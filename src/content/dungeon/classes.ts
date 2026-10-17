import type { CardDefinition } from "../../game/types";
import { adventurer } from "./shared";

// The run's first card: the adventurer, one of twelve (2026-10-17, the
// League's starters done as a dungeon party). Each has one signature you
// feel on the dice or in the satchel, and levels up twice, at a landing for
// drinks or with a Dog-Eared Tome, each level a change the level-up banner
// can name. The Drunken Monk is bad until it isn't; the Plus-One is the
// worst by design, and levelling it up makes it worse (the table can rest
// instead). Powers are written from the numbers, so the flavor here is only
// the first sentence. Check every class's own win rate in
// `tests/dungeon.test.ts`.

export const classes: CardDefinition[] = [
  // Boss killer who runs into traps.
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
      { title: "Warlord", omen: { hearts: 3, roll: { boss: 3, elite: 2 } } },
    ],
  ),
  // Traps and relics, and room for everything they steal.
  adventurer(
    "rogue",
    "Rogue",
    "Already has your wallet.",
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
  // Every heal heals more.
  adventurer("cleric", "Cleric", "Blesses every drink, loudly.", { heal: 1 }, [
    { title: "Priest", omen: { hearts: 1, heal: 1, loot: ["revive"] } },
    { title: "High Priest", omen: { hearts: 2, heal: 2 } },
  ]),
  // Loaded dice, then one back whenever a boss falls.
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
      { title: "Archmage", omen: { roll: { all: 1 }, restock: "die" } },
    ],
  ),
  // Lucky: natural 20s come easy.
  adventurer(
    "bard",
    "Bard",
    "Brought a guitar. Nobody asked.",
    { hearts: 1, crit: 19 },
    [
      { title: "Minstrel", omen: { hearts: 1, crit: 18 } },
      { title: "Rock Star", omen: { hearts: 2, crit: 18, roll: { all: 1 } } },
    ],
  ),
  // The tank: hearts and shields, and bosses hurt less.
  adventurer(
    "paladin",
    "Paladin",
    "Sworn to guard the table's drinks.",
    { hearts: 1, loot: ["shield"] },
    [
      {
        title: "Crusader",
        omen: { hearts: 1, hurt: { boss: -1 }, loot: ["shield"] },
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
  // Monster hunter, weak to bosses until it grows.
  adventurer(
    "ranger",
    "Ranger",
    "Tracks the bar by smell.",
    { roll: { monster: 2 }, hurt: { boss: 1 } },
    [
      { title: "Tracker", omen: { roll: { monster: 2, ambush: 2 } } },
      {
        title: "Beastmaster",
        omen: { hearts: 2, roll: { monster: 3, ambush: 2 } },
      },
    ],
  ),
  // Stumbles early, then fights like nobody else.
  adventurer(
    "monk",
    "Drunken Monk",
    "Starts drunk. Gets better.",
    { hearts: -1, fumble: 2 },
    [
      { title: "Brawler", omen: { roll: { all: 1 } } },
      {
        title: "Drunken Master",
        omen: { hearts: 1, roll: { all: 2 }, crit: 19 },
      },
    ],
  ),
  // Dies, gets up, dies again.
  adventurer(
    "necromancer",
    "Necromancer",
    "Has died twice tonight already.",
    { hearts: -3, loot: ["revive"] },
    [
      { title: "Bone Caller", omen: { hearts: -3, roll: { boss: 1 } } },
      {
        title: "Lich",
        omen: { hearts: -2, roll: { boss: 2 }, loot: ["revive"] },
      },
    ],
  ),
  // Flasks for days, then a fresh one whenever a boss falls.
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
  // Glass cannon: every roll better, every heart dearer.
  adventurer(
    "warlock",
    "Warlock",
    "Sold their soul for a better seat.",
    { hearts: -3, roll: { all: 2 } },
    [
      { title: "Hexblade", omen: { hearts: -3, roll: { all: 2 }, crit: 19 } },
      { title: "Archfiend", omen: { hearts: -2, roll: { all: 3 }, crit: 19 } },
    ],
  ),
  // The worst, on purpose. Levelling up makes it worse.
  adventurer(
    "plus-one",
    "The Plus-One",
    "Nobody knows who invited them.",
    { hearts: -3, roll: { boss: -1 }, reroll20: true },
    [
      {
        title: "The Plus-Two",
        omen: { hearts: -4, roll: { boss: -1 }, reroll20: true, satchel: 2 },
      },
    ],
  ),
];

// Each level's dice (2026-10-17): the enamel, then the metal.
const PALETTES: Record<string, [primary: string, secondary: string]> = {
  Barbarian: ["#8c2f1e", "#d9a441"],
  Berserker: ["#a3241c", "#e2c290"],
  Warlord: ["#5e1914", "#c9a227"],
  Rogue: ["#2d3a33", "#9fb8a2"],
  Cutpurse: ["#25302b", "#c7b273"],
  Shadow: ["#1b1d26", "#8a90a8"],
  Cleric: ["#e8e0c8", "#b08a2e"],
  Priest: ["#d8cfa8", "#6f5a2a"],
  "High Priest": ["#f2ead2", "#c4972f"],
  Wizard: ["#2e2a6e", "#c7b8f0"],
  Sorcerer: ["#3d1f6b", "#e0a8ff"],
  Archmage: ["#18234f", "#f2d47a"],
  Bard: ["#7a2f5e", "#f0c27a"],
  Minstrel: ["#8f3b6e", "#b8e0d2"],
  "Rock Star": ["#141414", "#e6467a"],
  Paladin: ["#2f5a8c", "#e6d29a"],
  Crusader: ["#25497a", "#f0f0f0"],
  Templar: ["#1e3c66", "#d4af37"],
  Ranger: ["#3e5e2c", "#c9b27a"],
  Tracker: ["#4a6b34", "#8a5a2e"],
  Beastmaster: ["#2e4a22", "#d98e3a"],
  "Drunken Monk": ["#b85c1e", "#f5d76e"],
  Brawler: ["#9e4a1a", "#3a2a1a"],
  "Drunken Master": ["#c96a12", "#7a1f1f"],
  Necromancer: ["#2a2f2a", "#7fd18a"],
  "Bone Caller": ["#1f2a24", "#e8e4d0"],
  Lich: ["#14201a", "#56e0b0"],
  Alchemist: ["#3a6b5e", "#e3b04b"],
  Apothecary: ["#2f5f6b", "#d9e6b0"],
  Brewmaster: ["#5a3a1a", "#e8c14a"],
  Warlock: ["#4a1030", "#e04a4a"],
  Hexblade: ["#3a0d2a", "#b44ae0"],
  Archfiend: ["#26071a", "#ff7a3a"],
  "The Plus-One": ["#9a9a8e", "#5a5a52"],
  "The Plus-Two": ["#b0b0a6", "#6e6e66"],
};
const palette = (title: string) => {
  const [primary, secondary] = PALETTES[title];
  return { primary, secondary };
};
for (const c of classes) {
  c.palette = palette(c.title);
  for (const e of c.evolves ?? []) e.palette = palette(e.title);
}
