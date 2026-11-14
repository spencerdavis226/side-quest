import { describe, expect, it } from "vitest";
import {
  advance,
  createSession,
  currentCard,
  finaleCard,
  takeSpoils,
  type Random,
} from "../src/game/engine";
import { returnToCard, rollDice } from "../src/game/dice";
import { parseSession } from "../src/app/persistence";
import { cards, packs } from "../src/content/catalog";
import { cardFinish } from "../src/components/moments/detect";
import { JOKE_CLASSES } from "../src/content/dungeon/classes";
import { regionRares } from "../src/content/dungeon/rares";
import { hiddenIds } from "../src/content/dungeon/hidden";
import type { GameConfig, SessionState } from "../src/game/types";
import { takeRoads } from "./roads";

// Rare things (The Quest 2.0 Phase 6, 2026-11-14): a stage's rares replace
// one of its picks, with their odds, when the game starts; a hidden result
// is one face of one card that brings something its rules never say.
const crawl: GameConfig = {
  version: 1,
  packIds: ["dungeon"],
  limit: null,
  quest: "dungeon",
};
const seeded = (seed: number): Random => {
  seed = (Math.imul(seed, 2654435761) >>> 0) % 2147483646 || 1;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
};
const RARES = new Set(
  Object.values(regionRares)
    .flat()
    .map((c) => c.id),
);
const roundTrip = (s: SessionState) =>
  expect(parseSession(JSON.stringify(s))).toEqual(s);

describe("rares", () => {
  it("a region deals a rare about one run in five, in a room's place, never the landmark's", () => {
    let regions = 0;
    let rare = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const s = takeRoads(createSession(crawl, cards, packs, seeded(seed)));
      const q = s.quest!;
      let first = 0;
      for (const st of q.stages) {
        const picks = q.finale.slice(first, first + st.pick);
        first += st.pick;
        if (st.pick !== 8) continue;
        regions++;
        const at = picks.flatMap((id, i) => (RARES.has(id) ? [i] : []));
        expect(at.length).toBeLessThanOrEqual(1);
        if (!at.length) continue;
        rare++;
        expect(at[0]).not.toBe(4);
        expect(at[0]).not.toBe(7);
        expect(st.rare!.cards.some((c) => c.id === picks[at[0]])).toBe(true);
      }
      roundTrip(s);
    }
    expect(rare / regions).toBeGreaterThan(0.14);
    expect(rare / regions).toBeLessThan(0.26);
  }, 30_000);

  it("the joke classes are rare: about six runs in a hundred", () => {
    let jokes = 0;
    for (let seed = 1; seed <= 600; seed++) {
      const s = createSession(crawl, cards, packs, seeded(seed));
      if (JOKE_CLASSES.includes(s.quest!.finale[0])) jokes++;
    }
    expect(jokes / 600).toBeGreaterThan(0.03);
    expect(jokes / 600).toBeLessThan(0.1);
  }, 30_000);

  it("a rare wears a prismatic foil", () => {
    for (let seed = 1; ; seed++) {
      const s = takeRoads(createSession(crawl, cards, packs, seeded(seed)));
      const id = s.quest!.finale.find((x) => RARES.has(x));
      if (!id) continue;
      const card = finaleCard(s.quest!, id)!;
      expect(card.ribbon).toMatch(/ · Rare$/);
      expect(cardFinish(s, card)).toBe("prism");
      break;
    }
  });
});

describe("hidden results", () => {
  it("every hidden result sits on one face and says what happened", () => {
    expect(hiddenIds.length).toBeGreaterThanOrEqual(15);
    for (const id of hiddenIds) {
      const c = cards.find((x) => x.id === id)!;
      const hidden = c.dice!.outcomes!.filter((o) => o.reward);
      expect(hidden, id).toHaveLength(1);
      expect(hidden[0].min).toBe(hidden[0].max);
    }
  });

  it("the Bridge Troll pays the toll on a natural 20, and the run remembers it", () => {
    for (let seed = 1; ; seed++) {
      let s = takeRoads(createSession(crawl, cards, packs, seeded(seed)));
      const q = s.quest!;
      const at = q.finale.indexOf("dungeon.keg-golem");
      if (at < 0) continue;
      s = advance({
        ...s,
        discarded: at,
        previousId: q.finale[at - 1],
        quest: { ...q, step: at },
      });
      s = returnToCard(rollDice(s, () => 0.999));
      expect(s.roll!.instruction).toMatch(/He pays you the toll\.$/);
      // A felled boss waits for its spoils.
      const next = takeSpoils(s, 0);
      expect(next.quest!.party!.loot).toContain("die");
      expect(next.quest!.party!.found).toEqual(["dungeon.keg-golem"]);
      roundTrip(next);
      // Any other face finds nothing.
      const plain = takeSpoils(
        returnToCard(
          rollDice(
            { ...s, roll: null },
            () => (19 - 0.5) / currentCard(s).dice!.sides,
          ),
        ),
        0,
      );
      expect(plain.quest!.party!.found).toBeUndefined();
      break;
    }
  });
});
