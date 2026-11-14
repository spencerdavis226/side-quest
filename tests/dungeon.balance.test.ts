import { expect, it } from "vitest";
import {
  advance,
  awaitingChoice,
  awaitingOffer,
  awaitingPress,
  awaitingSpoils,
  awaitingVerdict,
  cashOut,
  pressOn,
  canTakeOffer,
  canUseLoot,
  createSession,
  currentCard,
  finaleStage,
  omenForm,
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
  canSendIn,
  partyTeam,
  sendIn,
} from "../src/game/engine";
import { returnToCard, rollDice, rollTarget, rollWins } from "../src/game/dice";
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
  summons: 2,
  queue: 3,
  floor1: 4,
  boss1: 12,
  sign: 13,
  landing1: 14,
  plea: 15,
  hidden: 16,
  keeper: 18,
  floor2: 19,
  boss2: 27,
  landing2: 28,
  stairs: 29,
  floor3: 30,
  closing: 38,
  lastCall: 39,
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
// any lost roll, smoke on any room fight
// it can, relics opened above 4 hearts, trials won a little over half the
// time, a merchant's drink-priced ware whenever the satchel has room (a
// price in hearts only above 8), the loud door above 6 hearts, a Tome read
// at once (never by a joke class: the Peasant, the Squire, the Mimic), at
// an inn (Realms, 2026-11-03) a rest when three or more hearts are gone,
// else its item when the satchel has room, and a side quest taken above 6
// hearts. Real cards, real engine, so a change to either shows up here.
/** What the party brought to the dragon (Phase 4): its lore and its
 * living allies, by run seed, for the main runs only. */
const atDragon = new Map<number, { lore: number; allies: number }>();
function playRun(seed: number, adventurer?: string) {
  const random = seeded(seed);
  let s = createSession(crawl, cards, packs, random);
  if (adventurer) s = deal(s, `dungeon.class-${adventurer}`);
  const use = (item: Loot) => {
    if (canUseLoot(s, item)) s = spendLoot(s, item, random);
  };
  const joke = () => JOKE_CLASSES.includes(party(s).omen ?? "");
  for (let guard = 0; guard < 500 && s.phase !== "complete"; guard++) {
    s = advance(s, random);
    const card = currentCard(s);
    if (!adventurer && card.lairFight && !atDragon.has(seed))
      atDragon.set(seed, {
        lore: party(s).lore ?? 0,
        allies: partyTeam(s.quest).filter((m) => m.ally).length,
      });
    if (party(s).hearts <= 3) use("draught");
    if (!joke()) use("candy");
    if (awaitingOffer(s)) {
      const offers = card.offers!;
      const p = party(s);
      let pick: number;
      // The road (Phase 5): a coin flip between the two regions offered.
      if (offers.some((o) => o.route !== undefined))
        pick = random() < 0.5 ? 0 : 1;
      else if (card.encounter === "fork") pick = p.hearts > 6 ? 1 : 0;
      else if (offers.some((o) => o.skip)) pick = p.hearts > 6 ? 0 : 1;
      // A landmark or a dragon sign (The Quest 2.0 Phase 3): gear, then an
      // item, then a heal when hurt, then the loud door when healthy, else
      // whatever is free.
      else if (card.encounter === "shrine") {
        const room = p.loot.length < satchelSize(s.quest);
        const ok = (i: number) =>
          canTakeOffer(s, i) && (!offers[i].cost || p.hearts > 6);
        const first = (want: (o: (typeof offers)[number]) => boolean) =>
          offers.findIndex((o, i) => want(o) && ok(i));
        pick =
          [
            first((o) => !!o.boon),
            first((o) => !!o.loot && room),
            p.max - p.hearts >= 2 ? first((o) => !!o.heal) : -1,
            p.hearts > 6 ? first((o) => !!o.elite) : -1,
            first((o) => !o.cost && !o.elite),
          ].find((i) => i >= 0) ?? 0;
      } else if (card.encounter === "rest") {
        // The inns' third plaque (Phase 4): hire a blade with no ally yet,
        // ask about the dragon below three lore; when not hurt.
        const third = offers[2];
        const wants =
          !!third &&
          ((third.recruit && !(p.team ?? []).length) ||
            (third.lore && (p.lore ?? 0) < 3));
        pick =
          p.max - p.hearts >= 3
            ? 0
            : wants
              ? 2
              : p.loot.length >= satchelSize(s.quest)
                ? 0
                : 1;
      } else
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
      // A felling win on a boss with spoils fills a free slot first.
      const free = spoilsOnWin(s)
        ? currentCard(s).spoils!.findIndex((b) => !replaces(s.quest, b).length)
        : -1;
      s = settleBattle(
        s,
        // The enrage contest is a coin flip (The Quest 2.0).
        random() < (party(s).duel?.contest ? 0.5 : 0.55),
        random,
        spoilsOnWin(s) ? (free >= 0 ? free : 0) : undefined,
      );
      continue;
    }
    // An ally (Phase 4) goes into a fight of its calling when its bonus
    // makes the roll 55% or better, and always at the dragon.
    if (card.dice && !s.roll)
      for (const m of partyTeam(s.quest)) {
        if (!m.ally || !canSendIn(s, m.id)) continue;
        const need = rollTarget(s, card)?.target ?? 21;
        if (card.lairFight || need - m.ally.bonus <= 10) {
          s = sendIn(s, m.id);
          break;
        }
      }
    if (card.dice) {
      if (!s.roll) s = rollDice(s, random);
      s = returnToCard(s);
      if (card.battle && !rollWins(card.dice, s.roll!.values, s.roll!)) {
        use("die");
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

// For tuning: QUEST_RUNS=1000 plays fewer runs (the bands then wobble).
const RUNS = Number(process.env.QUEST_RUNS ?? 4000);
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
      .label.replace(/^The (King's Road|Old Forest|Marsh)$/, "Region 1")
      .replace(/^The (Haunted Crypt|Goblin Mines|Wizard's Tower)$/, "Region 2")
      .replace(/^The (Sunken Coast|Fire Caverns|Frozen Pass)$/, "Region 3")
      .replace(/^.* boss$/, (l) =>
        /King's Road|Old Forest|Marsh/.test(l)
          ? "Region 1 boss"
          : /Haunted Crypt|Goblin Mines|Wizard's Tower/.test(l)
            ? "Region 2 boss"
            : "Side quest boss",
      );
    wipes.set(label, (wipes.get(label) ?? 0) + 1);
  }
  const avg = (f: (s: SessionState) => number, of = winners) =>
    (of.map(f).reduce((a, b) => a + b, 0) / of.length).toFixed(1);
  console.log(
    `crawl: won ${(won * 100).toFixed(1)}%; a won run takes ${mean.toFixed(1)} draws, ` +
      `keeps ${avg((s) => party(s).boons?.length ?? 0)} boons\n` +
      `wiped at: ${[...wipes].map(([l, n]) => `${l} ${pct(n / RUNS)}`).join(", ")}`,
  );
  expect(won).toBeGreaterThan(0.18);
  expect(won).toBeLessThan(0.4);
  expect(mean).toBeGreaterThan(38);
  // D10 (The Quest 2.0, 2026-11-13): the measured mean plus 6. Measured
  // 54.4 after the dragon battle (Phase 2), so 60.4; 55.0 with the
  // landmarks and the dragon sign (Phase 3), so 61; 56.1 with allies,
  // lore and a five-scale dragon (Phase 4), so 62; 58.1 with the two road
  // cards (Phase 5), so 64; 58.7 with the rares, echoes and a three-swing
  // Lair's Door (Phase 6), so 65.
  expect(mean).toBeLessThan(65);
  // Nearly every run gets through the gate and the first region.
  const early = ["The City Gate", "Region 1"].reduce(
    (n, l) => n + (wipes.get(l) ?? 0),
    0,
  );
  expect(early / RUNS).toBeLessThan(0.1);
  for (const s of full) roundTrip(s);
}, 30_000);

it("the dragon battle is the run's last hard fight, never a wall", () => {
  // The Quest 2.0 Phase 2 (2026-11-13): every dragon between 12% and 45%
  // of the runs it ends, and 45% to 65% of runs reach it.
  // Every run that ended at the dragon (Phase 4: walked-on side quests
  // counted too; the old filter on the run's length left them out).
  const atLair = runs.filter(
    (s) => finaleStage(s.quest!).label === "The Dragon's Lair",
  );
  const dragons = by((s) => {
    const id = s.quest!.finale[s.quest!.finale.length - 1];
    return id.replace("dungeon.", "");
  });
  const beaten = atLair.filter((s) => questRecord(s)!.won);
  // Swings at the dragon (a contest round is not a swing), win or lose.
  const swings = atLair.map((s) => (party(s).duel?.swings ?? 0) + 1);
  const meanSwings = swings.reduce((a, b) => a + b, 0) / swings.length;
  console.log(
    `dragon: ${pct(atLair.length / RUNS)} of runs reach it, ${pct(beaten.length / atLair.length)} of those win; ` +
      `${meanSwings.toFixed(1)} swings; ` +
      dragons.map(([n, r]) => `${n} ${pct(r)}`).join(", "),
  );
  // Lore and allies (Phase 4): the party brings 1 to 2 lore on average,
  // and at least one ally lives to the dragon in 60% to 90% of the runs
  // that reach it (the plan said 30% to 60%; a keeper's ally joins in
  // most runs and meets few fights of its calling, so most live: see the
  // plan's Phase 4 "As built").
  const brought = [...atDragon.values()];
  const meanLore = brought.reduce((a, b) => a + b.lore, 0) / brought.length;
  const withAlly = brought.filter((b) => b.allies > 0).length / brought.length;
  console.log(
    `at the dragon: ${meanLore.toFixed(2)} lore on average; an ally alive in ${pct(withAlly)}`,
  );
  expect(atLair.length / RUNS).toBeGreaterThan(0.45);
  expect(atLair.length / RUNS).toBeLessThan(0.65);
  expect(meanLore).toBeGreaterThan(1);
  expect(meanLore).toBeLessThan(2);
  expect(withAlly).toBeGreaterThan(0.6);
  expect(withAlly).toBeLessThan(0.9);
  for (const [name, r] of dragons) {
    expect(r, name).toBeGreaterThan(0.12);
    expect(r, name).toBeLessThan(0.45);
  }
});

it("no road is the easy one (The Quest 2.0 Phase 5)", () => {
  // Each pair of regions offered (the choice card dealt) wins within 8
  // points of every other at its depth.
  for (const label of ["The Road Out", "The Signpost"]) {
    const pairs = by(
      (s) =>
        s.quest!.stages.find((st) => st.label === label)?.cards[0].id ?? "none",
    ).filter(([n]) => n !== "none");
    console.log(
      `${label}: ${pairs.map(([n, r]) => `${n.replace("dungeon.road-", "")} ${pct(r)}`).join(", ")}`,
    );
    expect(pairs).toHaveLength(3);
    const rates = pairs.map(([, r]) => r);
    expect(Math.max(...rates) - Math.min(...rates)).toBeLessThan(0.08);
  }
});

it("adventurers rank up often, but not always all the way", () => {
  const levelling = runs.filter(
    (s) => !JOKE_CLASSES.includes(party(s).omen ?? ""),
  );
  const once = levelling.filter((s) => (party(s).form ?? 0) >= 1).length;
  const full = levelling.filter((s) => !omenForm(s.quest)!.canEvolve).length;
  console.log(
    `ranks: ${pct(once / levelling.length)} rank up at least once, ${pct(full / levelling.length)} reach rank 3`,
  );
  expect(once / levelling.length).toBeGreaterThan(0.6);
  // Realms (2026-11-03): ranks come free from the two region bosses and the
  // side quest's keeper, so most tables that get that far reach rank 3; a
  // walked-past side quest or an early wipe still stops short.
  expect(full / levelling.length).toBeGreaterThan(0.2);
  expect(full / levelling.length).toBeLessThan(0.9);
}, 30_000);

it("no adventurer, omen or dungeon makes a crawl a walkover or hopeless", () => {
  const adventurers = by((s) =>
    s.quest!.finale[STEP.adventurer].replace("dungeon.class-", ""),
  );
  const omens = by((s) =>
    s.quest!.finale[STEP.omen].replace("dungeon.omen-", ""),
  );
  // A side quest's dungeon is the stage after its plea (Realms,
  // 2026-11-03); a run that walked on is measured as "walked on".
  const room = (s: SessionState) => {
    const stages = s.quest!.stages;
    const at = stages.findIndex((st) => st.label === "A Side Quest");
    return stages[at + 1].cards.some((c) => / · Guard$/.test(c.ribbon ?? ""))
      ? stages[at + 1].label
      : "walked on";
  };
  const rooms = by(room).filter(([n]) => n !== "walked on");
  const walked = runs.filter((s) => room(s) === "walked on").length / RUNS;
  // Each region on its own (27 whole routes are too thin to measure), by
  // its eight-encounter stage at each depth.
  // A run that fell before a road choice (Phase 5) holds both regions
  // offered at that depth and reached neither: it is left out there.
  const DEPTHS = [
    ["The King's Road", "The Old Forest", "The Marsh"],
    ["The Haunted Crypt", "The Goblin Mines", "The Wizard's Tower"],
    ["The Sunken Coast", "The Fire Caverns", "The Frozen Pass"],
  ];
  const regionAt = (s: SessionState, depth: number) => {
    const at = s.quest!.stages.filter(
      (st) => st.pick === 8 && DEPTHS[depth].includes(st.label),
    );
    return at.length === 1 ? at[0].label.replace("The ", "") : "none";
  };
  const dungeons = [0, 1, 2].flatMap((i) =>
    by((s) => regionAt(s, i)).filter(([n]) => n !== "none"),
  );
  console.log(
    `adventurers: ${adventurers.map(([n, r]) => `${n} ${pct(r)}`).join(", ")}\n` +
      `omens: ${omens.map(([n, r]) => `${n} ${pct(r)}`).join(", ")}\n` +
      `side quests (${pct(walked)} walked on): ${rooms.map(([n, r]) => `${n} ${pct(r)}`).join(", ")}\n` +
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
}, 120_000);
