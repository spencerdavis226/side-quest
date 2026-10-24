import { test, expect, type Page } from "@playwright/test";
import { createSession } from "../../src/game/engine";
import { cards, packs } from "../../src/content/catalog";
const key = "side-quest.session.v1";
const diceCard = cards.find((c) => c.dice)!;
async function seedDice(page: Page) {
  const session = createSession(
    { version: 1, packIds: ["core"], limit: 1 },
    [diceCard],
    [{ ...packs[0], cardIds: [diceCard.id] }],
  );
  session.phase = "revealed";
  await page.goto("./");
  await page.evaluate(
    ({ key, session }) => localStorage.setItem(key, JSON.stringify(session)),
    { key, session },
  );
  await page.reload();
}
test("unselected packs stay readable and selection is unambiguous", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Choose packs" }).click();
  const dialog = page.getByRole("dialog");
  const core = dialog.getByRole("button", { name: /The Core deck/ });
  const other = dialog.getByRole("button", { name: "VIP night", exact: true });
  await expect(core).toHaveAttribute("aria-pressed", "true");
  const unselected = await other.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      opacity: Number(style.opacity),
      filter: style.filter,
      mark: el.querySelector(".checkbox")!.textContent,
    };
  });
  // An available-but-unselected pack must not look disabled.
  expect(unselected.opacity).toBe(1);
  expect(unselected.filter).toBe("none");
  expect(unselected.mark).toBe("+");
  // The pack's own mark leads the tile; there is no shared tankard art.
  expect(
    await other.evaluate(
      (el) =>
        el.firstElementChild!.classList.contains("pack-logo") &&
        !el.querySelector("img, .pack-art"),
    ),
  ).toBe(true);
  await other.click();
  await expect(other).toHaveAttribute("aria-pressed", "true");
  await expect(other.locator(".checkbox")).toHaveText("✓");
  // Core is an ordinary opt-in pack now, too.
  await core.click();
  await expect(core).toHaveAttribute("aria-pressed", "false");
  await expect(dialog).not.toContainText("Always included");
});
test("the pack dialog carries no prose and closes on a tap outside it", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Choose packs" }).click();
  const dialog = page.getByRole("dialog");
  for (const name of ["VIP night", "Pokémon night"])
    await dialog.getByRole("button", { name, exact: true }).click();
  await expect(dialog.locator("p")).toHaveCount(0);
  // A tap on the panel's own frame is inside it and must not dismiss.
  const box = (await dialog.boundingBox())!;
  await page.mouse.click(box.x + 6, box.y + box.height / 2);
  await expect(dialog).toBeVisible();
  await page.mouse.click(box.x + box.width / 2, box.y / 2);
  await expect(dialog).toHaveCount(0);
});
test("@release the pack count stays readable with every pack selected", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("./");
  await page.getByRole("button", { name: "Choose packs" }).click();
  const dialog = page.getByRole("dialog");
  for (const name of [
    "The House deck",
    "VIP night",
    "Pokémon night",
    "Cabin weekend",
    "Most Likely To",
    "Secrets & fuses",
  ]) {
    const pack = dialog.getByRole("button", { name, exact: true });
    await pack.click();
    // Each tap toggles its pack and leaves the picker open.
    await expect(pack, name).toHaveAttribute("aria-pressed", "true");
    await expect(dialog, name).toBeVisible();
  }
  await dialog.getByRole("button", { name: "Done" }).click();
  const row = page.locator(".pack-selector");
  await expect(row.locator(".pack-logo")).toHaveCount(7);
  const count = row.getByText("817 cards");
  await expect(count).toBeVisible();
  expect(
    await count.evaluate((el) => {
      const text = el.getBoundingClientRect();
      const box = el.closest(".pack-selector")!.getBoundingClientRect();
      return el.scrollWidth <= el.clientWidth + 1 && text.right <= box.right;
    }),
  ).toBe(true);
  await row.screenshot({ path: test.info().outputPath("seven-packs.png") });
});
test("@release House and VIP are selectable add-ons and Core can be deselected", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("./");
  await page.getByRole("button", { name: "Choose packs" }).click();
  const dialog = page.getByRole("dialog");
  const vip = dialog.getByRole("button", { name: "VIP night", exact: true });
  const house = dialog.getByRole("button", { name: /The House deck/ });
  await expect(vip).toHaveAttribute("aria-pressed", "false");
  await expect(house).toHaveAttribute("aria-pressed", "false");
  expect(
    await dialog.evaluate((dialogEl) => {
      const rect = dialogEl.getBoundingClientRect();
      return rect.left >= 0 && rect.right <= innerWidth;
    }),
  ).toBe(true);
  await house.click();
  await page.getByRole("button", { name: "Done" }).click();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".progress")).toBeVisible();
  const session = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    key,
  );
  expect(session.config.packIds).toEqual(["core", "house"]);
  expect(session.cards).toHaveLength(190);
  expect(
    session.cards.some((card: { id: string }) => card.id === "house.sheet-091"),
  ).toBe(true);
  expect(
    session.cards.some((card: { id: string }) => card.id === "house.sheet-106"),
  ).toBe(false);
});
test("the card is the only dice control and keeps a generous target", async ({
  page,
}) => {
  await seedDice(page);
  await expect(page.locator(".roll-cta")).toHaveCount(0);
  const card = page.locator(".game-card");
  await expect(card).toHaveAccessibleName(/^Roll /);
  const box = await card.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
});
test("dialog copy sits on a quiet panel surface", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Add to Home Screen help" }).click();
  await page.locator("dialog[open]").waitFor();
  const surface = await page.locator("dialog[open]").evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      border: style.borderImageSource,
      background: style.backgroundImage,
    };
  });
  expect(surface.border).toContain("panel.webp");
  // The painted frame stays, but the interior is scrimmed for readable copy.
  expect(surface.background).toContain("panel.webp");
  expect(surface.background).toContain("linear-gradient");
});
test("@release leaving a quest mode takes its pack back out of the deck", async ({
  page,
}) => {
  await page.goto("./");
  for (const mode of [/^Pub Crawl/, /^Pokémon League/]) {
    await page.getByRole("button", { name: mode }).click();
    await page.getByRole("button", { name: /^Standard/ }).click();
  }
  // A quest mode picked and left before a reload is remembered as left.
  await page.reload();
  await expect(page.getByRole("button", { name: /^Standard/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".progress")).toBeVisible();
  const session = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    key,
  );
  expect(session.config.packIds).toEqual(["core"]);
  expect(session.cards).toHaveLength(packs[0].cardIds.length);
});
test("@release a quest mode chosen before a reload is still chosen", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: /^Pub Crawl/ }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: /^Pub Crawl/ }),
  ).toHaveAttribute("aria-pressed", "true");
});
