import { expect, it } from "vitest";
import {
  advance,
  awaitingChoice,
  awaitingOffer,
  awaitingPress,
  awaitingSpoils,
  awaitingVerdict,
  canQuaff,
  cashOut,
  pressOn,
  canTakeOffer,
  canUseLoot,
  createSession,
  currentCard,
  finaleStage,
  omenForm,
  quaff,
  questRecord,
  satchelSize,
  settleBattle,
  skipRoll,
  spendLoot,
  takeOffer,
  takeSpoils,
  type Random,
} from "../src/game/engine";
import { returnToCard, rollDice, rollWins } from "../src/game/dice";
import { parseSession } from "../src/app/persistence";
import { cards, packs } from "../src/content/catalog";
import type { GameConfig, Loot, SessionState } from "../src/game/types";
import {} from "../src/content/dungeon/shared";

// Pub Crawl's balance (`npm run test:balance`, run by CI beside `npm test`):
// 4,000 seeded runs played by a sensible table. Kept out of `npm test` so
// the everyday check stays quick; run it after changing crawl cards or rules.
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
const STEP = {
  adventurer: 0,
  omen: 1,
  queue: 2,
  floor1: 3,
  boss1: 11,
  landing1: 12,
  hidden: 13,
  keeper: 15,
  floor2: 16,
  boss2: 24,
  landing2: 25,
  floor3: 26,
  closing: 34,
  lastCall: 35,
};
const party = (s: SessionState) => s.quest!.party!;
const roundTrip = (s: SessionState) =>
  expect(parseSession(JSON.stringify(s))).toEqual(s);
// Put a card in the run at the current step, by id.
const deal = (s: SessionState, id: string): SessionState => {
  const finale = [...s.quest!.finale];
  const at = finale.indexOf(id);
  if (at >= 0) finale[at] = finale[s.quest!.step];
  finale[s.quest!.step] = id;
  return { ...s, quest: { ...s.quest!, finale } };
};

// The table plays sensibly: a draught at 3 hearts or less, a loaded die on
// any lost roll and the Quaff when there's no die, smoke on any room fight
// it can, relics opened above 4 hearts, trials won a little over half the
// time, a merchant's drink-priced ware whenever the satchel has room (a
// price in hearts only above 8), the loud door above 6 hearts, a Tome read
// at once, and at a landing a level up unless the hearts are low (6 or
// fewer) or the adventurer is the Plus-One, who rests. Real cards, real
// engine, so a change to either shows up here.
function playRun(seed: number, adventurer?: string) {
  const random = seeded(seed);
  let s = createSession(crawl, cards, packs, random);
  if (adventurer) s = deal(s, `dungeon.class-${adventurer}`);
  const use = (item: Loot) => {
    if (canUseLoot(s, item)) s = spendLoot(s, item, random);
  };
  const plusOne = () => party(s).omen === "dungeon.class-plus-one";
  for (let guard = 0; guard < 500 && s.phase !== "complete"; guard++) {
    s = advance(s, random);
    const card = currentCard(s);
    if (party(s).hearts <= 3) use("draught");
    if (!plusOne()) use("candy");
    if (awaitingOffer(s)) {
      const offers = card.offers!;
      const p = party(s);
      let pick: number;
      if (card.encounter === "fork") pick = p.hearts > 6 ? 1 : 0;
      else if (card.encounter === "rest")
        pick = p.hearts > 6 && !plusOne() && canTakeOffer(s, 0) ? 0 : 1;
      else
        pick = Math.max(
          0,
          offers.findIndex(
            (o, i) =>
              !!o.loot &&
              p.loot.length < satchelSize(s.quest) &&
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
      if (card.battle && !rollWins(card.dice, s.roll!.values, s.roll!)) {
        use("die");
        if (s.roll && canQuaff(s)) s = quaff(s);
        if (!s.roll) s = returnToCard(rollDice(s, random));
      }
    }
    // Push your luck: one more pull when healthy, then cash out.
    if (awaitingPress(s)) {
      s =
        party(s).hearts > 6 && !party(s).press
          ? pressOn(s)
          : cashOut(s, random);
      continue;
    }
    // Spoils: the table picks either trinket, at random.
    if (awaitingSpoils(s)) {
      s = takeSpoils(s, random() < 0.5 ? 0 : 1, random);
      if (party(s).hearts <= 3) use("draught");
      continue;
    }
    s = advance(s, random);
    if (party(s).hearts <= 3) use("draught");
  }
  return s;
}

const RUNS = 4000;
// The tests below read thousands of runs; beside the other harness in a
// full parallel `npm test` they can pass the 5 s default, so each has 30 s.
const runs = Array.from({ length: RUNS }, (_, i) => playRun(i + 1));
const rate = (group: SessionState[]) =>
  group.filter((s) => questRecord(s)!.won).length / group.length;
const pct = (n: number) => (n * 100).toFixed(0) + "%";
const by = (key: (s: SessionState) => string) => {
  const groups = new Map<string, SessionState[]>();
  for (const s of runs) groups.set(key(s), [...(groups.get(key(s)) ?? []), s]);
  return [...groups].map(([name, group]) => [name, rate(group)] as const);
};

it("a crawl is hard: the party wins about a quarter of its runs", () => {
  expect(runs.every((s) => s.phase === "complete")).toBe(true);
  const won = rate(runs);
  const winners = runs.filter((s) => questRecord(s)!.won);
  const draws = winners.map((s) => s.discarded);
  const mean = draws.reduce((a, b) => a + b, 0) / draws.length;
  // Where runs wipe, by stage label.
  const wipes = new Map<string, number>();
  for (const s of runs.filter((s) => party(s).wiped)) {
    const label = finaleStage(s.quest!)
      .label.replace(/^The (Cellar|Wine Cellar|Brewery)$/, "Floor 1")
      .replace(/^The (Catacombs|Sewers|Walk-in Freezer)$/, "Floor 2")
      .replace(/^The (Drowned Taproom|Kitchen|Rooftop Bar)$/, "Floor 3")
      .replace(/^.* boss$/, (l) =>
        /Cellar|Brewery/.test(l)
          ? "Floor 1 boss"
          : /Catacombs|Sewers|Freezer/.test(l)
            ? "Floor 2 boss"
            : "Hidden room boss",
      );
    wipes.set(label, (wipes.get(label) ?? 0) + 1);
  }
  const avg = (f: (s: SessionState) => number, of = winners) =>
    (of.map(f).reduce((a, b) => a + b, 0) / of.length).toFixed(1);
  console.log(
    `crawl: won ${(won * 100).toFixed(1)}%; a won run takes ${mean.toFixed(1)} draws, ` +
      `keeps ${avg((s) => party(s).boons?.length ?? 0)} boons, pours ${avg((s) => party(s).cup ?? 0, runs)} splashes a run\n` +
      `wiped at: ${[...wipes].map(([l, n]) => `${l} ${pct(n / RUNS)}`).join(", ")}`,
  );
  expect(won).toBeGreaterThan(0.18);
  expect(won).toBeLessThan(0.4);
  expect(mean).toBeGreaterThan(38);
  expect(mean).toBeLessThan(55);
  // Nearly every run gets through the door and the first floor.
  const early = ["The Queue", "Floor 1"].reduce(
    (n, l) => n + (wipes.get(l) ?? 0),
    0,
  );
  expect(early / RUNS).toBeLessThan(0.1);
  for (const s of runs.slice(0, 50)) roundTrip(s);
}, 30_000);

it("adventurers level up often, but not always all the way", () => {
  const levelling = runs.filter(
    (s) => party(s).omen !== "dungeon.class-plus-one",
  );
  const once = levelling.filter((s) => (party(s).form ?? 0) >= 1).length;
  const full = levelling.filter((s) => !omenForm(s.quest)!.canEvolve).length;
  console.log(
    `levels: ${pct(once / levelling.length)} level up at least once, ${pct(full / levelling.length)} reach level 3`,
  );
  expect(once / levelling.length).toBeGreaterThan(0.6);
  expect(full / levelling.length).toBeGreaterThan(0.2);
  expect(full / levelling.length).toBeLessThan(0.6);
}, 30_000);

it("no adventurer, omen or dungeon makes a crawl a walkover or hopeless", () => {
  const adventurers = by((s) =>
    s.quest!.finale[STEP.adventurer].replace("dungeon.class-", ""),
  );
  const omens = by((s) =>
    s.quest!.finale[STEP.omen].replace("dungeon.omen-", ""),
  );
  const rooms = by((s) => s.quest!.stages[6].label);
  // Each floor on its own (27 whole routes are too thin to measure).
  const dungeons = [3, 8, 11].flatMap((i) =>
    by((s) => s.quest!.stages[i].label.replace("The ", "")),
  );
  console.log(
    `adventurers: ${adventurers.map(([n, r]) => `${n} ${pct(r)}`).join(", ")}\n` +
      `omens: ${omens.map(([n, r]) => `${n} ${pct(r)}`).join(", ")}\n` +
      `hidden rooms: ${rooms.map(([n, r]) => `${n} ${pct(r)}`).join(", ")}\n` +
      `floors: ${dungeons.map(([n, r]) => `${n} ${pct(r)}`).join(", ")}`,
  );
  expect(adventurers).toHaveLength(12);
  expect(omens).toHaveLength(12);
  expect(dungeons).toHaveLength(9);
  expect(rooms).toHaveLength(5);
  // The Plus-One is the worst by design, measured on its own below.
  for (const [name, r] of [...adventurers, ...omens, ...rooms, ...dungeons]) {
    if (name === "plus-one") continue;
    expect(r, name).toBeGreaterThan(0.1);
    expect(r, name).toBeLessThan(0.5);
  }
}, 30_000);

it("the Plus-One is the worst adventurer, and still wins now and then", () => {
  const plus = rate(
    Array.from({ length: 600 }, (_, i) => playRun(i + 1, "plus-one")),
  );
  const worst = Math.min(
    ...by((s) => s.quest!.finale[STEP.adventurer])
      .filter(([n]) => !n.endsWith("plus-one"))
      .map(([, r]) => r),
  );
  console.log(`plus-one (600 runs) ${pct(plus)}; next worst ${pct(worst)}`);
  expect(plus).toBeGreaterThan(0.01);
  expect(plus).toBeLessThan(Math.min(0.1, worst));
}, 30_000);
