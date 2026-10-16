import { describe, expect, it } from "vitest";
import {
  advance,
  awaitingChoice,
  awaitingVerdict,
  canUseLoot,
  createSession,
  currentCard,
  finaleStage,
  questRecord,
  replaySession,
  settleBattle,
  skipRoll,
  spendLoot,
  type Random,
} from "../src/game/engine";
import { returnToCard, rollDice, rollWins } from "../src/game/dice";
import { parseSession } from "../src/app/persistence";
import { cards, packs } from "../src/content/catalog";
import type { GameConfig, Loot, SessionState } from "../src/game/types";

const crawl: GameConfig = {
  version: 1,
  packIds: ["dungeon"],
  limit: null,
  quest: "dungeon",
};
const seeded =
  (seed: number): Random =>
  () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
const start = (seed = 1) => createSession(crawl, cards, packs, seeded(seed));
const roundTrip = (s: SessionState) =>
  expect(parseSession(JSON.stringify(s))).toEqual(s);
const party = (s: SessionState) => s.quest!.party!;
// Put a card in the run at the current step, by id.
const deal = (s: SessionState, id: string): SessionState => {
  const finale = [...s.quest!.finale];
  const at = finale.indexOf(id);
  if (at >= 0) finale[at] = finale[s.quest!.step];
  finale[s.quest!.step] = id;
  return { ...s, quest: { ...s.quest!, finale } };
};
// Every die shows `face`.
const rollTo = (s: SessionState, face: number) => {
  const sides = currentCard(s).dice!.sides;
  return returnToCard(rollDice(s, () => (face - 0.5) / sides));
};
const fight = (s: SessionState, face: number) =>
  advance(rollTo(advance(s), face));
const fromStep = (s: SessionState, step: number) => ({
  ...s,
  quest: { ...s.quest!, step },
  discarded: step,
  previousId: step ? s.quest!.finale[step - 1] : null,
});

describe("Pub Crawl", () => {
  it("is a run of three floors, each closed by a boss, for 12 shared hearts", () => {
    const s = start();
    expect(s.quest).toMatchObject({ due: true, goal: 0, step: 0 });
    expect(party(s)).toEqual({
      hearts: 12,
      max: 12,
      loot: [],
      curse: null,
      hits: 0,
      rounds: 0,
      wiped: false,
    });
    expect(s.quest!.stages.map((st) => [st.label, st.pick])).toEqual([
      ["The Cellar", 7],
      ["Cellar boss", 1],
      ["The Catacombs", 7],
      ["Catacombs boss", 1],
      ["The Drowned Taproom", 7],
      ["Last call", 1],
    ]);
    const bosses = [7, 15, 23].map((step) =>
      s
        .quest!.stages.flatMap((st) => st.cards)
        .find((c) => c.id === s.quest!.finale[step])!,
    );
    expect(bosses.map((b) => b.hits)).toEqual([1, 2, 3]);
    expect(currentCard(s).id).toBe(s.quest!.finale[0]);
    roundTrip(s);
  });

  it("a lost room fight costs the party hearts and the run moves on", () => {
    let s = deal(start(), "dungeon.gelatinous-shot");
    s = fight(s, 3);
    expect(party(s).hearts).toBe(11);
    expect(s.quest!.step).toBe(1);
    expect(s.quest!.lost ?? 0).toBe(0);
    roundTrip(s);
  });

  it("a won fight earns its loot; a lost one its curse", () => {
    let s = deal(start(), "dungeon.drunk-goblin");
    s = fight(s, 15);
    expect(party(s).loot).toEqual(["smoke"]);
    s = fight(deal(fromStep(start(), 8), "dungeon.leech-swarm"), 2);
    expect(party(s)).toMatchObject({ curse: "bleed", hearts: 10 });
    roundTrip(s);
  });

  it("the satchel holds three; a fourth find is left behind", () => {
    let s = deal(start(), "dungeon.lost-and-found");
    s.quest!.party!.loot = ["draught", "die", "smoke"];
    s = advance(advance(s));
    expect(party(s).loot).toEqual(["draught", "die", "smoke"]);
  });

  it("a shrine heals, never past the party's full hearts", () => {
    let s = deal(start(), "dungeon.wishing-drain");
    s.quest!.party!.hearts = 9;
    s = advance(advance(s));
    expect(party(s).hearts).toBe(11);
    s = deal(s, "dungeon.lost-and-found");
    s.quest!.party!.hearts = 12;
    expect(
      party(advance(advance(deal(s, "dungeon.wishing-drain")))).hearts,
    ).toBe(12);
  });

  it("a trial waits for Won or Lost", () => {
    let s = advance(deal(start(), "dungeon.riddling-tap"));
    expect(awaitingVerdict(s)).toBe(true);
    expect(advance(s)).toBe(s);
    expect(party(settleBattle(s, true)).hearts).toBe(12);
    s = settleBattle(s, false);
    expect(party(s).hearts).toBe(11);
    roundTrip(s);
  });

  it("walking away from a relic is neither a win nor a loss", () => {
    let s = advance(deal(start(), "dungeon.mimic-cooler"));
    expect(awaitingChoice(s)).toBe(true);
    s = skipRoll(s);
    expect(party(s)).toMatchObject({ hearts: 12, loot: [] });
    expect(s.quest!.step).toBe(1);
    roundTrip(s);
  });

  it("a boss is dealt again until it has taken its hits, and its curse lifts with it", () => {
    let s = fromStep(start(), 15);
    s = deal(s, "dungeon.hangover-hydra");
    s.quest!.party!.curse = "hex";
    s = fight(s, 2); // a miss
    expect(currentCard(s).id).toBe("dungeon.hangover-hydra");
    expect(party(s)).toMatchObject({ hearts: 10, hits: 0, rounds: 0 });
    expect(s.quest!.lost).toBe(1);
    roundTrip(s);
    s = fight(s, 14); // one head off
    expect(currentCard(s).id).toBe("dungeon.hangover-hydra");
    expect(party(s)).toMatchObject({ hits: 1, rounds: 1, curse: "hex" });
    roundTrip(s);
    s = fight(s, 14); // and the other
    expect(s.quest!.step).toBe(16);
    expect(finaleStage(s.quest!).label).toBe("The Drowned Taproom");
    expect(party(s)).toMatchObject({ hits: 0, rounds: 1, curse: null });
    roundTrip(s);
  });

  it("the last boss falling wins the crawl", () => {
    let s = deal(fromStep(start(), 23), "dungeon.last-call-lich");
    for (let i = 0; i < 3; i++) s = fight(s, 15);
    expect(s.phase).toBe("complete");
    expect(questRecord(s)!.won).toBe(true);
    roundTrip(s);
  });

  it("losing the last heart wipes the party and ends the game", () => {
    let s = deal(start(), "dungeon.tab-goblin");
    s.quest!.party!.hearts = 1;
    s = fight(s, 1);
    expect(s.phase).toBe("complete");
    expect(party(s)).toMatchObject({ hearts: 0, wiped: true });
    expect(questRecord(s)!.won).toBe(false);
    roundTrip(s);
    // Wiping on a boss mid-fight is the end too.
    let b = deal(fromStep(start(), 7), "dungeon.keg-golem");
    b.quest!.party!.hearts = 2;
    b = fight(b, 1);
    expect(b.phase).toBe("complete");
    roundTrip(b);
  });

  it("the shield takes a loss whole; bleeding costs one more; a hex seals the satchel", () => {
    const at = (loot: Loot[], curse: "bleed" | "hex" | null) => {
      const s = deal(fromStep(start(), 8), "dungeon.bachelor-ghosts");
      Object.assign(s.quest!.party!, { loot, curse });
      return party(fight(s, 1));
    };
    expect(at(["shield"], null)).toMatchObject({ hearts: 12, loot: [] });
    expect(at([], "bleed")).toMatchObject({ hearts: 9 });
    expect(at(["shield"], "hex")).toMatchObject({
      hearts: 10,
      loot: ["shield"],
    });
  });

  it("items: a draught heals one, a loaded die rerolls a loss, a smoke bomb escapes a room but not a boss", () => {
    let s = deal(start(), "dungeon.gelatinous-shot");
    s.quest!.party!.loot = ["draught", "die", "smoke"];
    expect(canUseLoot(s, "draught")).toBe(false); // full hearts
    s.quest!.party!.hearts = 8;
    s = spendLoot(s, "draught");
    expect(party(s)).toMatchObject({ hearts: 9, loot: ["die", "smoke"] });
    s = advance(s);
    expect(canUseLoot(s, "die")).toBe(false);
    s = rollTo(s, 2);
    expect(canUseLoot(s, "die")).toBe(true);
    expect(canUseLoot(s, "smoke")).toBe(false);
    s = spendLoot(s, "die");
    expect(s.roll).toBeNull();
    expect(party(s).loot).toEqual(["smoke"]);
    roundTrip(s);
    s = advance(rollTo(s, 18));
    expect(party(s).hearts).toBe(9);
    // Smoke: past a room before it is rolled, never past a boss.
    s = advance(deal(s, "dungeon.keg-spider"));
    expect(canUseLoot(s, "smoke")).toBe(true);
    const fled = spendLoot(s, "smoke");
    expect(fled.quest!.step).toBe(s.quest!.step + 1);
    expect(party(fled)).toMatchObject({ hearts: 9, loot: [] });
    roundTrip(fled);
    const boss = advance(deal(fromStep(start(), 7), "dungeon.keg-golem"));
    boss.quest!.party!.loot = ["smoke"];
    expect(canUseLoot(boss, "smoke")).toBe(false);
    // A hex seals every item.
    s.quest!.party!.curse = "hex";
    expect(canUseLoot(s, "smoke")).toBe(false);
  });

  it("replay starts a fresh crawl", () => {
    let s = fight(deal(start(), "dungeon.tab-goblin"), 1);
    s = replaySession(s, seeded(9));
    expect(s.quest).toMatchObject({ due: true, step: 0, lost: 0 });
    expect(party(s)).toMatchObject({ hearts: 12, loot: [], wiped: false });
    roundTrip(s);
  });

  it("the plain modes play the rooms as ordinary cards, without the finds", () => {
    const s = createSession(
      { version: 1, packIds: ["dungeon"], limit: 30 },
      cards,
      packs,
      seeded(3),
    );
    expect(s.quest).toBeUndefined();
    expect(s.cards).toHaveLength(48);
    expect(s.cards.some((c) => c.reward && !c.battle)).toBe(false);
    // A trial is put aside with a tap, no verdict.
    const trial = {
      ...s,
      order: [
        "dungeon.riddling-tap",
        ...s.order.filter((id) => id !== "dungeon.riddling-tap"),
      ],
    };
    expect(advance(advance(trial)).discarded).toBe(1);
  });

  it("rejects saves whose party does not add up", () => {
    const s = fight(deal(fromStep(start(), 15), "dungeon.hangover-hydra"), 14);
    const tamper = (change: (q: SessionState) => void) => {
      const copy = structuredClone(s);
      change(copy);
      return () => parseSession(JSON.stringify(copy));
    };
    expect(tamper(() => {})).not.toThrow();
    expect(tamper((q) => (q.quest!.party!.hearts = 13))).toThrow();
    expect(tamper((q) => (q.quest!.party!.hits = 2))).toThrow();
    expect(tamper((q) => (q.quest!.party!.rounds = 0))).toThrow();
    expect(tamper((q) => (q.quest!.party!.wiped = true))).toThrow();
    expect(tamper((q) => (q.quest!.party!.loot = ["beer" as Loot]))).toThrow();
    expect(
      tamper((q) => (q.quest!.party!.loot = ["die", "die", "die", "die"])),
    ).toThrow();
    expect(tamper((q) => delete q.quest!.party)).toThrow();
  });
});

// The table plays sensibly: a draught at 3 hearts or less, a loaded die on
// any lost roll, smoke on any room fight it can, relics opened above 4
// hearts, and trials won a little over half the time. Real cards, real
// engine, so a change to either shows up here.
function playRun(seed: number) {
  const random = seeded(seed);
  let s = createSession(crawl, cards, packs, random);
  const use = (item: Loot) => {
    if (canUseLoot(s, item)) s = spendLoot(s, item, random);
  };
  for (let guard = 0; guard < 400 && s.phase !== "complete"; guard++) {
    s = advance(s, random);
    const card = currentCard(s);
    if (party(s).hearts <= 3) use("draught");
    if (card.battle && !card.hits && !card.dice?.choice) {
      use("smoke");
      if (s.phase !== "revealed" || currentCard(s) !== card) continue;
    }
    if (awaitingChoice(s)) {
      if (party(s).hearts > 4) s = rollDice(s, random);
      else {
        s = skipRoll(s, random);
        continue;
      }
    }
    if (awaitingVerdict(s)) {
      s = settleBattle(s, random() < 0.55, random);
      continue;
    }
    if (card.dice) {
      if (!s.roll) s = rollDice(s, random);
      s = returnToCard(s);
      if (card.battle && !rollWins(card.dice, s.roll!.values)) {
        use("die");
        if (!s.roll) s = returnToCard(rollDice(s, random));
      }
    }
    s = advance(s, random);
    if (party(s).hearts <= 3) use("draught");
  }
  return s;
}

it("a crawl is hard: the party wins about a quarter of its runs", () => {
  const runs = Array.from({ length: 2000 }, (_, i) => playRun(i + 1));
  expect(runs.every((s) => s.phase === "complete")).toBe(true);
  const won = runs.filter((s) => questRecord(s)!.won).length / runs.length;
  const deep = (s: SessionState) => finaleStage(s.quest!).stage;
  const wipes = [0, 1, 2, 3, 4, 5].map(
    (stage) =>
      runs.filter((s) => party(s).wiped && deep(s) === stage).length /
      runs.length,
  );
  // Report the shape so a tuning change is easy to read in the test output.
  console.log(
    `crawl: won ${(won * 100).toFixed(1)}%; wiped by stage ${wipes
      .map((w) => (w * 100).toFixed(0) + "%")
      .join(" / ")}`,
  );
  expect(won).toBeGreaterThan(0.18);
  expect(won).toBeLessThan(0.4);
  // Nearly every run gets past the Cellar; most wipes are deep.
  expect(wipes[0] + wipes[1]).toBeLessThan(0.1);
  for (const s of runs.slice(0, 50)) roundTrip(s);
});
