import { test, expect, type Page } from "@playwright/test";
import { createSession, advance } from "../../src/game/engine";
import { cards, packs } from "../../src/content/catalog";
const key = "side-quest.session.v1";
const core = packs.find((p) => p.id === "core")!;
const plain = cards.filter((c) => !c.dice && core.cardIds.includes(c.id));
async function seed(page: Page, session: unknown) {
  await page.goto("./");
  await page.evaluate(
    ({ key, session }) => localStorage.setItem(key, JSON.stringify(session)),
    { key, session },
  );
  await page.reload();
}
function game(limit = 3) {
  const list = plain.slice(0, limit);
  return createSession(
    { version: 1, packIds: ["core"], limit: list.length },
    list,
    [{ ...core, cardIds: list.map((c) => c.id) }],
  );
}
// Reveal, discard, reveal: an active session that has a previous card.
const withHistory = () => advance(advance(advance(game(3))));

test("dialog enter and exit share the motion tokens", async ({ page }) => {
  await page.goto("./");
  const tokens = await page.locator("main").evaluate((el) => ({
    enter: getComputedStyle(el).getPropertyValue("--motion-dialog").trim(),
    exit: getComputedStyle(el).getPropertyValue("--motion-dialog-exit").trim(),
  }));
  expect(tokens).toEqual({ enter: "220ms", exit: "180ms" });
  await page.getByRole("button", { name: "Add to Home Screen help" }).click();
  const dialog = page.locator("dialog[open]");
  await expect(dialog).toBeVisible();
  // Read the exit contract by toggling the class instead of racing the ~180ms
  // unmount window between two browser round-trips.
  const animations = await dialog.evaluate((el) => {
    const entry = getComputedStyle(el).animationDuration;
    el.classList.add("closing");
    const closing = getComputedStyle(el);
    const exit = {
      name: closing.animationName,
      duration: closing.animationDuration,
    };
    el.classList.remove("closing");
    return { entry, exit };
  });
  expect(animations.entry).toBe("0.22s");
  expect(animations.exit).toEqual({ name: "panel-exit", duration: "0.18s" });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("install information control and dialog close icon are optically centered", async ({
  page,
}) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 768, height: 1024 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("./");
    const install = page.getByRole("button", {
      name: "Add to Home Screen help",
    });
    await expect(install).toHaveText("");
    const target = await install.boundingBox();
    expect(target!.width).toBeGreaterThanOrEqual(44);
    expect(target!.height).toBeGreaterThanOrEqual(44);
    const installSurface = await install.evaluate((button) => {
      const style = getComputedStyle(button);
      return {
        background: style.backgroundImage,
        radius: parseFloat(style.borderRadius),
      };
    });
    expect(installSurface.background).toBe("none");
    expect(installSurface.background).not.toContain("bezel.webp");
    expect(installSurface.radius).toBeGreaterThanOrEqual(target!.height / 2);
    await install.click();
    const close = page.getByRole("button", { name: "Close" });
    expect(
      await close.evaluate(
        (button) => getComputedStyle(button).backgroundImage,
      ),
    ).not.toContain("bezel.webp");
    const centered = await close.evaluate((button) => {
      const control = button.getBoundingClientRect();
      const icon = button.querySelector("svg")!.getBoundingClientRect();
      return {
        x: Math.abs(
          icon.left + icon.width / 2 - (control.left + control.width / 2),
        ),
        y: Math.abs(
          icon.top + icon.height / 2 - (control.top + control.height / 2),
        ),
        width: control.width,
        height: control.height,
      };
    });
    expect(centered.x).toBeLessThanOrEqual(1);
    expect(centered.y).toBeLessThanOrEqual(1);
    expect(centered.width).toBeGreaterThanOrEqual(44);
    expect(centered.height).toBeGreaterThanOrEqual(44);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(install).toBeFocused();
  }
});

test("an exiting dialog is inert and cannot trigger its controls", async ({
  page,
}) => {
  await page.clock.install({ time: 0 });
  await seed(page, game());
  await page.getByRole("button", { name: "Open game menu" }).click();
  const dialog = page.locator("dialog[open]");
  await expect(dialog).toBeVisible();
  // Freeze the exit timer so WebKit cannot unmount the short-lived dialog
  // before the inert state is inspected across the Playwright round-trip.
  // Use a known future point in the mock clock; host Date.now() can already
  // be in its past by the time a WebKit round-trip reaches pauseAt.
  await page.clock.pauseAt(60_000);
  await page.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toHaveClass(/closing/);
  await expect(dialog).toHaveAttribute("inert", "");
  expect(
    await dialog.evaluate((el) => getComputedStyle(el).pointerEvents),
  ).toBe("none");
  await page.clock.runFor(220);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("home has one How to play, for the mode chosen", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("button", { name: /How to play/ })).toHaveCount(
    1,
  );
  await page.getByRole("button", { name: /How to play/ }).click();
  let guide = page.getByRole("dialog", { name: "How to play" });
  await expect(guide.locator(".guide-rows")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.locator(".quest-mode").filter({ hasText: "Pub Crawl" }).click();
  await page.getByRole("button", { name: /How to play/ }).click();
  guide = page.getByRole("dialog", { name: "How to play" });
  // One row a system since 2026-10-31: hearts, fights, bosses, landings,
  // the satchel and gear, jinxes.
  await expect(guide.locator(".guide-rows li")).toHaveCount(6);
});

test("How to play explains every card from the pause menu", async ({
  page,
}) => {
  await seed(page, game());
  await page.getByRole("button", { name: "Open game menu" }).click();
  await page.getByRole("button", { name: "How to play" }).click();
  const guide = page.getByRole("dialog", { name: "How to play" });
  // A plain game has no crawl rows, only the basics.
  await expect(guide.locator(".guide-rows")).toHaveCount(0);
  await expect(guide.locator(".guide-basics dt")).toHaveCount(5);
  await guide.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("Escape closes the menu and restores focus to its opener", async ({
  page,
}) => {
  await seed(page, game());
  const opener = page.getByRole("button", { name: "Open game menu" });
  // The menu is a brass stud cut from the painted bezel, like the counter.
  expect(
    await opener.evaluate((button) => getComputedStyle(button).backgroundImage),
  ).toContain("bezel.webp");
  await opener.click();
  await expect(page.getByRole("dialog")).toContainText("Paused");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(opener).toBeFocused();
  expect(
    await opener.evaluate((button) => getComputedStyle(button).outlineStyle),
  ).toBe("none");
});

test("menu → Previous card → Close returns to play", async ({ page }) => {
  const session = withHistory();
  await seed(page, session);
  await page.getByRole("button", { name: "Open game menu" }).click();
  await page
    .getByRole("button", { name: "Previous card", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Previous card");
  await expect(page.locator(".previous-card .study-face")).toBeVisible();
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".game-card")).toBeVisible();
});

test("@release cancelling End game keeps the active session", async ({
  page,
}) => {
  await seed(page, game());
  await page.getByRole("button", { name: "Open game menu" }).click();
  await expect(
    page.getByRole("button", { name: "Previous card", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "End game", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Call it a night?");
  await expect(page.getByRole("dialog")).toContainText(
    "Your progress will be cleared.",
  );
  await page.getByRole("button", { name: "Keep playing" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".game-card")).toBeVisible();
  await page.reload();
  await expect(page.locator(".game-card")).toBeVisible();
});

test("a dialog can be reopened after it fully closes", async ({ page }) => {
  await seed(page, game());
  await page.getByRole("button", { name: "Open game menu" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Open game menu" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).not.toHaveClass(/closing/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("reduced motion still opens and closes dialogs", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seed(page, game());
  await page.getByRole("button", { name: "Open game menu" }).click();
  const dialog = page.locator("dialog[open]");
  await expect(dialog).toBeVisible();
  // Reduce Motion ends every animation at once (0.01ms) rather than removing
  // it, so fill modes and animationend still work; nothing visibly moves.
  const duration = await dialog.evaluate(
    (el) => getComputedStyle(el).animationDuration,
  );
  const seconds = parseFloat(duration) / (duration.endsWith("ms") ? 1000 : 1);
  expect(seconds).toBeLessThan(0.001);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
