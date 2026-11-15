import type { SessionState } from "./types";
import { ballad, singleBlow, BALLAD_FOOLS } from "./ballad";
import { finaleCard, finaleStage } from "./crawl/stages";
import { runNames } from "./crawl/names";
import { omenForm } from "./crawl/party";
import { teamMember } from "./crawl/team";
import { rivalProfile } from "./crawl/rival";

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
  /** The Pokémon League's record (2026-11-14), optional so a Chronicle
   * kept before it still loads. A malformed one is dropped alone. */
  league?: LeagueRecord;
  /** Rivals Phase 6: each rival's record across runs, by key, and the one
   * who got the better of the table last run (twice as likely next time).
   * Optional; a malformed one is dropped alone. */
  rivals?: Record<string, RivalRecord>;
  nemesis?: string;
}

/** A rival's record across runs (Rivals Phase 6): runs met, duels won
 * against them, meetings lost to them, runs they joined, betrayals, and
 * dragons they "slew". */
export interface RivalRecord {
  met: number;
  beaten: number;
  lostTo: number;
  joined: number;
  betrayed: number;
  slainBy: number;
}

/** The Pokémon League's record across runs. Names, not card IDs, so the
 * Chronicle shows it without loading the pack. */
export interface LeagueRecord {
  /** Keys of runs already counted (the last 60). */
  runs: string[];
  played: number;
  won: number;
  /** The most badges any run earned. */
  bestBadges: number;
  /** Starters that reached the Hall of Fame, by the starter card's name. */
  starters: string[];
  /** Champions beaten, and what whited the team out, by name. */
  champions: Record<string, number>;
  fellTo: Record<string, number>;
  /** Pokémon caught for the team, by name, in the order first caught. */
  caught: string[];
  /** The last ten Hall of Fame entries. */
  halls: { at: string; starter: string; team: string[]; champion: string }[];
}

export const emptyLeague = (): LeagueRecord => ({
  runs: [],
  played: 0,
  won: 0,
  bestBadges: 0,
  starters: [],
  champions: {},
  fellTo: {},
  caught: [],
  halls: [],
});

/** How many starters and Champions the League deals (a unit test holds
 * these to the content). */
export const STARTER_COUNT = 35;
export const CHAMPION_COUNT = 13;

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
    name: "Nice One, Chad",
    line: "Sir Chad falls at the dragon.",
  },
  { key: "long-way", name: "The Long Way", line: "Take a side quest and win." },
  {
    key: "straight-there",
    name: "Straight There",
    line: "Walk past the side quest and win.",
  },
  { key: "full-house", name: "Full House", line: "See every landmark." },
  { key: "collector", name: "Collector", line: "See every rare." },
  // Rivals Phase 6.
  {
    key: "paid-in-full",
    name: "Paid in Full",
    line: "Beat your rival's duel holding nothing of yours.",
  },
  { key: "et-tu", name: "Et Tu", line: "Be betrayed." },
  {
    key: "just-watching",
    name: "Just Watching",
    line: "Win with a useless Chuck on the team.",
  },
  {
    key: "allegedly",
    name: "Allegedly",
    line: "Win with Sir Chad on the team.",
  },
  { key: "audited", name: "Audited", line: "Settle Gary's debt in drinks." },
  {
    key: "bad-reviews",
    name: "Bad Reviews",
    line: "Lose to Dame Queefington's vicious ballad.",
  },
];

/** How many landmarks and rares there are to see (Full House, Collector). */
export const LANDMARK_COUNT = 27;
export const RARE_COUNT = 22;
/** The rest of the Chronicle's "of n": classes (the joke ones too, the
 * Dragonslayer not), echoes and hidden results. */
export const CLASS_COUNT = 18;
export const ECHO_COUNT = 11;
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

/** What a new run of The Quest remembers of the rivals (Rivals Phase 6):
 * the nemesis, and every rival met before (`createSession`'s `rivals`). */
export const rivalMemory = (c: Chronicle) => ({
  ...(c.nemesis ? { nemesis: c.nemesis } : {}),
  met: Object.keys(c.rivals ?? {}).filter((who) => c.rivals![who].met > 0),
});

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
 * run already counted is not counted again. The Quest and the Pokémon
 * League (its own record, `league`) are recorded. */
export function recordRun(
  c: Chronicle,
  s: SessionState,
  at: string,
): Chronicle {
  const q = s.quest;
  const party = q?.party;
  if (q?.packId === "pokemon" && party) {
    const before = c.league ?? emptyLeague();
    const league = recordLeague(before, s, at);
    return league === before ? c : { ...c, league };
  }
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
  if (
    atDragon &&
    (party.fainted === "dungeon.closing-bradley-begs" ||
      party.fainted === "dungeon.rival-bradley-door")
  )
    earned.push("bradley");
  if (won && deeds.includes("quest-taken")) earned.push("long-way");
  if (won && deeds.includes("quest-walked")) earned.push("straight-there");
  if (next.landmarks.length >= LANDMARK_COUNT) earned.push("full-house");
  if (next.rares.length >= RARE_COUNT) earned.push("collector");
  // Rivals Phase 6: the run's rival, their record and the feats.
  const rival = party.rival;
  if (rival) {
    const has = (d: string) => deeds.includes(d);
    const joined = has("rival-joined") && !has("rival-turned");
    const onTeam = (party.team ?? []).some(
      (id) => finaleCard(q, id)?.rival?.who === rival.who,
    );
    const credit = won && joined && onTeam && !!rivalProfile(q)?.profile.credit;
    const was = c.rivals?.[rival.who] ?? {
      met: 0,
      beaten: 0,
      lostTo: 0,
      joined: 0,
      betrayed: 0,
      slainBy: 0,
    };
    next = {
      ...next,
      rivals: {
        ...c.rivals,
        [rival.who]: {
          met: was.met + 1,
          beaten: was.beaten + (has("rival-beaten") ? 1 : 0),
          lostTo: was.lostTo + rival.lost,
          joined: was.joined + (has("rival-joined") ? 1 : 0),
          betrayed: was.betrayed + (has("rival-turned") ? 1 : 0),
          slainBy: was.slainBy + (credit ? 1 : 0),
        },
      },
    };
    // They got the better of the table: still holding its things, turned
    // on it, or went into the lair first.
    const nemesis =
      rival.took.length > 0 || has("rival-turned") || has("rival-went-first");
    if (nemesis) next.nemesis = rival.who;
    else delete next.nemesis;
    if (has("rival-beaten") && has("rival-clean")) earned.push("paid-in-full");
    if (has("rival-turned")) earned.push("et-tu");
    if (won && onTeam && rival.who === "chuck" && rival.joinFace === 1)
      earned.push("just-watching");
    if (credit) earned.push("allegedly");
    if (has("rival-settled") && rival.who === "gary") earned.push("audited");
    if (
      !won &&
      !!rivalProfile(q)?.profile.ballad &&
      !joined &&
      !has("rival-beaten")
    )
      earned.push("bad-reviews");
  }
  return { ...next, feats: add(c.feats, earned) };
}

/** Fold a League session into its record: the Pokémon caught at any
 * time, and once the run ends, its counts and (a win) its Hall of Fame. */
export function recordLeague(
  r: LeagueRecord,
  s: SessionState,
  at: string,
): LeagueRecord {
  const q = s.quest;
  const party = q?.party;
  if (!q || !party) return r;
  const names = (party.team ?? [])
    .map((id) => teamMember(q, id)?.title)
    .filter((n): n is string => !!n);
  const caught = add(r.caught, names);
  const key = runKey(s);
  if (s.phase !== "complete" || r.runs.includes(key))
    return caught === r.caught ? r : { ...r, caught };
  const won = !party.wiped;
  const step = Math.min(q.step, q.finale.length - 1);
  const last = finaleCard(q, q.finale[step]);
  // Badges: the leaders (quest-tagged) put aside before the run ended.
  const beaten = won ? q.finale.length : step;
  const badges = q.finale
    .slice(0, beaten)
    .filter((id) => finaleCard(q, id)?.quest === q.packId).length;
  const bump = (m: Record<string, number>, name: string) => ({
    ...m,
    [name]: (m[name] ?? 0) + 1,
  });
  // The starter: the omen put aside, else the run's first card if it is one.
  const first = finaleCard(q, q.finale[0]);
  const starter = party.omen
    ? finaleCard(q, party.omen)?.title
    : first?.encounter === "omen"
      ? first.title
      : undefined;
  return {
    ...r,
    caught,
    runs: [...r.runs, key].slice(-60),
    played: r.played + 1,
    won: r.won + (won ? 1 : 0),
    bestBadges: Math.max(r.bestBadges, badges),
    starters: won && starter ? add(r.starters, [starter]) : r.starters,
    champions: won && last ? bump(r.champions, last.title) : r.champions,
    fellTo: !won && last ? bump(r.fellTo, last.title) : r.fellTo,
    halls:
      won && last
        ? [
            ...r.halls,
            {
              at,
              starter: omenForm(q)?.title ?? starter ?? "",
              team: names,
              champion: last.title,
            },
          ].slice(-10)
        : r.halls,
  };
}

/** A stored League record, checked: anything malformed is none. */
function readLeague(raw: unknown): LeagueRecord | null {
  const r = raw as LeagueRecord;
  const list = (x: unknown) =>
    Array.isArray(x) && x.every((v) => typeof v === "string");
  const whole = (n: unknown) => Number.isSafeInteger(n) && (n as number) >= 0;
  const counts = (x: unknown) =>
    !!x &&
    typeof x === "object" &&
    !Array.isArray(x) &&
    Object.values(x).every(whole);
  if (
    !r ||
    typeof r !== "object" ||
    ![r.runs, r.starters, r.caught].every(list) ||
    ![r.played, r.won, r.bestBadges].every(whole) ||
    !counts(r.champions) ||
    !counts(r.fellTo) ||
    !Array.isArray(r.halls) ||
    r.halls.some(
      (h) =>
        !h ||
        typeof h.at !== "string" ||
        typeof h.starter !== "string" ||
        typeof h.champion !== "string" ||
        !list(h.team),
    )
  )
    return null;
  return r;
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
  // Rivals Phase 6: a malformed rival record or nemesis is dropped alone.
  let out: Chronicle = c;
  if (c.rivals !== undefined && !readRivals(c.rivals)) {
    const { rivals: _bad, ...rest } = out;
    out = rest;
  }
  if (
    c.nemesis !== undefined &&
    (typeof c.nemesis !== "string" || !/^[a-z]{2,12}$/.test(c.nemesis))
  ) {
    const { nemesis: _bad, ...rest } = out;
    out = rest;
  }
  if (out.league === undefined) return out;
  const league = readLeague(out.league);
  if (league) return out;
  const { league: _bad, ...rest } = out;
  return rest;
}
/** A stored rival record, checked (Rivals Phase 6). */
function readRivals(raw: unknown): boolean {
  const whole = (n: unknown) => Number.isSafeInteger(n) && (n as number) >= 0;
  return (
    !!raw &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    Object.entries(raw as Record<string, RivalRecord>).every(
      ([who, r]) =>
        /^[a-z]{2,12}$/.test(who) &&
        !!r &&
        typeof r === "object" &&
        [r.met, r.beaten, r.lostTo, r.joined, r.betrayed, r.slainBy].every(
          whole,
        ),
    )
  );
}
