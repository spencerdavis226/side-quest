import type { SessionState } from "./types";
import { ballad, singleBlow, BALLAD_FOOLS } from "./ballad";
import { finaleCard, finaleStage } from "./crawl/stages";
import { runNames } from "./crawl/names";

// The Chronicle (The Quest 2.0 Phase 7, 2026-11-14): The Quest's record
// across runs, kept under its own storage key (`side-quest.chronicle.v1`)
// and never part of a session save; a session never depends on it. Pure:
// `recordRun` folds a session into it (the things seen at any time, the
// counts once, when the run ends), `unlocks` reads what it has earned.

export interface Chronicle {
  version: 1;
  /** Keys of runs already counted (the last 60), so a run counts once. */
  runs: string[];
  played: number;
  won: number;
  heroicWon: number;
  /** Dragons slain, and dragons that won, by card ID. */
  slain: Record<string, number>;
  fellTo: Record<string, number>;
  heroicSlain: Record<string, number>;
  /** Class card IDs won with. */
  classesWon: string[];
  /** Allies met and lost, by name. */
  allies: string[];
  alliesLost: string[];
  /** Card IDs seen: rares, landmarks, echoes; hidden results found. */
  rares: string[];
  landmarks: string[];
  echoes: string[];
  secrets: string[];
  /** Feats earned, by key (`FEATS`). */
  feats: string[];
  /** The "Unlock everything" switch (a table that lost its record). */
  unlockedAll?: true;
  /** The last ten ballads. */
  ballads: { at: string; won: boolean; lines: string[] }[];
}

export const emptyChronicle = (): Chronicle => ({
  version: 1,
  runs: [],
  played: 0,
  won: 0,
  heroicWon: 0,
  slain: {},
  fellTo: {},
  heroicSlain: {},
  classesWon: [],
  allies: [],
  alliesLost: [],
  rares: [],
  landmarks: [],
  echoes: [],
  secrets: [],
  feats: [],
  ballads: [],
});

/** The twelve feats' names and lines, in the Chronicle's order. Counted
 * only; each shows as "?" until done. */
export const FEATS: { key: string; name: string; line: string }[] = [
  { key: "fool", name: "The Fool's Ballad", line: "Win with a joke class." },
  {
    key: "nobody-lost",
    name: "Nobody Left Behind",
    line: "Win with no ally lost.",
  },
  {
    key: "pour-one-out",
    name: "Pour One Out",
    line: "Lose an ally and still win.",
  },
  {
    key: "well-read",
    name: "Well Read",
    line: "Reach the dragon with three lore.",
  },
  { key: "one-blow", name: "One Blow", line: "Slay a dragon on a natural 20." },
  { key: "by-a-thread", name: "By a Thread", line: "Win on one heart." },
  {
    key: "untouched",
    name: "Untouched",
    line: "Win with no curse on you at the end.",
  },
  {
    key: "bradley",
    name: "Well Done, Bradley",
    line: "Sir Bradley falls at the dragon.",
  },
  { key: "long-way", name: "The Long Way", line: "Take a side quest and win." },
  {
    key: "straight-there",
    name: "Straight There",
    line: "Walk past the side quest and win.",
  },
  { key: "full-house", name: "Full House", line: "See every landmark." },
  { key: "collector", name: "Collector", line: "See every rare." },
];

/** How many landmarks and rares there are to see (Full House, Collector). */
export const LANDMARK_COUNT = 27;
export const RARE_COUNT = 24;
/** The rest of the Chronicle's "of n": classes (the joke ones too, the
 * Dragonslayer not), echoes and hidden results. */
export const CLASS_COUNT = 18;
export const ECHO_COUNT = 10;
export const SECRET_COUNT = 8;
/** A hidden result's kind: every region's mimic hides the same one
 * (Chester), so they count once. */
export const secretKind = (id: string) =>
  /^dungeon\.mimic-/.test(id) ? "dungeon.mimic" : id;

/** The unlocks, in the order the Chronicle shows them, with what earns
 * each and what it adds. */
export const UNLOCKS: {
  key: string;
  name: string;
  earn: string;
  adds: string;
}[] = [
  {
    key: "heroic",
    name: "Heroic mode",
    earn: "Slay any dragon.",
    adds: "The road is harder now.",
  },
  {
    key: "dragonslayer",
    name: "The Dragonslayer",
    earn: "Slay three different dragons.",
    adds: "A class that starts with one lore.",
  },
  {
    key: "bartholomew",
    name: "Bartholomew",
    earn: "Slay three different dragons.",
    adds: "A dragon who would rather talk.",
  },
  {
    key: "dragon-king",
    name: "The Dragon King",
    earn: "Slay all nine dragons.",
    adds: "All of them at once.",
  },
  {
    key: "gold-mark",
    name: "A gold mark",
    earn: "Slay the Dragon King.",
    adds: "The Quest's mark, in gold.",
  },
];
/** The nine dragons the Chronicle counts toward the Dragon King. */
export const NINE = [
  "dungeon.last-call-lich",
  "dungeon.two-am-kebab",
  "dungeon.the-morning-after",
  "dungeon.bartender-below",
  "dungeon.surge-pricing",
  "dungeon.house-lights",
  "dungeon.final-tab",
  "dungeon.the-group-chat",
  "dungeon.dragon-tidewrack",
];
export const DRAGON_KING = "dungeon.dragon-king";

/** What the Chronicle has earned. */
export function unlocks(c: Chronicle): Set<string> {
  if (c.unlockedAll) return new Set(UNLOCKS.map((u) => u.key));
  const out = new Set<string>();
  const slain = Object.keys(c.slain).filter((id) => c.slain[id] > 0);
  if (slain.length >= 1) out.add("heroic");
  if (slain.filter((id) => NINE.includes(id)).length >= 3) {
    out.add("dragonslayer");
    out.add("bartholomew");
  }
  if (NINE.every((id) => slain.includes(id))) out.add("dragon-king");
  if (slain.includes(DRAGON_KING)) out.add("gold-mark");
  return out;
}

/** A run's key: its picks and its adventurer, hashed. */
export function runKey(s: SessionState): string {
  const text = `${s.quest?.finale.join(",") ?? ""}|${s.quest?.finale[0] ?? ""}|${s.order.length}`;
  let h = 2166136261;
  for (let i = 0; i < text.length; i++)
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

const add = (list: string[], items: string[]) => {
  const fresh = items.filter((x) => !list.includes(x));
  return fresh.length ? [...list, ...fresh] : list;
};

/** Fold a session into the Chronicle: what the run has seen so far (at
 * any time), and once it ends, its counts, its ballad and its feats. A
 * run already counted is not counted again. Only The Quest is recorded. */
export function recordRun(
  c: Chronicle,
  s: SessionState,
  at: string,
): Chronicle {
  const q = s.quest;
  const party = q?.party;
  if (!q || !party || q.packId !== "dungeon") return c;
  // The cards dealt so far.
  const upTo = s.phase === "complete" ? q.finale.length : q.step + 1;
  const dealt = q.finale
    .slice(0, upTo)
    .map((id) => finaleCard(q, id))
    .filter((card) => !!card);
  // The rare things to collect: not the joke classes (rare adventurers)
  // nor the Chronicle's own dragons.
  const rares = dealt.filter(
    (card) =>
      card.encounter !== "omen" &&
      !card.lairFight &&
      q.stages.some((st) => st.rare?.cards.some((r) => r.id === card.id)),
  );
  const landmarks = dealt.filter((card) =>
    / · (Landmark|Approach)$/.test(card.ribbon ?? ""),
  );
  const echoes = dealt.filter((card) => card.ribbon === "An Echo");
  const allies = (party.team ?? [])
    .map((id) => finaleCard(q, id)?.ally?.name)
    .filter((n): n is string => !!n);
  const lost = party.fainted
    ? finaleCard(q, party.fainted)?.ally?.name
    : undefined;
  let next: Chronicle = {
    ...c,
    rares: add(
      c.rares,
      rares.map((r) => r.id),
    ),
    landmarks: add(
      c.landmarks,
      landmarks.map((r) => r.id),
    ),
    echoes: add(
      c.echoes,
      echoes.map((r) => r.id),
    ),
    secrets: add(c.secrets, (party.found ?? []).map(secretKind)),
    allies: add(c.allies, [...allies, ...(lost ? [lost] : [])]),
    alliesLost: add(c.alliesLost, lost ? [lost] : []),
  };
  const key = runKey(s);
  if (s.phase !== "complete" || c.runs.includes(key)) {
    // Nothing new seen: the same Chronicle, so the caller can skip a write.
    const seen = [
      "rares",
      "landmarks",
      "echoes",
      "secrets",
      "allies",
      "alliesLost",
    ] as const;
    return seen.every((k) => next[k] === c[k]) ? c : next;
  }
  // The run ends: count it once.
  const won = !party.wiped;
  const { id: dragon } = runNames(q);
  const atDragon =
    !!dragon &&
    finaleStage(q, Math.min(q.step, q.finale.length - 1)).label ===
      "The Dragon's Lair";
  const heroic = !!s.config.heroic;
  const bump = (m: Record<string, number>, id: string) => ({
    ...m,
    [id]: (m[id] ?? 0) + 1,
  });
  next = {
    ...next,
    runs: [...c.runs, key].slice(-60),
    played: c.played + 1,
    won: c.won + (won ? 1 : 0),
    heroicWon: c.heroicWon + (won && heroic ? 1 : 0),
    slain: won && dragon ? bump(c.slain, dragon) : c.slain,
    heroicSlain:
      won && heroic && dragon ? bump(c.heroicSlain, dragon) : c.heroicSlain,
    fellTo: !won && atDragon && dragon ? bump(c.fellTo, dragon) : c.fellTo,
    classesWon:
      won && party.omen ? add(c.classesWon, [party.omen]) : c.classesWon,
    ballads: [...c.ballads, { at, won, lines: ballad(s) }].slice(-10),
  };
  // The feats this run earned.
  const deeds = party.deeds ?? [];
  const earned: string[] = [];
  if (won && BALLAD_FOOLS.includes(party.omen ?? "")) earned.push("fool");
  if (won && !deeds.includes("ally-fell")) earned.push("nobody-lost");
  if (won && deeds.includes("ally-fell")) earned.push("pour-one-out");
  if (atDragon && party.lore === 3) earned.push("well-read");
  if (singleBlow(s)) earned.push("one-blow");
  if (won && party.hearts === 1) earned.push("by-a-thread");
  if (won && !party.jinx) earned.push("untouched");
  if (atDragon && party.fainted === "dungeon.closing-bradley-begs")
    earned.push("bradley");
  if (won && deeds.includes("quest-taken")) earned.push("long-way");
  if (won && deeds.includes("quest-walked")) earned.push("straight-there");
  if (next.landmarks.length >= LANDMARK_COUNT) earned.push("full-house");
  if (next.rares.length >= RARE_COUNT) earned.push("collector");
  return { ...next, feats: add(c.feats, earned) };
}

/** What a run just added to the Chronicle, for the end screen: new
 * unlocks, new feats, dragons slain for the first time. */
export function chronicleNews(before: Chronicle, after: Chronicle) {
  const was = unlocks(before);
  const unlocked = UNLOCKS.filter(
    (u) => unlocks(after).has(u.key) && !was.has(u.key),
  );
  const feats = FEATS.filter(
    (f) => after.feats.includes(f.key) && !before.feats.includes(f.key),
  );
  const firsts = Object.keys(after.slain).filter(
    (id) => after.slain[id] > 0 && !before.slain[id],
  );
  return { unlocked, feats, firsts };
}

export type ChronicleNews = ReturnType<typeof chronicleNews>;

/** A stored Chronicle, checked: anything malformed is no Chronicle. */
export function readChronicle(raw: unknown): Chronicle | null {
  const c = raw as Chronicle;
  const list = (x: unknown) =>
    Array.isArray(x) && x.every((v) => typeof v === "string");
  const counts = (x: unknown) =>
    !!x &&
    typeof x === "object" &&
    !Array.isArray(x) &&
    Object.values(x).every(
      (v) => Number.isSafeInteger(v) && (v as number) >= 0,
    );
  const whole = (n: unknown) => Number.isSafeInteger(n) && (n as number) >= 0;
  if (
    !c ||
    c.version !== 1 ||
    !list(c.runs) ||
    !whole(c.played) ||
    !whole(c.won) ||
    !whole(c.heroicWon) ||
    !counts(c.slain) ||
    !counts(c.fellTo) ||
    !counts(c.heroicSlain) ||
    ![
      c.classesWon,
      c.allies,
      c.alliesLost,
      c.rares,
      c.landmarks,
      c.echoes,
      c.secrets,
      c.feats,
    ].every(list) ||
    (c.unlockedAll !== undefined && c.unlockedAll !== true) ||
    !Array.isArray(c.ballads) ||
    c.ballads.some(
      (b) =>
        !b ||
        typeof b.at !== "string" ||
        typeof b.won !== "boolean" ||
        !list(b.lines),
    )
  )
    return null;
  return c;
}
