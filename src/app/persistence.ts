import { packs } from "../content/manifest.generated";
import { validateCatalog } from "../content/validate";
import { validateRoll } from "../game/dice";
import {
  currentCard,
  findCard,
  finaleCard,
  formEffect,
  hitsNeeded,
  omenForm,
  satchelSize,
  validConfig,
} from "../game/engine";
import type { GameConfig, PartyState, SessionState } from "../game/types";
import { CURSES, LOOT } from "../game/types";
export const SAVE_KEY = "side-quest.session.v1";
export const SETTINGS_KEY = "side-quest.settings.v1";
/** Keys from before the rename to Side Quest, mapped to their new names. */
export const LEGACY_KEYS: Record<string, string> = {
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
export type DeckChoice = "short" | "long" | "infinite" | "quest";
export const MODE_LIMITS: Record<DeckChoice, number | null> = {
  short: 30,
  long: 60,
  infinite: null,
  quest: null,
};
export interface Preferences {
  config: GameConfig;
  choice: DeckChoice;
}
export const defaults: Preferences = {
  config: { version: 1, packIds: ["core"], limit: 30 },
  choice: "short",
};
/** Keep only installed packs; never let a stale selection empty the deck. */
const knownPackIds = (ids: readonly string[]) => {
  const known = packs.map((pack) => pack.id).filter((id) => ids.includes(id));
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
  const pool = q.stages.flatMap((stage) => [
    ...(Array.isArray(stage?.cards) ? stage.cards : []),
    ...(Array.isArray(stage?.elite) ? stage.elite : []),
  ]);
  validateCatalog(pool, []);
  // The finale is each stage's picks, in stage order, with no repeats; a
  // crawl floor's fork may have swapped one of its later rooms for an elite.
  let at = 0;
  for (const stage of q.stages) {
    const picks = q.finale.slice(at, at + stage.pick);
    const elite = stage.elite;
    if (
      typeof stage.label !== "string" ||
      !stage.label.trim() ||
      !whole(stage.pick, 1) ||
      stage.pick > stage.cards.length ||
      picks.length !== stage.pick ||
      (elite !== undefined &&
        (!q.party || !Array.isArray(elite) || !elite.length)) ||
      picks.some(
        (id, i) =>
          !stage.cards.some((c) => c.id === id) &&
          !(i > 0 && elite?.some((c) => c.id === id)),
      )
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
    !(p.curse === null || CURSES.includes(p.curse)) ||
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
              : !/^\d$/.test(pick) || !card.spoils?.[Number(pick)])
          );
        }) ||
        new Set(p.boons.map((k) => k.split("#")[0])).size !==
          p.boons.length)) ||
    (p.jinx !== undefined &&
      (typeof p.jinx !== "string" ||
        !dealt.includes(p.jinx) ||
        !finaleCard(s.quest!, p.jinx)?.jinx)) ||
    (p.quaff !== undefined && !whole(p.quaff, 0)) ||
    (p.quaffed !== undefined &&
      (p.quaffed !== true || p.quaff === undefined)) ||
    (p.cup !== undefined && !whole(p.cup, 0)) ||
    (p.press !== undefined &&
      (!whole(p.press, 1) ||
        s.phase !== "revealed" ||
        p.press >= (currentCard(s).press?.prizes.length ?? 0))) ||
    (p.passed !== undefined &&
      (!whole(p.passed, 0) || p.passed > s.discarded)) ||
    // The starter's form: a later form it has, once the omen is set.
    (p.form !== undefined &&
      (!whole(p.form, 1) ||
        p.omen === undefined ||
        p.form > (omenForm(s.quest)?.forms ?? 0)))
  )
    throw Error("Invalid party");
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
  const current = currentCard(s);
  const previous = findCard(s, s.previousId);
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
        return {
          config: { ...config, packIds: knownPackIds(config.packIds), quest },
          choice: "quest",
        };
      } else if (["short", "long", "infinite"].includes(p.choice)) {
        choice = p.choice;
      } else if (p.choice === "endless") {
        choice = "infinite";
      } else if (["20", "40", "60", "custom"].includes(p.choice)) {
        const size =
          p.choice === "custom" ? Number(p.customSize) : Number(p.choice);
        const finite =
          Number.isInteger(size) && size >= 1 && size <= 500
            ? size
            : p.config.limit;
        choice = finite === null ? "infinite" : finite <= 45 ? "short" : "long";
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
