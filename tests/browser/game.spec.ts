import { test, expect, reseed, seedStorage, withMotion } from "./support";
import type { CardDefinition } from "../../src/game/types";
const key = "side-quest.session.v1";
async function ready(page: import("@playwright/test").Page) {
  await expect(page.locator(".card-stage")).not.toHaveClass(
    /flip|discard|settle|deal/,
  );
}
// The standard pack mixes dice cards in, so tests that tap a card straight to
// discard first move known non-dice cards to the front of the saved order.
async function forcePlainFirst(
  page: import("@playwright/test").Page,
  count: number,
) {
  await page.evaluate(
    ({ k, count }) => {
      const s = JSON.parse(localStorage.getItem(k)!);
      const first = s.cards
        .filter((c: { dice?: unknown }) => !c.dice)
        .slice(0, count)
        .map((c: { id: string }) => c.id);
      s.order = [
        ...first,
        ...s.order.filter((id: string) => !first.includes(id)),
      ];
      s.position = 0;
      s.cycle = 0;
      s.discarded = 0;
      s.phase = "hidden";
      s.previousId = null;
      s.roll = null;
      s.previousRoll = null;
      localStorage.setItem(k, JSON.stringify(s));
    },
    { k: key, count },
  );
  await page.reload();
}
test("@release legacy finite game, rapid taps, restore, previous card, replay and settings", async ({
  page,
}) => {
  // Multi-step flow; Linux WebKit on CI is slow enough to exceed the default.
  test.setTimeout(90000);
  // Rapid taps must land while the flip is still turning.
  await withMotion(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".progress")).toBeVisible();
  // An in-progress game with a former custom limit keeps its original finish.
  await page.evaluate((k) => {
    const s = JSON.parse(localStorage.getItem(k)!);
    s.config.limit = 2;
    localStorage.setItem(k, JSON.stringify(s));
  }, key);
  await forcePlainFirst(page, 2);
  // The reveal and the rapid taps go in one synchronous burst. Sent as two
  // steps, a slow runner can finish the flip in between, and the first
  // "rapid" tap then discards the card.
  await expect(page.getByRole("button", { name: "Reveal card" })).toBeVisible();
  await page.locator(".game-card").evaluate((el) => {
    for (let i = 0; i < 9; i++) (el as HTMLElement).click();
  });
  await ready(page);
  await expect(page.locator(".card-front")).toHaveCSS(
    "border-top-width",
    "0px",
  );
  // The front is shown once the turn has ended; read the title from it then.
  await expect(page.locator(".card-front")).toHaveCSS("visibility", "visible");
  const title = await page.locator(".study-title h2").innerText();
  await page.reload();
  await expect(page.locator(".study-title h2")).toHaveText(title);
  await expect(page.locator(".progress")).toContainText("1 / 2");
  await page.locator(".game-card").click();
  await ready(page);
  await page.getByRole("button", { name: "Open game menu" }).click();
  await page.getByRole("button", { name: "Previous card" }).click();
  await expect(page.locator(".previous-card h2")).toHaveText(title);
  await expect(page.locator(".previous-card .study-face")).toBeVisible();
  await expect(page.locator(".previous-card")).toHaveCSS(
    "border-top-width",
    "0px",
  );
  await page.getByRole("dialog").getByRole("button", { name: "Close" }).click();
  await expect(page.locator(".progress")).toContainText("2 / 2");
  await page.getByRole("button", { name: "Reveal card" }).click();
  await ready(page);
  await expect(page.locator(".game-card")).toHaveClass(/face/);
  await page.locator(".game-card").click();
  await expect(page.getByRole("button", { name: "Play again" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Play again" })).toBeVisible();
  await page.getByRole("button", { name: "Play again" }).click();
  await expect(page.locator(".progress")).toContainText("1 / 2");
  await page.getByRole("button", { name: "Open game menu" }).click();
  await page.getByRole("button", { name: "End game", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Call it a night?");
  await page.getByRole("button", { name: "Keep playing" }).click();
  await expect(page.locator(".game-card")).toBeVisible();
  expect(errors).toEqual([]);
});
test("two lengths and the quest modes appear, and every pack can be toggled", async ({
  page,
}) => {
  await page.goto("./");
  await expect(
    page.getByRole("group", { name: "Game length" }).getByRole("button"),
  ).toHaveCount(2);
  await expect(page.locator(".quest-mode")).toHaveCount(2);
  await expect(
    page.getByRole("button", { name: "Standard, 50 cards" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Choose packs" }).click();
  const dialog = page.getByRole("dialog");
  // Six packs since House and Cabin weekend joined Core (2026-10-24).
  await expect(dialog.locator(".pack")).toHaveCount(6);
  await expect(dialog).not.toContainText("Always included");
  const core = dialog.getByRole("button", { name: /The Core deck/ });
  await core.click();
  await expect(core).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Done" }).click();
  await expect(
    page.getByRole("button", { name: "Play", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Choose packs" }).click();
  await core.click();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(
    page.getByRole("button", { name: "Play", exact: true }),
  ).toBeEnabled();
});
test("Standard and Infinite create the advertised limits", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".progress")).toBeVisible();
  expect(
    await page.evaluate(
      (k) => JSON.parse(localStorage.getItem(k)!).config.limit,
      key,
    ),
  ).toBe(50);
  await ready(page);
  await page.getByRole("button", { name: "Open game menu" }).click();
  await page.getByRole("button", { name: "End game", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "End game", exact: true })
    .click();
  await page.getByRole("button", { name: "Infinite, Keeps going" }).click();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".progress")).toBeVisible();
  expect(
    await page.evaluate(
      (k) => JSON.parse(localStorage.getItem(k)!).config.limit,
      key,
    ),
  ).toBeNull();
});
test("corrupt save recovery", async ({ page }) => {
  await seedStorage(page, { [key]: '{"bad":true}' });
  await expect(page.getByText("This save lost")).toBeVisible();
  await page.getByRole("button", { name: "Return to setup" }).click();
  await expect(
    page.getByRole("button", { name: "Play", exact: true }),
  ).toBeVisible();
  // The game is gone from play but kept, as it was, for a later fix.
  expect(
    await page.evaluate(
      (k) => [
        localStorage.getItem(k),
        localStorage.getItem("side-quest.session.corrupt.v1"),
      ],
      key,
    ),
  ).toEqual([null, '{"bad":true}']);
});
test("storage failure still allows play", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw Error("blocked");
    };
  });
  await page.goto("./");
  await expect(page.getByText(/Saving is unavailable/)).toBeVisible();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".progress")).toBeVisible();
  await page.getByRole("button", { name: "Reveal card" }).click();
  await expect(page.locator(".study-title h2")).toBeVisible();
});
test("portrait phone, iPad, and large text retain readable rules", async ({
  page,
}) => {
  // Five viewports of reveal/discard; Linux WebKit on CI is slow enough to
  // exceed the default timeout.
  test.setTimeout(90000);
  await page.goto("./");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".progress")).toBeVisible();
  await forcePlainFirst(page, 6);
  for (const viewport of [
    { width: 375, height: 667 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 320, height: 700 },
  ]) {
    await page.setViewportSize(viewport);
    await page.getByRole("button", { name: "Reveal card" }).click();
    await ready(page);
    await expect(page.locator(".study-rules p")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.locator(".game-card").click();
    await ready(page);
  }
  await page.addStyleTag({ content: ":root {font-size:24px}" });
  await page.getByRole("button", { name: "Reveal card" }).click();
  await ready(page);
  const clipped = await page
    .locator(".game-card")
    .evaluate((el) => el.scrollHeight > el.clientHeight + 2);
  expect(clipped).toBe(false);
});
test("reduced motion and keyboard play", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".progress")).toBeVisible();
  // Let the reduced-motion deal settle before activating the card; otherwise
  // Enter can arrive while the controller still holds the deal motion and is
  // (correctly) ignored, leaving the card hidden.
  await ready(page);
  const reveal = page.getByRole("button", { name: "Reveal card" });
  await reveal.focus();
  await expect(reveal).toBeFocused();
  await page.keyboard.press("Enter");
  await ready(page);
  await expect(page.locator(".study-title h2")).toBeVisible();
  await page.getByRole("button", { name: "Open game menu" }).click();
  // Escape closes an open dialog; wait for it to be open first.
  await expect(page.getByRole("dialog", { name: "Paused" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
test("offline reload keeps the same revealed card", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Playwright WebKit does not expose service worker control; verify installed iOS manually.",
  );
  await page.goto("./");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".progress")).toBeVisible();
  await page.getByRole("button", { name: "Reveal card" }).click();
  await ready(page);
  // The front is shown once the turn has ended; read the title from it then.
  await expect(page.locator(".card-front")).toHaveCSS("visibility", "visible");
  const title = await page.locator(".study-title h2").innerText();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".study-title h2")).toHaveText(title);
  const frameLoaded = await page.locator(".study-face").evaluate(async (el) => {
    const url = getComputedStyle(el).backgroundImage.match(
      /url\(["']?(.*?)["']?\)/,
    )![1];
    const image = new Image();
    image.src = url;
    await image.decode();
    return image.naturalWidth;
  });
  expect(frameLoaded).toBeGreaterThan(0);
});

test("representative Core cards keep edge clearance and a 2:3 frame across device sizes", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.goto("./");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".progress")).toBeVisible();
  const original = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    key,
  );
  // The workshop checks every card at five viewport presets and both text
  // sizes. Keep this production-session check focused on each card kind and
  // the content extremes; reloading all 250 cards at four widths duplicates
  // that sweep and exceeds the browser test budget.
  const pool = original.cards as CardDefinition[];
  const sampled = [
    ...(["sip", "group", "category", "challenge", "rule"] as const).map(
      (category) => pool.find((card) => card.category === category)!,
    ),
    [...pool].sort((a, b) => b.title.length - a.title.length)[0],
    [...pool].sort((a, b) => b.rules.length - a.rules.length)[0],
    pool.find((card) => card.dice?.sides === 20)!,
    pool.at(-1)!,
  ];
  const uniqueSamples = [
    ...new Map(sampled.map((card) => [card.id, card])).values(),
  ];
  for (const viewport of [
    { width: 320, height: 700 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    for (const card of uniqueSamples) {
      const state = {
        ...original,
        order: [
          card.id,
          ...original.order.filter((id: string) => id !== card.id),
        ],
        phase: "revealed",
      };
      await reseed(page, state);
      await page.addStyleTag({ content: ":root {font-size:24px}" });
      await expect(page.locator(".study-title h2")).toHaveText(card.title);
      const fits = await page.locator(".game-card").evaluate((el) => {
        const box = el.getBoundingClientRect();
        const rules = el.querySelector(".study-rules")!.getBoundingClientRect();
        return {
          ratio: el.clientWidth / el.clientHeight,
          sideMargin: Math.min(box.left, innerWidth - box.right),
          rulesFit:
            rules.left >= box.left &&
            rules.right <= box.right &&
            rules.bottom <= box.bottom &&
            rules.top >= box.top,
          equalFaces:
            Math.abs(
              (el.querySelector(".card-back") as HTMLElement).clientWidth -
                (el.querySelector(".card-front") as HTMLElement).clientWidth,
            ) < 1 &&
            Math.abs(
              (el.querySelector(".card-back") as HTMLElement).clientHeight -
                (el.querySelector(".card-front") as HTMLElement).clientHeight,
            ) < 1,
        };
      });
      expect(fits.ratio, `${viewport.width}px ${card.title}`).toBeCloseTo(
        2 / 3,
        2,
      );
      expect(fits.rulesFit, `${viewport.width}px ${card.title}`).toBe(true);
      expect(fits.equalFaces, `${viewport.width}px ${card.title}`).toBe(true);
      if (viewport.width <= 390)
        expect(
          fits.sideMargin,
          `${viewport.width}px ${card.title}`,
        ).toBeGreaterThanOrEqual(23);
    }
  }
});

test("@release rules taps discard, while scrolling and cancelled gestures keep the card", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("./");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".progress")).toBeVisible();
  const original = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    key,
  );
  const longest = original.cards
    .filter((card: { dice?: unknown }) => !card.dice)
    .reduce(
      (
        result: { id: string; rules: string },
        card: { id: string; rules: string },
      ) => (card.rules.length > result.rules.length ? card : result),
    );
  await page.evaluate(
    ({ key, state }) => localStorage.setItem(key, JSON.stringify(state)),
    {
      key,
      state: {
        ...original,
        order: [
          longest.id,
          ...original.order.filter((id: string) => id !== longest.id),
        ],
        phase: "revealed",
      },
    },
  );
  await page.reload();
  await page.addStyleTag({ content: ":root {font-size:24px}" });
  const rules = page.locator(".study-rules");
  await expect
    .poll(() => rules.evaluate((el) => el.scrollHeight > el.clientHeight + 2))
    .toBe(true);
  const box = await rules.boundingBox();
  if (!box) throw new Error("Rules panel is not visible");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 20);
  await page.mouse.up();
  await rules.evaluate((el) => el.scrollTo({ top: 240 }));
  await expect
    .poll(() => rules.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0);
  let saved = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    key,
  );
  expect(saved.phase).toBe("revealed");
  expect(saved.discarded).toBe(0);

  await rules.click();
  saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), key);
  expect(saved.phase).toBe("hidden");
  expect(saved.discarded).toBe(1);

  await page.evaluate(
    ({ key, state }) => localStorage.setItem(key, JSON.stringify(state)),
    {
      key,
      state: {
        ...original,
        order: [
          longest.id,
          ...original.order.filter((id: string) => id !== longest.id),
        ],
        phase: "revealed",
      },
    },
  );
  await page.reload();
  await rules.dispatchEvent("pointerdown", {
    pointerId: 7,
    clientX: 120,
    clientY: 320,
    pointerType: "touch",
  });
  await rules.dispatchEvent("pointercancel", { pointerId: 7 });
  await rules.dispatchEvent("click");
  saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), key);
  expect(saved.phase).toBe("revealed");
  expect(saved.discarded).toBe(0);

  await page.locator(".game-card").focus();
  await page.keyboard.press("Enter");
  saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), key);
  expect(saved.phase).toBe("hidden");
  expect(saved.discarded).toBe(1);
});
test("mode and add-ons persist while interruption restores a stable card", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Infinite, Keeps going" }).click();
  await page.getByRole("button", { name: "Choose packs" }).click();
  await page.getByRole("button", { name: /VIP night/ }).click();
  await page.getByRole("button", { name: "Done" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Infinite, Keeps going" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".pack-selector")).toHaveAccessibleName(
    /VIP night/,
  );
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".progress")).toBeVisible();
  const config = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!).config,
    key,
  );
  expect(config).toEqual({ version: 1, packIds: ["core", "vip"], limit: null });
  await forcePlainFirst(page, 1);
  await page.getByRole("button", { name: "Reveal card" }).click();
  await page.reload();
  await expect(page.locator(".game-card")).toHaveClass(/face/);
  await expect(page.locator(".card-stage")).not.toHaveClass(
    /flip|discard|settle|deal/,
  );
  await ready(page);
  await page.locator(".game-card").click();
  await page.reload();
  await expect(page.locator(".card-stage")).not.toHaveClass(
    /flip|discard|settle|deal/,
  );
  await expect(page.locator(".game-card")).toBeVisible();
});

test("minimal interface and a real two-sided flip", async ({ page }) => {
  test.setTimeout(60000);
  await page.goto("./");
  await expect(
    page.locator(".helper, .footnote, .eyebrow, .tap-hint"),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".progress")).toBeVisible();
  await expect(page.locator(".card-front")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await forcePlainFirst(page, 1);
  await page.getByRole("button", { name: "Reveal card" }).click();
  await ready(page);
  await expect(page.locator(".card-front")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await expect
    .poll(() =>
      page
        .locator(".card-rotator")
        .evaluate(
          (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m11,
        ),
    )
    .toBeLessThan(-0.99);
  await page.locator(".game-card").click();
  await ready(page);
  await expect(page.getByRole("button", { name: "Reveal card" })).toBeVisible();
  await expect(page.locator(".card-front")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await expect(page.locator(".progress")).toContainText("2 / 50");
});

test("legacy audio and atmosphere preferences are ignored and toggles are gone", async ({
  page,
}) => {
  // The atmosphere is checked here; Reduced Motion hides it.
  await withMotion(page);
  await page.goto("./");
  // Seeded under the pre-rename key, so this also covers its migration.
  await page.evaluate(() =>
    localStorage.setItem(
      "drink-at-ron.settings.v1",
      JSON.stringify({
        config: { version: 1, packIds: ["core"], limit: 40 },
        sound: true,
        ambience: true,
        atmosphere: false,
        choice: "40",
        customSize: "40",
      }),
    ),
  );
  await page.reload();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".progress")).toBeVisible();
  await page.getByRole("button", { name: "Open game menu" }).click();
  // The ambience is always on and the audio/atmosphere switches are removed.
  await expect(page.locator(".atmosphere")).toBeVisible();
  await expect(page.getByRole("switch")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Previous card", exact: true }),
  ).toHaveCount(0);
});
test("canceled animations and backgrounding settle without additional draws", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".progress")).toBeVisible();
  await forcePlainFirst(page, 1);
  await page.getByRole("button", { name: "Reveal card" }).click();
  await page
    .locator(".game-card")
    .evaluate((el) => el.getAnimations().forEach((a) => a.cancel()));
  await ready(page);
  await page.locator(".game-card").click();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".card-stage")).not.toHaveClass(
    /flip|discard|settle|deal/,
  );
  await expect(page.locator(".progress")).toContainText("2 / 50");
  await expect(page.locator(".atmosphere")).toHaveClass(/suspended/);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".progress")).toContainText("2 / 50");
  await page.reload();
  await expect(page.locator(".progress")).toContainText("2 / 50");
});
test("offline uses local Grenze and painted controls", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Installed Safari offline remains a physical-device check",
  );
  await page.goto("./");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(() => document.fonts.check("600 24px Grenze")),
  ).toBe(true);
  expect(
    await page
      .locator(".primary")
      .evaluate((el) => getComputedStyle(el).borderImageSource),
  ).toContain("button.webp");
  await page.getByRole("button", { name: "Choose packs" }).click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: /The Core deck/ })
      .locator(".pack-logo-gilt"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();
  await page.getByRole("button", { name: "Add to Home Screen help" }).click();
  await expect(page.getByText("Ready for offline play")).toBeVisible();
});
test("readable fallback when artwork fails and keyboard focus returns", async ({
  page,
}) => {
  await page.route("**/art/tankard.webp", (route) => route.abort());
  await page.goto("./");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".progress")).toBeVisible();
  await page.getByRole("button", { name: "Reveal card" }).click();
  await ready(page);
  await expect(page.locator(".study-rules p")).toBeVisible();
  await page.getByRole("button", { name: "Open game menu" }).click();
  // Escape closes an open dialog; wait for it to be open first.
  await expect(page.getByRole("dialog", { name: "Paused" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Open game menu" }),
  ).toBeFocused();
});

test("a game saved before the rename to Side Quest resumes", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".progress")).toBeVisible();
  const saved = await page.evaluate((k) => {
    const raw = localStorage.getItem(k)!;
    localStorage.removeItem(k);
    localStorage.setItem("drink-at-ron.session.v1", raw);
    return JSON.parse(raw);
  }, key);
  await page.reload();
  await expect(page.locator(".progress")).toBeVisible();
  const moved = await page.evaluate(
    (k) => ({
      session: JSON.parse(localStorage.getItem(k)!),
      legacy: localStorage.getItem("drink-at-ron.session.v1"),
    }),
    key,
  );
  expect(moved.legacy).toBeNull();
  expect(moved.session.order).toEqual(saved.order);
  expect(moved.session.position).toBe(saved.position);
});
test("the table goes still after a minute without a tap, and a tap wakes it", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("./");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".progress")).toBeVisible();
  const atmosphere = page.locator(".atmosphere");
  const state = () =>
    atmosphere.evaluate((el) => ({
      glow: getComputedStyle(el.querySelector(".firelight")!)
        .animationPlayState,
      motes: getComputedStyle(el.querySelector(".embers")!).opacity,
      dust: getComputedStyle(el.querySelector(".dust")!).opacity,
    }));
  await page.clock.runFor(59_000);
  await expect(atmosphere).not.toHaveClass(/idle/);
  await page.clock.runFor(2_000);
  await expect(atmosphere).toHaveClass(/idle/);
  await expect.poll(state).toEqual({ glow: "paused", motes: "0", dust: "0" });
  // The next tap, on the card, wakes it.
  await page.getByRole("button", { name: "Reveal card" }).click();
  await expect(atmosphere).not.toHaveClass(/idle/);
  await expect.poll(state).toEqual({ glow: "running", motes: "1", dust: "1" });
});
