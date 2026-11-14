import { packs } from "../content/manifest.generated";
import { validateCatalog } from "../content/validate";
import { validateRoll } from "../game/dice";
import {
  currentCard,
  findCard,
  finaleCard,
  teamMember,
  formEffect,
  hitsNeeded,
  omenForm,
  previousCard,
  satchelSize,
  stageCards,
  TEAM_SIZE,
  validConfig,
  emptyChronicle,
  readChronicle,
  type Chronicle,
} from "../game/engine";
import type { GameConfig, PartyState, SessionState } from "../game/types";
import { LOOT } from "../game/types";
import { IS_PREVIEW, KEY_PREFIX } from "./channel";
export const SAVE_KEY = `${KEY_PREFIX}session.v1`;
export const SETTINGS_KEY = `${KEY_PREFIX}settings.v1`;
/** The Chronicle (The Quest 2.0 Phase 7): The Quest's record across runs,
 * never part of a session save. */
export const CHRONICLE_KEY = `${KEY_PREFIX}chronicle.v1`;
/** The last save that failed to load, kept as it was so a later fix can
 * recover the game. Only the latest is kept. */
export const CORRUPT_KEY = `${KEY_PREFIX}session.corrupt.v1`;
/** Keys from before the rename to Side Quest, mapped to their new names.
 * The preview site has none: those saves belong to the live game. */
export const LEGACY_KEYS: Record<string, string> = IS_PREVIEW
  ? {}
  : {
      "drink-at-ron.session.v1": SAVE_KEY,
      "drink-at-ron.settings.v1": SETTINGS_KEY,
    };
type KeyStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;
/** Moves a pre-rename save and settings to the new keys, once. A value
 * already under a new key wins; an old key is removed only after its value
 * is safely copied. Runs before anything reads storage. */
export function migrateStorageKeys(storage?: KeyStore) {
  try {
    const store = storage ?? localStorage;
    for (const [from, to] of Object.entries(LEGACY_KEYS)) {
      const value = store.getItem(from);
      if (value === null) continue;
      if (store.getItem(to) === null) store.setItem(to, value);
      store.removeItem(from);
    }
  } catch {
    // Storage unavailable or full: the old keys stay for the next launch.
  }
}
/** A length, or a pack's quest mode (`config.quest` names the pack). */
export type DeckChoice = "standard" | "infinite" | "quest";
export const MODE_LIMITS: Record<DeckChoice, number | null> = {
  standard: 50,
  infinite: null,
  quest: null,
};
export interface Preferences {
  config: GameConfig;
  choice: DeckChoice;
  /** The pack a quest mode switched on when it was chosen; leaving the mode
   * switches it off again. Absent when the pack was already selected. */
  added?: string;
}
export const defaults: Preferences = {
  config: { version: 1, packIds: ["core"], limit: 50 },
  choice: "standard",
};
/** Leave a quest mode's pack the way the player had it: a pack the mode
 * switched on goes off again, unless that would empty the selection. */
function dropAdded(prefs: Preferences): GameConfig {
  // Heroic (The Quest 2.0 Phase 7) belongs to the quest mode it was set in.
  const { quest: _quest, heroic: _heroic, ...config } = prefs.config;
  const kept = config.packIds.filter((id) => id !== prefs.added);
  return { ...config, packIds: kept.length ? kept : config.packIds };
}
/** Choose a plain length (Standard or Infinite). */
export function chooseLength(
  prefs: Preferences,
  choice: Exclude<DeckChoice, "quest">,
): Preferences {
  return {
    choice,
    config: { ...dropAdded(prefs), limit: MODE_LIMITS[choice] },
  };
}
/** Choose pack `id`'s quest mode: it plays its own pack, plus whatever else
 * is selected, and remembers whether it had to switch that pack on. */
export function chooseQuest(
  prefs: Preferences,
  id: string,
  all: readonly { id: string }[] = packs,
): Preferences {
  const config = dropAdded(prefs);
  const added = !config.packIds.includes(id);
  return {
    choice: "quest",
    config: {
      ...config,
      // A quest has no card limit; the settings loader rejects one with it.
      limit: null,
      quest: id,
      packIds: all
        .filter((p) => p.id === id || config.packIds.includes(p.id))
        .map((p) => p.id),
    },
    ...(added ? { added: id } : {}),
  };
}
/** Packs folded into another since they shipped (2026-10-24: the House sheet
 * and Cabin weekend became part of Core). A selection or a save that names one
 * means the pack that now holds its cards. */
const RETIRED_PACKS: Record<string, string> = { house: "core", cabin: "core" };
const currentPackIds = (ids: readonly string[]) => [
  ...new Set(ids.map((id) => RETIRED_PACKS[id] ?? id)),
];
/** Keep only installed packs; never let a stale selection empty the deck. */
const knownPackIds = (ids: readonly string[]) => {
  const current = currentPackIds(ids);
  const known = packs
    .map((pack) => pack.id)
    .filter((id) => current.includes(id));
  return known.length ? known : [packs[0].id];
};
function validateQuest(s: SessionState) {
  const q = s.quest;
  const whole = (n: unknown, min: number): n is number =>
    Number.isSafeInteger(n) && (n as number) >= min;
  if ((q === undefined) !== (s.config.quest === undefined))
    throw Error("Invalid quest");
  if (!q) return;
  if (!Array.isArray(q.stages) || !q.stages.length || !Array.isArray(q.finale))
    throw Error("Invalid quest");
  // Stages a road choice or a Walk on removed (The Quest 2.0 Phase 5),
  // kept for a replay: each a stage, its cards checked like the run's.
  if (
    q.dropped !== undefined &&
    (!q.party ||
      !Array.isArray(q.dropped) ||
      q.dropped.some(
        (st) =>
          !st ||
          typeof st.label !== "string" ||
          !whole(st.pick, 1) ||
          !Array.isArray(st.cards) ||
          st.pick > st.cards.length + (st.inserts?.length ?? 0),
      ))
  )
    throw Error("Invalid quest");
  const pool = [...q.stages, ...(q.dropped ?? [])].flatMap(stageCards);
  validateCatalog(pool, []);
  // The finale is each stage's picks, in stage order, with no repeats; a
  // crawl floor's fork may have swapped one of its later rooms for an elite.
  let at = 0;
  for (const stage of q.stages) {
    const picks = q.finale.slice(at, at + stage.pick);
    const elite = stage.elite;
    // A landmark (The Quest 2.0 Phase 3, 2026-11-14): a card from an
    // insert's pool at that insert's place.
    const inserts = stage.inserts;
    const badInserts =
      inserts !== undefined &&
      (!q.party ||
        !Array.isArray(inserts) ||
        !inserts.length ||
        inserts.length >= stage.pick ||
        new Set(inserts.map((i) => i?.at)).size !== inserts.length ||
        inserts.some(
          (i) =>
            !i ||
            !whole(i.at, 0) ||
            i.at >= stage.pick ||
            !Array.isArray(i.cards) ||
            !i.cards.length,
        ));
    if (
      typeof stage.label !== "string" ||
      !stage.label.trim() ||
      !whole(stage.pick, 1) ||
      // A road's tag and the stage's place (Phase 5).
      (stage.route !== undefined && stage.route !== 0 && stage.route !== 1) ||
      (stage.at !== undefined && !whole(stage.at, 0)) ||
      badInserts ||
      stage.pick - (inserts?.length ?? 0) > stage.cards.length ||
      picks.length !== stage.pick ||
      (elite !== undefined &&
        (!q.party || !Array.isArray(elite) || !elite.length)) ||
      picks.some(
        (id, i) =>
          !stage.cards.some((c) => c.id === id) &&
          !(i > 0 && elite?.some((c) => c.id === id)) &&
          !inserts?.some(
            (ins) => ins.at === i && ins.cards.some((c) => c.id === id),
          ) &&
          // The Quest 2.0 Phase 6: a rare, or the variant reached.
          !stage.rare?.cards?.some((c) => c.id === id) &&
          !(
            i === 0 &&
            stage.variants?.some((v) => v.cards?.some((c) => c.id === id))
          ),
      ) ||
      // At most one rare a stage, and a variant's extra need is small.
      picks.filter((id) => stage.rare?.cards?.some((c) => c.id === id)).length >
        1 ||
      (stage.harder !== undefined &&
        (!whole(stage.harder, 1) || stage.harder > 3))
    )
      throw Error("Invalid quest");
    at += stage.pick;
  }
  if (
    at !== q.finale.length ||
    new Set(q.finale).size !== q.finale.length ||
    q.packId !== s.config.quest ||
    typeof q.label !== "string" ||
    !q.label.trim() ||
    !whole(q.goal, q.party ? 0 : 1) ||
    (q.party && q.goal !== 0) ||
    !whole(q.length, q.goal + 1) ||
    !whole(q.count, 0) ||
    q.count > q.goal ||
    q.due !== (q.count === q.goal) ||
    !whole(q.step, 0) ||
    (q.lost !== undefined && !whole(q.lost, 0)) ||
    q.step >= q.finale.length ||
    // Heroic (The Quest 2.0 Phase 7) only with its config.
    (q.heroic !== undefined && (q.heroic !== true || !s.config.heroic)) ||
    (!q.due && q.step !== 0) ||
    // A crawl's rooms are also its pack's deck cards, never dealt in a crawl.
    (!q.party && pool.some((c) => s.cards.some((d) => d.id === c.id)))
  )
    throw Error("Invalid quest");
  validateParty(s, q.party);
}
function validateParty(s: SessionState, p: PartyState | undefined) {
  if (p === undefined) return;
  const whole = (n: unknown, min: number): n is number =>
    Number.isSafeInteger(n) && (n as number) >= min;
  const dealt = s.quest!.finale.slice(0, s.quest!.step + 1);
  if (
    !p ||
    !whole(p.max, 1) ||
    !whole(p.hearts, 0) ||
    p.hearts > p.max ||
    !Array.isArray(p.loot) ||
    p.loot.length > satchelSize(s.quest) ||
    p.loot.some((item) => !LOOT.includes(item)) ||
    !whole(p.hits, 0) ||
    !whole(p.rounds, 0) ||
    typeof p.wiped !== "boolean" ||
    p.wiped !== (p.hearts === 0) ||
    (p.wiped && s.phase !== "complete") ||
    // Tonight's omen is a card already dealt.
    (p.omen !== undefined &&
      (typeof p.omen !== "string" ||
        !dealt.includes(p.omen) ||
        !formEffect(s.quest))) ||
    // Boons and the jinx come from cards already dealt that carry them.
    (p.boons !== undefined &&
      (!Array.isArray(p.boons) ||
        new Set(p.boons).size !== p.boons.length ||
        p.boons.some((key) => {
          if (typeof key !== "string") return true;
          // A spoil is kept as "<card id>#<index>".
          const [id, pick, extra] = key.split("#");
          const card = dealt.includes(id) ? finaleCard(s.quest!, id) : null;
          return (
            !card ||
            extra !== undefined ||
            (pick === undefined
              ? !card.boon
              : pick === "k"
                ? !card.kit
                : // A plaque's gear (The Quest 2.0 Phase 3).
                  /^o\d$/.test(pick)
                  ? !card.offers?.[Number(pick.slice(1))]?.boon
                  : !/^\d$/.test(pick) || !card.spoils?.[Number(pick)])
          );
        }) ||
        new Set(p.boons.map((k) => k.split("#")[0])).size !==
          p.boons.length)) ||
    (p.jinx !== undefined &&
      (typeof p.jinx !== "string" ||
        !dealt.includes(p.jinx) ||
        !finaleCard(s.quest!, p.jinx)?.jinx)) ||
    (p.press !== undefined &&
      (!whole(p.press, 1) ||
        s.phase !== "revealed" ||
        p.press >= (currentCard(s).press?.prizes.length ?? 0))) ||
    // The League's team (2026-10-25): caught cards already dealt, each a
    // typed Pokémon, at most two.
    (p.team !== undefined &&
      (!Array.isArray(p.team) ||
        p.team.length > TEAM_SIZE ||
        new Set(p.team).size !== p.team.length ||
        p.team.some(
          (id) =>
            typeof id !== "string" ||
            !dealt.includes(id) ||
            // A typed Pokémon, or an ally (The Quest 2.0 Phase 4).
            (!teamMember(s.quest!, id)?.type &&
              !teamMember(s.quest!, id)?.ally),
        ))) ||
    // Dragon lore (The Quest 2.0 Phase 4): one to three.
    (p.lore !== undefined && (!whole(p.lore, 1) || p.lore > 3)) ||
    // Deeds (Phase 6): short names, each once; found: cards already dealt.
    (p.deeds !== undefined &&
      (!Array.isArray(p.deeds) ||
        new Set(p.deeds).size !== p.deeds.length ||
        p.deeds.some(
          (d) => typeof d !== "string" || !/^[a-z-]{2,24}$/.test(d),
        ))) ||
    (p.found !== undefined &&
      (!Array.isArray(p.found) ||
        new Set(p.found).size !== p.found.length ||
        p.found.some((id) => typeof id !== "string" || !dealt.includes(id)))) ||
    // The ball thrown at the Pokémon face up (2026-10-27), kept until its
    // card is put aside.
    (p.throw !== undefined &&
      (s.phase !== "revealed" ||
        !p.throw ||
        p.throw.id !== currentCard(s).id ||
        !currentCard(s).catchRate ||
        !whole(p.throw.face, 1) ||
        p.throw.face > 20 ||
        // A Master Ball (2026-11-01) always lands a 20.
        (p.throw.master !== undefined &&
          (p.throw.master !== true || p.throw.face !== 20)) ||
        // A Great or Ultra Ball (2026-11-01), never with a Master Ball.
        (p.throw.ball !== undefined &&
          ((p.throw.ball !== "great" && p.throw.ball !== "ultra") ||
            p.throw.master !== undefined)))) ||
    // The caught Pokémon sent into the d20 battle face up (2026-10-31): one
    // on the team.
    (p.assist !== undefined &&
      (typeof p.assist !== "string" ||
        s.phase !== "revealed" ||
        !p.team?.includes(p.assist) ||
        !currentCard(s).dice ||
        !currentCard(s).battle)) ||
    // The caught Pokémon that fainted on the card just put aside: dealt,
    // typed, and off the team.
    (p.fainted !== undefined &&
      (typeof p.fainted !== "string" ||
        !dealt.includes(p.fainted) ||
        !!p.team?.includes(p.fainted) ||
        (!teamMember(s.quest!, p.fainted)?.type &&
          !teamMember(s.quest!, p.fainted)?.ally))) ||
    // The beat of the phased boss put aside last.
    (p.beat !== undefined &&
      (!whole(p.beat, 1) ||
        p.beat > (findCard(s, s.previousId)?.phases?.length ?? 0))) ||
    (p.passed !== undefined &&
      (!whole(p.passed, 0) || p.passed > s.discarded)) ||
    // The dragon battle (The Quest 2.0, 2026-11-13): only while a lair
    // fight is the card in play; a move from its six, or the contest.
    (p.duel !== undefined && badDuel(s, p.duel)) ||
    // The starter's form: a later form it has, once the omen is set.
    (p.form !== undefined &&
      (!whole(p.form, 1) ||
        p.omen === undefined ||
        p.form > (omenForm(s.quest)?.forms ?? 0)))
  )
    throw Error("Invalid party");
}
/** Whether a saved dragon battle is malformed or out of place. */
function badDuel(s: SessionState, duel: NonNullable<PartyState["duel"]>) {
  const q = s.quest!;
  // A finished battle keeps its last round (`prev`) on the card put aside.
  const card =
    s.phase === "complete"
      ? finaleCard(q, s.previousId ?? "")
      : q.due
        ? finaleCard(q, q.finale[q.step])
        : undefined;
  const moves = (n: unknown) =>
    Number.isSafeInteger(n) && (n as number) >= 0 && (n as number) < 6;
  const round = (r: unknown) => {
    if (r === "contest") return true;
    const m = r as { move?: unknown; enraged?: unknown } | null;
    return (
      !!m &&
      typeof m === "object" &&
      moves(m.move) &&
      (m.enraged === undefined || m.enraged === true)
    );
  };
  return (
    !duel ||
    typeof duel !== "object" ||
    !card?.lairFight ||
    (s.phase === "complete" && duel.prev === undefined) ||
    !moves(duel.move) ||
    !Number.isSafeInteger(duel.swings) ||
    duel.swings < 0 ||
    (duel.contest !== undefined &&
      (duel.contest !== true || duel.move !== 0 || !!duel.enraged)) ||
    (duel.enraged !== undefined && duel.enraged !== true) ||
    (duel.prev !== undefined && !round(duel.prev))
  );
}
/** Systems cut on 2026-10-31 (owner: "way too much clutter"): signature
 * powers, Pub Crawl's knacks, floor rules, Cup and Quaff, curses, the Tera
 * Orb, the levelling fork and the League's legacy team rests. A save from
 * before keeps playing without them: their party fields go, a Tera Orb is
 * an X Attack (a loaded die), and a forked adventurer keeps the path it is
 * on as its one line (one not yet levelled keeps its first path). Card
 * fields the engine no longer reads (`power`, `knack`, `curse`) stay in the
 * snapshot, ignored. Exported for the save fixtures' tests. */
export function retireSystems(parsed: unknown) {
  const s = parsed as Record<string, unknown> | null;
  const q = s?.quest as Record<string, unknown> | undefined;
  type Obj = Record<string, unknown>;
  const isObj = (v: unknown): v is Obj => !!v && typeof v === "object";
  const tera = (v: unknown) => (v === "tera" ? "die" : v);
  const noTera = (c: Obj) => {
    if (Array.isArray(c.offers))
      for (const o of c.offers) if (isObj(o)) o.loot = tera(o.loot);
    if (isObj(c.reward)) c.reward.loot = tera(c.reward.loot);
    for (const o of [c.omen, ...(Array.isArray(c.evolves) ? c.evolves : [])]) {
      const e = isObj(o) && isObj(o.omen) ? o.omen : o;
      if (!isObj(e)) continue;
      if (Array.isArray(e.loot)) e.loot = e.loot.map(tera);
      if (e.restock !== undefined) e.restock = tera(e.restock);
    }
  };
  if (Array.isArray(s?.cards)) for (const c of s.cards) if (isObj(c)) noTera(c);
  if (!isObj(q)) return;
  const party = isObj(q.party) ? q.party : undefined;
  for (const stage of Array.isArray(q.stages) ? q.stages : []) {
    if (!isObj(stage)) continue;
    delete stage.rule;
    for (const c of [
      ...(Array.isArray(stage.cards) ? stage.cards : []),
      ...(Array.isArray(stage.elite) ? stage.elite : []),
    ]) {
      if (!isObj(c)) continue;
      noTera(c);
      if (c.fork !== true || !Array.isArray(c.evolves)) continue;
      const mine = !!party && party.omen === c.id;
      const form = mine && typeof party.form === "number" ? party.form : 0;
      const path = form ? (form - 1) % 2 : 0;
      c.evolves = [c.evolves[path], c.evolves[path + 2]];
      delete c.fork;
      if (party && mine && form) party.form = form > 2 ? 2 : 1;
    }
  }
  if (!party) return;
  for (const key of [
    "curse",
    "cup",
    "quaff",
    "quaffed",
    "tera",
    "powers",
    "armed",
    "tired",
    "sent",
  ])
    delete party[key];
  if (Array.isArray(party.loot)) party.loot = party.loot.map(tera);
}
export function parseSession(raw: string): SessionState {
  const parsed = JSON.parse(raw);
  // Retain the storage key so existing installs discover and migrate their saves.
  // Legacy snapshots cannot have dice mechanics retroactively attached to them.
  if (parsed?.version === 1 && Array.isArray(parsed.cards)) {
    if (
      parsed.cards.some((c: { dice?: unknown } | null) => c?.dice !== undefined)
    )
      throw Error("Invalid legacy dice save");
    parsed.version = 2;
    parsed.roll = null;
    parsed.previousRoll = null;
  }
  // League saves from before the gauntlet carried one finale card: read it
  // as a one-card stage, so a game in progress survives the update.
  const legacy = parsed?.quest;
  if (
    legacy?.finale &&
    !Array.isArray(legacy.finale) &&
    typeof legacy.finale === "object"
  )
    parsed.quest = {
      ...legacy,
      stages: [{ label: "League", pick: 1, cards: [legacy.finale] }],
      finale: [legacy.finale.id],
      step: 0,
    };
  retireSystems(parsed);
  const s = parsed as SessionState;
  if (
    !s ||
    s.version !== 2 ||
    !validConfig(s.config) ||
    !s.config.packIds.length ||
    !Array.isArray(s.cards) ||
    !s.cards.length
  )
    throw Error("Invalid save");
  s.config.packIds = currentPackIds(s.config.packIds);
  validateCatalog(s.cards, []);
  if (
    !Array.isArray(s.order) ||
    s.order.length !== s.cards.length ||
    new Set(s.order).size !== s.order.length ||
    s.order.some((id) => !s.cards.some((c) => c.id === id))
  )
    throw Error("Invalid order");
  if (
    !Number.isSafeInteger(s.position) ||
    s.position < 0 ||
    s.position >= s.order.length ||
    !Number.isSafeInteger(s.cycle) ||
    s.cycle < 0 ||
    !Number.isSafeInteger(s.discarded) ||
    s.discarded < 0 ||
    !["hidden", "revealed", "complete"].includes(s.phase)
  )
    throw Error("Invalid progress");
  validateQuest(s);
  if (s.previousId !== null && !findCard(s, s.previousId))
    throw Error("Invalid previous card");
  if ((s.discarded === 0) !== (s.previousId === null))
    throw Error("Invalid history");
  // Finale cards and lost battles are draws that take no deck position.
  const q = s.quest;
  const drawn =
    s.cycle * s.cards.length +
    s.position +
    (q?.due ? q.step : 0) +
    (q?.lost ?? 0) +
    (q?.party?.rounds ?? 0);
  if (s.phase === "complete") {
    // A finite game ends at its limit; a quest mode on its last finale card.
    if (
      !(s.config.limit !== null
        ? s.discarded === s.config.limit
        : (q?.due && q.step === q.finale.length - 1) || !!q?.party?.wiped) ||
      s.discarded !== drawn + 1 ||
      s.previousId !== currentCard(s).id
    )
      throw Error("Invalid completion");
  } else if (
    s.discarded !== drawn ||
    (s.config.limit !== null && s.discarded >= s.config.limit)
  )
    throw Error("Invalid count");
  const previous = previousCard(s);
  // A finished game ends on the card just put aside: a phased boss's last
  // beat, not the opener its reset hits would read.
  const current =
    s.phase === "complete" && previous ? previous : currentCard(s);
  if (q?.party && q.party.hits >= (hitsNeeded(q, current) || 1))
    throw Error("Invalid party");
  validateRoll(s.roll, current.dice);
  validateRoll(s.previousRoll, previous?.dice);
  if (
    (s.phase === "hidden" && s.roll !== null) ||
    // A choice card may have been put aside without a roll, and a crawl's
    // smoke bomb escapes a fight before it is rolled.
    (previous?.dice && !previous.dice.choice && !q?.party && !s.previousRoll) ||
    (s.previousRoll && !s.previousRoll.returned) ||
    (s.phase === "complete" &&
      current.dice &&
      !(current.dice.choice && !s.roll && !s.previousRoll) &&
      (!s.roll?.returned ||
        JSON.stringify(s.roll) !== JSON.stringify(s.previousRoll)))
  )
    throw Error("Invalid dice progress");
  return s;
}
export function loadSession(): {
  session: SessionState | null;
  corrupt: boolean;
  unavailable: boolean;
} {
  let raw;
  try {
    raw = localStorage.getItem(SAVE_KEY);
  } catch {
    return { session: null, corrupt: false, unavailable: true };
  }
  try {
    return {
      session: raw ? parseSession(raw) : null,
      corrupt: false,
      unavailable: false,
    };
  } catch {
    // Keep the game before "Return to setup" clears it. Storage that is full
    // or refuses only loses the backup, never the recovery screen.
    try {
      localStorage.setItem(CORRUPT_KEY, raw!);
    } catch {
      /* no room for a backup */
    }
    return { session: null, corrupt: true, unavailable: false };
  }
}
export function loadPreferences(): Preferences {
  try {
    const p = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
    // Legacy saves may still carry sound/ambience/atmosphere; they are ignored.
    if (p && validConfig(p.config)) {
      let choice: DeckChoice;
      const { quest, ...config } = p.config;
      if (
        p.choice === "quest" &&
        packs.some((pack) => pack.id === quest && pack.quest)
      ) {
        const packIds = knownPackIds(config.packIds);
        return {
          config: { ...config, packIds, quest },
          choice: "quest",
          ...(p.added === quest && packIds.includes(quest)
            ? { added: quest }
            : {}),
        };
      } else if (p.choice === "infinite" || p.choice === "endless") {
        choice = "infinite";
      } else if (
        // Short and Long (until 2026-10-17) and the older fixed and custom
        // lengths all become Standard.
        ["standard", "short", "long", "20", "40", "60", "custom"].includes(
          p.choice,
        )
      ) {
        choice = "standard";
      } else {
        return defaults;
      }
      return {
        config: {
          ...config,
          packIds: knownPackIds(config.packIds),
          limit: MODE_LIMITS[choice],
        },
        choice,
      };
    }
  } catch {
    /* defaults */
  }
  return defaults;
}
/** The stored Chronicle, or an empty one when there is none, storage is
 * unavailable, or it is malformed (a malformed one is reset alone: the
 * session and settings are never touched). */
export function loadChronicle(): Chronicle {
  let raw: string | null;
  try {
    raw = localStorage.getItem(CHRONICLE_KEY);
  } catch {
    return emptyChronicle();
  }
  if (!raw) return emptyChronicle();
  try {
    const c = readChronicle(JSON.parse(raw));
    if (c) return c;
  } catch {
    /* malformed */
  }
  try {
    localStorage.removeItem(CHRONICLE_KEY);
  } catch {
    /* storage refuses */
  }
  return emptyChronicle();
}
export const saveChronicle = (c: Chronicle) => save(CHRONICLE_KEY, c);
export function save(key: string, value: unknown): boolean {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
/** Ask the browser to keep saves; Safari grants this to installed web apps. */
export function requestPersistence() {
  try {
    void navigator.storage?.persist?.().catch(() => {});
  } catch {
    /* unsupported */
  }
}
