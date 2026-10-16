import { test, expect, devices, type Page } from "@playwright/test";
import { createSession } from "../../src/game/engine";
import { diceResultText } from "../../src/presentation/dice/result-text";
import { cards, packs } from "../../src/content/catalog";
const key = "side-quest.session.v1";
const webgl = (page: Page) =>
  page.evaluate(() => {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  });
const diceIds = ["core.same-shit", "core.fuck-around"] as const;
async function seed(page: Page, index = 0) {
  const card = cards.find((c) => c.id === diceIds[index])!;
  const session = createSession(
    { version: 1, packIds: ["core"], limit: 2 },
    [card],
    [{ ...packs[0], cardIds: [card.id] }],
  );
  session.phase = "revealed";
  await page.goto("./");
  await Promise.all([
    page.waitForNavigation(),
    page.evaluate(
      ({ key, session }) => {
        localStorage.setItem(key, JSON.stringify(session));
        location.reload();
      },
      { key, session },
    ),
  ]);
  await expect(page.locator(".game-card")).toHaveAccessibleName(/^Roll /);
}
const saved = (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
for (const index of [0, 1])
  test(`dice overlay renders saved ${index ? "d20" : "2d6"} faces over the card`, async ({
    page,
  }, info) => {
    // Only the tests that must actually render need WebGL.
    test.skip(
      !(await webgl(page)),
      "WebGL unavailable (headless Linux WebKit)",
    );
    const external: string[] = [];
    page.on("request", (request) => {
      if (
        !request.url().startsWith("http://127.0.0.1:") &&
        !request.url().startsWith("data:")
      )
        external.push(request.url());
    });
    await seed(page, index);
    // The card stays in the layout behind the transparent stage, undimmed.
    await expect(page.locator(".game-card")).toBeVisible();
    const bounds = await page.locator(".roll-layer").boundingBox();
    expect(bounds!.width).toBe(page.viewportSize()!.width);
    await page.locator(".game-card").click();
    const committed = await saved(page);
    await expect(page.locator(".roll-stage")).toHaveAttribute(
      "data-renderer",
      `settled:${committed.roll.values.join(",")}`,
      { timeout: 15000 },
    );
    console.log(
      info.project.name,
      index,
      "startup ms",
      await page.locator(".roll-stage").getAttribute("data-startup-ms"),
    );
    await page.screenshot({ path: info.outputPath(`settled-${index}.png`) });
    await expect(page.locator(".roll-layer")).toHaveCount(0);
    await expect(page.locator(".resolved-instruction")).toHaveText(
      diceResultText(
        cards.find((c) => c.id === diceIds[index])!,
        committed.roll,
      ),
    );
    await expect(page.locator(".dice-result-face")).toHaveText(
      committed.roll.values.map(String),
    );
    if (committed.roll.values.length > 1)
      await expect(page.locator(".dice-result-total strong")).toHaveText(
        String(committed.roll.total),
      );
    expect((await saved(page)).roll).toEqual({
      ...committed.roll,
      returned: true,
    });
    expect(external).toEqual([]);
    expect((await saved(page)).discarded).toBe(0);
    // Amounts are bold. Some results have none: the d20 card's 1 and 20 read
    // "Take a shot." and "Give a shot.", which failed this check on 1 roll in 10.
    const amounts = page.locator(".resolved-instruction strong");
    if (/\d/.test(committed.roll.instruction))
      await expect(amounts.first()).toBeVisible();
    else await expect(amounts).toHaveCount(0);
  });
test("@release a restored unrolled dice card rolls by tapping the card", async ({
  page,
}) => {
  test.skip(!(await webgl(page)), "WebGL unavailable (headless Linux WebKit)");
  await seed(page);
  const cta = page.locator(".game-card");
  await expect(cta).toHaveAccessibleName(/^Roll /);
  await cta.click();
  await expect(page.locator(".roll-stage")).toHaveAttribute(
    "data-renderer",
    /^settled:/,
    { timeout: 15000 },
  );
  expect(
    await page.locator(".roll-stage").getAttribute("data-stop-reason"),
  ).toBe("");
  await expect(page.locator(".roll-layer")).toHaveCount(0);
  await expect(page.locator(".game-card")).toHaveAccessibleName(
    /Tap to put this card aside\.$/,
  );
});
test("repeated rolls settle, never fall back, and are never a weak plop", async ({
  page,
}) => {
  test.skip(!(await webgl(page)), "WebGL unavailable (headless Linux WebKit)");
  // Software-rendered CI WebKit creates a stage per roll; 6 rolls can exceed the
  // default timeout.
  test.setTimeout(90000);
  const durations: number[] = [];
  for (let i = 0; i < 6; i++) {
    await seed(page, i % 2);
    await page.locator(".game-card").click();
    await expect(page.locator(".roll-stage")).toHaveAttribute(
      "data-renderer",
      /^settled:/,
      { timeout: 15000 },
    );
    expect(
      await page.locator(".roll-stage").getAttribute("data-stop-reason"),
    ).toBe("");
    durations.push(
      Number(await page.locator(".roll-stage").getAttribute("data-roll-ms")),
    );
    // Let the automatic result handoff finish before replacing this save with
    // the next fixture; otherwise the intentional 700ms hold can outlive the
    // test's localStorage write and race the next navigation.
    await expect(page.locator(".roll-layer")).toHaveCount(0);
  }
  console.log("roll ms", durations.join(", "));
  for (const ms of durations) {
    expect(ms).toBeGreaterThan(700);
    // Upper bound is loose: software-rendered CI runners are slow, but a
    // fallback or runaway roll would still be caught by the settled assertion.
    expect(ms).toBeLessThan(5000);
  }
});
test("reload and reduced motion reveal a saved result without replay", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seed(page);
  // Reduced motion commits the roll with no dice animation.
  await page.locator(".game-card").click();
  await expect(page.locator(".resolved-instruction")).toBeVisible();
  const committed = await saved(page);
  expect(committed.roll.returned).toBe(true);
  await page.reload();
  await expect(page.locator(".game-card")).toHaveAccessibleName(
    /Tap to put this card aside\.$/,
  );
  await expect(page.locator(".roll-stage canvas")).toHaveCount(0);
  expect((await saved(page)).roll).toEqual(committed.roll);
});
test("dragging the resolved rules does not discard", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seed(page);
  await page.locator(".game-card").click();
  await expect(page.locator(".resolved-instruction")).toBeVisible();
  const box = (await page.locator(".study-rules").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 30, {
    steps: 5,
  });
  await page.mouse.up();
  await expect(page.locator(".game-card")).toHaveAccessibleName(
    /Tap to put this card aside\.$/,
  );
  expect((await saved(page)).roll.returned).toBe(true);
  expect((await saved(page)).discarded).toBe(0);
  // A stationary tap on the resolved card discards it.
  await page.locator(".game-card").click();
  await expect.poll(async () => (await saved(page)).discarded).toBe(1);
});
test("@release a second tap finishes the moving dice, then reveals the bold amount", async ({
  page,
}) => {
  test.skip(!(await webgl(page)), "WebGL unavailable");
  await seed(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // Deliver taps as raw input. locator.click() waits for the card to hold
  // still for two frames, and on a software-rendered CI WebKit the dice
  // animation starves the main thread long enough for the roll to finish on
  // its own before the finish tap lands; the tap is still a stationary press
  // on the card, which is exactly what the gesture code expects.
  const tapCard = async () => {
    const box = (await page.locator(".game-card").boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  };
  await tapCard();
  const committed = await saved(page);
  await expect(page.locator(".roll-stage")).toHaveAttribute(
    "data-renderer",
    "rolling",
  );
  await expect(page.locator(".game-card")).toHaveAccessibleName(
    "Finish dice roll",
  );
  await tapCard();
  await expect(page.locator(".roll-layer")).toBeVisible();
  await expect(page.locator(".roll-stage")).toHaveAttribute(
    "data-face-values",
    committed.roll.values.join(","),
    { timeout: 1800 },
  );
  await expect(page.locator(".roll-layer")).toHaveCount(0);
  await expect(page.locator(".resolved-instruction")).toHaveText(
    diceResultText(
      cards.find((c) => c.id === diceIds[0])!,
      committed.roll,
    ),
  );
  await expect(
    page.locator(".resolved-instruction strong").first(),
  ).toBeVisible();
  expect((await saved(page)).roll).toEqual({
    ...committed.roll,
    returned: true,
  });
  expect((await saved(page)).discarded).toBe(0);
  // Stale animation callbacks must not advance the deck after an early finish.
  await page.waitForTimeout(600);
  expect((await saved(page)).discarded).toBe(0);
  expect(errors).toEqual([]);
  await page.locator(".game-card").click();
  await expect.poll(async () => (await saved(page)).discarded).toBe(1);
});
test("Escape finishes the throw and reveals without changing the saved faces", async ({
  page,
}) => {
  await seed(page);
  await page.locator(".game-card").click();
  const committed = await saved(page);
  await page.keyboard.press("Escape");
  await expect(page.locator(".roll-layer")).toHaveCount(0);
  expect((await saved(page)).roll).toEqual({
    ...committed.roll,
    returned: true,
  });
  await expect(page.locator(".game-card")).toBeFocused();
});
test("offline dice roll and relaunch preserve result", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName === "webkit",
    "Playwright WebKit offline navigation fails here; verify installed iOS offline separately.",
  );
  test.skip(!(await webgl(page)), "WebGL unavailable (headless Linux WebKit)");
  await seed(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.locator(".game-card").click();
  await expect(page.locator(".resolved-instruction")).toBeVisible({
    timeout: 15000,
  });
  const committed = await saved(page);
  expect(committed.roll.returned).toBe(true);
  await page.reload();
  await expect(page.locator(".game-card")).toHaveAccessibleName(
    /Tap to put this card aside\.$/,
  );
  expect((await saved(page)).roll).toEqual(committed.roll);
  await context.setOffline(false);
});
test("WebGL failure immediately reveals the saved result", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.includes("webgl")) return null;
      return original.apply(this, [type, ...args] as Parameters<
        typeof original
      >);
    } as typeof original;
  });
  await seed(page);
  await page.locator(".game-card").click();
  await expect(page.locator(".resolved-instruction")).toBeVisible();
  await expect(page.locator(".roll-layer")).toHaveCount(0);
  const committed = await saved(page);
  expect(committed.roll.returned).toBe(true);
  await page.reload();
  expect((await saved(page)).roll).toEqual(committed.roll);
});
test("a WebGL context lost before the roll is rebuilt and still thrown", async ({
  page,
}) => {
  test.skip(!(await webgl(page)), "WebGL unavailable (headless Linux WebKit)");
  await seed(page);
  const stage = page.locator(".roll-stage");
  await expect(stage).toHaveAttribute("data-renderer", "ready", {
    timeout: 15000,
  });
  await page
    .locator(".roll-stage canvas:not(.dice-shadow-layer)")
    .dispatchEvent("webglcontextlost");
  await expect(stage).toHaveAttribute("data-renderer", "fallback");
  await page.locator(".game-card").click();
  const committed = await saved(page);
  await expect(stage).toHaveAttribute(
    "data-renderer",
    `settled:${committed.roll.values.join(",")}`,
    { timeout: 15000 },
  );
});
test("resize interruption settles without another roll", async ({ page }) => {
  await seed(page);
  await page.locator(".game-card").click();
  const committed = await saved(page);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator(".resolved-instruction")).toBeVisible();
  expect((await saved(page)).roll).toEqual({
    ...committed.roll,
    returned: true,
  });
  await page.reload();
  await expect(page.locator(".roll-stage canvas")).toHaveCount(0);
});
test("backgrounding stops animation and preserves the saved outcome", async ({
  page,
}) => {
  await seed(page);
  await page.locator(".game-card").click();
  const committed = await saved(page);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".resolved-instruction")).toBeVisible();
  await expect(page.locator(".roll-stage canvas")).toHaveCount(0);
  expect((await saved(page)).roll).toEqual({
    ...committed.roll,
    returned: true,
  });
});

test("legacy cursed-number saves show the number in the rule without a Rolled heading", async ({
  page,
}) => {
  const { rollDice } = await import("../../src/game/dice");
  const source = cards.find((c) => c.title === "Cursed Number")!;
  const card = {
    ...source,
    dice: {
      ...source.dice!,
      instruction: "That number is banned. Say it: drink 2.",
    },
  };
  let state = createSession(
    { version: 1, packIds: ["core"], limit: 1 },
    [card],
    [{ ...packs[0], cardIds: [card.id] }],
  );
  state.phase = "revealed";
  state = rollDice(state, () => 1 / 6);
  await page.goto("./");
  await page.evaluate(
    ({ key, state }) => localStorage.setItem(key, JSON.stringify(state)),
    { key, state },
  );
  await page.reload();
  await expect(page.locator(".roll-layer")).toHaveCount(0);
  await expect(page.locator(".resolved-instruction")).toHaveText(
    "2 is banned. Say it: drink 2.",
  );
  expect((await saved(page)).roll.instruction).toBe(state.roll!.instruction);
});

test("resolved 1d20 through 4d6 summaries fit a small phone with enlarged text", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const source = cards.find((card) => card.id === diceIds[0])!;
  for (const count of [1, 2, 3, 4]) {
    const sides = count === 1 ? 20 : 6;
    const card = {
      ...source,
      dice: {
        version: 1 as const,
        count,
        sides: sides as 6 | 20,
        instruction: "Give {total}.",
      },
    };
    const state = createSession(
      { version: 1, packIds: ["core"], limit: 1 },
      [card],
      [{ ...packs[0], cardIds: [card.id] }],
    );
    const values = Array.from({ length: count }, () => sides);
    const total = values.reduce((sum, value) => sum + value, 0);
    state.phase = "revealed";
    state.roll = {
      values,
      total,
      instruction: `Give ${total}.`,
      returned: true,
    };
    await page.goto("./");
    await page.evaluate(
      ({ key, state }) => localStorage.setItem(key, JSON.stringify(state)),
      { key, state },
    );
    await page.reload();
    await page
      .locator("main")
      .evaluate((element) => element.classList.add("enlarged"));
    await expect(page.locator(".dice-result-face")).toHaveCount(count);
    await expect(page.locator(".resolved-instruction")).toHaveText(
      `Give ${total}.`,
    );
    expect(
      await page
        .locator(".study-rules")
        .evaluate((element) => element.scrollWidth <= element.clientWidth + 2),
      `${count} dice should not overflow horizontally`,
    ).toBe(true);
  }
});

for (const viewport of [
  { width: 320, height: 568 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
]) {
  test.describe(`viewport ${viewport.width}`, () => {
    if (viewport.width === 1280)
      test.use({
        isMobile: false,
        hasTouch: false,
        userAgent: devices["Desktop Safari"].userAgent,
      });
    test(`four dice stay visible and retain faces at ${viewport.width}px`, async ({
      page,
    }, info) => {
      test.skip(!(await webgl(page)), "WebGL unavailable");
      await page.setViewportSize(viewport);
      const source = cards.find((c) => c.id === "house.sheet-003")!;
      const card = {
        ...source,
        rules: "Roll 4d6. Give the total.",
        dice: { ...source.dice!, count: 4 },
      };
      const state = createSession(
        { version: 1, packIds: ["core"], limit: 2 },
        [card],
        [{ ...packs[0], cardIds: [card.id] }],
      );
      state.phase = "revealed";
      await page.goto("./");
      await page.evaluate(
        ({ key, state }) => localStorage.setItem(key, JSON.stringify(state)),
        { key, state },
      );
      await page.reload();
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.locator(".game-card").click();
      const committed = await saved(page);
      await expect(page.locator(".roll-stage")).toHaveAttribute(
        "data-renderer",
        `settled:${committed.roll.values.join(",")}`,
      );
      const bounds = JSON.parse(
        (await page.locator(".roll-stage").getAttribute("data-landed-bounds"))!,
      ) as number[][];
      expect(bounds).toHaveLength(4);
      for (const [left, top, right, bottom] of bounds) {
        expect(left).toBeGreaterThanOrEqual(0);
        expect(top).toBeGreaterThanOrEqual(0);
        expect(right).toBeLessThanOrEqual(viewport.width);
        expect(bottom).toBeLessThanOrEqual(viewport.height);
      }
      await page.screenshot({
        path: info.outputPath(`dice-${viewport.width}.png`),
      });
      await expect(page.locator(".roll-layer")).toHaveCount(0);
      await expect(page.locator(".resolved-instruction")).toHaveText(
        `Give ${committed.roll.total}.`,
      );
      await expect(page.locator(".resolved-instruction strong")).toHaveText(
        String(committed.roll.total),
      );
      await expect(page.locator(".dice-result-face")).toHaveText(
        committed.roll.values.map(String),
      );
      await expect(page.locator(".dice-result-total strong")).toHaveText(
        String(committed.roll.total),
      );
      await page.screenshot({
        path: info.outputPath(`result-${viewport.width}.png`),
      });
      expect(errors).toEqual([]);
    });
  });
}

test("a finish request during lazy loading survives startup without another roll", async ({
  page,
}) => {
  let release: () => void = () => {};
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/library-*.js", async (route) => {
    await ready;
    await route.continue();
  });
  await seed(page);
  await page.locator(".game-card").click();
  const committed = await saved(page);
  await page.locator(".game-card").click();
  expect((await saved(page)).roll).toEqual(committed.roll);
  release();
  await expect(page.locator(".roll-layer")).toHaveCount(0);
  expect((await saved(page)).roll).toEqual({
    ...committed.roll,
    returned: true,
  });
  expect((await saved(page)).discarded).toBe(0);
});

async function seedChoice(page: Page) {
  const card = cards.find((c) => c.id === "house.sheet-023")!;
  const house = packs.find((p) => p.id === "house")!;
  const session = createSession(
    { version: 1, packIds: ["house"], limit: 3 },
    [card],
    [{ ...house, cardIds: [card.id] }],
  );
  session.phase = "revealed";
  await page.goto("./");
  await Promise.all([
    page.waitForNavigation(),
    page.evaluate(
      ({ key, session }) => {
        localStorage.setItem(key, JSON.stringify(session));
        location.reload();
      },
      { key, session },
    ),
  ]);
  await expect(page.locator(".card-choice")).toBeVisible();
}
for (const viewport of [
  { width: 390, height: 844 },
  { width: 375, height: 548 },
])
  test(`choice card offers both options on the card at ${viewport.width}x${viewport.height} @release`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await seedChoice(page);
    const skip = page.locator(".card-choice-option.skip");
    const roll = page.locator(".card-choice-option.roll");
    await expect(skip).toHaveAccessibleName("Wear them");
    await expect(roll).toHaveAccessibleName("Refuse: roll 2d6");
    const boxes = await Promise.all(
      [".game-card", ".study-body", ".study-rules p"]
        .map((selector) => page.locator(selector))
        .concat(skip, roll)
        .map((locator) => locator.boundingBox()),
    );
    const [cardBox, body, rules, left, right] = boxes.map((box) => box!);
    for (const plaque of [left, right]) {
      expect(plaque.height).toBeGreaterThanOrEqual(48);
      expect(plaque.x).toBeGreaterThanOrEqual(cardBox.x);
      expect(plaque.x + plaque.width).toBeLessThanOrEqual(
        cardBox.x + cardBox.width + 1,
      );
      expect(plaque.y + plaque.height).toBeLessThanOrEqual(
        cardBox.y + cardBox.height + 1,
      );
      // The parchment ends above the plaques, so no rule text sits under them.
      expect(body.y + body.height).toBeLessThanOrEqual(plaque.y + 1);
    }
    expect(rules.y + rules.height).toBeLessThanOrEqual(left.y);
    expect(left.x + left.width).toBeLessThanOrEqual(right.x);
    // A tap on the card itself neither rolls nor discards.
    await page.locator(".game-card").click({ force: true });
    expect((await saved(page)).roll).toBeNull();
    expect((await saved(page)).discarded).toBe(0);
    await skip.click();
    await expect(page.locator(".game-card")).toHaveAccessibleName(
      "Reveal card",
    );
    await expect(page.locator(".card-choice")).toHaveCount(0);
    expect(await saved(page)).toMatchObject({
      discarded: 1,
      phase: "hidden",
      roll: null,
      previousRoll: null,
    });
    // The unrolled card survives a reload and reads back as the previous card.
    await page.reload();
    await expect(page.locator(".game-card")).toHaveAccessibleName(
      "Reveal card",
    );
    await page.locator(".game-card").click();
    await roll.click();
    await expect(page.locator(".resolved-instruction")).toHaveText(
      /^Drink \d+\.$/,
      { timeout: 15000 },
    );
    const rolled = await saved(page);
    expect(rolled.roll.values).toHaveLength(2);
    expect(rolled.roll.returned).toBe(true);
  });
