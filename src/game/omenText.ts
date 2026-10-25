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
  /** The same kinds before "rolls": "route battle", "Ace Trainer". */
  rollKinds: Partial<Record<Encounter, string>>;
  /** Write hearts and the satchel as changes ("+2 max hearts", "+1
   * satchel slot") rather than totals: Pub Crawl stacks boons on the
   * adventurer, so a total on one card would be wrong once another
   * lands. `max` and `bag` are then the plural nouns, with these
   * singulars. */
  relative?: { maxOne: string; slot: [one: string, many: string] };
  /** Where a restock comes: "at every gym". */
  restockAt?: string;
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

const signed = (n: number) => `${n < 0 ? "−" : "+"}${Math.abs(n)}`;
/** "+1 to every battle d20. +2 to route battle d20s." Bonuses apply only
 * to single-d20 battles (`rollDice`), so the words say d20. */
function rollSentences(roll: OmenEffect["roll"], words: OmenWords) {
  const out: string[] = [];
  if (roll?.all) out.push(`${signed(roll.all)} to every battle d20`);
  const byValue = new Map<number, string[]>();
  for (const kind of Object.keys(words.rollKinds) as Encounter[]) {
    const n = roll?.[kind] ?? 0;
    if (n) byValue.set(n, [...(byValue.get(n) ?? []), words.rollKinds[kind]!]);
  }
  for (const [n, kinds] of byValue)
    out.push(`${signed(n)} to ${join(kinds)} d20s`);
  return out;
}
const critSentence = (crit = 20) =>
  crit >= 20
    ? "Natural 20s on a 20 only"
    : crit === 19
      ? "Natural 20 on a 19 or 20"
      : `Natural 20 on ${crit} to 20`;
const fumbleSentence = (fumble = 1) =>
  fumble <= 1
    ? "Natural 1s on a 1 only"
    : fumble === 2
      ? "Natural 1 on a 1 or 2"
      : `Natural 1 on 1 to ${fumble}`;
const restockSentence = (item: Loot, words: OmenWords) =>
  `A fresh ${words.items[item][0]} ${words.restockAt ?? "at every gym"}`;
/** "+2 max hearts", "−1 max heart". */
const heartsBy = (n: number, words: OmenWords) =>
  `${signed(n)} ${Math.abs(n) === 1 ? words.relative!.maxOne : words.max}`;
/** "+1 satchel slot". */
const slotsBy = (n: number, words: OmenWords) =>
  `${signed(n)} ${words.relative!.slot[Math.abs(n) === 1 ? 0 : 1]}`;
const sameRoll = (a: OmenEffect["roll"], b: OmenEffect["roll"]) =>
  JSON.stringify(
    Object.entries(a ?? {})
      .filter(([, n]) => n)
      .sort(),
  ) ===
  JSON.stringify(
    Object.entries(b ?? {})
      .filter(([, n]) => n)
      .sort(),
  );

const healSentence = (heal = 0) =>
  heal > 0
    ? `Every heal heals ${heal} more`
    : heal < 0
      ? `Every heal heals ${-heal} less`
      : "Heals heal as written";
const bagSentence = (words: OmenWords, size = 3) =>
  `${words.bag} holds ${size}`;
const bossSentence = (hits = 0) =>
  hits
    ? hits < 0
      ? `Bosses take ${-hits} fewer hit${hits < -1 ? "s" : ""}, never under 1`
      : `Bosses take ${hits} more hit${hits > 1 ? "s" : ""}`
    : "Bosses take their usual hits";

/** What an omen does, in sentences: "Max HP 15. Every heal heals 1 more.
 * Starts with a Potion." `base` is the run's HP before the omen. Items are
 * named only with `start` (the first form's are dealt at the start; a later
 * form's arrive once, in `describeChange`), led by `itemsLead` ("Comes
 * with" for a boon found mid-run). */
export function describeOmen(
  effect: OmenEffect,
  words: OmenWords,
  base: number,
  start = true,
  itemsLead = "Starts with",
) {
  const out: string[] = [];
  // A later form always says its HP, so its power never reads empty.
  if (words.relative) {
    if (effect.hearts) out.push(heartsBy(effect.hearts, words));
  } else if (effect.hearts || !start)
    out.push(`${words.max} ${base + (effect.hearts ?? 0)}`);
  out.push(...rollSentences(effect.roll, words));
  if ((effect.crit ?? 20) < 20) out.push(critSentence(effect.crit));
  if ((effect.fumble ?? 1) > 1) out.push(fumbleSentence(effect.fumble));
  if (effect.reroll20) out.push("Every 20 is rerolled");
  if (effect.heal) out.push(healSentence(effect.heal));
  out.push(...hurtSentences(effect.hurt, words));
  if (effect.restock) out.push(restockSentence(effect.restock, words));
  if (effect.bossHits) out.push(bossSentence(effect.bossHits));
  if ((effect.satchel ?? 3) !== 3)
    out.push(
      words.relative
        ? slotsBy((effect.satchel ?? 3) - 3, words)
        : bagSentence(words, effect.satchel),
    );
  if (start && effect.loot?.length)
    out.push(`${itemsLead} ${itemList(effect.loot, words)}`);
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
  if (h0 !== h1)
    out.push(
      words.relative
        ? heartsBy(h1 - h0, words)
        : `${words.max} ${base + h0} → ${base + h1}`,
    );
  if (!sameRoll(before.roll, after.roll)) {
    const roll = rollSentences(after.roll, words);
    out.push(...(roll.length ? roll : ["No roll bonus"]));
  }
  if ((before.crit ?? 20) !== (after.crit ?? 20))
    out.push(critSentence(after.crit));
  if ((before.fumble ?? 1) !== (after.fumble ?? 1))
    out.push(fumbleSentence(after.fumble));
  if (!!before.reroll20 !== !!after.reroll20)
    out.push(after.reroll20 ? "Every 20 is rerolled" : "A 20 stands again");
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
    out.push(
      words.relative
        ? slotsBy((after.satchel ?? 3) - (before.satchel ?? 3), words)
        : bagSentence(words, after.satchel),
    );
  if (before.restock !== after.restock && after.restock)
    out.push(restockSentence(after.restock, words));
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
    round: ["Baton Pass", "Baton Passes", "a"],
    tera: ["Tera Orb", "Tera Orbs", "a"],
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
  rollKinds: {
    monster: "route battle",
    trap: "hazard",
    relic: "find",
    elite: "Ace Trainer",
    ambush: "rival",
    boss: "boss",
  },
};

/** Pub Crawl's words for its adventurers, tonight's omens and trinkets
 * (the dungeon theme's item names). Hearts and the satchel are written as
 * changes, since boons stack. */
export const dungeonOmenWords: OmenWords = {
  max: "max hearts",
  bag: "The satchel",
  relative: { maxOne: "max heart", slot: ["satchel slot", "satchel slots"] },
  items: {
    draught: ["Healing Draught", "Healing Draughts", "a"],
    shield: ["Coaster Shield", "Coaster Shields", "a"],
    die: ["Loaded Die", "Loaded Dice", "a"],
    smoke: ["Smoke Bomb", "Smoke Bombs", "a"],
    revive: ["Second Wind", "Second Winds", "a"],
    candy: ["Dog-Eared Tome", "Dog-Eared Tomes", "a"],
    round: ["Bar Tab", "Bar Tabs", "a"],
    tera: ["Prism Shard", "Prism Shards", "a"],
  },
  kinds: {
    monster: "monsters",
    trial: "trials",
    trap: "traps",
    relic: "relics",
    elite: "elites",
    ambush: "ambushes",
    boss: "bosses",
  },
  rollKinds: {
    monster: "monster",
    trap: "trap",
    relic: "relic",
    elite: "elite",
    ambush: "ambush",
    boss: "boss",
  },
  restockAt: "whenever a boss falls",
};
