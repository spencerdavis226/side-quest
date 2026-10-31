import type { CardDefinition } from "../../game/types";
import { adventurer } from "./shared";

// The run's first card: the adventurer, one of eighteen (2026-10-17, the
// League's starters done as a dungeon party). Each has one signature you
// feel on the dice or in the satchel, and levels up twice, at a landing for
// drinks or with a Dog-Eared Tome, each level a change the level-up banner
// can name. The second level follows the first: one line, no paths (the
// two-path fork was cut 2026-10-31, keeping each class's original line). The
// Drunken Monk is bad until it isn't. Three joke classes (the Plus-One, the
// Intern and the Mimic, owner 2026-10-25: "intentionally bad", humor first)
// are the worst by design, and levelling makes them worse, so the table
// rests instead. Perks are written from the numbers, so the flavor here is
// only the first sentence. Check every class's own win rate in
// `tests/dungeon.balance.test.ts`.

export const classes: CardDefinition[] = [
  // Boss killer who runs into traps; or a wall of hearts.
  adventurer(
    "barbarian",
    "Barbarian",
    "Rage first. Questions never.",
    { roll: { boss: 2 }, hurt: { trap: 1 } },
    [
      {
        title: "Berserker",
        omen: { hearts: 2, roll: { boss: 2, elite: 2 }, hurt: { trap: 1 } },
      },
      {
        title: "Warlord",
        omen: { hearts: 3, roll: { boss: 3, elite: 2 } },
      },
    ],
  ),
  // Traps and relics, and room for everything they steal; or the gambler.
  adventurer(
    "rogue",
    "Rogue",
    "Has your wallet.",
    { satchel: 4, loot: ["smoke"], roll: { trap: 2, relic: 2 } },
    [
      {
        title: "Cutpurse",
        omen: {
          satchel: 4,
          loot: ["smoke"],
          roll: { trap: 3, relic: 2, monster: 1 },
        },
      },
      {
        title: "Shadow",
        omen: { satchel: 5, roll: { trap: 3, relic: 3, monster: 2 } },
      },
    ],
  ),
  // Every heal heals more; or a priest who hits back.
  adventurer("cleric", "Cleric", "Blesses every drink, loudly.", { heal: 1 }, [
    {
      title: "Priest",
      omen: { hearts: 1, heal: 1, loot: ["revive"] },
    },
    {
      title: "High Priest",
      omen: { hearts: 2, heal: 2 },
    },
  ]),
  // Loaded dice, then one back whenever a boss falls; or smoke and mirrors.
  adventurer(
    "wizard",
    "Wizard",
    "Reads the menu like a spellbook.",
    { hearts: -2, loot: ["die", "die"] },
    [
      {
        title: "Sorcerer",
        omen: { hearts: -1, loot: ["die"], restock: "die" },
      },
      {
        title: "Archmage",
        omen: { roll: { all: 1 }, restock: "die" },
      },
    ],
  ),
  // Lucky: natural 20s come easy; or the life of the party.
  adventurer(
    "bard",
    "Bard",
    "Brought a guitar. Nobody asked.",
    { hearts: 1, crit: 19 },
    [
      {
        title: "Minstrel",
        omen: { hearts: 1, crit: 18 },
      },
      {
        title: "Rock Star",
        omen: { hearts: 2, crit: 18, roll: { all: 1 } },
      },
    ],
  ),
  // The tank: hearts and shields, and bosses hurt less; or all offense.
  adventurer(
    "paladin",
    "Paladin",
    "Sworn to guard the table's drinks.",
    { hearts: 1, loot: ["shield"] },
    [
      {
        title: "Crusader",
        omen: { hurt: { boss: -1 }, loot: ["shield"] },
      },
      {
        title: "Templar",
        omen: {
          hearts: 2,
          hurt: { boss: -1, ambush: -1 },
          restock: "shield",
        },
      },
    ],
  ),
  // Monster hunter, weak to bosses until it grows; or a sniper.
  adventurer(
    "ranger",
    "Ranger",
    "Tracks the bar by smell.",
    { roll: { monster: 2 }, hurt: { boss: 1 } },
    [
      {
        title: "Tracker",
        omen: { roll: { monster: 2, ambush: 2 } },
      },
      {
        title: "Beastmaster",
        omen: { hearts: 2, roll: { monster: 3, ambush: 2 } },
      },
    ],
  ),
  // Stumbles early, then fights like nobody else; or sobers up.
  adventurer(
    "monk",
    "Drunken Monk",
    "Starts drunk. Gets better.",
    { hearts: -1, fumble: 2 },
    [
      {
        title: "Brawler",
        omen: { roll: { all: 1 } },
      },
      {
        title: "Drunken Master",
        omen: { hearts: 1, roll: { all: 2 }, crit: 19 },
      },
    ],
  ),
  // Dies, gets up, dies again; or brings the medicine.
  adventurer(
    "necromancer",
    "Necromancer",
    "Has died twice tonight already.",
    { hearts: -3, loot: ["revive"] },
    [
      {
        title: "Bone Caller",
        omen: { hearts: -3, roll: { boss: 1 } },
      },
      {
        title: "Lich",
        omen: { hearts: -2, roll: { boss: 2 }, loot: ["revive"] },
      },
    ],
  ),
  // Flasks for days, then a fresh one whenever a boss falls; or bombs.
  adventurer(
    "alchemist",
    "Alchemist",
    "Has a flask for every flask.",
    { hearts: 1, satchel: 4, loot: ["draught", "draught"] },
    [
      {
        title: "Apothecary",
        omen: { hearts: 1, satchel: 4, heal: 1, loot: ["draught"] },
      },
      {
        title: "Brewmaster",
        omen: { hearts: 2, satchel: 5, heal: 1, restock: "draught" },
      },
    ],
  ),
  // Glass cannon: every roll better, every heart dearer; or a better deal.
  adventurer(
    "warlock",
    "Warlock",
    "Sold their soul for a better seat.",
    { hearts: -3, roll: { all: 2 } },
    [
      {
        title: "Hexblade",
        omen: { hearts: -3, roll: { all: 2 }, crit: 19 },
      },
      {
        title: "Archfiend",
        omen: { hearts: -2, roll: { all: 3 }, crit: 19 },
      },
    ],
  ),
  // New 2026-10-25. The door: ambushes hurt less; then security or shields.
  adventurer(
    "bouncer",
    "Bouncer",
    "Checked your ID twice.",
    { hearts: 2, hurt: { ambush: -1 } },
    [
      {
        title: "Security",
        omen: { hearts: 2, hurt: { ambush: -1 }, roll: { ambush: 1 } },
      },
      {
        title: "Head of Security",
        omen: { hearts: 3, hurt: { ambush: -1 }, roll: { ambush: 2, boss: 1 } },
      },
    ],
  ),
  // New 2026-10-25. Pours for the table: the Bar Tab, then drinks or tabs.
  adventurer(
    "bartender",
    "Bartender",
    "Knows everyone's order.",
    { hearts: 1, satchel: 4, loot: ["round", "draught"] },
    [
      {
        title: "Mixologist",
        omen: { hearts: 1, satchel: 4, heal: 1, loot: ["draught"] },
      },
      {
        title: "Master Mixologist",
        omen: { hearts: 1, satchel: 4, heal: 1, restock: "draught" },
      },
    ],
  ),
  // New 2026-10-25. Takes the loud door: elites, then bounties or bodyguard.
  adventurer(
    "mercenary",
    "Mercenary",
    "Will fight anything for a drink.",
    { roll: { elite: 3, monster: 1 } },
    [
      {
        title: "Bounty Hunter",
        omen: { roll: { elite: 3, monster: 1, boss: 1 } },
      },
      {
        title: "Legend for Hire",
        omen: { hearts: 2, roll: { elite: 3, monster: 2, boss: 1 } },
      },
    ],
  ),
  // New 2026-10-25. Traps can't touch it; then a bear, or herbs.
  adventurer(
    "druid",
    "Druid",
    "Smells like moss. Talks to the plants.",
    { hearts: 1, roll: { trap: 2 } },
    [
      {
        title: "Shapeshifter",
        omen: { hearts: 1, roll: { trap: 2, monster: 1, ambush: 1 } },
      },
      {
        title: "Archdruid",
        omen: { hearts: 2, roll: { trap: 2, monster: 2, ambush: 2 } },
      },
    ],
  ),
  // The joke classes (owner, 2026-10-25: intentionally bad, humor first).
  // Both paths make them worse, differently; the table can rest instead.
  // The worst of all, on purpose.
  adventurer(
    "plus-one",
    "The Plus-One",
    "Nobody invited them.",
    { hearts: -3, roll: { boss: -1 }, reroll20: true },
    [
      {
        title: "The Plus-Two",
        omen: { hearts: -4, roll: { boss: -1 }, reroll20: true, satchel: 2 },
      },
      {
        title: "The Plus-Three",
        omen: { hearts: -5, roll: { boss: -2 }, reroll20: true, satchel: 1 },
      },
    ],
  ),
  // Unpaid, and it shows: no room, fumbles, and a career path.
  adventurer(
    "intern",
    "The Intern",
    "Unpaid, sadly.",
    { hearts: -2, satchel: 1, fumble: 2 },
    [
      {
        title: "Senior Intern",
        omen: { hearts: -2, satchel: 1, fumble: 3 },
      },
      {
        title: "Middle Manager",
        omen: { hearts: -2, satchel: 1, fumble: 3, bossHits: 1 },
      },
    ],
  ),
  // A treasure chest that thinks it's an adventurer: all satchel, no fight,
  // and a heart less than it looks (it measured 10%, too good for a joke).
  adventurer(
    "mimic",
    "The Mimic",
    "A very confused chest.",
    { hearts: -4, satchel: 5, roll: { all: -1 } },
    [
      {
        title: "Bigger Chest",
        omen: { hearts: -5, satchel: 5, roll: { all: -2 } },
      },
      {
        title: "Storage Unit",
        omen: { hearts: -6, satchel: 5, roll: { all: -2 }, hurt: { trap: 1 } },
      },
    ],
  ),
];

/** The joke classes: worst by design, measured apart from the rest. */
export const JOKE_CLASSES = ["plus-one", "intern", "mimic"].map(
  (id) => `dungeon.class-${id}`,
);

// Each level's dice (2026-10-17): the enamel, then the metal.
const PALETTES: Record<string, [primary: string, secondary: string]> = {
  Barbarian: ["#8c2f1e", "#d9a441"],
  Berserker: ["#a3241c", "#e2c290"],
  Warlord: ["#5e1914", "#c9a227"],
  Brute: ["#6e3a22", "#b8a07a"],
  Juggernaut: ["#3e2a20", "#9a9a9a"],
  Rogue: ["#2d3a33", "#9fb8a2"],
  Cutpurse: ["#25302b", "#c7b273"],
  Shadow: ["#1b1d26", "#8a90a8"],
  "Card Sharp": ["#1f3a2a", "#e8d8a0"],
  "High Roller": ["#0f2a1c", "#e2b84a"],
  Cleric: ["#e8e0c8", "#b08a2e"],
  Priest: ["#d8cfa8", "#6f5a2a"],
  "High Priest": ["#f2ead2", "#c4972f"],
  "Battle Priest": ["#c9c0a0", "#7a2a1e"],
  Inquisitor: ["#5a1a1a", "#e8dcc0"],
  Wizard: ["#2e2a6e", "#c7b8f0"],
  Sorcerer: ["#3d1f6b", "#e0a8ff"],
  Archmage: ["#18234f", "#f2d47a"],
  Illusionist: ["#3a2a5e", "#a8e0e0"],
  "Grand Illusionist": ["#24184a", "#d0f0f0"],
  Bard: ["#7a2f5e", "#f0c27a"],
  Minstrel: ["#8f3b6e", "#b8e0d2"],
  "Rock Star": ["#141414", "#e6467a"],
  "Hype Man": ["#c2410c", "#fde68a"],
  Headliner: ["#4a1a3a", "#ffd166"],
  Paladin: ["#2f5a8c", "#e6d29a"],
  Crusader: ["#25497a", "#f0f0f0"],
  Templar: ["#1e3c66", "#d4af37"],
  Oathbreaker: ["#3a2f3a", "#c08a8a"],
  Blackguard: ["#1a1418", "#a01e2a"],
  Ranger: ["#3e5e2c", "#c9b27a"],
  Tracker: ["#4a6b34", "#8a5a2e"],
  Beastmaster: ["#2e4a22", "#d98e3a"],
  Sharpshooter: ["#4a5a3a", "#e0e0d0"],
  Deadeye: ["#2a3324", "#e8c060"],
  "Drunken Monk": ["#b85c1e", "#f5d76e"],
  Brawler: ["#9e4a1a", "#3a2a1a"],
  "Drunken Master": ["#c96a12", "#7a1f1f"],
  "Sober Monk": ["#d8c8a0", "#5a7a5a"],
  "Zen Master": ["#e8e0d0", "#6a8a9a"],
  Necromancer: ["#2a2f2a", "#7fd18a"],
  "Bone Caller": ["#1f2a24", "#e8e4d0"],
  Lich: ["#14201a", "#56e0b0"],
  "Plague Doctor": ["#2a2a24", "#b8b070"],
  "Plague Lord": ["#1e241a", "#9ad04a"],
  Alchemist: ["#3a6b5e", "#e3b04b"],
  Apothecary: ["#2f5f6b", "#d9e6b0"],
  Brewmaster: ["#5a3a1a", "#e8c14a"],
  Bombardier: ["#5a2a1a", "#f0a040"],
  Demolitionist: ["#3a1a12", "#ff8a2a"],
  Warlock: ["#4a1030", "#e04a4a"],
  Hexblade: ["#3a0d2a", "#b44ae0"],
  Archfiend: ["#26071a", "#ff7a3a"],
  "Pact Keeper": ["#3a1a3a", "#e0c0a0"],
  "Soul Broker": ["#2a0a2a", "#c0e0a0"],
  Bouncer: ["#1a1a1a", "#c0c0c0"],
  Security: ["#222a33", "#f0d040"],
  Doorman: ["#3a2a1a", "#d4af37"],
  "Head of Security": ["#141a22", "#f0e060"],
  "The Velvet Rope": ["#6a0f1f", "#d4af37"],
  Bartender: ["#4a2e1a", "#e8d0a0"],
  Mixologist: ["#1f4a4a", "#f0c0d0"],
  "Bar Manager": ["#3a2a20", "#c0a080"],
  "Master Mixologist": ["#123a3a", "#ffd0e0"],
  "Bar Owner": ["#2a1a10", "#e8c060"],
  Mercenary: ["#4a4a3a", "#b0a080"],
  "Bounty Hunter": ["#3a3a2a", "#d0a050"],
  Bodyguard: ["#2a2a2a", "#e0e0e0"],
  "Legend for Hire": ["#2a2010", "#ffd070"],
  Champion: ["#1e3a5a", "#ffd700"],
  Druid: ["#2f4a2a", "#a8c890"],
  Shapeshifter: ["#4a3a22", "#c8a070"],
  "Hedge Witch": ["#3a4a2a", "#d8c0e0"],
  Archdruid: ["#1e3a1a", "#e0d080"],
  "Grove Keeper": ["#24401e", "#f0e0b0"],
  "The Plus-One": ["#9a9a8e", "#5a5a52"],
  "The Plus-Two": ["#b0b0a6", "#6e6e66"],
  "The Plus-Three": ["#c4c4bc", "#7a7a72"],
  "The Ex": ["#8a7a8a", "#4a3a4a"],
  "The Ex's New Partner": ["#a0b0c0", "#5a6a7a"],
  "The Intern": ["#c8c0b0", "#6a6a6a"],
  "Senior Intern": ["#bab2a2", "#5e5e5e"],
  "Middle Manager": ["#8a8a90", "#4a4a50"],
  "Coffee Runner": ["#6b4a2a", "#d8c8b0"],
  "LinkedIn Guru": ["#0a66c2", "#e8eef4"],
  "The Mimic": ["#7a5a2a", "#c8a050"],
  "Bigger Chest": ["#8a6a3a", "#b89a60"],
  "Storage Unit": ["#8a8a80", "#e07a2a"],
  "Self-Aware Chest": ["#6a4a2a", "#e0c0a0"],
  "Chest With Anxiety": ["#5a4a3a", "#a0c0d0"],
};
const palette = (title: string) => {
  const [primary, secondary] = PALETTES[title];
  return { primary, secondary };
};
for (const c of classes) {
  c.palette = palette(c.title);
  for (const e of c.evolves ?? []) e.palette = palette(e.title);
}
