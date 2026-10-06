import { test, expect, type Page } from "@playwright/test";
import { createSession } from "../../src/game/engine";
import { cards, packs } from "../../src/content/catalog";
const key = "side-quest.session.v1";

// A Secrets & fuses game with the given card revealed first.
async function seed(page: Page, first: string) {
  const session = createSession(
    { version: 1, packIds: ["secrets"], limit: 30 },
    cards,
    packs,
  );
  session.order = [first, ...session.order.filter((id) => id !== first)];
  session.phase = "revealed";
  await page.goto("./");
  await page.evaluate(
    ({ key, session }) => localStorage.setItem(key, JSON.stringify(session)),
    { key, session },
  );
  await page.reload();
}
const discarded = (page: Page) =>
  page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).discarded as number,
    key,
  );
async function hold(page: Page, name: RegExp) {
  const box = (await page
    .locator(".card-actions")
    .getByRole("button", { name })
    .boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
}

for (const width of [320, 390])
  test(`@release a secret shows only while held, at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 700 });
    await seed(page, "secrets.paranoia-01");
    const rules = page.locator(".game-card .study-rules");
    await expect(rules).toContainText("Left neighbor reads alone");
    await expect(rules).not.toContainText("unlocked phone");
    // The plaque sits below the rules, inside the card.
    const plaque = page
      .locator(".card-actions")
      .getByRole("button", { name: /Hold to read/ });
    const [card, body, plaqueBox] = await Promise.all([
      page.locator(".game-card").boundingBox(),
      page.locator(".game-card .study-body").boundingBox(),
      plaque.boundingBox(),
    ]);
    expect(body!.y + body!.height).toBeLessThanOrEqual(plaqueBox!.y + 1);
    expect(plaqueBox!.y + plaqueBox!.height).toBeLessThanOrEqual(
      card!.y + card!.height,
    );
    await hold(page, /Hold to read/);
    await expect(rules).toContainText(
      "Who here would you least trust with your unlocked phone?",
    );
    await page.screenshot({ path: info.outputPath(`secret-${width}.png`) });
    await page.mouse.up();
    await expect(rules).toContainText("Left neighbor reads alone");
    await expect(rules).not.toContainText("unlocked phone");
    // A secret card goes aside with an ordinary tap.
    await page.locator(".game-card").click();
    await expect.poll(() => discarded(page)).toBe(1);
  });

test("@release a fuse holds the card until the boom", async ({
  page,
}, info) => {
  await page.clock.install();
  await seed(page, "secrets.potato-01");
  const card = page.locator(".game-card");
  await expect(card).toHaveAttribute("aria-disabled", "true");
  // A tap on a waiting timed card never puts it aside.
  await card.click({ force: true });
  expect(await discarded(page)).toBe(0);
  await page
    .locator(".card-actions")
    .getByRole("button", { name: /Light the fuse/ })
    .click();
  await expect(page.getByRole("timer")).toHaveAccessibleName("The fuse is lit");
  await page.clock.runFor(14_000);
  // A tap on a waiting timed card never puts it aside.
  await card.click({ force: true });
  expect(await discarded(page)).toBe(0);
  // Step the hidden fuse (15 to 45 s) a second at a time to catch the blast.
  const rules = card.locator(".study-rules");
  for (let i = 0; i < 32; i++) {
    if ((await rules.textContent())?.startsWith("Boom")) break;
    await page.clock.runFor(1_000);
  }
  await expect(rules).toHaveText("Boom. Whoever's holding this drinks 3.");
  await expect(page.locator(".timer-blast.boom")).toBeVisible();
  await page.screenshot({ path: info.outputPath("boom.png") });
  // The blast clears itself and never blocks the card.
  await page.clock.runFor(2_000);
  await expect(page.locator(".timer-blast")).toHaveCount(0);
  await expect(card).toHaveAttribute("aria-disabled", "false");
  await card.click();
  await expect.poll(() => discarded(page)).toBe(1);
});

test("a countdown counts, keeps its secret, and a reload unlights it", async ({
  page,
}, info) => {
  await page.clock.install();
  await seed(page, "secrets.forehead-01");
  await page
    .locator(".card-actions")
    .getByRole("button", { name: /Start the clock/ })
    .click();
  const timer = page.getByRole("timer");
  await expect(timer).toHaveAccessibleName("30 seconds left");
  await page.clock.runFor(10_000);
  await expect(timer).toHaveAccessibleName("20 seconds left");
  await hold(page, /Hold to read/);
  await expect(page.locator(".game-card .study-rules")).toContainText(
    "Hangover",
  );
  await page.screenshot({ path: info.outputPath("forehead.png") });
  await page.mouse.up();
  await page.clock.runFor(21_000);
  await expect(page.locator(".game-card .study-rules")).toHaveText(
    "Time. Got it? Give 3. Still guessing? Drink 3.",
  );
  // The hold plaque stays for a secret card after time is up.
  await expect(
    page.locator(".card-actions").getByRole("button", { name: /Hold to read/ }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page
      .locator(".card-actions")
      .getByRole("button", { name: /Start the clock/ }),
  ).toBeVisible();
  expect(await discarded(page)).toBe(0);
});
