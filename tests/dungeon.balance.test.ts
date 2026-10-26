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
  spoilsOnWin,
  skipRoll,
  spendLoot,
  takeOffer,
  takeSpoils,
  replaces,
  type Random,
} from "../src/game/engine";
import { returnToCard, rollDice, rollWins } from "../src/game/dice";
import { botPower } from "./bot";
import { parseSession } from "../src/app/persistence";
import { cards, packs } from "../src/content/catalog";
import type { GameConfig, Loot, SessionState } from "../src/game/types";
import { JOKE_CLASSES } from "../src/content/dungeon/classes";

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
  stairs: 26,
  floor3: 27,
  closing: 35,
  lastCall: 36,
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
// fewer) or the adventurer is a joke class (the Plus-One, the Intern, the
// Mimic), who rests; a forked level up picks either path, at random. Real cards, real
// engine, so a change to either shows up here.
function playRun(seed: number, adventurer?: string) {
  const random = seeded(seed);
  let s = createSession(crawl, cards, packs, random);
  if (adventurer) s = deal(s, `dungeon.class-${adventurer}`);
  const use = (item: Loot) => {
    if (canUseLoot(s, item))
      s = spendLoot(s, item, random, random() < 0.5 ? 0 : 1);
  };
  const joke = () => JOKE_CLASSES.includes(party(s).omen ?? "");
  for (let guard = 0; guard < 500 && s.phase !== "complete"; guard++) {
    s = advance(s, random);
    const card = currentCard(s);
    if (party(s).hearts <= 3) use("draught");
    if (!joke()) use("candy");
    if (awaitingOffer(s)) {
      const offers = card.offers!;
      const p = party(s);
      let pick: number;
      if (card.encounter === "fork") pick = p.hearts > 6 ? 1 : 0;
      else if (card.encounter === "rest")
        pick = p.hearts > 6 && !joke() && canTakeOffer(s, 0) ? 0 : 1;
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
        random() < 0.5 ? 0 : 1,
      );
      continue;
    }
    if (card.battle && !card.hits && !card.dice?.choice) {
      use("smoke");
      if (s.phase !== "revealed" || currentCard(s) !== card) continue;
    }
    // The class's or starter's power (2026-10-25).
    if (s.phase === "revealed") {
      s = botPower(s, random, "before");
      if (s.phase !== "revealed" || currentCard(s).id !== card.id) continue;
    }
    if (awaitingChoice(s)) {
      if (party(s).hearts > 4) s = rollDice(s, random);
      else {
        s = skipRoll(s, random);
        continue;
      }
    }
    if (awaitingVerdict(s)) {
      // A felling win on a boss with spoils fills a free slot first.
      const free = spoilsOnWin(s)
        ? currentCard(s).spoils!.findIndex((b) => !replaces(s.quest, b).length)
        : -1;
      s = settleBattle(
        s,
        random() < 0.55,
        random,
        spoilsOnWin(s) ? (free >= 0 ? free : 0) : undefined,
      );
      continue;
    }
    if (card.dice) {
      if (!s.roll) s = rollDice(s, random);
      s = returnToCard(s);
      if (card.battle && !rollWins(card.dice, s.roll!.values, s.roll!)) {
        s = botPower(s, random, "lost");
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
    // Spoils: the table fills an empty equipment slot when it can
    // (2026-10-25), else picks either piece at random and swaps it in.
    if (awaitingSpoils(s)) {
      const spoils = currentCard(s).spoils!;
      const free = spoils.findIndex((b) => !replaces(s.quest, b).length);
      s = takeSpoils(s, free >= 0 ? free : random() < 0.5 ? 0 : 1, random);
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
// A finished run is kept without its deck snapshot (`cards`, a clone of
// every Dungeon night deck card): a crawl deals only its stages' cards, which
// every reader below finds in `quest.stages`, and 4,000 full sessions pass
// the default 2 GB heap. The first 50 are round-tripped whole first.
const full: SessionState[] = [];
const slim = (s: SessionState, i: number): SessionState => {
  if (i < 50) full.push(s);
  return { ...s, cards: [] };
};
const runs = Array.from({ length: RUNS }, (_, i) => slim(playRun(i + 1), i));
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
  for (const s of full) roundTrip(s);
}, 30_000);

it("adventurers level up often, but not always all the way", () => {
  const levelling = runs.filter(
    (s) => !JOKE_CLASSES.includes(party(s).omen ?? ""),
  );
  const once = levelling.filter((s) => (party(s).form ?? 0) >= 1).length;
  const full = levelling.filter((s) => !omenForm(s.quest)!.canEvolve).length;
  // Each forked path's rate among the runs that took it (2026-10-25): a
  // run that levels is a run that got far, so these read high.
  const paths = new Map<string, SessionState[]>();
  for (const s of levelling.filter((s) => (party(s).form ?? 0) >= 1)) {
    const card = omenForm(s.quest)!.card;
    const path = card.evolves![((party(s).form ?? 1) - 1) % 2].title;
    const key = `${card.title}/${path}`;
    paths.set(key, [...(paths.get(key) ?? []), s]);
  }
  console.log(
    `levels: ${pct(once / levelling.length)} level up at least once, ${pct(full / levelling.length)} reach level 3\n` +
      `paths: ${[...paths].map(([k, g]) => `${k} ${pct(rate(g))} (${g.length})`).join(", ")}`,
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
  const dungeons = [3, 8, 12].flatMap((i) =>
    by((s) => s.quest!.stages[i].label.replace("The ", "")),
  );
  console.log(
    `adventurers: ${adventurers.map(([n, r]) => `${n} ${pct(r)}`).join(", ")}\n` +
      `omens: ${omens.map(([n, r]) => `${n} ${pct(r)}`).join(", ")}\n` +
      `hidden rooms: ${rooms.map(([n, r]) => `${n} ${pct(r)}`).join(", ")}\n` +
      `floors: ${dungeons.map(([n, r]) => `${n} ${pct(r)}`).join(", ")}`,
  );
  expect(adventurers).toHaveLength(18);
  expect(omens).toHaveLength(20);
  expect(dungeons).toHaveLength(9);
  expect(rooms).toHaveLength(5);
  // The joke classes are the worst by design, measured on their own below.
  for (const [name, r] of [...adventurers, ...omens, ...rooms, ...dungeons]) {
    if (JOKE_CLASSES.includes(`dungeon.class-${name}`)) continue;
    expect(r, name).toBeGreaterThan(0.1);
    expect(r, name).toBeLessThan(0.5);
  }
}, 30_000);

it("the joke classes are the worst adventurers, and still win now and then", () => {
  const worst = Math.min(
    ...by((s) => s.quest!.finale[STEP.adventurer])
      .filter(([n]) => !JOKE_CLASSES.includes(n))
      .map(([, r]) => r),
  );
  const jokes = JOKE_CLASSES.map((id) => {
    const name = id.replace("dungeon.class-", "");
    const r = rate(
      Array.from({ length: 600 }, (_, i) => ({
        ...playRun(i + 1, name),
        cards: [],
      })),
    );
    return [name, r] as const;
  });
  console.log(
    `jokes (600 runs each): ${jokes.map(([n, r]) => `${n} ${pct(r)}`).join(", ")}; next worst ${pct(worst)}`,
  );
  for (const [name, r] of jokes) {
    expect(r, name).toBeGreaterThan(0.01);
    expect(r, name).toBeLessThan(Math.min(0.1, worst));
  }
}, 60_000);
