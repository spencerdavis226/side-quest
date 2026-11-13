import type { CardDefinition } from "../../game/types";
import { adventurer } from "./shared";

// The run's first card: the adventurer, one of eighteen (2026-10-17, the
// League's starters done as a dungeon party; Realms, 2026-11-03, a fantasy
// party). Each has one signature you feel on the dice or in the satchel,
// and three ranks to earn: since Realms a rank comes when a region's boss
// or the side quest's keeper falls (`levelUp`), or with a Tome of Training,
// not at an inn. One line, no paths (the two-path fork was cut 2026-10-31).
// The Drunken Monk is bad until it isn't. Three joke classes (the Peasant,
// the Squire and the Mimic, owner 2026-10-25: "intentionally bad", humor
// first) are the worst by design, and their ranks make them no better.
// Perks are written from the numbers, so the flavor here is only the first
// sentence. Check every class's own win rate in
// `tests/dungeon.balance.test.ts`.

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
      {
        title: "Warlord",
        omen: { hearts: 3, roll: { boss: 3, elite: 2 } },
      },
      {
        title: "Destroyer",
        omen: { hearts: 3, roll: { boss: 3, elite: 3, monster: 1 } },
      },
    ],
  ),
  // Traps and relics, and room for everything they steal.
  adventurer(
    "rogue",
    "Rogue",
    "Has your purse.",
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
      {
        title: "Guildmaster",
        omen: {
          satchel: 5,
          roll: { trap: 3, relic: 3, monster: 2, ambush: 1 },
        },
      },
    ],
  ),
  // Every heal heals more.
  adventurer("cleric", "Cleric", "Blesses every drink, loudly.", { heal: 1 }, [
    {
      title: "Priest",
      omen: { hearts: 1, heal: 1 },
    },
    {
      title: "High Priest",
      omen: { hearts: 1, heal: 2 },
    },
    {
      title: "Saint",
      omen: { hearts: 2, heal: 2 },
    },
  ]),
  // Lucky Coins, then one back whenever a boss falls.
  adventurer(
    "wizard",
    "Wizard",
    "Smells of burnt eyebrows.",
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
      {
        title: "Grand Magus",
        omen: { hearts: 1, roll: { all: 2 }, restock: "die" },
      },
    ],
  ),
  // Lucky: natural 20s come easy.
  adventurer(
    "bard",
    "Bard",
    "Brought a lute. Nobody asked.",
    { hearts: 1, crit: 19 },
    [
      {
        title: "Minstrel",
        omen: { hearts: 1, crit: 18 },
      },
      {
        title: "Troubadour",
        omen: { hearts: 2, crit: 18, roll: { all: 1 } },
      },
      {
        title: "Living Legend",
        omen: { hearts: 3, crit: 17, roll: { all: 1 } },
      },
    ],
  ),
  // The tank: hearts and shields, and bosses hurt less.
  adventurer(
    "paladin",
    "Paladin",
    "Sworn to protect, loudly.",
    { hearts: 1, loot: ["shield"] },
    [
      {
        title: "Crusader",
        omen: { hearts: 2 },
      },
      {
        title: "Templar",
        omen: { hearts: 2, roll: { boss: 1 } },
      },
      {
        title: "Lightbringer",
        omen: { hearts: 2, hurt: { boss: -1 } },
      },
    ],
  ),
  // Monster hunter, weak to bosses until it grows.
  adventurer(
    "ranger",
    "Ranger",
    "Hasn't slept indoors in years.",
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
      {
        title: "Warden of the Wild",
        omen: { hearts: 2, roll: { monster: 3, ambush: 3, boss: 1 } },
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
      {
        title: "Brawler",
        omen: { roll: { all: 1 } },
      },
      {
        title: "Drunken Master",
        omen: { hearts: 1, roll: { all: 2 }, crit: 19 },
      },
      {
        title: "Grandmaster",
        omen: { hearts: 2, roll: { all: 2 }, crit: 18 },
      },
    ],
  ),
  // Dies, gets up, dies again.
  adventurer(
    "necromancer",
    "Necromancer",
    "Has died twice this week already.",
    { hearts: -3, loot: ["revive"] },
    [
      {
        title: "Bone Caller",
        omen: { hearts: -3, roll: { boss: 1 } },
      },
      {
        title: "Lich",
        omen: { hearts: -3, roll: { boss: 2 } },
      },
      {
        title: "Lord of Bones",
        omen: { hearts: -2, roll: { boss: 3, elite: 1 } },
      },
    ],
  ),
  // Potions for days, then a fresh one whenever a boss falls.
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
        title: "Master Alchemist",
        omen: { hearts: 1, satchel: 5, heal: 1, restock: "draught" },
      },
      {
        title: "Philosopher",
        omen: { hearts: 2, satchel: 5, heal: 1, restock: "draught" },
      },
    ],
  ),
  // Glass cannon: every roll better, every heart dearer.
  adventurer(
    "warlock",
    "Warlock",
    "Read none of the pact.",
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
      {
        title: "Soul Broker",
        omen: { hearts: -1, roll: { all: 3 }, crit: 19 },
      },
    ],
  ),
  // New 2026-10-25 (was the Bouncer). Ambushes hurt less.
  adventurer(
    "bouncer",
    "Knight",
    "Mentions the armor daily.",
    { hearts: 2, hurt: { ambush: -1 } },
    [
      {
        title: "Knight Errant",
        omen: { hearts: 2, hurt: { ambush: -1 }, roll: { ambush: 1 } },
      },
      {
        title: "Knight Commander",
        omen: { hearts: 2, hurt: { ambush: -1 }, roll: { ambush: 2 } },
      },
      {
        title: "Lord Protector",
        omen: { hearts: 2, hurt: { ambush: -1 }, roll: { ambush: 2, boss: 1 } },
      },
    ],
  ),
  // New 2026-10-25 (was the Bartender). The Hired Sword, then potions.
  adventurer(
    "bartender",
    "Innkeeper",
    "Knows every rumor.",
    { hearts: 1, satchel: 4, loot: ["round", "draught"] },
    [
      {
        title: "Tavern Master",
        omen: { hearts: 1, satchel: 4, heal: 1, loot: ["draught"] },
      },
      {
        title: "Master Brewer",
        omen: { hearts: 1, satchel: 4, heal: 1, restock: "draught" },
      },
      {
        title: "Lord of Feasts",
        omen: { hearts: 2, satchel: 5, heal: 1, restock: "draught" },
      },
    ],
  ),
  // New 2026-10-25 (was the Mercenary). Takes the loud door: elites.
  adventurer(
    "mercenary",
    "Sellsword",
    "Will fight anything for coin.",
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
      {
        title: "Captain of Blades",
        omen: { hearts: 3, roll: { elite: 3, monster: 2, boss: 2 } },
      },
    ],
  ),
  // New 2026-10-25. Traps can't touch it; then a bear.
  adventurer(
    "druid",
    "Druid",
    "Talks to the trees. The trees talk back.",
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
      {
        title: "Voice of the Wild",
        omen: { hearts: 3, roll: { trap: 3, monster: 2, ambush: 2 } },
      },
    ],
  ),
  // The joke classes (owner, 2026-10-25: intentionally bad, humor first).
  // Their ranks come whether the table wants them or not, and help no one.
  // The worst of all, on purpose (was the Plus-One).
  adventurer(
    "plus-one",
    "The Peasant",
    "Brought dad's pitchfork.",
    { hearts: -3, roll: { boss: -1 }, reroll20: true },
    [
      {
        title: "The Angry Peasant",
        omen: { hearts: -3, roll: { boss: -1 }, reroll20: true, satchel: 2 },
      },
      {
        title: "The Angry Mob",
        omen: { hearts: -3, roll: { boss: -1 }, reroll20: true, satchel: 2 },
      },
      {
        title: "The Peasant Revolt",
        omen: { hearts: -3, roll: { boss: -1 }, reroll20: true, satchel: 2 },
      },
    ],
  ),
  // Carries everything, drops most of it (was the Intern).
  adventurer(
    "intern",
    "The Squire",
    "Drops things.",
    { hearts: -2, satchel: 1, fumble: 2 },
    [
      {
        title: "Senior Squire",
        omen: { hearts: -2, satchel: 1, fumble: 3 },
      },
      {
        title: "Squire of the Year",
        omen: { hearts: -2, satchel: 1, fumble: 3 },
      },
      {
        title: "The Eternal Squire",
        omen: { hearts: -2, satchel: 1, fumble: 3 },
      },
    ],
  ),
  // A treasure chest that thinks it's an adventurer: all satchel, no fight,
  // and a heart less than it looks (it measured 10%, too good for a joke).
  adventurer(
    "mimic",
    "The Mimic",
    "A very confused chest.",
    { hearts: -5, satchel: 5, roll: { all: -1 } },
    [
      {
        title: "Bigger Chest",
        omen: { hearts: -5, satchel: 5, roll: { all: -1 } },
      },
      {
        title: "Storage Unit",
        omen: { hearts: -5, satchel: 5, roll: { all: -2 } },
      },
      {
        title: "Treasure Vault",
        omen: { hearts: -5, satchel: 5, roll: { all: -2 } },
      },
    ],
  ),
];

/** The joke classes: worst by design, measured apart from the rest. */
export const JOKE_CLASSES = ["plus-one", "intern", "mimic"].map(
  (id) => `dungeon.class-${id}`,
);

// Each rank's dice (2026-10-17): the enamel, then the metal.
const PALETTES: Record<string, [primary: string, secondary: string]> = {
  Barbarian: ["#8c2f1e", "#d9a441"],
  Berserker: ["#a3241c", "#e2c290"],
  Warlord: ["#5e1914", "#c9a227"],
  Destroyer: ["#3a0f0c", "#e8b04a"],
  Rogue: ["#2d3a33", "#9fb8a2"],
  Cutpurse: ["#25302b", "#c7b273"],
  Shadow: ["#1b1d26", "#8a90a8"],
  Guildmaster: ["#141a16", "#e2b84a"],
  Cleric: ["#e8e0c8", "#b08a2e"],
  Priest: ["#d8cfa8", "#6f5a2a"],
  "High Priest": ["#f2ead2", "#c4972f"],
  Saint: ["#fbf6e8", "#e0b040"],
  Wizard: ["#2e2a6e", "#c7b8f0"],
  Sorcerer: ["#3d1f6b", "#e0a8ff"],
  Archmage: ["#18234f", "#f2d47a"],
  "Grand Magus": ["#0e1638", "#ffe08a"],
  Bard: ["#7a2f5e", "#f0c27a"],
  Minstrel: ["#8f3b6e", "#b8e0d2"],
  Troubadour: ["#5e1f4a", "#ffd166"],
  "Living Legend": ["#3a1030", "#ffe9a0"],
  Paladin: ["#2f5a8c", "#e6d29a"],
  Crusader: ["#25497a", "#f0f0f0"],
  Templar: ["#1e3c66", "#d4af37"],
  Lightbringer: ["#f0e8c8", "#2f5a8c"],
  Ranger: ["#3e5e2c", "#c9b27a"],
  Tracker: ["#4a6b34", "#8a5a2e"],
  Beastmaster: ["#2e4a22", "#d98e3a"],
  "Warden of the Wild": ["#1e3a16", "#e8c060"],
  "Drunken Monk": ["#b85c1e", "#f5d76e"],
  Brawler: ["#9e4a1a", "#3a2a1a"],
  "Drunken Master": ["#c96a12", "#7a1f1f"],
  Grandmaster: ["#e8d8b0", "#a03a12"],
  Necromancer: ["#2a2f2a", "#7fd18a"],
  "Bone Caller": ["#1f2a24", "#e8e4d0"],
  Lich: ["#14201a", "#56e0b0"],
  "Lord of Bones": ["#0c1410", "#c8f0d8"],
  Alchemist: ["#3a6b5e", "#e3b04b"],
  Apothecary: ["#2f5f6b", "#d9e6b0"],
  "Master Alchemist": ["#5a3a1a", "#e8c14a"],
  Philosopher: ["#1a3a34", "#ffd870"],
  Warlock: ["#4a1030", "#e04a4a"],
  Hexblade: ["#3a0d2a", "#b44ae0"],
  Archfiend: ["#26071a", "#ff7a3a"],
  "Soul Broker": ["#2a0a2a", "#c0e0a0"],
  Knight: ["#5a6470", "#e0e4ea"],
  "Knight Errant": ["#46505c", "#d4af37"],
  "Knight Commander": ["#2a3440", "#f0e060"],
  "Lord Protector": ["#1a2230", "#ffd870"],
  Innkeeper: ["#4a2e1a", "#e8d0a0"],
  "Tavern Master": ["#5a3a20", "#f0c890"],
  "Master Brewer": ["#3a2410", "#e8c060"],
  "Lord of Feasts": ["#2a1608", "#ffd070"],
  Sellsword: ["#4a4a3a", "#b0a080"],
  "Bounty Hunter": ["#3a3a2a", "#d0a050"],
  "Legend for Hire": ["#2a2010", "#ffd070"],
  "Captain of Blades": ["#1a1408", "#f0e0a0"],
  Druid: ["#2f4a2a", "#a8c890"],
  Shapeshifter: ["#4a3a22", "#c8a070"],
  Archdruid: ["#1e3a1a", "#e0d080"],
  "Voice of the Wild": ["#24401e", "#f0e0b0"],
  "The Peasant": ["#9a9a8e", "#5a5a52"],
  "The Angry Peasant": ["#a08a6e", "#5a4a3a"],
  "The Angry Mob": ["#8a5a3a", "#e07a2a"],
  "The Peasant Revolt": ["#6a3a22", "#ff9a3a"],
  "The Squire": ["#c8c0b0", "#6a6a6a"],
  "Senior Squire": ["#bab2a2", "#5e5e5e"],
  "Squire of the Year": ["#a8a090", "#d4af37"],
  "The Eternal Squire": ["#8a8a90", "#4a4a50"],
  "The Mimic": ["#7a5a2a", "#c8a050"],
  "Bigger Chest": ["#8a6a3a", "#b89a60"],
  "Storage Unit": ["#8a8a80", "#e07a2a"],
  "Treasure Vault": ["#5a4220", "#ffd060"],
};
const palette = (title: string) => {
  const [primary, secondary] = PALETTES[title];
  return { primary, secondary };
};
for (const c of classes) {
  c.palette = palette(c.title);
  for (const e of c.evolves ?? []) e.palette = palette(e.title);
}
