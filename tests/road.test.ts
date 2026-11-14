import { describe, expect, it } from "vitest";
import {
  advance,
  createSession,
  currentCard,
  finaleStage,
  replaySession,
  takeOffer,
  type Random,
} from "../src/game/engine";
import { parseSession } from "../src/app/persistence";
import { cards, packs } from "../src/content/catalog";
import type { GameConfig, SessionState } from "../src/game/types";

// The road (The Quest 2.0 Phase 5, 2026-11-14): at the first two depths
// the table chooses one of two regions; the third is closed. A run holds
// both until the choice, which drops the other with its picks (kept in
// `quest.dropped` for a replay).
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
const DEPTH1 = ["The King's Road", "The Old Forest", "The Marsh"];
const DEPTH2 = ["The Haunted Crypt", "The Goblin Mines", "The Wizard's Tower"];
const ROAD = 4;
const roundTrip = (s: SessionState) =>
  expect(parseSession(JSON.stringify(s))).toEqual(s);
/** The run at its choice card at step `step`, face up. */
const atChoice = (s: SessionState, step: number) =>
  advance({
    ...s,
    discarded: step,
    previousId: s.quest!.finale[step - 1],
    quest: { ...s.quest!, step },
  });
const added = (s: SessionState) =>
  s.quest!.stages.reduce((n, st) => n + st.pick, 0);

describe("the road", () => {
  it("offers two of the three regions, each left out about a third of the time", () => {
    const out = new Map<string, number>();
    for (let seed = 1; seed <= 300; seed++) {
      const s = createSession(crawl, cards, packs, seeded(seed));
      const q = s.quest!;
      expect(q.stages[ROAD].label).toBe("The Road Out");
      const offered = q.stages
        .filter((st) => st.route !== undefined && DEPTH1.includes(st.label))
        .map((st) => st.label);
      expect(offered).toHaveLength(2);
      const closed = DEPTH1.find((r) => !offered.includes(r))!;
      out.set(closed, (out.get(closed) ?? 0) + 1);
      // The card names the two regions open, in order.
      const card = q.stages[ROAD].cards[0];
      expect(card.offers!.map((o) => o.label)).toEqual(offered);
      expect(added(s)).toBe(q.finale.length);
    }
    for (const r of DEPTH1) {
      expect(out.get(r)!).toBeGreaterThan(70);
      expect(out.get(r)!).toBeLessThan(130);
    }
  }, 30_000);

  it("taking a road drops the other, with its picks, and every count adds up", () => {
    const s = createSession(crawl, cards, packs, seeded(3));
    const choice = atChoice(s, ROAD);
    expect(currentCard(choice).offers).toHaveLength(2);
    roundTrip(choice);
    for (const route of [0, 1] as const) {
      const took = takeOffer(choice, route);
      const q = took.quest!;
      const kept = currentCard(choice).offers![route].label;
      expect(q.step).toBe(ROAD + 1);
      expect(finaleStage(q).label).toBe(kept);
      expect(q.stages.filter((st) => DEPTH1.includes(st.label))).toHaveLength(
        1,
      );
      expect(q.dropped!.map((st) => st.label)).toHaveLength(2);
      expect(added(took)).toBe(q.finale.length);
      expect(new Set(q.finale).size).toBe(q.finale.length);
      roundTrip(took);
    }
  });

  it("the Signpost comes after the side quest, so a Walk on still skips two stages", () => {
    const s = createSession(crawl, cards, packs, seeded(5));
    let q = takeOffer(atChoice(s, ROAD), 0).quest!;
    const plea = q.stages.findIndex((st) => st.label === "A Side Quest");
    expect(q.stages[plea + 3].label).toBe("The Signpost");
    const first = q.stages.slice(0, plea).reduce((n, st) => n + st.pick, 0);
    const at = atChoice({ ...s, quest: q }, first);
    const walk = currentCard(at).offers!.findIndex((o) => o.skip);
    const walked = takeOffer(at, walk);
    q = walked.quest!;
    expect(q.stages[plea + 1].label).toBe("The Signpost");
    expect(q.dropped).toHaveLength(2 + 2);
    roundTrip(walked);
    // The second choice, then.
    const sign = q.stages.slice(0, plea + 1).reduce((n, st) => n + st.pick, 0);
    const post = atChoice({ ...s, quest: q }, sign);
    const chosen = takeOffer(post, 1).quest!;
    expect(
      chosen.stages.filter((st) => DEPTH2.includes(st.label)),
    ).toHaveLength(1);
    expect(added({ ...s, quest: chosen })).toBe(chosen.finale.length);
  });

  it("a replay puts every dropped stage back in its place", () => {
    const s = createSession(crawl, cards, packs, seeded(7));
    const labels = s.quest!.stages.map((st) => st.label);
    const took = takeOffer(atChoice(s, ROAD), 1);
    const replay = replaySession(took, seeded(9));
    expect(replay.quest!.stages.map((st) => st.label)).toEqual(labels);
    expect(replay.quest!.dropped).toBeUndefined();
    expect(added(replay)).toBe(replay.quest!.finale.length);
    roundTrip(replay);
  });

  it("a save before roads (no `at`, no `route`) still loads and plays", () => {
    const s = createSession(crawl, cards, packs, seeded(11));
    const took = structuredClone(takeOffer(atChoice(s, ROAD), 0));
    const q = took.quest!;
    for (const st of q.stages) {
      delete st.at;
      delete st.route;
    }
    delete q.dropped;
    const old = { ...took, quest: q };
    expect(() => parseSession(JSON.stringify(old))).not.toThrow();
    const again = replaySession(old, seeded(2));
    expect(added(again)).toBe(again.quest!.finale.length);
  });
});
