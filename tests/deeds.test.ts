import { describe, expect, it } from "vitest";
import {
  advance,
  createSession,
  currentCard,
  finaleStage,
  awaitingPress,
  cashOut,
  settleBattle,
  takeOffer,
  type Random,
} from "../src/game/engine";
import { returnToCard, rollDice } from "../src/game/dice";
import { parseSession } from "../src/app/persistence";
import { cards, packs } from "../src/content/catalog";
import { echoes } from "../src/content/dungeon/echoes";
import type { GameConfig, SessionState } from "../src/game/types";
import { takeRoads } from "./roads";

// The road remembers (The Quest 2.0 Phase 6, 2026-11-14): deeds set by
// plaques and fights, an echo dealt for one held, and the Lair's Door
// chosen by the Company's record. Both are decided as the stage is
// reached and written into the run.
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
// With both roads taken: the city gate, the last card of the third region,
// the echo, the Lair's Door.
const GATE = 3; // The Road Out now; any early step does.
const REGION3_LAST = 39;
const ECHO = 40;
const roundTrip = (s: SessionState) =>
  expect(parseSession(JSON.stringify(s))).toEqual(s);
const run = (seed = 1) =>
  takeRoads(createSession(crawl, cards, packs, seeded(seed)));
/** The run at `step`, face up, holding `deeds`, with no rare at the door. */
const at = (s: SessionState, step: number, deeds: string[] = []) =>
  advance({
    ...s,
    discarded: step,
    previousId: s.quest!.finale[step - 1],
    quest: {
      ...s.quest!,
      step,
      party: { ...s.quest!.party!, ...(deeds.length ? { deeds } : {}) },
    },
  });
/** Put the third region's last card aside (a won roll, or any plaque). */
const passOnce = (s: SessionState) => {
  const card = currentCard(s);
  if (card.offers?.length) return takeOffer(s, card.offers.length - 1);
  // A trial settled at the table: won.
  if (card.battle && !card.dice) return settleBattle(s, true);
  if (card.dice) {
    // A winning face: 19 on a d20, the top face of a d6 or a coin.
    const sides = card.dice.sides;
    const rolled = returnToCard(
      rollDice(s, () => (Math.min(19, sides) - 0.5) / sides),
    );
    // A gamble won: the table walks away with it.
    return awaitingPress(rolled) ? cashOut(rolled) : advance(rolled);
  }
  return advance(s);
};

/** The same, until the run moves on (an ambush is dealt twice). */
const pass = (s: SessionState) => {
  const step = s.quest!.step;
  let next = passOnce(s);
  for (let i = 0; i < 4 && next.quest!.step === step; i++)
    next = passOnce(advance(next));
  return next;
};

describe("deeds", () => {
  it("a plaque sets its deed once", () => {
    const s = run(3);
    const plea = s.quest!.stages.findIndex((st) => st.label === "A Side Quest");
    const step = s
      .quest!.stages.slice(0, plea)
      .reduce((n, st) => n + st.pick, 0);
    const took = takeOffer(at(s, step), 0);
    expect(took.quest!.party!.deeds).toEqual(["quest-taken"]);
    roundTrip(took);
  });

  it("a malformed deed list is rejected", () => {
    const s = at(run(4), GATE, ["freed"]);
    roundTrip(s);
    for (const deeds of [["freed", "freed"], ["Not A Deed"], [7]]) {
      const bad = structuredClone(s) as SessionState;
      bad.quest!.party!.deeds = deeds as string[];
      expect(() => parseSession(JSON.stringify(bad))).toThrow();
    }
  });
});

describe("echoes and the Lair's Door", () => {
  it("with no deed the echo leaves the run, and the door is dealt", () => {
    const s = run(5);
    const before = s.quest!.finale.length;
    const next = pass(at(s, REGION3_LAST));
    const q = next.quest!;
    expect(q.finale.length).toBe(before - 1);
    expect(finaleStage(q).label).toBe("The Lair's Door");
    expect(q.dropped?.some((st) => st.label === "An Echo")).toBe(true);
    roundTrip(next);
  });

  it("a held deed deals its echo", () => {
    const s = run(6);
    const next = pass(at(s, REGION3_LAST, ["freed"]));
    expect(next.quest!.finale[ECHO]).toBe(echoes.freed.id);
    expect(finaleStage(next.quest!).label).toBe("An Echo");
    roundTrip(next);
    // Slip inside: the Lair's Door is skipped.
    const slipped = takeOffer(advance(next), 0);
    expect(finaleStage(slipped.quest!).label).toBe("The Dragon's Lair");
    roundTrip(slipped);
  });

  it("the door deals the run's rival, and the duel only when refused", () => {
    const s = run(7);
    const door = pass(at(s, REGION3_LAST, ["rival-bradley"]));
    expect(door.quest!.finale[door.quest!.step]).toBe(
      "dungeon.rival-bradley-door",
    );
    roundTrip(door);
    // Taken in: the duel leaves the run.
    const joined = takeOffer(advance(door), 0);
    expect(finaleStage(joined.quest!).label).toBe("The Dragon's Lair");
    expect(joined.quest!.party!.team).toEqual(["dungeon.rival-bradley-door"]);
    roundTrip(joined);
    // Refused: their own duel is dealt.
    const refused = takeOffer(advance(door), 1);
    expect(refused.quest!.finale[refused.quest!.step]).toBe(
      "dungeon.rival-bradley-duel",
    );
    roundTrip(refused);
  });
});
