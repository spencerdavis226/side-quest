import type { CardDefinition, Power, PowerKind } from "../game/types";

// Signature powers (2026-10-25): every Pub Crawl class and League starter
// has one power the table chooses when to use, once (or `uses` times) until
// the next boss or gym falls. Each form may bring its own, which replaces
// the one before it; a form without one keeps it. The plaque's line is
// written from the kind, in the pack's words, so every power of a kind
// reads the same. Applied by card ID (`applyPowers`), like the knacks.

/** A power's words in one crawl: the fight, the hearts. */
export interface PowerWords {
  fight: string;
  hearts: (n: number) => string;
  /** No hearts, in the pack's words ("no hearts", "no HP"). */
  none: string;
  flee: string;
}
export const dungeonPowerWords: PowerWords = {
  fight: "fight",
  hearts: (n) => `${n} ${n === 1 ? "heart" : "hearts"}`,
  none: "no hearts",
  flee: "Slip past a room fight",
};
export const leaguePowerWords: PowerWords = {
  fight: "battle",
  hearts: (n) => `${n} HP`,
  none: "no HP",
  flee: "Escape a wild battle",
};

/** One power: its kind, and its uses, cost or amount. */
export type PowerSpec = [
  name: string,
  kind: PowerKind,
  more?: { uses?: number; cost?: number; amount?: number; drinks?: number },
];
export function makePower(
  [name, kind, more = {}]: PowerSpec,
  w: PowerWords,
): Power {
  const rules = {
    reroll: `Roll a lost ${w.fight} again`,
    spare: `A loss costs ${w.none}`,
    edge: `Take the edge in a ${w.fight}`,
    double: "A win counts double",
    win: `Win a ${w.fight} for ${w.hearts(more.cost ?? 1)}`,
    heal: `Get ${w.hearts(more.amount ?? 1)} back`,
    flee: w.flee,
  }[kind];
  return { name, kind, rules, ...more };
}

/** A class's or starter's powers: its own, then one per form (`null` keeps
 * the form before it). */
export type PowerLine = [base: PowerSpec, ...forms: (PowerSpec | null)[]];
export function applyPowers(
  cards: CardDefinition[],
  lines: Readonly<Record<string, PowerLine>>,
  prefix: string,
  words: PowerWords,
) {
  for (const [id, [base, ...forms]] of Object.entries(lines)) {
    const card = cards.find((c) => c.id === `${prefix}${id}`);
    if (!card?.omen) throw new Error(`No omen for a power: ${prefix}${id}`);
    card.power = makePower(base, words);
    const evolves = card.evolves ?? [];
    if (forms.length !== evolves.length)
      throw new Error(`Powers for every form: ${prefix}${id}`);
    forms.forEach((spec, i) => {
      if (spec) evolves[i].power = makePower(spec, words);
    });
  }
  const missing = cards.filter(
    (c) => c.id.startsWith(prefix) && c.omen && !c.power,
  );
  if (missing.length)
    throw new Error(`No power: ${missing.map((c) => c.id).join(", ")}`);
}
