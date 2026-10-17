export const VERSION = 1 as const;
export type Category = "sip" | "group" | "category" | "challenge" | "rule";
export interface DiceOutcome {
  min: number;
  max: number;
  /** Repeat step so a table can cover every other total (odds, evens). */
  step?: number;
  instruction: string;
  /** A battle card's winning outcome (see `CardDefinition.battle`). */
  win?: true;
}
export interface DiceDefinition {
  version: 1;
  count: number;
  sides: 6 | 20;
  instruction?: string;
  /** Replaces the normal instruction when every die shows the same face. */
  doubles?: string;
  /** A battle card's doubles are a win. */
  doublesWin?: true;
  outcomes?: DiceOutcome[];
  /** The roll is one of two options. `skip` labels the option that puts the
   * card aside without rolling; `roll` labels the option that rolls. */
  choice?: { skip: string; roll: string };
}
export interface DiceRoll {
  values: number[];
  total: number;
  instruction: string;
  returned: boolean;
}
export interface CardDefinition {
  version: 1;
  id: string;
  title: string;
  rules: string;
  category: Category;
  artwork: string;
  dice?: DiceDefinition;
  /** The id of the pack whose quest meter this card advances when it is put
   * aside (a gym battle earns a badge). */
  quest?: string;
  /** A short gold ribbon on the card face, e.g. "Gym Leader · Boulder Badge". */
  ribbon?: string;
  /** The ribbon's finish; gold when absent. The League gives each finale
   * stage its own: pearl Legendaries, violet Elite Four, crimson Champions. */
  ribbonTone?: RibbonTone;
  /** Text one player reads alone: it shows only while they hold the card's
   * Hold to read plaque and hides on release (a Paranoia question, a secret
   * mission, a word for the table to act out). The rules say who reads it. */
  secret?: string;
  /** A timed card: a plaque starts it and the card can't be put aside until
   * time is up, when `end` replaces the rules. */
  timer?: TimerDefinition;
  /** A fight the table can lose (gym leaders, Champions). A dice battle is won
   * by its `win` outcomes; any other is settled with Won and Lost plaques. In
   * a quest only a win counts: a lost gym leader goes back into the deck, and
   * a lost finale card is replaced by another from its stage. */
  battle?: true;
  /** Pub Crawl: hearts the party loses when this battle is lost. */
  damage?: number;
  /** A boss: the battle has to be won this many times. Each swing is one
   * deal, and the boss is dealt again, win or lose, until it falls. */
  hits?: number;
  /** Pub Crawl: what the card brings the party when it is put aside (a
   * battle only on a win): an item for the satchel, or hearts back. */
  reward?: { loot?: Loot; heal?: number };
  /** Pub Crawl: a curse on the party to the end of the floor (a battle's
   * only when lost). */
  curse?: Curse;
  /** Pub Crawl: what kind of room the card is, so an omen can single out
   * traps or monsters. A boss is told apart from an ambush (both have
   * `hits`) only by this; saves from before it have no ambushes. */
  encounter?: Encounter;
  /** Pub Crawl: a merchant's wares or a fork's doors. The card is put aside
   * only by taking one of these (two or three) plaques. */
  offers?: Offer[];
  /** Pub Crawl: tonight's omen, dealt first. Its effect holds for the run
   * once the card is put aside. */
  omen?: OmenEffect;
  /** Pokémon League: a starter omen's later forms, in order. An offer with
   * `evolve` moves the run to the next form, whose effect replaces the one
   * before it (`party.form`). */
  evolves?: Evolution[];
  /** The `evolves` forms are alternatives, not a line: the first evolution
   * picks one of them (Eevee: Vaporeon, Jolteon or Flareon), and that is
   * its last. */
  branches?: true;
}
/** One later form of a starter: its name, what it does (shown in the team
 * dialog) and the omen effect it holds while it is the current form. */
export interface Evolution {
  title: string;
  rules: string;
  omen: OmenEffect;
}
export const ENCOUNTERS = [
  "monster",
  "elite",
  "ambush",
  "trap",
  "trial",
  "relic",
  "treasure",
  "shrine",
  "boss",
  "merchant",
  "fork",
  "omen",
] as const;
export type Encounter = (typeof ENCOUNTERS)[number];
/** One plaque on a merchant or a fork. `cost` is hearts paid outright (no
 * shield blocks a price, and it cannot be paid with the last heart); `loot`
 * and `heal` are what it brings; `elite` swaps the next room on this floor
 * for one of the floor's elites. */
export interface Offer {
  label: string;
  cost?: number;
  loot?: Loot;
  heal?: number;
  elite?: true;
  /** The starter evolves into its next form; never taken once it is fully
   * evolved. */
  evolve?: true;
}
/** What an omen changes for the run. `hearts` moves the party's maximum and
 * current hearts; `loot` goes into the satchel; `satchel` is its size;
 * `hurt` adds hearts to every loss on that kind of room; `heal` adds to
 * every heal a card brings; `bossHits` adds swings to every boss. */
export interface OmenEffect {
  hearts?: number;
  loot?: Loot[];
  satchel?: number;
  hurt?: Partial<Record<Encounter, number>>;
  heal?: number;
  bossHits?: number;
}
/** Pub Crawl items, carried in the party's satchel (at most three).
 * `draught`: down a fresh, full drink to heal a heart. `shield`: the next
 * heart loss is blocked, on its own. `die`: roll a lost fight again.
 * `smoke`: escape a room fight before it starts (never a boss). `revive`
 * (2026-10-17): when the hearts run out, the party is back at half its
 * maximum instead, on its own. `candy` (2026-10-17): the starter evolves
 * now (never a branching one, which picks its form on an evolution card). */
export const LOOT = [
  "draught",
  "shield",
  "die",
  "smoke",
  "revive",
  "candy",
] as const;
export type Loot = (typeof LOOT)[number];
/** Pub Crawl curses, to the end of the floor. `bleed`: every heart loss
 * costs one more. `hex`: the satchel is sealed (no items, no shield). */
export const CURSES = ["bleed", "hex"] as const;
export type Curse = (typeof CURSES)[number];
/** `fuse`: a hidden length between `min` and `max` seconds, picked when it is
 * lit, so nobody knows who will hold the phone at the boom. `countdown`: the
 * seconds are shown counting down. Display only: a reload unlights it. */
export type TimerDefinition =
  | { version: 1; kind: "fuse"; min: number; max: number; end: string }
  | { version: 1; kind: "countdown"; seconds: number; end: string };
export const RIBBON_TONES = ["pearl", "violet", "crimson"] as const;
export type RibbonTone = (typeof RIBBON_TONES)[number];
/** One stage of a quest's finale: `pick` cards drawn at random from
 * `cardIds` when the game starts (e.g. the Elite Four: 4 of 9). */
export interface QuestStage {
  label: string;
  /** The banner line that sweeps across the table as the stage begins, e.g.
   * "A Legendary appears". Display only; never saved. */
  intro?: string;
  pick: number;
  cardIds: string[];
  /** Pub Crawl: the floor's elites, dealt only through a fork's loud door
   * (never picked, never in `cardIds`). */
  elite?: string[];
}
/** A run's place in the finale: one stage, or `oneOf` a set of routes (each
 * a list of stages, such as a floor and its boss), one picked per game. */
export type QuestSlot = QuestStage | { oneOf: QuestStage[][] };
/** A pack's game mode: a table-wide meter that, on reaching its goal, deals
 * the finale stages one card at a time between deck cards, and the game ends
 * when the last is put aside. Finale cards are authored with the pack's cards
 * but are in no deck list, so they never enter the shuffle. */
export interface PackQuest {
  /** The mode's name on the setup screen, e.g. "Pokémon League". */
  mode: string;
  /** One short line under the mode's name. */
  summary: string;
  /** The meter's label, e.g. "Badges". */
  label: string;
  goal: number;
  /** The quest's cards are spread through this many draws, so the finale is
   * dealt by then. */
  length: number;
  /** Cards that only play in this mode (not in `cardIds`). */
  cardIds: string[];
  finale: QuestSlot[];
  /** The mode's own mark on the setup screen and meter (single-colour SVG),
   * when it differs from the pack's. */
  mark?: string;
  /** A crawl: the run is the finale stages alone, dealt from the first card
   * (`goal` is 0 and the deck is never dealt), and the table shares
   * `hearts`. Losing them all ends the game. Stage cards may also be in the
   * pack's deck, which plays them as ordinary cards in the plain modes. */
  party?: { hearts: number };
}
/** A quest's progress in one game. `stages` snapshots each stage's pool and
 * `finale` holds the cards picked at the start, in the order they are dealt.
 * `due` means the goal is met: `finale[step]` is the card in play (or the
 * next one drawn). */
export interface QuestState {
  packId: string;
  label: string;
  goal: number;
  length: number;
  count: number;
  due: boolean;
  stages: {
    label: string;
    pick: number;
    cards: CardDefinition[];
    /** A crawl floor's elites (`QuestStage.elite`); older saves omit it. */
    elite?: CardDefinition[];
  }[];
  finale: string[];
  step: number;
  /** Battles lost so far. Each was a draw that took no deck position or
   * finale step; older saves omit it. */
  lost?: number;
  /** A crawl's party; absent in other quests. */
  party?: PartyState;
}
export interface PartyState {
  hearts: number;
  max: number;
  /** The satchel, oldest first. */
  loot: Loot[];
  curse: Curse | null;
  /** Swings landed on the boss in play. */
  hits: number;
  /** Boss swings that landed without felling it: each dealt the boss again
   * without a finale step, like a lost battle. */
  rounds: number;
  /** The hearts ran out; the game ended in defeat. */
  wiped: boolean;
  /** The id of tonight's omen card once it is put aside; older saves and
   * runs without an omen omit it. */
  omen?: string;
  /** How many times tonight's omen has evolved (`evolves`); absent is 0. */
  form?: number;
}
export interface PackDefinition {
  version: 1;
  id: string;
  title: string;
  description: string;
  cardIds: string[];
  artwork?: string;
  /** One single-colour silhouette; the app tints it wherever it appears. */
  logo?: string;
  quest?: PackQuest;
}
export interface GameConfig {
  version: 1;
  packIds: string[];
  limit: number | null;
  /** A quest mode: the id of the selected pack whose quest runs the game.
   * The game has no card limit; it ends on the quest's finale. */
  quest?: string;
}
export interface SessionState {
  version: 2;
  roll: DiceRoll | null;
  previousRoll: DiceRoll | null;
  config: GameConfig;
  cards: CardDefinition[];
  order: string[];
  position: number;
  cycle: number;
  discarded: number;
  phase: "hidden" | "revealed" | "complete";
  previousId: string | null;
  /** Present only in a quest mode; older saves omit it. */
  quest?: QuestState;
}
