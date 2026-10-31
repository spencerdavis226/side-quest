import { type Page } from "@playwright/test";
import { test, expect, motion, rng, seedStorage, SESSION_KEY } from "./support";
import { createSession } from "../../src/game/engine";
import { cards, packs } from "../../src/content/catalog";
// The title is re-fitted while the card turns: this needs the turn.
test.use(motion);

// A Standard Core game with a long-titled card on top, face down: one page
// load (it was four: setup, Play, reorder, reload).
async function revealTitleCard(page: Page) {
  const config = { version: 1, packIds: ["core"], limit: 50 } as const;
  const session = createSession(
    { ...config, packIds: [...config.packIds] },
    cards,
    packs,
    rng("title fit"),
  );
  const id = "cabin.almost-lost-my-cool";
  session.order = [id, ...session.order.filter((x) => x !== id)];
  await seedStorage(page, {
    [SESSION_KEY]: JSON.stringify(session),
    "side-quest.settings.v1": JSON.stringify({ config, choice: "standard" }),
  });
  await page.getByRole("button", { name: "Reveal card" }).click();
}
const titleSize = (page: Page) =>
  page
    .locator(".study-title h2")
    .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

test("a title fitted mid-flip settles at its full size", async ({ page }) => {
  // Four full game setups; slow WebKit runs exceed the default 30 s.
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1850, height: 1065 });
  await revealTitleCard(page);
  await expect(page.locator(".card-stage")).not.toHaveClass(/flip/);
  const flat = await titleSize(page);
  // A resize during the turn re-fits the title while the card is tilted; the
  // 3D stretch must not leave it stuck small. Sample a few points of the turn.
  for (const delay of [200, 280, 360]) {
    await page.setViewportSize({ width: 1850, height: 1065 });
    await revealTitleCard(page);
    // Hold the turn at `delay` ms in (rather than sleeping and hoping the
    // runner keeps pace), resize while it is tilted, then let it finish.
    const held = await page.evaluate((delay) => {
      const turning = document
        .getAnimations()
        .filter(
          (a) =>
            a.playState === "running" &&
            Number(a.effect?.getComputedTiming().endTime) > delay,
        );
      for (const a of turning) {
        a.pause();
        a.currentTime = delay;
      }
      (window as unknown as { __held: Animation[] }).__held = turning;
      return turning.length;
    }, delay);
    expect(held, `the turn is under way at ${delay}ms`).toBeGreaterThan(0);
    await page.setViewportSize({ width: 1849, height: 1064 });
    await page.evaluate(() => {
      for (const a of (window as unknown as { __held: Animation[] }).__held)
        a.play();
    });
    await expect(page.locator(".card-stage")).not.toHaveClass(/flip/);
    // The 3D stretch must not leave it stuck small once the card is flat.
    await expect
      .poll(() => titleSize(page), { message: `re-fit at ${delay}ms` })
      .toBeGreaterThan(flat - 1.5);
  }
});
