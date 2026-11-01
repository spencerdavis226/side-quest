import { test, expect, seed, saved, withMotion, rng } from "./support";
import { createSession } from "../../src/game/engine";
import { cards, packs } from "../../src/content/catalog";
import { league } from "./sessions";

// The moments layer (2026-11-01): full-screen moments play only on what the
// table just did, a tap skips one without reaching the card underneath,
// and a reload plays nothing.

test("@release the League's starter turns over with a ball; a tap skips it, a reload plays nothing", async ({
  page,
}) => {
  await withMotion(page);
  const s = createSession(
    { ...league, packIds: [...league.packIds] },
    cards,
    packs,
    rng("moments starter"),
  );
  await seed(page, s);
  await page.locator(".game-card").click();
  const moment = page.locator(".moment-omen");
  await expect(moment).toBeVisible();
  await expect(moment.locator(".omen-name small")).toHaveText("Your starter");
  // The tap that skips it never reaches the card.
  await moment.click();
  await expect(moment).toHaveCount(0);
  const after = await saved(page);
  expect(after.phase).toBe("revealed");
  expect(after.discarded).toBe(0);
  await page.reload();
  await expect(page.locator(".game-card")).toBeVisible();
  await expect(page.locator(".moment")).toHaveCount(0);
});

test("Most Likely To counts down to POINT, and the card still puts aside", async ({
  page,
}) => {
  await withMotion(page);
  const s = createSession(
    { version: 1, packIds: ["likely"], limit: 50 },
    cards,
    packs,
    rng("moments likely"),
  );
  await seed(page, s);
  await page.locator(".game-card").click();
  const plaque = page.getByRole("button", { name: /Count it down/ });
  await expect(plaque).toBeVisible();
  await plaque.click();
  const stage = page.locator(".point-countdown");
  await expect(stage).toBeVisible();
  await expect(stage.locator(".point-word")).toHaveText("Point!");
  await expect(stage).toHaveCount(0, { timeout: 6000 });
  await page.locator(".game-card").click();
  await expect.poll(async () => (await saved(page)).discarded).toBe(1);
});

test("Reduced Motion reads a moment's words on a still plaque", async ({
  page,
}) => {
  const s = createSession(
    { version: 1, packIds: ["core"], limit: 50 },
    cards,
    packs,
    rng("moments still"),
  );
  // One card before halfway, face up and plain.
  const plain = s.cards.findIndex((c) => !c.dice && !c.timer && !c.secret);
  const order = [...s.order];
  const at = order.indexOf(s.cards[plain].id);
  [order[24], order[at]] = [order[at], order[24]];
  await seed(page, {
    ...s,
    order,
    position: 24,
    discarded: 24,
    previousId: order[23],
    phase: "revealed",
  });
  await page.locator(".game-card").click();
  await expect(page.locator(".still-plaque")).toHaveText(
    /cards left\s*Halfway\s*Refill the glasses\./,
  );
});
