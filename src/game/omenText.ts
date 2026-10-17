import type { Encounter, Loot, OmenEffect } from "./types";

// An omen's effect in words, written from its numbers so the text can never
// disagree with what the engine does (owner, 2026-10-17: a Bulbasaur evolved
// and nobody could tell what changed). The League's starter cards and their
// evolutions use `describeOmen`; the evolution banner uses `describeChange`.
// The words are the pack's own (`crawlTheme`), passed in so this stays pure.

export interface OmenWords {
  /** "Max HP". */
  max: string;
  /** "The bag". */
  bag: string;
  /** What every item is called, with its article: "a Protect". */
  items: Record<Loot, [one: string, many: string, article: string]>;
  /** The kinds an omen can single out, as written mid-sentence ("route
   * battles", "Ace Trainers"), in the order they are listed. */
  kinds: Partial<Record<Encounter, string>>;
}

const join = (parts: string[]) =>
  parts.length < 2
    ? parts.join("")
    : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "a Protect and 2 X Attacks". */
export function itemList(loot: Loot[], words: OmenWords) {
  const counts = new Map<Loot, number>();
  for (const item of loot) counts.set(item, (counts.get(item) ?? 0) + 1);
  return join(
    [...counts].map(([item, n]) => {
      const [one, many, article] = words.items[item];
      return n === 1 ? `${article} ${one}` : `${n} ${many}`;
    }),
  );
}

/** "Route battles hurt 1 less. Bosses hurt 1 more." Kinds that share a
 * value share a sentence; 0 says they hurt as written (only in a change). */
function hurtSentences(
  hurt: OmenEffect["hurt"],
  words: OmenWords,
  only?: Set<Encounter>,
) {
  const byValue = new Map<number, string[]>();
  for (const kind of Object.keys(words.kinds) as Encounter[]) {
    const n = hurt?.[kind] ?? 0;
    if (only ? !only.has(kind) : !n) continue;
    byValue.set(n, [...(byValue.get(n) ?? []), words.kinds[kind]!]);
  }
  return [...byValue].map(([n, kinds]) => {
    const who = cap(join(kinds));
    return n === 0
      ? only
        ? `${who} now hurt as written`
        : ""
      : `${who} hurt ${Math.abs(n)} ${n < 0 ? "less" : "more"}`;
  });
}

const healSentence = (heal = 0) =>
  heal ? `Every heal heals ${heal} more` : "Heals heal as written";
const bagSentence = (words: OmenWords, size = 3) =>
  `${words.bag} holds ${size}`;
const bossSentence = (hits = 0) =>
  hits
    ? `Bosses take ${Math.abs(hits)} ${hits < 0 ? "fewer hits" : `more hit${hits > 1 ? "s" : ""}`}`
    : "Bosses take their usual hits";

/** What an omen does, in sentences: "Max HP 15. Every heal heals 1 more.
 * Starts with a Potion." `base` is the run's HP before the omen. Items are
 * named only with `start` (the first form's are dealt at the start; a later
 * form's arrive once, in `describeChange`). */
export function describeOmen(
  effect: OmenEffect,
  words: OmenWords,
  base: number,
  start = true,
) {
  const out: string[] = [];
  // A later form always says its HP, so its power never reads empty.
  if (effect.hearts || !start)
    out.push(`${words.max} ${base + (effect.hearts ?? 0)}`);
  if (effect.heal) out.push(healSentence(effect.heal));
  out.push(...hurtSentences(effect.hurt, words));
  if (effect.bossHits) out.push(bossSentence(effect.bossHits));
  if ((effect.satchel ?? 3) !== 3) out.push(bagSentence(words, effect.satchel));
  if (start && effect.loot?.length)
    out.push(`Starts with ${itemList(effect.loot, words)}`);
  return out
    .filter(Boolean)
    .map((s) => `${s}.`)
    .join(" ");
}

/** What an evolution changed: "Max HP 15 → 17. Gets a Potion." Only what
 * differs is named, so an evolution that changes nothing reads empty. */
export function describeChange(
  before: OmenEffect,
  after: OmenEffect,
  words: OmenWords,
  base: number,
) {
  const out: string[] = [];
  const [h0, h1] = [before.hearts ?? 0, after.hearts ?? 0];
  if (h0 !== h1) out.push(`${words.max} ${base + h0} → ${base + h1}`);
  if ((before.heal ?? 0) !== (after.heal ?? 0))
    out.push(healSentence(after.heal));
  const changed = new Set(
    (Object.keys(words.kinds) as Encounter[]).filter(
      (k) => (before.hurt?.[k] ?? 0) !== (after.hurt?.[k] ?? 0),
    ),
  );
  if (changed.size) out.push(...hurtSentences(after.hurt, words, changed));
  if ((before.bossHits ?? 0) !== (after.bossHits ?? 0))
    out.push(bossSentence(after.bossHits));
  if ((before.satchel ?? 3) !== (after.satchel ?? 3))
    out.push(bagSentence(words, after.satchel));
  if (after.loot?.length) out.push(`Gets ${itemList(after.loot, words)}`);
  return out.map((s) => `${s}.`).join(" ");
}

/** Pokémon League's words for its starters (the League theme's item names;
 * the starter cards write their powers in them too). */
export const leagueOmenWords: OmenWords = {
  max: "Max HP",
  bag: "The bag",
  items: {
    draught: ["Potion", "Potions", "a"],
    shield: ["Protect", "Protects", "a"],
    die: ["X Attack", "X Attacks", "an"],
    smoke: ["Escape Rope", "Escape Ropes", "an"],
    revive: ["Revive", "Revives", "a"],
    candy: ["Rare Candy", "Rare Candies", "a"],
  },
  kinds: {
    monster: "route battles",
    trial: "trainer challenges",
    trap: "hazards",
    relic: "finds",
    elite: "Ace Trainers",
    ambush: "rivals",
    boss: "bosses",
  },
};
