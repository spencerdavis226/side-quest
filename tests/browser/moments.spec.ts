import { test, expect, seed, saved, withMotion, rng, frames } from "./support";
import { advance, createSession, currentCard } from "../../src/game/engine";
import { returnToCard, rollDice } from "../../src/game/dice";
import { cards, packs } from "../../src/content/catalog";
import type { SessionState } from "../../src/game/types";
import { STEP, crawlAt, league, leagueAt } from "./sessions";

const rolled = (s: SessionState, face: number) =>
  returnToCard(rollDice(s, () => (face - 0.5) / currentCard(s).dice!.sides));

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
  // The tap that skips it never reaches the card. Tap at once: waiting for
  // the stage to read as "stable" can outlast a 2.6 s moment on a slow
  // runner (WebKit in CI).
  await moment.click({ force: true });
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
  // Centred on the screen (owner, 2026-11-01: the 160vmax rays sat in the
  // grid and pushed the numbers off a phone's right edge; toBeVisible still
  // passed, so measure).
  const view = page.viewportSize()!;
  for (const el of [".point-num", ".point-word"]) {
    const box = (await stage.locator(el).first().boundingBox())!;
    expect(Math.abs(box.x + box.width / 2 - view.width / 2)).toBeLessThan(4);
    expect(Math.abs(box.y + box.height / 2 - view.height / 2)).toBeLessThan(
      view.height * 0.1,
    );
  }
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

// A boss's entrance (2026-11-01 review): it plays once, as the boss is
// dealt; a tap on the card skips it and turns the card in the same tap (the
// table's tap does it, not the animation); a boss dealt again after a lost
// swing gets none.
test("a boss's entrance plays once, and a tap on the card skips it and turns it", async ({
  page,
}) => {
  await withMotion(page);
  await seed(page, advance(crawlAt("dungeon.possessed-mop", STEP.boss1 - 1)));
  await page.locator(".game-card").click();
  const entrance = page.locator(".moment-entrance");
  await expect(entrance).toBeVisible();
  await expect(entrance.locator(".gate-board strong")).not.toBeEmpty();
  const box = (await page.locator(".game-card").boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(entrance).toHaveCount(0);
  await expect.poll(async () => (await saved(page)).phase).toBe("revealed");
  const s = await saved(page);
  expect(s.discarded).toBe(STEP.boss1);
  expect(s.quest.step).toBe(STEP.boss1);
});

test("a boss dealt again after a lost swing has no second entrance", async ({
  page,
}) => {
  await withMotion(page);
  const boss = advance(crawlAt("dungeon.keg-golem", STEP.boss1));
  const lost = returnToCard(
    rollDice(boss, () => (2 - 0.5) / currentCard(boss).dice!.sides),
  );
  await seed(page, lost);
  await page.locator(".game-card").click();
  // Put aside and dealt again, face down: the same boss, the same step.
  await expect.poll(async () => (await saved(page)).phase).toBe("hidden");
  const again = await saved(page);
  expect(again.previousId).toBe("dungeon.keg-golem");
  expect(again.quest.step).toBe(STEP.boss1);
  await expect(page.locator(".card-stage")).not.toHaveClass(
    /\b(deal|flip|discard)\b/,
  );
  await frames(page, 10);
  await expect(page.locator(".moment-entrance")).toHaveCount(0);
});

test("a beaten gym's badge flies into the badges chip", async ({ page }) => {
  await withMotion(page);
  // Byron's ace, one hit landed: Won fells him and earns the sixth badge.
  await seed(page, advance(leagueAt("pokemon.gym-byron", { hits: 1 })));
  await page.getByRole("button", { name: "Won", exact: true }).click();
  await expect(page.locator(".moment-badge")).toBeVisible();
  // No stamp first: the badge says it (2026-11-01, owner).
  await expect(page.locator(".felled-stamp")).toHaveCount(0);
  const flier = page.locator(".moment-flier");
  await expect(flier).toHaveCount(1, { timeout: 5000 });
  // Held at the end of its flight: over the chip, still painted.
  const landing = await flier.evaluate((el) => {
    const flight = el.getAnimations()[0];
    flight.pause();
    flight.currentTime =
      Number(flight.effect!.getComputedTiming().duration) * 0.98;
    const r = el.getBoundingClientRect();
    const t = document
      .querySelector('[data-fly="badges"]')!
      .getBoundingClientRect();
    // The badge's art, or its type's medallion when a gym has no art.
    const face = el.querySelector<HTMLElement>("img, .type-mark");
    const look = face && getComputedStyle(face);
    return {
      gap: Math.hypot(
        r.left + r.width / 2 - (t.left + t.width / 2),
        r.top + r.height / 2 - (t.top + t.height / 2),
      ),
      fits: r.height <= t.height * 1.2,
      art:
        !!look &&
        look.visibility === "visible" &&
        face!.getBoundingClientRect().width > 0 &&
        (face!.tagName === "IMG" ||
          look.backgroundImage !== "none" ||
          look.backgroundColor !== "rgba(0, 0, 0, 0)"),
    };
  });
  expect(landing.gap).toBeLessThan(12);
  expect(landing.fits).toBe(true);
  expect(landing.art).toBe(true);
  await expect(
    page.getByRole("status").and(page.locator("#banner-announcer")),
  ).toContainText("Badge earned. 6 of 8.");
});

test("a tap during the type clash still rolls", async ({ page }) => {
  await withMotion(page);
  // Lt. Surge (Electric) turned over against Squirtle (Water).
  await seed(
    page,
    leagueAt("pokemon.gym-lt-surge", {}, 0, "pokemon.starter-squirtle"),
  );
  await page.locator(".game-card").click();
  await expect(page.locator(".moment-clash")).toBeVisible();
  await page.locator(".game-card").click();
  await expect(page.locator(".moment-clash")).toHaveCount(0);
  await expect.poll(async () => (await saved(page)).roll).not.toBeNull();
});

test("a jinx is laid on a scroll that rolls up into the jinx chip", async ({
  page,
}) => {
  await withMotion(page);
  // The Goblin Shaman lost on a 2: Goblin Tongue is laid.
  await seed(
    page,
    rolled(advance(crawlAt("dungeon.goblin-shaman", STEP.floor1)), 2),
  );
  await page.locator(".game-card").click();
  const scroll = page.locator(".moment-jinx .jinx-scroll");
  await expect(scroll).toBeVisible();
  await expect(scroll).toContainText("Goblin Tongue");
  await expect(scroll).toContainText("The jinxed player speaks of themself");
  // Its seal flies into the strip's jinx chip, then the moment ends.
  await expect(page.locator(".moment-flier")).toHaveCount(1, {
    timeout: 6000,
  });
  await expect(page.locator(".moment-jinx")).toHaveCount(0, { timeout: 6000 });
  await expect(page.locator(".tag-jinx")).toBeVisible();
  await expect(
    page.getByRole("status").and(page.locator("#banner-announcer")),
  ).toContainText("Jinxed! Goblin Tongue.");
});

test("a teammate lost with in a fight faints, quietly, once", async ({
  page,
}) => {
  await withMotion(page);
  // Pidgey sent into Machop's fight (Route 3) and the roll lost on a 2.
  const PIDGEY = "pokemon.route-pidgey";
  const s = leagueAt("pokemon.route-machop", {}, 0, "pokemon.starter-pikachu");
  const q = s.quest!;
  const finale = [...q.finale];
  const was = finale.indexOf(PIDGEY);
  if (was >= 0) finale[was] = finale[1];
  finale[1] = PIDGEY;
  const up = advance({
    ...s,
    previousId: finale[q.step - 1],
    quest: {
      ...q,
      finale,
      party: { ...q.party!, team: [PIDGEY], assist: PIDGEY },
    },
  });
  await seed(page, rolled(up, 2));
  await page.locator(".game-card").click();
  const moment = page.locator(".moment-faint");
  await expect(moment).toBeVisible();
  await expect(moment.locator(".faint-words strong")).toHaveText("Pidgey");
  await expect
    .poll(async () => (await saved(page)).quest.party.fainted)
    .toBe(PIDGEY);
  await moment.click({ force: true });
  await expect(moment).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".game-card")).toBeVisible();
  await expect(page.locator(".moment")).toHaveCount(0);
});

test("a hidden room's bookcase swings open; a tap on the card skips it and turns it", async ({
  page,
}) => {
  await withMotion(page);
  // The first landing, resting: next is the Speakeasy's first guard.
  await seed(
    page,
    advance(
      crawlAt(
        "dungeon.landing-stairwell",
        STEP.landing1,
        {},
        {
          adventurer: "barbarian",
        },
      ),
    ),
  );
  await page.getByRole("button", { name: /^Rest/ }).click();
  const door = page.locator(".moment-door");
  await expect(door).toBeVisible();
  await expect(door.locator(".door-room")).toContainText("The Speakeasy");
  await expect(door.locator(".door-room")).toContainText(
    "Wanted: The Proprietor",
  );
  await expect(page.locator(".stage-banner")).toHaveCount(0);
  await page.locator(".game-card").click({ force: true });
  await expect(door).toHaveCount(0);
  await expect.poll(async () => (await saved(page)).phase).toBe("revealed");
  await page.reload();
  await expect(page.locator(".game-card")).toBeVisible();
  await expect(page.locator(".moment")).toHaveCount(0);
});

test("a boss's foil is one sheet over the whole card, under its text", async ({
  page,
}) => {
  await seed(page, advance(leagueAt("pokemon.gym-byron")));
  const foil = page.locator(".game-card .card-foil");
  await expect(foil).toHaveCount(1);
  // No cut-outs (2026-11-01, owner: they looked janky), and the title and
  // rules sit above it.
  const look = await foil.evaluate((el) => {
    const face = el.parentElement!;
    const z = (sel: string) =>
      Number(getComputedStyle(face.querySelector(sel)!).zIndex);
    const f = el.getBoundingClientRect();
    const r = face.getBoundingClientRect();
    return {
      mask: getComputedStyle(el).maskImage,
      covers: f.width === r.width && f.height === r.height,
      under:
        Number(getComputedStyle(el).zIndex) < z(".study-title") &&
        Number(getComputedStyle(el).zIndex) < z(".study-body"),
    };
  });
  expect(look).toEqual({ mask: "none", covers: true, under: true });
});
