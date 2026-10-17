import type { Curse, Loot, QuestStage } from "../game/types";
import {
  dungeonOmenWords,
  leagueOmenWords,
  type OmenWords,
} from "../game/omenText";

// What a crawl is called, per pack: the same engine is a dungeon crawl in
// Dungeon night and a journey in Pokémon League. Display only; the engine
// and saves never see these words.

export type CrawlIconName =
  | Loot
  | Curse
  | "heart"
  | "boss"
  | "satchel"
  | "wiped"
  | "omen"
  | "ambush"
  | "elite"
  | "door"
  | "adventurer"
  | "trinket"
  | "cup"
  | "quaff"
  | "rest"
  | "jinx";

export interface CrawlTheme {
  loot: Record<Loot, { name: string; does: string }>;
  curses: Record<Curse, { name: string; does: string }>;
  /** The card plaques for an item used on the card in play. */
  flee: string;
  reroll: string;
  /** The plaque that passes a lost fight's drinks on (`round`). */
  pass: string;
  /** Drink the draught from the satchel dialog. */
  drink: string;
  /** Use the candy from the satchel dialog. */
  eat: string;
  /** Pokémon League: its starters' powers and evolutions are written from
   * their numbers in these words (`game/omenText.ts`). */
  omenWords?: OmenWords;
  /** `public/<folder>/<file>.svg` for a mark; a mark not listed is the
   * crawl's own (`art/crawl/<name>.svg`). */
  icons: { folder: string; files: Partial<Record<CrawlIconName, string>> };
  words: {
    /** "1 heart", "2 hearts". */
    heart: string;
    hearts: string;
    /** Leads the meter's spoken label: "Hearts: 10 of 12". */
    Hearts: string;
    /** "A curse" or "a status" on a card's seal. */
    curse: string;
    Satchel: string;
    /** The party dialog's title. */
    party: string;
    /** Rooms on a floor: "Room 3 of 7", "3 of 7 rooms". */
    Room: string;
    rooms: string;
    floors: string;
    /** The medallion's spoken label, and a card's hits seal. */
    Boss: string;
    Ambush: string;
    aBoss: string;
    anAmbush: string;
    /** The medallion on the run's first card. */
    omen: string;
    /** What a fork's loud door brings. */
    elite: string;
    /** After a curse's name in the party dialog. */
    curseLasts: string;
    /** The setup screen's section and summary. */
    setupTitle: string;
    setupBrief: (hearts: number, floors: number) => string;
    setupHearts: string;
    setupFloors: string;
    /** A row of badges in the party dialog, when the crawl earns them. */
    badges?: string;
    /** The banner when the starter evolves: "What? Charmander is evolving!" */
    evolving?: (from: string) => string;
    /** The run's own omen in the party dialog and the medallion: "Your
     * starter", "Your adventurer". */
    adventurer: string;
    /** On an evolve plaque: who grows, and what it is once it can't. */
    grows: { who: string; verb: string; done: string };
    /** Pub Crawl only (2026-10-17): the boons kept for the run, a jinx, the
     * Quaff and the Cup. A theme without them never shows them. */
    trinkets?: string;
    trinketFound?: string;
    jinx?: { name: string; landed: string; lifted: string; lasts: string };
    quaff?: string;
    cup?: {
      name: string;
      pour: string;
      /** The end screens: who drinks it. */
      won: string;
      wiped: string;
    };
    /** A floor's banner names the boss waiting at the bottom. */
    wanted?: string;
  };
  /** What the setup screen counts as the run's length (floors, gyms);
   * by default every stage of several rooms. */
  lengthOf?: (stages: QuestStage[]) => number;
  /** The seals legend in the party dialog: −hearts, curse, hits, +item. */
  legend: [string, string, string, string];
  /** The legend's last two lines, the standing rule on a d20: what a
   * natural 20 doubles, then what a natural 1 doubles. */
  naturals: [string, string];
  /** Pub Crawl's extra seals: a trinket on a win, a jinx on a loss. */
  legendMore?: { trinket?: string; jinx?: string };
  /** The end screens: two title lines (the second in italics) and the
   * verdict. */
  wiped: { title: [string, string]; verdict: string };
  won: { title: [string, string]; verdict: string };
}

const dungeon: CrawlTheme = {
  loot: {
    draught: {
      name: "Healing Draught",
      does: "Down a fresh, full drink: +1 heart",
    },
    shield: { name: "Coaster Shield", does: "Blocks the next heart loss" },
    die: { name: "Loaded Die", does: "Roll a lost fight again" },
    smoke: { name: "Smoke Bomb", does: "Escape a room fight" },
    // Adventurers, merchants and trinkets bring these (2026-10-17).
    revive: {
      name: "Second Wind",
      does: "When the hearts run out: back to half",
    },
    candy: { name: "Dog-Eared Tome", does: "Your adventurer levels up now" },
    round: {
      name: "Bar Tab",
      does: "A lost fight's drinks go to someone else",
    },
  },
  curses: {
    bleed: { name: "Bleeding", does: "Every heart loss costs one more" },
    hex: { name: "Hexed", does: "The satchel is sealed" },
  },
  flee: "Flee",
  reroll: "Reroll",
  pass: "Pass it",
  eat: "Read",
  drink: "Drink",
  omenWords: dungeonOmenWords,
  icons: { folder: "art/crawl", files: {} },
  words: {
    heart: "heart",
    hearts: "hearts",
    Hearts: "Hearts",
    curse: "curse",
    Satchel: "Satchel",
    party: "The party",
    Room: "Room",
    rooms: "rooms",
    floors: "floors",
    Boss: "Boss",
    Ambush: "Ambush",
    aBoss: "A boss",
    anAmbush: "An ambush",
    omen: "Tonight's omen",
    elite: "the next room is an elite: harder, and it drops a trinket",
    curseLasts: "to the end of the floor",
    setupTitle: "The crawl",
    setupBrief: (hearts, floors) =>
      `${hearts} shared hearts, ${floors} floors, an adventurer who levels up, trinkets from bosses, and the Cup`,
    setupHearts: "hearts",
    setupFloors: "floors",
    evolving: (from) => `${from} levels up!`,
    adventurer: "Your adventurer",
    grows: {
      who: "your adventurer",
      verb: "levels up",
      done: "fully levelled",
    },
    trinkets: "Kept for the run",
    trinketFound: "Trinket found",
    jinx: {
      name: "Jinx",
      landed: "Jinxed!",
      lifted: "The jinx lifts",
      lasts: "until the floor's boss falls",
    },
    quaff: "Quaff",
    cup: {
      name: "The Cup",
      pour: "Every lost fight pours a splash into the Cup",
      won: "Whoever landed the last swing hands the Cup to anyone.",
      wiped: "Whoever drew the last card drinks the Cup.",
    },
    wanted: "Wanted",
  },
  legend: [
    "Hearts the party loses if the fight is lost",
    "A curse on a loss, until the floor's boss falls",
    "Wins it takes: the next drawer swings again",
    "An item for the satchel, on a win",
  ],
  naturals: [
    "A natural 20 doubles a win: its gives, item, heal and swing",
    "A natural 1 doubles a loss: its drinks and hearts",
  ],
  // Floors are the stages of eight rooms; the hidden room's two guards are
  // not a floor.
  lengthOf: (stages) => stages.filter((st) => st.pick >= 4).length,
  legendMore: {
    trinket: "A trinket on a win: it holds the rest of the run",
    jinx: "A jinx on a loss: a table rule until the boss falls",
  },
  wiped: {
    title: ["Party", "wiped."],
    verdict: "Everyone finishes their drink.",
  },
  won: {
    title: ["Last call,", "survived."],
    verdict: "Make a rule for the rest of the night.",
  },
};

// Pokémon League as a journey: Team HP, the Bag, statuses for curses and a
// white-out for a wipe. A placeholder until the League's crawl lands (the
// pack's quest gains `party`).
const league: CrawlTheme = {
  loot: {
    draught: { name: "Potion", does: "Down a fresh, full drink: +1 HP" },
    shield: { name: "Protect", does: "Blocks the next HP loss" },
    die: { name: "X Attack", does: "Roll a lost battle again" },
    smoke: {
      name: "Escape Rope",
      does: "Escape a wild or trainer battle, never a gym",
    },
    revive: {
      name: "Revive",
      does: "When Team HP runs out: back to half instead",
    },
    candy: { name: "Rare Candy", does: "Your starter evolves now" },
    round: {
      name: "Baton Pass",
      does: "A lost battle's drinks go to someone else",
    },
  },
  curses: {
    bleed: { name: "Poisoned", does: "Every HP loss costs one more" },
    hex: { name: "Confused", does: "The bag is sealed" },
  },
  flee: "Escape",
  reroll: "Reroll",
  pass: "Pass it",
  drink: "Use",
  eat: "Use",
  omenWords: leagueOmenWords,
  icons: {
    folder: "art/league",
    files: {
      heart: "poke-ball",
      draught: "potion",
      shield: "protect",
      die: "x-attack",
      smoke: "escape-rope",
      revive: "revive",
      candy: "rare-candy",
      round: "baton-pass",
      bleed: "poison",
      hex: "confused",
      boss: "badge",
      satchel: "bag",
      wiped: "whited-out",
      omen: "starter",
      adventurer: "starter",
    },
  },
  words: {
    heart: "HP",
    hearts: "HP",
    Hearts: "Team HP",
    curse: "status",
    Satchel: "Bag",
    party: "The team",
    Room: "Battle",
    rooms: "battles",
    floors: "routes",
    Boss: "Boss battle",
    Ambush: "Rival battle",
    aBoss: "A boss battle",
    anAmbush: "A rival battle",
    omen: "Your starter",
    elite: "the next battle is an elite trainer: harder, and it pays",
    curseLasts: "until the next gym falls",
    setupTitle: "The journey",
    setupBrief: (hearts, gyms) =>
      `${hearts} team HP, ${gyms} gyms with a route before each, a villain hideout, the League, and a new starter every run`,
    setupHearts: "HP",
    setupFloors: "gyms",
    badges: "Badges",
    evolving: (from) => `What? ${from} is evolving!`,
    adventurer: "Your starter",
    grows: { who: "your starter", verb: "evolves", done: "fully evolved" },
    // League jinxes (2026-10-17): a few trainers and Legendaries lay one.
    jinx: {
      name: "Jinx",
      landed: "Jinxed!",
      lifted: "The jinx lifts",
      lasts: "until the next boss falls",
    },
  },
  lengthOf: (stages) => stages.filter((st) => /^Gym \d/.test(st.label)).length,
  legend: [
    "HP the team loses if the battle is lost",
    "A status on a loss, until the next gym falls",
    "Wins it takes: the next trainer battles again",
    "An item for the bag, on a win",
  ],
  naturals: [
    "A natural 20 doubles a win: its gives, item, heal and hit",
    "A natural 1 doubles a loss: its drinks and HP",
  ],
  legendMore: {
    jinx: "A jinx on a loss: a table rule until the next boss falls",
  },
  wiped: {
    title: ["Whited", "out."],
    verdict: "Everyone finishes their drink.",
  },
  won: {
    title: ["Hall of", "Fame."],
    verdict: "The Champion makes a rule for the rest of the night.",
  },
};

const themes: Record<string, CrawlTheme> = { dungeon, pokemon: league };

/** The crawl's words and marks for a pack; any other crawl pack reads as a
 * dungeon. */
export function crawlTheme(packId: string | undefined): CrawlTheme {
  return (packId && themes[packId]) || dungeon;
}

/** A mark's path under `public/`. */
export function crawlIconPath(theme: CrawlTheme, name: CrawlIconName) {
  const file = theme.icons.files[name];
  return file ? `${theme.icons.folder}/${file}.svg` : `art/crawl/${name}.svg`;
}

/** "1 heart", "3 hearts", "2 HP". */
export function heartCount(theme: CrawlTheme, n: number) {
  return `${n} ${n === 1 ? theme.words.heart : theme.words.hearts}`;
}
