import { describe, expect, it } from "vitest";
import { createSession, currentCard, type Random } from "../src/game/engine";
import { parseSession } from "../src/app/persistence";
import { cards, packs } from "../src/content/catalog";
import type { GameConfig, SessionState } from "../src/game/types";

// Pokémon League as a crawl (owner, 2026-10-16): a starter, eight routes
// each closed by a gym, a villain hideout after the fourth badge, Victory
// Road, the rival, a Legendary, four of the Elite Four and a Champion.
const league: GameConfig = {
  version: 1,
  packIds: ["pokemon"],
  limit: null,
  quest: "pokemon",
};
// Park-Miller, with the seed scrambled first (see tests/dungeon.test.ts).
const seeded = (seed: number): Random => {
  seed = (Math.imul(seed, 2654435761) >>> 0) % 2147483646 || 1;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
};
const roundTrip = (s: SessionState) =>
  expect(parseSession(JSON.stringify(s))).toEqual(s);
const pack = packs.find((p) => p.id === "pokemon")!;

describe("Pokémon League journey", () => {
  it("is a crawl of the Pokémon pack alone, opening on a starter", () => {
    const s = createSession(league, cards, packs, seeded(1));
    expect(s.quest!.party).toMatchObject({ hearts: 17, max: 17 });
    const labels = s.quest!.stages.map((st) => st.label);
    expect(labels[0]).toBe("Your starter");
    expect(labels.filter((l) => /^Route \d$/.test(l))).toHaveLength(8);
    expect(labels.filter((l) => /^Gym \d$/.test(l))).toHaveLength(8);
    expect(labels.slice(-5)).toEqual([
      "Victory Road",
      "Pokémon League",
      "Legendary",
      "Elite Four",
      "Champion",
    ]);
    // The hideout sits after the fourth gym.
    expect(labels[labels.indexOf("Gym 4") + 1]).toMatch(
      /Hideout|HQ|Castle|Lab|House|Tower|Base/,
    );
    // About 53 cards are dealt, before rematches and boss swings.
    expect(s.quest!.finale).toHaveLength(53);
    expect(currentCard(s).encounter).toBe("omen");
    // The plain deck never plays in the League.
    expect(s.cards.every((c) => pack.cardIds.includes(c.id))).toBe(true);
    roundTrip(s);
  });

  it("gym k is always one of every region's kth leaders", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = createSession(league, cards, packs, seeded(seed));
      for (let k = 1; k <= 8; k++) {
        const stage = s.quest!.stages.find((st) => st.label === `Gym ${k}`)!;
        expect(stage.cards).toHaveLength(9);
        expect(stage.cards.every((c) => c.quest === "pokemon")).toBe(true);
      }
    }
  });

  it("deals every starter and every hideout across runs", () => {
    const starters = new Set<string>();
    const hideouts = new Set<string>();
    for (let seed = 1; seed <= 600; seed++) {
      const s = createSession(league, cards, packs, seeded(seed));
      starters.add(s.quest!.finale[0]);
      const at = s.quest!.stages.findIndex((st) => st.label === "Gym 4");
      hideouts.add(s.quest!.stages[at + 1].label);
    }
    expect(starters.size).toBe(25);
    expect(hideouts.size).toBe(9);
  });
});
