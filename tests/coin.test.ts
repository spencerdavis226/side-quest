import { describe, expect, it } from "vitest";
import {
  advance,
  canUseLoot,
  cardEdge,
  createSession,
  currentCard,
  finaleStage,
  killingRound,
  spendLoot,
  takeOffer,
  type Random,
} from "../src/game/engine";
import {
  returnToCard,
  rollDice,
  rollWins,
  validateDice,
} from "../src/game/dice";
import { parseSession } from "../src/app/persistence";
import { cards, packs } from "../src/content/catalog";
import { flip } from "../src/content/author";
import { echoes } from "../src/content/dungeon/echoes";
import { DRAGON_HEALTH } from "../src/content/dungeon/shared";
import type { GameConfig, SessionState } from "../src/game/types";
import { takeRoads } from "./roads";

// The coin (The Quest 2.1): a one-die roll with two sides (2 heads, 1
// tails), the enrage contest it decides, the Lucky Coin's flip, a road
// card's "Flip for it", and the echo that falls back to the side quest's.
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
const ROAD = 3;
const REGION3_LAST = 39;
const ECHO = 40;
const CLOSING = 41;
const LAIR = 42;
const party = (s: SessionState) => s.quest!.party!;
const roundTrip = (s: SessionState) =>
  expect(parseSession(JSON.stringify(s))).toEqual(s);
/** A d20 face, or a coin: a high face is heads. */
const rollTo = (s: SessionState, face: number) => {
  const sides = currentCard(s).dice!.sides;
  const show = sides === 2 ? (face > 10 ? 2 : 1) : face;
  return returnToCard(rollDice(s, () => (show - 0.5) / sides));
};
const fight = (s: SessionState, face: number, random = seeded(7)) =>
  advance(rollTo(advance(s), face), random);
const at = (s: SessionState, step: number, more: object = {}) => ({
  ...s,
  discarded: step,
  previousId: s.quest!.finale[step - 1],
  quest: {
    ...s.quest!,
    step,
    party: { ...s.quest!.party!, ...more },
  },
});
function atDragon(seed = 1, hearts = 30): SessionState {
  let s = takeRoads(createSession(crawl, cards, packs, seeded(seed)));
  s = at(s, CLOSING, { max: hearts, hearts });
  // The door's second plaque: no rival was met, so no duel follows.
  s = takeOffer(advance(s), 1, seeded(seed));
  expect(s.quest!.step).toBe(LAIR);
  return s;
}

describe("the coin", () => {
  it("is one flip: tails or heads, each its own line", () => {
    const coin = flip("Tails. Drink 2.", "Heads. Give 2.", true);
    expect(() => validateDice(coin)).not.toThrow();
    expect(rollWins(coin, [2])).toBe(true);
    expect(rollWins(coin, [1])).toBe(false);
    // Never two coins, never a third face.
    expect(() => validateDice({ ...coin, count: 2 })).toThrow();
    expect(() =>
      validateDice({
        ...coin,
        outcomes: [{ min: 1, max: 3, instruction: "x" }],
      }),
    ).toThrow();
  });

  it("every coin card in the catalog reads both faces", () => {
    const coins = cards.filter((c) => c.dice?.sides === 2);
    // Ten in the core deck, three Realms fights, and since 2026-11-23 five
    // in Never Have I Ever, five in VIP night and three Last Call closers;
    // since 2026-11-24 one more in Core, one in Great Minds and three in
    // Dealer's Choice; since 2026-11-26 a Last Call closer each in Great
    // Minds and Dealer's Choice.
    expect(coins).toHaveLength(33);
    for (const c of coins) {
      expect(c.dice!.count, c.id).toBe(1);
      expect(c.dice!.outcomes, c.id).toHaveLength(2);
      expect(c.rules, c.id).toMatch(/flip/i);
    }
  });
});

describe("the enrage contest (The Quest 2.1)", () => {
  const half = Math.ceil(DRAGON_HEALTH / 2);
  const atContest = () => {
    let s = atDragon();
    for (let i = 0; i < half; i++) s = fight(s, 19);
    expect(party(s).duel).toMatchObject({ contest: true });
    return s;
  };

  it("ends on a coin: heads breaks a scale, tails costs the hearts", () => {
    const s = atContest();
    const card = currentCard(advance(s));
    expect(card.dice).toMatchObject({ count: 1, sides: 2 });
    expect(card.rules).toMatch(/flip/i);
    const heads = fight(s, 20);
    expect(party(heads).hits).toBe(half + 1);
    expect(party(heads).hearts).toBe(party(s).hearts);
    const tails = fight(s, 1);
    expect(party(tails).hits).toBe(half);
    expect(party(tails).hearts).toBeLessThan(party(s).hearts);
    roundTrip(rollTo(advance(s), 20));
    roundTrip(heads);
  });

  it("never fells the dragon: the last scale waits for a swing, rolled twice", () => {
    let s = atContest();
    // One scale left when the contest is won.
    s = {
      ...s,
      quest: {
        ...s.quest!,
        party: { ...party(s), hits: DRAGON_HEALTH - 1 },
      },
    };
    expect(killingRound(advance(s), currentCard(advance(s)))).toBe(false);
    const won = fight(s, 20);
    expect(won.phase).not.toBe("complete");
    expect(party(won).hits).toBe(DRAGON_HEALTH - 1);
    expect(party(won).duel).toMatchObject({ staggered: true, enraged: true });
    expect(cardEdge(won.quest, currentCard(won))).toBe("advantage");
    expect(killingRound(advance(won), currentCard(advance(won)))).toBe(true);
    roundTrip(won);
    const rolled = rollDice(advance(won), seeded(3));
    expect(rolled.roll).toMatchObject({ edge: "advantage" });
    roundTrip(rolled);
    // The edge is for that swing alone.
    const missed = fight(won, 2);
    if (missed.phase !== "complete")
      expect(party(missed).duel!.staggered).toBeUndefined();
    // A staggered contest round is not a saved state.
    const bad = structuredClone(s);
    bad.quest!.party!.duel = { ...party(s).duel!, staggered: true };
    expect(() => parseSession(JSON.stringify(bad))).toThrow();
  });

  it("a dragon saved before the coin keeps its Won and Lost plaques", () => {
    const s = structuredClone(atContest());
    for (const st of s.quest!.stages)
      for (const c of st.cards) if (c.lairFight) delete c.lairFight.enrage.flip;
    expect(currentCard(advance(s)).dice).toBeUndefined();
    roundTrip(advance(s));
  });
});

describe("the Lucky Coin (The Quest 2.1)", () => {
  const lostFight = (seed: number) => {
    const s0 = takeRoads(createSession(crawl, cards, packs, seeded(seed)));
    expect(s0.quest!.coin).toBe(true);
    // The first card of the first region that is a single-d20 fight.
    const q = s0.quest!;
    const step = q.finale.findIndex((id, i) => {
      if (i < ROAD) return false;
      const c = cards.find((x) => x.id === id);
      return (
        !!c?.battle &&
        !c.hits &&
        c.dice?.sides === 20 &&
        c.dice.count === 1 &&
        !c.dice.choice &&
        !c.press
      );
    });
    const s = at(s0, step, { loot: ["die"] });
    return rollTo(advance(s), 2);
  };

  it("is flipped: heads rolls the reroll twice, tails once", () => {
    const lost = lostFight(2);
    expect(canUseLoot(lost, "die")).toBe(true);
    const heads = spendLoot(lost, "die", () => 0.9);
    expect(heads.roll).toBeNull();
    expect(party(heads).coin).toEqual({ face: 2, for: "luck" });
    expect(party(heads).loot).toEqual([]);
    expect(cardEdge(heads.quest, currentCard(heads))).toBe("advantage");
    roundTrip(heads);
    const again = rollDice(heads, seeded(5));
    expect(again.roll).toMatchObject({ edge: "advantage" });
    roundTrip(again);
    const tails = spendLoot(lost, "die", () => 0.1);
    expect(party(tails).coin).toEqual({ face: 1, for: "luck" });
    expect(cardEdge(tails.quest, currentCard(tails))).toBeNull();
    expect(rollDice(tails, seeded(5)).roll!.edge).toBeUndefined();
    // The coin is gone with the card.
    const next = advance(returnToCard(again));
    expect(party(next).coin).toBeUndefined();
  });

  it("a run from before the coin rerolls as it did", () => {
    const lost = structuredClone(lostFight(2));
    delete lost.quest!.coin;
    const used = spendLoot(lost, "die", () => 0.9);
    expect(used.roll).toBeNull();
    expect(party(used).coin).toBeUndefined();
    roundTrip(used);
  });

  it("a malformed coin is rejected", () => {
    const heads = spendLoot(lostFight(2), "die", () => 0.9);
    for (const coin of [{ face: 3, for: "luck" }, { face: 2, for: "x" }, 1]) {
      const bad = structuredClone(heads);
      (bad.quest!.party as unknown as { coin: unknown }).coin = coin;
      expect(() => parseSession(JSON.stringify(bad))).toThrow();
    }
  });
});

describe("flip for the road (The Quest 2.1)", () => {
  it("heads takes the first road, tails the second, and the count adds up", () => {
    const s = createSession(crawl, cards, packs, seeded(3));
    const choice = advance(at(s, ROAD));
    const offers = currentCard(choice).offers!;
    expect(offers[2]).toMatchObject({ label: "Flip for it", flip: true });
    for (const [draw, face, kept] of [
      [0.9, 2, 0],
      [0.1, 1, 1],
    ] as const) {
      const took = takeOffer(choice, 2, () => draw);
      const q = took.quest!;
      expect(q.party!.coin).toEqual({ face, for: "road" });
      expect(finaleStage(q).label).toBe(offers[kept].label);
      expect(q.stages.reduce((n, st) => n + st.pick, 0)).toBe(q.finale.length);
      roundTrip(took);
      // Old news once the next card is put aside.
      let next = advance(took);
      for (let i = 0; i < 6 && next.quest!.step === q.step; i++) {
        const card = currentCard(next);
        next = card.offers?.length
          ? takeOffer(next, card.offers.length - 1)
          : card.dice
            ? advance(rollTo(next, 19))
            : advance(next);
        if (next.phase === "hidden" && next.quest!.step === q.step)
          next = advance(next);
      }
      if (next.quest!.step !== q.step)
        expect(next.quest!.party!.coin).toBeUndefined();
    }
  });
});

describe("the echo falls back to the side quest's (The Quest 2.1)", () => {
  const reach = (deeds: string[]) => {
    const s = takeRoads(createSession(crawl, cards, packs, seeded(5)));
    let next = advance(at(s, REGION3_LAST, { deeds, hearts: 30, max: 30 }));
    for (let i = 0; i < 6 && next.quest!.step === REGION3_LAST; i++) {
      const card = currentCard(next);
      next = card.offers?.length
        ? takeOffer(next, card.offers.length - 1)
        : card.dice
          ? advance(rollTo(next, 19))
          : advance(next);
      if (next.phase === "hidden" && next.quest!.step === REGION3_LAST)
        next = advance(next);
    }
    return next.quest!;
  };

  it("a choice's echo always wins over the side quest's", () => {
    for (let n = 0; n < 10; n++)
      expect(reach(["quest-taken", "freed"]).finale[ECHO]).toBe(
        echoes.freed.id,
      );
  });

  it("with only the side quest's deed, its echo is dealt", () => {
    expect(reach(["quest-taken"]).finale[ECHO]).toBe(echoes["quest-taken"].id);
    expect(reach(["quest-walked"]).finale[ECHO]).toBe(
      echoes["quest-walked"].id,
    );
  });
});
