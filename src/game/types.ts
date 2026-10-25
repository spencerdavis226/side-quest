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
  /** A crawl's single d20 battle (2026-10-17): the omen's bonus added to the
   * face before the outcome is read (0 when there is none). Its presence
   * marks a roll whose `natural` was decided when it was rolled; older saves
   * omit both and read naturals from the face. */
  bonus?: number;
  /** The roll counts as a natural 20 or 1: its face, or a face inside the
   * omen's widened range (`OmenEffect.crit`, `fumble`). */
  natural?: 20 | 1;
  /** A 20 was rolled and rerolled away (`OmenEffect.reroll20`). */
  flinched?: true;
  /** Pokémon League (2026-10-25): the fight was rolled twice for a type
   * matchup and the better (`advantage`) or worse (`disadvantage`) attempt
   * kept. `values` are the kept faces; `dropped` the other attempt's. */
  edge?: Edge;
  dropped?: number[];
}
/** A strike's three lines, one for each way the matchup can go. */
export interface Strike {
  even: string;
  advantage: string;
  disadvantage: string;
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
  /** Pokémon League (2026-10-25): a fight with no roll and no plaque. The
   * type matchup picks the line the card reads and what it costs when it is
   * put aside: the starter's edge wins (a reward and no `damage`), a
   * disadvantage loses (`damage`, a curse), and anything else, or an untyped
   * card, is even and costs only what the line says. */
  strike?: Strike;
  /** Pub Crawl: hearts the party loses when this battle (or a strike on a
   * bad matchup) is lost. */
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
  /** Pub Crawl (2026-10-25): `evolves` is two paths of two levels, flat as
   * `[A1, B1, A2, B2]`. The first level picks A1 or B1 (`party.form` 1 or
   * 2), and the second follows that path (3 or 4). */
  fork?: true;
  /** Pub Crawl (2026-10-25): an adventurer's knacks, two (none for a joke
   * class). */
  knacks?: Knack[];
  /** Pub Crawl (2026-10-25): the knack a fight calls for. An adventurer
   * with it has the edge: the dice fight is rolled with advantage, a
   * plaque fight's loss costs one heart less. Never a disadvantage. */
  knack?: Knack;
  /** A crawl omen's dice colours while it holds (`DicePalette`). */
  palette?: DicePalette;
  /** Pub Crawl (2026-10-17): an effect the party keeps for the rest of the
   * run once this card is put aside (a battle only on a win, a boss or an
   * ambush only when it falls): tonight's omen, or a trinket a boss or an
   * elite drops. Boons stack with each other and with the adventurer's
   * omen (`party.boons`). */
  boon?: Boon;
  /** Pub Crawl (2026-10-17): the trinkets a boss or an elite offers when it
   * falls (two). The table picks one on the winning roll, and that pick
   * puts the card aside (`takeSpoils`); it is kept as `<card id>#<index>`
   * in `party.boons`. Never beside `boon`. */
  spoils?: Boon[];
  /** Pub Crawl (2026-10-17): push your luck. Each won roll banks the next
   * prize and offers Cash out or Again; each Again rolls 2 lower; a loss
   * forfeits everything banked. A single-d20 battle only. */
  press?: { prizes: Loot[] };
  /** Pokémon League (2026-10-25): the Pokémon type a fight is against, or a
   * starter's type. A dice fight against a type the starter beats is rolled
   * with advantage, one that beats it with disadvantage; a fight settled
   * with plaques costs one HP less or more when lost (`matchup.ts`). */
  type?: PokemonType;
  /** Pub Crawl (2026-10-17): a spoken rule the table keeps until the
   * floor's boss falls, laid when the card is put aside (a battle only when
   * lost). The app shows it and lifts it; nobody has to remember. */
  jinx?: Jinx;
}
/** A lasting effect and its name, as the party dialog shows it. `rules` is
 * written from `effect` (`describeOmen`). */
export interface Boon {
  name: string;
  rules: string;
  effect: OmenEffect;
  /** Pub Crawl equipment (2026-10-25): the slot a trinket takes. The party
   * wears one piece per slot; a new one replaces the old. Absent on
   * tonight's omen and on older saves' trinkets, which stack as before. */
  slot?: Slot;
}
/** Pub Crawl's equipment slots (2026-10-25): weapons bend the dice, armor
 * keeps hearts, a trinket does anything else. */
export const SLOTS = ["weapon", "armor", "trinket"] as const;
export type Slot = (typeof SLOTS)[number];
/** A table rule with a name: "Goblin Tongue", "Speak of yourself in the
 * third person. Slip: drink 1." */
export interface Jinx {
  name: string;
  rule: string;
}
/** One later form of a starter: its name, what it does (shown in the team
 * dialog) and the omen effect it holds while it is the current form. */
export interface Evolution {
  title: string;
  rules: string;
  omen: OmenEffect;
  palette?: DicePalette;
  /** The form's type, when it differs from the starter's (Eevee's). */
  type?: PokemonType;
  /** A forked adventurer's path, in a few words for its plaque (at most
   * 28 characters), read from across the table (2026-10-25). */
  tagline?: string;
}
/** A crawl omen's (or a starter form's) dice colours: `primary` is the
 * enamel, `secondary` the metal and trim (2026-10-17). Display only. */
export interface DicePalette {
  primary: string;
  secondary: string;
}
/** The eighteen Pokémon types, and the Striaton trio's badge, which plays
 * as whichever of fire, water and grass beats the starter (`matchup.ts`). */
export const POKEMON_TYPES = [
  "normal",
  "fire",
  "water",
  "grass",
  "electric",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
  "trio",
] as const;
export type PokemonType = (typeof POKEMON_TYPES)[number];
/** How a type matchup bends a roll. */
export type Edge = "advantage" | "disadvantage";
/** Pub Crawl's knacks (2026-10-25): what a class is good at. A room that
 * calls for one rolls with the edge for an adventurer who has it. */
export const KNACKS = ["brawn", "sneak", "magic", "charm", "faith"] as const;
export type Knack = (typeof KNACKS)[number];
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
  // A rest between floors: level up or catch your breath (2026-10-17).
  "rest",
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
  /** Added to every single-d20 battle roll (`all`) or to one kind's
   * (2026-10-17). A bonus never makes a natural: the face (and `crit`,
   * `fumble`) decides those. */
  roll?: Partial<Record<Encounter | "all", number>>;
  /** The lowest face that counts as a natural 20 (19: on 19 or 20). */
  crit?: number;
  /** The highest face that counts as a natural 1 (2: on 1 or 2). */
  fumble?: number;
  /** A natural 20 is rolled again until it isn't one (Bidoof). */
  reroll20?: true;
  /** An item back in the bag each time a gym (a badge boss) falls. */
  restock?: Loot;
}
/** Pub Crawl items, carried in the party's satchel (at most three).
 * `draught`: drink 4 to heal two hearts (one when only one is missing). `shield`: the next
 * heart loss is blocked, on its own. `die`: roll a lost fight again.
 * `smoke`: escape a room fight before it starts (never a boss). `revive`
 * (2026-10-17): when the hearts run out, the party is back at half its
 * maximum instead, on its own. `candy` (2026-10-17): the starter evolves
 * now (never a branching one, which picks its form on an evolution card).
 * `round` (2026-10-17): on a lost roll, the drawer hands that fight's drinks
 * to someone else; the party still loses the hearts. */
export const LOOT = [
  "draught",
  "shield",
  "die",
  "smoke",
  "revive",
  "candy",
  // A lost fight's drinks go to someone else (2026-10-17).
  "round",
  // Pokémon League (2026-10-25): before a typed battle's roll, the starter
  // Terastallizes into the type that beats the foe, for that fight.
  "tera",
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
   * pack's deck, which plays them as ordinary cards in the plain modes.
   * `quaff` (2026-10-17): a lost d20 can be rolled again for that many
   * drinks, once until the next boss falls. `cup`: every lost fight pours a
   * splash into a shared cup, and the run's end hands it to someone. */
  party?: { hearts: number; quaff?: number; cup?: true };
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
  /** The cards whose `boon` the party keeps, in the order they came; older
   * saves omit it. */
  boons?: string[];
  /** The card whose `jinx` holds until the floor's boss falls. */
  jinx?: string;
  /** The Quaff's price in drinks, when the crawl has one, and whether it
   * has been drunk since the last boss fell. */
  quaff?: number;
  quaffed?: true;
  /** Splashes in the Cup, when the crawl keeps one: one per lost fight. */
  cup?: number;
  /** Pulls already won on the push-your-luck card in play (`press`); the
   * roll on the card now is the next. Absent is 0. */
  press?: number;
  /** The draw (`SessionState.discarded`) whose lost drinks were passed on
   * with a `round`, so it is passed once. */
  passed?: number;
  /** The card in play the starter has Terastallized against (a Tera Orb):
   * the fight is rolled with advantage. Cleared when the card is put
   * aside, so a boss dealt again needs another orb. */
  tera?: string;
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
