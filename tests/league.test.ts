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
  finaleStage,
  omenForm,
  questRecord,
  satchelSize,
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

// Pokémon League as a crawl (owner, 2026-10-16): a starter, eight routes
// each closed by a gym, a villain hideout after the fourth badge, Victory
// Road, the rival, a Legendary, four of the Elite Four and a Champion.
const league: GameConfig = {
  version: 1,
  packIds: ["pokemon"],
  limit: null,
  quest: "pokemon",
};
// Park-Miller, with the seed scrambled first (see tests/dungeon.test.ts).
const seeded = (seed: number): Random => {
  seed = (Math.imul(seed, 2654435761) >>> 0) % 2147483646 || 1;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
};
const party = (s: SessionState) => s.quest!.party!;
const roundTrip = (s: SessionState) =>
  expect(parseSession(JSON.stringify(s))).toEqual(s);
const pack = packs.find((p) => p.id === "pokemon")!;

describe("Pokémon League journey", () => {
  it("is a crawl of the Pokémon pack alone, opening on a starter", () => {
    const s = createSession(league, cards, packs, seeded(1));
    expect(s.quest!.party).toMatchObject({ hearts: 17, max: 17 });
    const labels = s.quest!.stages.map((st) => st.label);
    expect(labels[0]).toBe("Your starter");
    expect(labels.filter((l) => /^Route \d$/.test(l))).toHaveLength(8);
    expect(labels.filter((l) => /^Gym \d$/.test(l))).toHaveLength(8);
    expect(labels.slice(-5)).toEqual([
      "Victory Road",
      "Pokémon League",
      "Legendary",
      "Elite Four",
      "Champion",
    ]);
    // The hideout sits after the fourth gym.
    expect(labels[labels.indexOf("Gym 4") + 1]).toMatch(
      /Hideout|HQ|Castle|Lab|House|Tower|Base/,
    );
    // About 53 cards are dealt, before rematches and boss swings.
    expect(s.quest!.finale).toHaveLength(53);
    expect(currentCard(s).encounter).toBe("omen");
    // The plain deck never plays in the League.
    expect(s.cards.every((c) => pack.cardIds.includes(c.id))).toBe(true);
    roundTrip(s);
  });

  it("gym k is always one of every region's kth leaders", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = createSession(league, cards, packs, seeded(seed));
      for (let k = 1; k <= 8; k++) {
        const stage = s.quest!.stages.find((st) => st.label === `Gym ${k}`)!;
        expect(stage.cards).toHaveLength(9);
        expect(stage.cards.every((c) => c.quest === "pokemon")).toBe(true);
      }
    }
  });

  it("deals every starter and every hideout across runs", () => {
    const starters = new Set<string>();
    const hideouts = new Set<string>();
    for (let seed = 1; seed <= 600; seed++) {
      const s = createSession(league, cards, packs, seeded(seed));
      starters.add(s.quest!.finale[0]);
      const at = s.quest!.stages.findIndex((st) => st.label === "Gym 4");
      hideouts.add(s.quest!.stages[at + 1].label);
    }
    expect(starters.size).toBe(23);
    expect(hideouts.size).toBe(9);
  });
});

// A sensible table: an X Attack on any lost roll, an Escape Rope on any
// route fight it can, finds opened above 5 HP, trainers' challenges won a
// little over half the time, a Mart's drink-priced item whenever the bag has
// room (an HP price only above 10), the loud path above 9 HP, always
// evolving (a Rare Candy at once), and catching whenever the team is hurt.
// Real cards, real engine.
function playRun(seed: number, starter?: string) {
  const random = seeded(seed);
  let s = createSession(league, cards, packs, random);
  if (starter) s.quest!.finale[0] = `pokemon.starter-${starter}`;
  const use = (item: Loot) => {
    if (canUseLoot(s, item)) s = spendLoot(s, item, random);
  };
  for (let guard = 0; guard < 600 && s.phase !== "complete"; guard++) {
    s = advance(s, random);
    const card = currentCard(s);
    if (party(s).hearts <= 4) use("draught");
    use("candy"); // A Rare Candy is eaten the moment it can be.
    if (awaitingOffer(s)) {
      const offers = card.offers!;
      const p = party(s);
      const evolve = offers.findIndex((o) => o.evolve);
      let pick: number;
      if (card.encounter === "fork") pick = p.hearts > 9 ? 1 : 0;
      else if (evolve >= 0) {
        // Eevee: the table picks a form at random.
        const forms = omenForm(s.quest)?.branches?.length ?? 1;
        if (canTakeOffer(s, evolve)) {
          s = takeOffer(s, evolve, random, Math.floor(random() * forms));
          continue;
        }
        pick = 1;
      } else if (offers.some((o) => o.heal))
        pick = p.hearts < p.max ? 0 : offers.length - 1;
      else
        pick = Math.max(
          0,
          offers.findIndex(
            (o, i) =>
              !!o.loot &&
              p.loot.length < satchelSize(s.quest) &&
              (!o.cost || p.hearts > 10) &&
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
      if (party(s).hearts > 5) s = rollDice(s, random);
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
        if (!s.roll) s = returnToCard(rollDice(s, random));
      }
    }
    s = advance(s, random);
    if (party(s).hearts <= 4) use("draught");
  }
  return s;
}

const RUNS = 4000;
const runs = Array.from({ length: RUNS }, (_, i) => playRun(i + 1));
const rate = (group: SessionState[]) =>
  group.filter((s) => questRecord(s)!.won).length / group.length;
const pct = (n: number) => (n * 100).toFixed(0) + "%";
const by = (key: (s: SessionState) => string) => {
  const groups = new Map<string, SessionState[]>();
  for (const s of runs) groups.set(key(s), [...(groups.get(key(s)) ?? []), s]);
  return [...groups].map(([name, group]) => [name, rate(group)] as const);
};

it("the League is hard: the team wins between 18% and 40% of its runs", () => {
  expect(runs.every((s) => s.phase === "complete")).toBe(true);
  const won = rate(runs);
  const winners = runs.filter((s) => questRecord(s)!.won);
  const draws = winners.map((s) => s.discarded);
  const mean = draws.reduce((a, b) => a + b, 0) / draws.length;
  const sorted = [...draws].sort((a, b) => a - b);
  const at = (q: number) => sorted[Math.floor(q * (sorted.length - 1))];
  // Where runs whiteout, by stage label.
  const wipes = new Map<string, number>();
  for (const s of runs.filter((s) => party(s).wiped)) {
    const label = finaleStage(s.quest!).label.replace(
      / .*(Hideout|HQ|Castle|Lab|House|Tower|Base).*/,
      " hideout",
    );
    wipes.set(label, (wipes.get(label) ?? 0) + 1);
  }
  const avg = (f: (s: SessionState) => number) =>
    (winners.map(f).reduce((a, b) => a + b, 0) / winners.length).toFixed(1);
  console.log(
    `extra draws on won runs: ${avg((s) => s.quest!.lost ?? 0)} lost to bosses, ${avg((s) => party(s).rounds)} boss swings landed, ${avg((s) => s.quest!.finale.length)} dealt\n` +
      `league: won ${(won * 100).toFixed(1)}%; a won run takes ${mean.toFixed(1)} draws (10th ${at(0.1)}, 90th ${at(0.9)})\n` +
      `whited out at: ${[...wipes].map(([l, n]) => `${l} ${pct(n / RUNS)}`).join(", ")}`,
  );
  expect(won).toBeGreaterThan(0.18);
  expect(won).toBeLessThan(0.4);
  expect(mean).toBeGreaterThan(60);
  expect(mean).toBeLessThan(70);
  for (const s of runs.slice(0, 50)) roundTrip(s);
});

it("starters evolve often, but not always all the way", () => {
  const evolving = runs.filter((s) => (omenForm(s.quest)?.forms ?? 0) > 0);
  const once = evolving.filter((s) => (party(s).form ?? 0) >= 1).length;
  const full = evolving.filter((s) => !omenForm(s.quest)!.canEvolve).length;
  console.log(
    `evolution: ${pct(once / evolving.length)} evolve at least once, ${pct(full / evolving.length)} reach the final form`,
  );
  expect(once / evolving.length).toBeGreaterThan(0.7);
  expect(once / evolving.length).toBeLessThan(0.9);
  expect(full / evolving.length).toBeGreaterThan(0.3);
  expect(full / evolving.length).toBeLessThan(0.5);
});

it("no starter and no hideout makes the League a walkover or hopeless", () => {
  const starters = by((s) =>
    s.quest!.finale[0].replace("pokemon.starter-", ""),
  );
  const hideouts = by((s) => {
    const at = s.quest!.stages.findIndex((st) => st.label === "Gym 4");
    return s.quest!.stages[at + 1].label;
  });
  console.log(
    `starters: ${starters.map(([n, r]) => `${n} ${pct(r)}`).join(", ")}\n` +
      `hideouts: ${hideouts.map(([n, r]) => `${n} ${pct(r)}`).join(", ")}`,
  );
  expect(starters).toHaveLength(23);
  expect(hideouts).toHaveLength(9);
  // Bidoof is the worst starter by design (owner, 2026-10-17), measured on
  // its own below: a 23rd of the runs is too few to read it here.
  for (const [name, r] of [...starters, ...hideouts]) {
    if (name === "bidoof") continue;
    expect(r, name).toBeGreaterThan(0.1);
    expect(r, name).toBeLessThan(0.5);
  }
});

it("Bidoof is the worst starter, and still wins now and then", () => {
  const bidoof = rate(
    Array.from({ length: 600 }, (_, i) => playRun(i + 1, "bidoof")),
  );
  const worst = Math.min(
    ...by((s) => s.quest!.finale[0])
      .filter(([n]) => !n.endsWith("bidoof"))
      .map(([, r]) => r),
  );
  console.log(`bidoof (600 runs) ${pct(bidoof)}; next worst ${pct(worst)}`);
  expect(bidoof).toBeGreaterThan(0.01);
  expect(bidoof).toBeLessThan(Math.min(0.08, worst));
});
