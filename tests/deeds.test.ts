import { describe, expect, it } from "vitest";
import {
  advance,
  createSession,
  currentCard,
  finaleStage,
  takeOffer,
  type Random,
} from "../src/game/engine";
import { returnToCard, rollDice, rollTarget } from "../src/game/dice";
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
const GATE = 3;
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
const pass = (s: SessionState) => {
  const card = currentCard(s);
  if (card.offers?.length) return takeOffer(s, card.offers.length - 1);
  if (card.dice)
    return advance(
      returnToCard(rollDice(s, () => (19 - 0.5) / card.dice!.sides)),
    );
  return advance(s);
};

describe("deeds", () => {
  it("the city gate records how the Company fight went", () => {
    const s = at(run(2), GATE);
    const won = advance(returnToCard(rollDice(s, () => 0.95)));
    expect(won.quest!.party!.deeds).toEqual(["gate-won"]);
    const lost = advance(returnToCard(rollDice(s, () => 0.06)));
    expect(lost.quest!.party!.deeds).toEqual(["gate-lost"]);
    roundTrip(lost);
  });

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

  it("beaten at the gate and the crossroads, Sir Bradley comes to beg", () => {
    const s = run(7);
    const won = pass(at(s, REGION3_LAST, ["gate-won", "crossroads-won"]));
    expect(won.quest!.finale[won.quest!.step]).toBe(
      "dungeon.closing-bradley-begs",
    );
    roundTrip(won);
  });

  it("beaten by them twice, the door's fight is a point harder", () => {
    const s = run(8);
    const lost = pass(at(s, REGION3_LAST, ["gate-lost", "crossroads-lost"]));
    const q = lost.quest!;
    expect(q.stages[finaleStage(q).stage].harder).toBe(1);
    const door = advance(lost);
    // The same card without the extra need.
    const plain = structuredClone(door);
    delete plain.quest!.stages[finaleStage(plain.quest!).stage].harder;
    const target = (t: SessionState) => rollTarget(t, currentCard(t));
    // The extra need is a d20's (Phase 6): a d6 door card reads as written.
    if (target(plain)?.count === 1 && target(plain)?.sides === 20)
      expect(target(door)!.target).toBe(target(plain)!.target + 1);
    roundTrip(lost);
  });
});
