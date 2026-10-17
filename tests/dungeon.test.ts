import { describe, expect, it } from "vitest";
import {
  advance,
  awaitingChoice,
  awaitingOffer,
  awaitingVerdict,
  canTakeOffer,
  canUseLoot,
  createSession,
  currentCard,
  findCard,
  finaleStage,
  hitsNeeded,
  questRecord,
  replaySession,
  settleBattle,
  skipRoll,
  spendLoot,
  takeOffer,
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
// Park-Miller, with the seed scrambled first: from a small seed its first
// draws are tiny, which would always pick the same floors.
const seeded = (seed: number): Random => {
  seed = (Math.imul(seed, 2654435761) >>> 0) % 2147483646 || 1;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
};
// The first three draws pick the floors: below 0.5 the original ones (the
// Cellar, the Catacombs, the Drowned Taproom), above it the others.
const ORIGINAL = [0.1, 0.1, 0.1];
const OTHER = [0.9, 0.9, 0.9];
const make = (floors = ORIGINAL, seed = 1) => {
  const rest = seeded(seed);
  const queue = [...floors];
  return createSession(crawl, cards, packs, () =>
    queue.length ? queue.shift()! : rest(),
  );
};
// The run past tonight's omen, on the original floors: step 1 is the
// Cellar's first room.
const start = (seed = 1) => fromStep(make(ORIGINAL, seed), 1);
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
function fromStep(s: SessionState, step: number): SessionState {
  return {
    ...s,
    quest: { ...s.quest!, step },
    discarded: step,
    previousId: step ? s.quest!.finale[step - 1] : null,
  };
}

describe("Pub Crawl", () => {
  it("opens on an omen, then three floors, each closed by a boss, for 12 shared hearts", () => {
    const s = make();
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
      ["Tonight's omen", 1],
      ["The Cellar", 7],
      ["Cellar boss", 1],
      ["The Catacombs", 7],
      ["Catacombs boss", 1],
      ["The Drowned Taproom", 7],
      ["Last call", 1],
    ]);
    expect(currentCard(s).encounter).toBe("omen");
    const bosses = [8, 16, 24].map((step) =>
      findCard(s, s.quest!.finale[step])!,
    );
    expect(bosses.map((b) => [b.encounter, b.hits])).toEqual([
      ["boss", 1],
      ["boss", 2],
      ["boss", 3],
    ]);
    roundTrip(s);
    expect(make(OTHER).quest!.stages.map((st) => st.label)).toEqual([
      "Tonight's omen",
      "The Wine Cellar",
      "Wine Cellar boss",
      "The Sewers",
      "Sewers boss",
      "The Kitchen",
      "Last call",
    ]);
    roundTrip(make(OTHER));
  });

  it("deals all eight dungeons and every omen across runs", () => {
    const routes = new Set<string>();
    const omens = new Set<string>();
    for (let seed = 1; seed <= 400; seed++) {
      const s = createSession(crawl, cards, packs, seeded(seed));
      routes.add(s.quest!.stages.map((st) => st.label).join("/"));
      omens.add(s.quest!.finale[0]);
    }
    expect(routes.size).toBe(8);
    expect(omens.size).toBe(12);
  });

  it("a lost room fight costs the party hearts and the run moves on", () => {
    let s = deal(start(), "dungeon.gelatinous-shot");
    s = fight(s, 3);
    expect(party(s).hearts).toBe(11);
    expect(s.quest!.step).toBe(2);
    expect(s.quest!.lost ?? 0).toBe(0);
    roundTrip(s);
  });

  it("a won fight earns its loot; a lost one its curse", () => {
    let s = deal(start(), "dungeon.drunk-goblin");
    s = fight(s, 15);
    expect(party(s).loot).toEqual(["smoke"]);
    s = fight(deal(fromStep(start(), 9), "dungeon.leech-swarm"), 2);
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
    expect(s.quest!.step).toBe(2);
    roundTrip(s);
  });

  it("a boss is dealt again until it has taken its hits, and its curse lifts with it", () => {
    let s = fromStep(start(), 16);
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
    expect(s.quest!.step).toBe(17);
    expect(finaleStage(s.quest!).label).toBe("The Drowned Taproom");
    expect(party(s)).toMatchObject({ hits: 0, rounds: 1, curse: null });
    roundTrip(s);
  });

  it("a natural 20 doubles what a win brings; a natural 1 doubles a loss's cost", () => {
    // A room: 2 hearts on a loss (floor 1), 4 on a natural 1.
    const room = () => deal(fromStep(start(), 9), "dungeon.bachelor-ghosts");
    expect(party(fight(room(), 2)).hearts).toBe(10);
    expect(party(fight(room(), 1)).hearts).toBe(8);
    // A shield still takes the whole doubled loss.
    const shielded = room();
    shielded.quest!.party!.loot = ["shield"];
    expect(party(fight(shielded, 1))).toMatchObject({ hearts: 12, loot: [] });
    // An elite's item comes twice on a natural 20, room permitting.
    const s = takeOffer(advance(deal(start(), "dungeon.two-hatches")), 1);
    const loot = currentCard(s).reward!.loot!;
    expect(party(fight(s, 20)).loot).toEqual([loot, loot]);
    const full = structuredClone(s);
    full.quest!.party!.loot = ["smoke", "smoke"];
    expect(party(fight(full, 20)).loot).toEqual(["smoke", "smoke", loot]);
    // A boss takes two swings from a natural 20.
    let b = deal(fromStep(start(), 16), "dungeon.hangover-hydra");
    b = fight(b, 20);
    expect(b.quest!.step).toBe(17);
    expect(party(b)).toMatchObject({ hits: 0, rounds: 0 });
    roundTrip(b);
    // A heal doubles too.
    const healer = cards.find(
      (c) => c.id.startsWith("dungeon.") && c.battle && c.reward?.heal,
    );
    if (healer) {
      const h = deal(start(), healer.id);
      h.quest!.party!.hearts = 4;
      const once = party(fight(structuredClone(h), 19)).hearts;
      expect(party(fight(h, 20)).hearts - 4).toBe((once - 4) * 2);
    }
  });

  it("the last boss falling wins the crawl", () => {
    let s = deal(fromStep(start(), 24), "dungeon.last-call-lich");
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
    let b = deal(fromStep(start(), 8), "dungeon.keg-golem");
    b.quest!.party!.hearts = 2;
    b = fight(b, 1);
    expect(b.phase).toBe("complete");
    roundTrip(b);
  });

  it("the shield takes a loss whole; bleeding costs one more; a hex seals the satchel", () => {
    const at = (loot: Loot[], curse: "bleed" | "hex" | null) => {
      const s = deal(fromStep(start(), 9), "dungeon.bachelor-ghosts");
      Object.assign(s.quest!.party!, { loot, curse });
      return party(fight(s, 2));
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
    const boss = advance(deal(fromStep(start(), 8), "dungeon.keg-golem"));
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
    expect(s.cards).toHaveLength(118);
    expect(s.cards.some((c) => c.reward && !c.battle)).toBe(false);
    expect(s.cards.some((c) => c.offers || c.omen)).toBe(false);
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
    const s = fight(deal(fromStep(start(), 16), "dungeon.hangover-hydra"), 14);
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

  it("tonight's omen is put aside first, and holds for the run", () => {
    const tonight = (id: string) => {
      const s = deal(make(), `dungeon.omen-${id}`);
      return advance(advance(s));
    };
    // Starting hearts and items.
    let s = tonight("running-a-tab");
    expect(party(s)).toMatchObject({
      hearts: 10,
      max: 10,
      loot: ["shield", "draught"],
      omen: "dungeon.omen-running-a-tab",
    });
    expect(s.quest!.step).toBe(1);
    roundTrip(s);
    // A bigger satchel.
    s = tonight("cargo-shorts");
    s.quest!.party!.loot = ["draught", "die", "smoke"];
    s = advance(advance(deal(s, "dungeon.lost-and-found")));
    expect(party(s).loot).toHaveLength(4);
    roundTrip(s);
    // A smaller one: a save holding more than it fits is rejected.
    s = tonight("butterfingers");
    expect(party(s)).toMatchObject({ hearts: 14, max: 14 });
    const over = structuredClone(s);
    over.quest!.party!.loot = ["die", "die", "die"];
    expect(() => parseSession(JSON.stringify(over))).toThrow();
    // Dearer monsters, but not traps.
    s = tonight("blood-moon");
    expect(party(fight(deal(s, "dungeon.gelatinous-shot"), 3)).hearts).toBe(12);
    expect(party(fight(deal(s, "dungeon.sticky-floor"), 3)).hearts).toBe(13);
    // Kinder shrines.
    s = tonight("happy-hour");
    s.quest!.party!.hearts = 6;
    expect(
      party(advance(advance(deal(s, "dungeon.wishing-drain")))).hearts,
    ).toBe(9);
    // A longer boss fight; an ambush is not a boss.
    s = tonight("lock-in");
    expect(hitsNeeded(s.quest, findCard(s, "dungeon.last-call-lich")!)).toBe(4);
    expect(hitsNeeded(s.quest, findCard(s, "dungeon.lost-bridesmaids")!)).toBe(
      2,
    );
    // A table rule changes nothing in the engine.
    expect(party(tonight("lefty-night"))).toMatchObject({
      hearts: 12,
      loot: [],
    });
  });

  it("a merchant sells for drinks or hearts, never the last heart", () => {
    const s = advance(deal(start(), "dungeon.rat-fence"));
    expect(awaitingOffer(s)).toBe(true);
    expect(advance(s)).toBe(s);
    const bought = takeOffer(s, 0);
    expect(party(bought)).toMatchObject({ hearts: 12, loot: ["draught"] });
    expect(bought.quest!.step).toBe(2);
    roundTrip(bought);
    expect(party(takeOffer(s, 1))).toMatchObject({
      hearts: 11,
      loot: ["shield"],
    });
    expect(party(takeOffer(s, 2))).toMatchObject({ hearts: 12, loot: [] });
    s.quest!.party!.hearts = 1;
    expect(canTakeOffer(s, 1)).toBe(false);
    expect(takeOffer(s, 1)).toBe(s);
    expect(canTakeOffer(s, 3)).toBe(false);
  });

  it("a fork's loud door turns the next room into an elite; the quiet one doesn't", () => {
    const s = advance(deal(start(), "dungeon.two-hatches"));
    const next = s.quest!.finale[2];
    expect(takeOffer(s, 0).quest!.finale[2]).toBe(next);
    const loud = takeOffer(s, 1, seeded(4));
    const elite = currentCard(loud);
    expect(elite.encounter).toBe("elite");
    expect([
      "dungeon.grease-trap-horror",
      "dungeon.health-inspector",
    ]).toContain(elite.id);
    roundTrip(loud);
    // A won elite pays its loot.
    expect(party(fight(loud, 19)).loot).toEqual([elite.reward!.loot]);
  });

  it("a fork is never the last room of its floor", () => {
    for (let seed = 1; seed <= 300; seed++) {
      const s = createSession(crawl, cards, packs, seeded(seed));
      let first = 0;
      for (const stage of s.quest!.stages) {
        const last = findCard(s, s.quest!.finale[first + stage.pick - 1])!;
        if (stage.pick > 1) expect(last.encounter).not.toBe("fork");
        first += stage.pick;
      }
    }
  });

  it("an ambush is dealt again until beaten twice, and lifts no curse", () => {
    let s = deal(start(), "dungeon.lost-bridesmaids");
    s.quest!.party!.curse = "bleed";
    s = fight(s, 15);
    expect(currentCard(s).id).toBe("dungeon.lost-bridesmaids");
    expect(party(s)).toMatchObject({ hits: 1, rounds: 1 });
    roundTrip(s);
    s = fight(s, 2); // a miss: one heart, and one more for bleeding
    expect(party(s)).toMatchObject({ hearts: 10, hits: 1 });
    s = fight(s, 15);
    expect(s.quest!.step).toBe(2);
    expect(party(s)).toMatchObject({ hits: 0, curse: "bleed" });
    roundTrip(s);
    // The record keeps it among the floor's rooms, not as a boss.
    expect(questRecord(s)!.stages[1]).toMatchObject({ boss: false });
  });

  it("loads a crawl saved before omens and floor variants", () => {
    // That save's stages start at the Cellar, with no omen and no elites.
    const old = structuredClone(start());
    old.quest!.stages = old.quest!.stages.slice(1).map((st) => ({
      label: st.label,
      pick: st.pick,
      cards: st.cards,
    }));
    old.quest!.finale = old.quest!.finale.slice(1);
    old.quest!.step = 0;
    old.discarded = 0;
    old.previousId = null;
    expect(parseSession(JSON.stringify(old))).toEqual(old);
    // A tampered omen is rejected.
    const forged = structuredClone(start());
    forged.quest!.party!.omen = "dungeon.gelatinous-shot";
    expect(() => parseSession(JSON.stringify(forged))).toThrow();
  });
});

// The table plays sensibly: a draught at 3 hearts or less, a loaded die on
// any lost roll, smoke on any room fight it can, relics opened above 4
// hearts, trials won a little over half the time, a merchant's drink-priced
// ware whenever the satchel has room (a price in hearts only above 8), and
// the loud door above 6 hearts. Real cards, real engine, so a change to
// either shows up here.
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
    if (awaitingOffer(s)) {
      const offers = card.offers!;
      const p = party(s);
      const pick =
        card.encounter === "fork"
          ? p.hearts > 6
            ? 1
            : 0
          : Math.max(
              0,
              offers.findIndex(
                (o, i) =>
                  !!o.loot &&
                  p.loot.length < 3 &&
                  (!o.cost || p.hearts > 8) &&
                  canTakeOffer(s, i),
              ),
            );
      s = takeOffer(
        s,
        canTakeOffer(s, pick) ? pick : offers.length - 1,
        random,
      );
      continue;
    }
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

const RUNS = 4000;
const runs = Array.from({ length: RUNS }, (_, i) => playRun(i + 1));
const rate = (group: SessionState[]) =>
  group.filter((s) => questRecord(s)!.won).length / group.length;
const pct = (n: number) => (n * 100).toFixed(0) + "%";

it("a crawl is hard: the party wins about a quarter of its runs", () => {
  expect(runs.every((s) => s.phase === "complete")).toBe(true);
  const won = rate(runs);
  // Wipes by depth: the omen, then floor 1, its boss, floor 2, its boss,
  // floor 3, Last Call.
  const deep = (s: SessionState) => finaleStage(s.quest!).stage;
  const wipes = [0, 1, 2, 3, 4, 5, 6].map(
    (stage) =>
      runs.filter((s) => party(s).wiped && deep(s) === stage).length /
      runs.length,
  );
  // Report the shape so a tuning change is easy to read in the test output.
  console.log(
    `crawl: won ${(won * 100).toFixed(1)}%; wiped by stage ${wipes
      .map(pct)
      .join(" / ")}`,
  );
  expect(won).toBeGreaterThan(0.18);
  expect(won).toBeLessThan(0.4);
  // Nearly every run gets past the first floor; most wipes are deep.
  expect(wipes[0] + wipes[1] + wipes[2]).toBeLessThan(0.1);
  for (const s of runs.slice(0, 50)) roundTrip(s);
});

it("no omen and no dungeon makes a crawl a walkover or hopeless", () => {
  const by = (key: (s: SessionState) => string) => {
    const groups = new Map<string, SessionState[]>();
    for (const s of runs)
      groups.set(key(s), [...(groups.get(key(s)) ?? []), s]);
    return [...groups].map(([name, group]) => [name, rate(group)] as const);
  };
  const omens = by((s) => s.quest!.finale[0].replace("dungeon.omen-", ""));
  const dungeons = by((s) =>
    s
      .quest!.stages.slice(1, 6)
      .filter((_, i) => i % 2 === 0)
      .map((st) => st.label.replace("The ", ""))
      .join(" > "),
  );
  console.log(
    `omens: ${omens.map(([n, r]) => `${n} ${pct(r)}`).join(", ")}\n` +
      `dungeons: ${dungeons.map(([n, r]) => `${n} ${pct(r)}`).join(", ")}`,
  );
  expect(omens).toHaveLength(12);
  expect(dungeons).toHaveLength(8);
  for (const [, r] of [...omens, ...dungeons]) {
    expect(r).toBeGreaterThan(0.1);
    expect(r).toBeLessThan(0.5);
  }
});
