// Content sweeps (@sweep): every crawl and League card loaded into a real
// game at the size it must fit, and its rules checked for overflow. They need
// layout, so they stay in the browser, but they load about 1,100 saves, so
// they are their own run: `npm run test:sweep` (and the full-validation
// dispatch), after changing card text, plaques or the card face. They are
// split into chunks so the workers share them.
import { type Page } from "@playwright/test";
import { test, expect, reseed } from "./support";
import { advance } from "../../src/game/engine";
import type { SessionState } from "../../src/game/types";
import { cards, packs } from "../../src/content/catalog";
import { crawlAt, leagueAt } from "./sessions";

// No service worker: a sweep reloads hundreds of times, and the worker's
// registration and update check on each load are not what is measured.
test.use({ serviceWorkers: "block" });

const reveal = (s: SessionState) => advance(s);
const chunk = <T>(list: T[], part: number, parts: number) =>
  list.filter((_, i) => i % parts === part);

/** Load `session` and report whether its rules spill. The card measures
 * itself after layout (a ResizeObserver, then again once fonts settle), so
 * this waits for that to settle on "none"; a card that really overflows
 * never does. */
async function spills(page: Page, session: SessionState, ready?: string) {
  await reseed(page, session);
  const rules = page.locator(".game-card .study-rules");
  await expect(rules).toBeVisible();
  if (ready) await expect(page.locator(ready)).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  try {
    await expect(rules).toHaveAttribute("data-overflow", "none", {
      timeout: 2000,
    });
    return false;
  } catch {
    return true;
  }
}

// Every Dungeon night card (about 575), each at its stage's first step on
// the route that has it, with a smoke bomb in the satchel so every room fight
// carries its Flee plaque.
const DUNGEON_PARTS = 6;
const dungeonIds = cards
  .filter((c) => c.id.startsWith("dungeon."))
  .map((c) => c.id);
const crawlRoutes = [0, 1, 2].flatMap((route) =>
  [0, 1, 2, 3, 4].map((room) => ({
    route,
    room,
    base: crawlAt(dungeonIds[0], 0, {}, { route, room }),
  })),
);
// Where a card is dealt: its stage's first step (an elite, behind a fork,
// one room later).
function crawlPlace(id: string) {
  for (const { route, room, base } of crawlRoutes) {
    let first = 0;
    for (const stage of base.quest!.stages) {
      if (stage.cards.some((c) => c.id === id))
        return { step: first, route, room };
      if (stage.elite?.some((c) => c.id === id))
        return { step: first + 1, route, room };
      first += stage.pick;
    }
  }
  throw Error(id);
}
for (let part = 0; part < DUNGEON_PARTS; part++)
  test(`@sweep every Dungeon night card fits its face with its plaques at 393x640 (${part + 1}/${DUNGEON_PARTS})`, async ({
    page,
  }) => {
    test.setTimeout(300000);
    await page.setViewportSize({ width: 393, height: 640 });
    await page.goto("./");
    const overflowing: string[] = [];
    for (const id of chunk(dungeonIds, part, DUNGEON_PARTS)) {
      const { step, route, room } = crawlPlace(id);
      const s = reveal(crawlAt(id, step, { loot: ["smoke"] }, { route, room }));
      if (await spills(page, s)) overflowing.push(id);
    }
    expect(overflowing).toEqual([]);
  });

// Every League-only card (about 400): starters as the run's starter, the
// rest at their stage on the villain route that holds them, with an Escape
// Rope in the bag so every route fight carries its plaque.
const LEAGUE_PARTS = 4;
const leagueDeck = new Set(packs.find((p) => p.id === "pokemon")!.cardIds);
const leagueIds = cards
  .filter((c) => c.id.startsWith("pokemon.") && !leagueDeck.has(c.id))
  .map((c) => c.id);
// Which villain route holds a hideout card.
function hideoutOf(id: string) {
  for (let h = 0; h < 9; h++)
    if (
      leagueAt(id, {}, h).quest!.stages.some((st) =>
        st.cards.some((c) => c.id === id),
      )
    )
      return h;
  return 0;
}
for (let part = 0; part < LEAGUE_PARTS; part++)
  test(`@sweep every League card fits its face with its plaques at 393x640 (${part + 1}/${LEAGUE_PARTS})`, async ({
    page,
  }) => {
    test.setTimeout(300000);
    await page.setViewportSize({ width: 393, height: 640 });
    await page.goto("./");
    const overflowing: string[] = [];
    for (const id of chunk(leagueIds, part, LEAGUE_PARTS)) {
      const s = reveal(
        id.startsWith("pokemon.starter-")
          ? leagueAt(id, {}, 0, id)
          : leagueAt(id, { loot: ["smoke"] }, hideoutOf(id)),
      );
      if (await spills(page, s)) overflowing.push(id);
    }
    expect(overflowing).toEqual([]);
  });

// A thrown ball reads on the card (2026-10-27): every Pokémon's caught and
// fled lines fit the narrowest phone without scrolling. (That there are 81
// is checked in tests/team.test.ts.)
const BALL_PARTS = 2;
const catchable = cards
  .filter(
    (c) =>
      c.id.startsWith("pokemon.") &&
      (c.catchable || c.offers?.some((o) => o.catch)),
  )
  .map((c) => c.id);
for (let part = 0; part < BALL_PARTS; part++)
  test(`@sweep every Pokémon's thrown-ball lines fit its face at 320x568 (${part + 1}/${BALL_PARTS})`, async ({
    page,
  }) => {
    test.setTimeout(300000);
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("./");
    const overflowing: string[] = [];
    for (const id of chunk(catchable, part, BALL_PARTS))
      for (const face of [20, 1]) {
        const s = reveal(
          leagueAt(id, { throw: { id, face } }, 0, "pokemon.starter-pikachu"),
        );
        if (await spills(page, s, ".game-card .ball-result"))
          overflowing.push(`${id}:${face}`);
      }
    expect(overflowing).toEqual([]);
  });
