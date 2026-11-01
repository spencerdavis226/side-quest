import type { Loot, QuestStage, SessionState, Slot } from "../game/types";
import { DRAUGHT_DRINKS, DRAUGHT_HEAL, finaleStage } from "../game/engine";
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
  | "rest"
  | "jinx"
  // Pub Crawl's equipment slots (2026-10-25); a trinket keeps its mark.
  | "weapon"
  | "armor";

/** One row of the how-to-play guide: a mark, a name, one line. */
export interface GuideRow {
  icon: CrawlIconName;
  title: string;
  line: string;
}

export interface CrawlTheme {
  loot: Record<Loot, { name: string; does: string }>;
  /** The card plaques for an item used on the card in play. */
  flee: string;
  reroll: string;
  /** The plaque that passes a lost fight's drinks on (`round`). */
  pass: string;
  /** Drink the draught from the satchel dialog. */
  drink: string;
  /** Use the candy from the satchel dialog. */
  eat: string;
  /** A class's or starter's perk and its levels are written from their
   * numbers in these words (`game/omenText.ts`). */
  omenWords?: OmenWords;
  /** Pub Crawl's equipment (2026-10-25): the slots' names and the spoils
   * sheet's words. */
  equipment?: {
    slots: Record<Slot, string>;
    spoils: string;
    replaces: string;
    keep: string;
    satchel: string;
  };
  /** `public/<folder>/<file>.svg` for a mark; a mark not listed is the
   * crawl's own (`art/crawl/<name>.svg`). */
  icons: { folder: string; files: Partial<Record<CrawlIconName, string>> };
  words: {
    /** "1 heart", "2 hearts". */
    heart: string;
    hearts: string;
    /** Leads the meter's spoken label: "Hearts: 10 of 12". */
    Hearts: string;
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
    /** The setup screen's section and summary. */
    setupTitle: string;
    setupBrief: (hearts: number, floors: number) => string;
    setupHearts: string;
    setupFloors: string;
    /** A row of badges in the party dialog, when the crawl earns them. */
    badges?: string;
    /** The party dialog's line under the badges: what they are for. */
    badgesNote?: string;
    /** The banner when the starter evolves: "What? Charmander is evolving!" */
    evolving?: (from: string) => string;
    /** The run's own omen in the party dialog and the medallion: "Your
     * starter", "Your adventurer". */
    adventurer: string;
    /** On an evolve plaque: who grows, and what it is once it can't. */
    /** Pub Crawl's end screen (2026-10-25): the felled bosses' wall and
     * the run's tab. */
    trophies?: string;
    tab?: string;
    grows: { who: string; verb: string; done: string };
    /** Pub Crawl only (2026-10-17): the boons kept for the run. A theme
     * without them never shows them. */
    trinkets?: string;
    trinketFound?: string;
    jinx?: { name: string; landed: string; lifted: string; lasts: string };
    /** A floor's banner names the boss waiting at the bottom. */
    wanted?: string;
  };
  /** Cards that ask the table to name the badges from memory: while one is
   * face up, the badge case stays shut (owner, 2026-10-24). `why` ends the
   * locked chip's spoken label. */
  badgeLock?: { cards: string[]; why: string };
  /** What the setup screen counts as the run's length (floors, gyms);
   * by default every stage of several rooms. */
  lengthOf?: (stages: QuestStage[]) => number;
  /** The seals legend in the guide: −hearts, hits, +item. */
  legend: [string, string, string];
  /** The legend's last two lines, the standing rule on a d20: what a
   * natural 20 doubles, then what a natural 1 doubles. */
  naturals: [string, string];
  /** Pub Crawl's extra seals: a trinket on a win, a jinx on a loss. */
  legendMore?: { trinket?: string; jinx?: string };
  /** The how-to-play guide (2026-10-17): the goal in a line, then one row
   * per mechanic. */
  guide: {
    goal: string;
    rows: (n: { hearts: number }) => GuideRow[];
  };
  /** A crawl's flourishes (display only): the stamp on a boss's felling
   * swing (Pub Crawl 2026-10-31, the League 2026-11-01) and the table's
   * light for each place in the run (`crawlScene`, Pub Crawl only). A
   * theme without them shows none. The natural 20 and 1 burst plays in
   * every mode (`NaturalBurst`). */
  flourish?: {
    /** Never on a badge's boss (a League gym leader): its badge moment
     * says it (2026-11-01). */
    felled: string;
    scene?: (stageLabel: string) => string | undefined;
  };
  /** The end screens: two title lines (the second in italics) and the
   * verdict. */
  wiped: { title: [string, string]; verdict: string };
  won: { title: [string, string]; verdict: string };
}

/** The table's light for a Pub Crawl stage, from its label ("The Cellar",
 * "Cellar boss", "The Queue"): each floor glows its own colour, so a run
 * reads as a descent. Wine Cellar is tested before Cellar. */
const SCENES: [RegExp, string][] = [
  [/Wine Cellar/, "wine"],
  [/Cellar/, "cellar"],
  [/Brewery/, "brewery"],
  [/Catacombs/, "catacombs"],
  [/Sewers/, "sewers"],
  [/Freezer/, "freezer"],
  [/Taproom/, "taproom"],
  [/Kitchen/, "kitchen"],
  [/Rooftop/, "rooftop"],
  [/Last Call/, "lastcall"],
  [/Queue|Stairs|Closing Time/, "rival"],
  [/Landing/, "landing"],
  [/Speakeasy|VIP|Back Office|Poker|Basement/, "hidden"],
];
function dungeonScene(label: string) {
  return SCENES.find(([test]) => test.test(label))?.[1];
}

const dungeon: CrawlTheme = {
  loot: {
    draught: {
      name: "Healing Draught",
      does: `Drink ${DRAUGHT_DRINKS}: +${DRAUGHT_HEAL} hearts`,
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
    // League only (2026-11-01); Pub Crawl never deals one.
    master: { name: "Master Ball", does: "Always catches" },
    great: { name: "Great Ball", does: "+3 to a catch" },
    ultra: { name: "Ultra Ball", does: "+6 to a catch" },
  },
  flee: "Flee",
  reroll: "Reroll",
  pass: "Pass it",
  eat: "Read",
  drink: "Drink",
  omenWords: dungeonOmenWords,
  equipment: {
    slots: { weapon: "Weapon", armor: "Armor", trinket: "Trinket" },
    spoils: "Spoils",
    replaces: "Replaces",
    keep: "Keep my gear",
    satchel: "Into the satchel",
  },
  icons: { folder: "art/crawl", files: {} },
  words: {
    heart: "heart",
    hearts: "hearts",
    Hearts: "Hearts",
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
    setupTitle: "The crawl",
    setupBrief: (hearts, floors) =>
      `${hearts} shared hearts, ${floors} floors, an adventurer who levels up, and gear from bosses`,
    setupHearts: "hearts",
    setupFloors: "floors",
    evolving: (from) => `${from} levels up!`,
    trophies: "Trophy wall",
    tab: "The tab",
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
    wanted: "Wanted",
  },
  flourish: {
    felled: "Felled",
    scene: dungeonScene,
  },
  legend: [
    "Hearts the party loses if the fight is lost",
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
  guide: {
    goal: "Beat Last Call before the party's hearts run out.",
    rows: ({ hearts }) => [
      {
        icon: "heart",
        title: "Hearts",
        line: `The table shares ${hearts}. A lost fight costs hearts; at zero the party is wiped.`,
      },
      {
        icon: "die",
        title: "Fights",
        line: "Roll the d20 and meet the number to win. No dice: the table judges, then taps Won or Lost.",
      },
      {
        icon: "boss",
        title: "Bosses",
        line: "One ends each floor. Its pips are the wins it takes; each drawer gets one swing.",
      },
      {
        icon: "rest",
        title: "Landings",
        line: "After a boss: level up your adventurer for 3 drinks, or rest for 3 hearts.",
      },
      {
        icon: "satchel",
        title: "Satchel and gear",
        line: "Items show up as buttons on a card when they help. Bosses and elites drop gear: one weapon, one armor, one trinket, and a new piece replaces the old. Tap the hearts to see both.",
      },
      {
        icon: "jinx",
        title: "Jinxes",
        line: "A lost fight can jinx a player with a table rule. It lifts when the floor's boss falls.",
      },
    ],
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

// Pokémon League as a journey: Team HP, the Bag, and a white-out for a
// wipe.
const league: CrawlTheme = {
  loot: {
    draught: {
      name: "Potion",
      does: `Drink ${DRAUGHT_DRINKS}: +${DRAUGHT_HEAL} HP`,
    },
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
    master: {
      name: "Master Ball",
      does: "Throw it at any catch: it always lands a 20",
    },
    great: { name: "Great Ball", does: "Throw it at a catch: +3 to the roll" },
    ultra: { name: "Ultra Ball", does: "Throw it at a catch: +6 to the roll" },
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
      master: "master-ball",
      great: "great-ball",
      ultra: "ultra-ball",
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
    setupTitle: "The journey",
    setupBrief: (hearts, gyms) =>
      `${hearts} team HP, ${gyms} gyms with a route before each, a villain hideout, the League, and a new starter every run`,
    setupHearts: "HP",
    setupFloors: "gyms",
    badges: "Badges",
    badgesNote:
      "One for each gym beaten. All eight open Victory Road and the League.",
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
  flourish: {
    felled: "Defeated",
  },
  badgeLock: {
    cards: ["pokemon.route-veteran-victory"],
    why: "locked, name them from memory",
  },
  legend: [
    "HP the team loses if the battle is lost",
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
  guide: {
    goal: "Beat the Champion before the team's HP runs out.",
    rows: ({ hearts }) => [
      {
        icon: "heart",
        title: "Team HP",
        line: `The table shares ${hearts}. A lost battle costs HP; at zero the team whites out.`,
      },
      {
        icon: "die",
        title: "Battles",
        line: "Roll the d20 and meet the number to win. No dice: the table judges, then taps Won or Lost.",
      },
      {
        icon: "omen",
        title: "Types",
        line: "Your starter has a type. Super effective on them: roll double the dice and keep the highest. Super effective on you: keep the lowest. A strike needs no roll: its type decides the line.",
      },
      {
        icon: "boss",
        title: "Gyms and badges",
        line: "A gym ends each route. Its pips are the wins it takes; each trainer gets one turn.",
      },
      {
        icon: "adventurer",
        title: "Evolution",
        line: "Evolve your starter for drinks, or press B for 1 HP. Each form is stronger.",
      },
      {
        icon: "heart",
        title: "Caught Pokémon",
        line: "Beat a wild Pokémon and you can catch it for a drink. It waits in the bag (two at most). Send one into a d20 battle its type beats (a Normal one goes into any it doesn't lose to, for one less): it adds to the roll, more the harder it was to catch. Win and it stays; lose and it faints for good.",
      },
      {
        icon: "satchel",
        title: "Bag",
        line: "Items show up as buttons on a card when they help. Tap the HP to see the bag.",
      },
      {
        icon: "jinx",
        title: "Jinxes",
        line: "A lost battle can jinx a player with a table rule. It lifts when the next boss falls.",
      },
    ],
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

/** The place a crawl's table is lit for (`Atmosphere`'s scene): the stage
 * now in play, while the run is on. Undefined outside a themed crawl. */
export function crawlScene(s: SessionState | null | undefined) {
  const quest = s?.quest;
  if (!quest?.party || !quest.due || s!.phase === "complete") return undefined;
  if (quest.step >= quest.finale.length) return undefined;
  const scene = crawlTheme(quest.packId).flourish?.scene;
  return scene?.(finaleStage(quest).label);
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
