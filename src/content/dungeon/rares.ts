import type { CardDefinition } from "../../game/types";
import {
  ELITE_NEED,
  FLOORS,
  GAMBLE_NEED,
  LORE,
  card,
  d20,
  elite,
  gamble,
  landing,
  moment,
  monster,
  shrine,
  treasure,
  trial,
  trinket,
  type Floor,
} from "./shared";

// Rare things (The Quest 2.0 Phase 6, 2026-11-14): cards outside a stage's
// pool that, with a set chance, replace one of its picks when the game
// starts (`rare` on the stage in `dungeon.ts`). Two a region at 0.2 a
// region; single-card stages have their own (the summons, the inns). A
// rare wears a prismatic foil and its ribbon ends "· Rare". The Quest only.
const rare = (c: CardDefinition): CardDefinition => ({
  ...c,
  ribbon: `${c.ribbon?.split(" · ")[0] ?? "The Road"} · Rare`,
});
const offers = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
  plaques: NonNullable<CardDefinition["offers"]>,
): CardDefinition => ({
  ...card(id, title, "group", rules),
  ribbon: `${FLOORS[floor]} · Rare`,
  ribbonTone: "violet",
  encounter: "shrine",
  offers: plaques,
});

/** Each region's two rares, keyed by its file's name. */
export const regionRares: Record<string, CardDefinition[]> = {
  kingsRoad: [
    rare(
      trial(
        0,
        "rare-king-in-disguise",
        "The King in Disguise",
        "A beggar who is plainly the king. The drawer chats for 20 seconds; no bowing, no saying 'king'.",
        { loot: "candy" },
      ),
    ),
    rare({
      ...shrine(
        0,
        "rare-unicorn",
        "A Unicorn",
        "A unicorn drinks from the stream. Whoever speaks first drinks 3.",
      ),
      reward: { heal: 4 },
    }),
  ],
  oldForest: [
    rare({
      ...card(
        "rare-sword-in-the-stone",
        "The Sword in the Stone",
        "challenge",
        "A sword in a stone, and a queue of failed knights, all compensating. The drawer may pull. Roll d20.",
        {
          ...d20(
            17,
            "Stuck. The knights laugh. Drink 3.",
            "It slides out. Everyone kneels to the drawer.",
            {
              crit: "It slides out like it was waiting. The knights weep. Everyone else drinks 3.",
            },
          ),
          choice: { skip: "Leave it", roll: "Pull" },
        },
      ),
      ribbon: "Old Forest · Rare",
      ribbonTone: "violet",
      encounter: "relic",
      battle: true,
      damage: 1,
      boon: trinket("Kingmaker", { roll: { all: 2 } }),
    }),
    {
      ...offers(
        3,
        "rare-sleeping-giant",
        "The Sleeping Giant",
        "A giant asleep across the path, snoring. Everyone holds their breath.",
        [
          { label: "Tiptoe past", jinx: true },
          { label: "Wake him", elite: true },
        ],
      ),
      jinx: {
        name: "Tiptoe",
        rule: "The cursed player whispers. Speaks up: drink 1.",
      },
    },
  ],
  marsh: [
    offers(
      6,
      "rare-wishing-frog",
      "The Wishing Frog",
      "A frog in a crown offers three wishes, but you only get one. The drawer chooses.",
      [
        { label: "Health", heal: 3 },
        { label: "A potion", loot: "draught" },
        { label: "Glory", cost: 2, evolve: true },
      ],
    ),
    offers(
      6,
      "rare-will-o-wisp",
      "The Will-o'-Wisp",
      "A blue light bobs off the path, singing your name. Everyone hums along.",
      [{ label: "Follow it", cost: 1, ...LORE }, { label: "Stay on the path" }],
    ),
  ],
  crypt: [
    rare(
      treasure(
        1,
        "rare-your-own-grave",
        "Your Own Grave",
        "A headstone with tonight's date and the drawer's name. Everyone toasts.",
        "revive",
      ),
    ),
    rare({
      ...trial(
        1,
        "rare-death-playing-chess",
        "Death, Playing Chess",
        "Death challenges the table's champion to rock-paper-scissors, best of three.",
      ),
      reward: { heal: 5 },
      damage: 2,
    }),
  ],
  mines: [
    rare({
      ...gamble(
        4,
        "rare-mother-lode",
        "The Mother Lode",
        "A seam of gold that goes on forever. The drawer digs. Roll d20.",
        "The tunnel caves. Drink 4.",
        "Gold! Dig again, or walk away rich.",
        ["die", "draught", "shield", "candy", "revive"],
      ),
      dice: d20(
        GAMBLE_NEED[1],
        "The tunnel caves. Drink 4.",
        "Gold! Dig again, or walk away rich.",
        { crit: "A nugget the size of a head! Everyone else drinks 3." },
      ),
    }),
    rare(
      elite(
        4,
        "rare-thing-below",
        "The Thing Below",
        "Something huge moves under the mine. The drawer goes down to meet it. Roll d20.",
        "It goes back to sleep on you. Drink 5.",
        "It flees deeper. Give 5.",
        [
          trinket("Deepsteel Axe", { roll: { boss: 2, elite: 1 } }),
          trinket("Deepsteel Mail", { hearts: 2 }),
        ],
      ),
    ),
  ],
  tower: [
    offers(
      7,
      "rare-wizard-is-home",
      "The Wizard Is Home",
      "The wizard's home, in slippers and nothing else, and delighted. Everyone compliments the tower.",
      [
        { label: "Tea · drink 4", loot: "candy" },
        { label: "An argument", elite: true },
      ],
    ),
    offers(
      7,
      "rare-oldest-apprentice",
      "The Oldest Apprentice",
      "An apprentice of ninety, still sweeping. The drawer asks what he has learned.",
      [
        { label: "Dragons · drink 2", ...LORE },
        {
          label: "Borrow his hat",
          boon: trinket("Apprentice's Hat", { hearts: 1 }),
        },
      ],
    ),
  ],
  coast: [
    rare(
      trial(
        2,
        "rare-ghost-ship",
        "The Ghost Ship",
        "A ghost ship wants a shanty. Everyone sings a line in turn; a stumble loses it.",
        { loot: "die" },
      ),
    ),
    rare({
      ...shrine(
        2,
        "rare-mermaids-kiss",
        "A Mermaid's Kiss",
        "A mermaid kisses the drawer, who may not speak until their next turn.",
      ),
      reward: { heal: 3 },
    }),
  ],
  caverns: [
    rare({
      ...monster(
        5,
        "rare-dragons-egg",
        "A Dragon's Egg",
        "A dragon egg, warm, in a nest of slag, and its mother is out. Roll d20.",
        "It bites. Drink 4.",
        "It hatches, and decides the drawer is its mother. Give 4.",
      ),
      dice: d20(
        ELITE_NEED[2],
        "It bites. Drink 4.",
        "It hatches, and decides the drawer is its mother. Give 4.",
      ),
      reward: { ally: true },
      ally: {
        name: "The Hatchling",
        calling: ["boss"],
        bonus: 5,
        ritual: "Everyone coos when it is named.",
      },
    }),
    offers(
      5,
      "rare-forge-of-kings",
      "The Forge of Kings",
      "The forge where the old kings' swords were made, still burning. Everyone feels the heat.",
      [
        {
          label: "Reforge",
          cost: 2,
          boon: trinket("Kingsforge Blade", { roll: { boss: 2, elite: 1 } }),
        },
        { label: "Warm your hands", heal: 1 },
      ],
    ),
  ],
  frozenPass: [
    rare(
      moment(
        8,
        "rare-yetis-tea-party",
        "The Yeti's Tea Party",
        "A yeti pours tea for everyone. Everyone pours for their left neighbor.",
        2,
      ),
    ),
    offers(
      8,
      "rare-old-dragonslayer",
      "The Old Dragonslayer",
      "An old dragonslayer on a rock, missing an arm and one ball. Everyone asks him one question.",
      [
        { label: "Listen · drink 3", ...LORE },
        { label: "Spar", elite: true },
      ],
    ),
  ],
};

/** The rare King's Summons. */
export const summonsRare: CardDefinition = {
  ...card(
    "summons-letter",
    "A Letter",
    "group",
    "'{dragon} here. Stop sending heroes. I'm out of room.' The drawer reads it as the dragon.",
  ),
  ribbon: "The Summons · Rare",
  ribbonTone: "pearl",
  encounter: "shrine",
};

/** The first inn's rares: an inn that is a mimic, and the Company asleep. */
export const innRares: CardDefinition[] = [
  {
    ...card(
      "inn-mimic",
      "The Inn Is a Mimic",
      "challenge",
      "The inn has teeth. The drawer fights their way out of bed. Roll d20.",
      d20(9, "It chews. Drink 4.", "You escape with the larder. Give 4."),
    ),
    ribbon: "Inn · Rare",
    ribbonTone: "violet",
    encounter: "monster",
    battle: true,
    damage: 2,
    reward: { heal: 3, loot: "draught" },
  },
  {
    ...landing(
      "companys-table",
      "The Company's Table",
      "The Gilded Company, asleep at the inn's best table. Everyone tiptoes.",
    ),
    ribbon: "Inn · Rare",
    offers: [
      { label: "Take a potion", loot: "draught" },
      { label: "Draw on Chad", deed: "drew-on-chad" },
    ],
  },
];

/** The Last Inn's rare: the dragonslayer's widow. */
export const lastInnRare: CardDefinition = {
  ...landing(
    "slayers-widow",
    "The Slayer's Widow",
    "She keeps the inn now, and her husband's sword over the fire. Everyone raises a glass to him.",
  ),
  ribbon: "Inn · Rare",
  offers: [
    {
      label: "Toast him",
      boon: trinket("Dragonbane", { roll: { boss: 2 } }),
    },
    { label: "Ask · drink 2", ...LORE },
  ],
};
