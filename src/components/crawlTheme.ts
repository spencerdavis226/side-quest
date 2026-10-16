import type { Curse, Loot, QuestStage } from "../game/types";

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
  | "door";

export interface CrawlTheme {
  loot: Record<Loot, { name: string; does: string }>;
  curses: Record<Curse, { name: string; does: string }>;
  /** The card plaques for an item used on the card in play. */
  flee: string;
  reroll: string;
  /** Drink the draught from the satchel dialog. */
  drink: string;
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
  };
  /** What the setup screen counts as the run's length (floors, gyms);
   * by default every stage of several rooms. */
  lengthOf?: (stages: QuestStage[]) => number;
  /** The seals legend in the party dialog: −hearts, curse, hits, +item. */
  legend: [string, string, string, string];
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
  },
  curses: {
    bleed: { name: "Bleeding", does: "Every heart loss costs one more" },
    hex: { name: "Hexed", does: "The satchel is sealed" },
  },
  flee: "Flee",
  reroll: "Reroll",
  drink: "Drink",
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
    elite: "the next room is an elite: harder, and it pays",
    curseLasts: "to the end of the floor",
    setupTitle: "The crawl",
    setupBrief: (hearts, floors) =>
      `${hearts} shared hearts, ${floors} floors, a boss on each, and a new omen every run`,
    setupHearts: "hearts",
    setupFloors: "floors",
  },
  legend: [
    "Hearts the party loses if the fight is lost",
    "A curse on a loss, until the floor's boss falls",
    "Wins it takes: the next drawer swings again",
    "An item for the satchel, on a win",
  ],
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
  },
  curses: {
    bleed: { name: "Poisoned", does: "Every HP loss costs one more" },
    hex: { name: "Confused", does: "The bag is sealed" },
  },
  flee: "Escape",
  reroll: "Reroll",
  drink: "Use",
  icons: {
    folder: "art/league",
    files: {
      heart: "poke-ball",
      draught: "potion",
      shield: "protect",
      die: "x-attack",
      smoke: "escape-rope",
      bleed: "poison",
      hex: "confused",
      boss: "badge",
      satchel: "bag",
      wiped: "whited-out",
      omen: "starter",
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
  },
  lengthOf: (stages) => stages.filter((st) => /^Gym \d/.test(st.label)).length,
  legend: [
    "HP the team loses if the battle is lost",
    "A status on a loss, until the next gym falls",
    "Wins it takes: the next trainer battles again",
    "An item for the bag, on a win",
  ],
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
