import type { CardDefinition } from "../../game/types";
import { guard, keeper, moves, pair, plea, trinket, vs } from "./shared";

// The side quests (2026-10-17 as the hidden rooms behind the bookcase, the
// League's villain hideouts done as a bar; Realms, 2026-11-03): between
// the first inn and the second region, someone begs the party for help.
// Take the quest and its dungeon is dealt: two of its three guards, then
// its keeper, beaten twice, who offers spoils, ranks the adventurer up and
// lays a curse on a missed swing that holds only while the fight lasts.
// Walk on and the dungeon leaves the run. Card IDs are the hidden rooms'.
// The Quest only.

export interface HiddenRoom {
  label: string;
  intro: string;
  plea: CardDefinition;
  guards: CardDefinition[];
  keeper: CardDefinition;
}

const cottage = "Witch's Cottage";
const fort = "Bandit Fort";
const barrow = "Old Barrow";
const shrine = "Drowned Shrine";
const vault = "Sunless Vault";

export const hiddenRooms: HiddenRoom[] = [
  {
    label: "The Witch's Cottage",
    intro: "Smoke from a crooked chimney",
    plea: plea(
      "goat",
      "The Miller's Plea",
      "A miller begs: a witch took his goat, and the goat is his best friend. Everyone says 'baa' once.",
    ),
    guards: [
      guard(
        cottage,
        "peephole",
        "The Gingerbread Door",
        "A gingerbread door wants a password. Invent one in 5 seconds and sell it. Table says no: drink 3.",
        null,
      ),
      guard(
        cottage,
        "flapper-fran",
        "The Witch's Cat",
        "A black cat blocks the path and judges you. Do your best cat for 5 seconds, then roll d20.",
        vs(
          "It's not impressed. Drink 3.",
          "It purrs and lets you by. Scratch someone behind the ears; they drink 3.",
        ),
      ),
      guard(
        cottage,
        "bathtub-gin",
        "The Cauldron",
        "A cauldron of something green, and a ladle. Roll d6.",
        moves(
          [
            "It tastes like feet. Drink 3.",
            "You turn green for a minute. Drink 3.",
          ],
          [
            "Smooth, somehow. Give 2.",
            "You ladle out a round. Give 3.",
            "You find the witch's recipe book. Give 3.",
            "You bottle it and sell it. Everyone else drinks 1.",
          ],
        ),
      ),
    ],
    keeper: keeper(
      cottage,
      "the-proprietor",
      "Granny Hex",
      "Three hundred years old, and she has never lost a staring contest. Roll d20.",
      vs(
        "She turns you into a toad, briefly. Drink 4.",
        "You knock the broom out of her hand. Give 4.",
        { crit: "You steal the broom and the goat. Everyone else drinks 3." },
      ),
      {
        jinx: {
          name: "Ribbit",
          rule: "The jinxed player says 'ribbit' after every sip. Forgets: drink 1.",
        },
        drops: [
          trinket("Witch's Flask", { loot: ["draught", "draught"] }),
          trinket("Broomstick", { roll: { elite: 2, ambush: 1 } }),
        ],
      },
    ),
  },
  {
    label: "The Bandit Fort",
    intro: "Torches on a wooden wall",
    plea: plea(
      "strongbox",
      "The Merchant's Plea",
      "A merchant, robbed blind, wants his strongbox back. Everyone checks their own pockets, loudly.",
    ),
    guards: [
      guard(
        fort,
        "bottle-service",
        "The Toll Booth",
        "The bandits charge a toll to get in, and another to get out. Roll 2d6.",
        pair(
          "You pay both. Drink 3.",
          "You pay in fake coins. Give 3 to whoever looks richest.",
          "A pair! They pay you. Everyone else drinks 2.",
        ),
      ),
      guard(
        fort,
        "the-influencer",
        "The Bandit Bard",
        "Sing the bandits a song about how great they are, 10 seconds. They hate it: drink 3.",
        null,
      ),
      guard(
        fort,
        "the-bodyguard",
        "The Gatekeeper",
        "Seven feet tall, one eye, and he wants the password. Roll d20.",
        vs(
          "Wrong password. Drink 3.",
          "You walk in like you own it. Give 3 to whoever's royalty here.",
        ),
      ),
    ],
    keeper: keeper(
      fort,
      "the-promoter",
      "One-Eyed Mag",
      "The bandit chief. The strongbox is under her chair, and she's sitting on it. Roll d20.",
      vs("She robs you too. Drink 4.", "You take the strongbox. Give 4.", {
        fumble: "She recruits you. Finish your drink.",
      }),
      {
        jinx: {
          name: "Bandit's Honor",
          rule: "Nobody speaks to the jinxed player except through someone else. Slip: drink 1.",
        },
        drops: [
          trinket("Mag's Eyepatch", { hurt: { monster: -1 } }),
          trinket("Stolen Map", { roll: { ambush: 1, boss: 1 } }),
        ],
      },
    ),
  },
  {
    label: "The Old Barrow",
    intro: "A hill with a door in it",
    plea: plea(
      "barrow",
      "The Gravedigger's Plea",
      "The gravedigger says the dead won't stay down. Everyone shows their best zombie face on three.",
    ),
    guards: [
      guard(
        barrow,
        "the-accountant",
        "The Barrow Wight",
        "A dead lord in rusted armor, counting his coins, and you. Roll d20.",
        vs(
          "You're counted. Drink 3.",
          "You knock his helmet off. Give 3 to whoever owes you money.",
        ),
      ),
      guard(
        barrow,
        "security-camera",
        "The Stone Watcher",
        "Freeze like a statue for 15 seconds while the table tries to crack you. Move: drink 3.",
        null,
      ),
      guard(
        barrow,
        "the-safe",
        "The Sealed Tomb",
        "The seal is a riddle nobody remembers. Roll d6 to crack it.",
        moves(
          ["The curse goes off. Drink 3.", "Dust in your eyes. Drink 3."],
          [
            "Empty, but you look brave. Give 2.",
            "A few old coins. Give 3.",
            "Coins, and a jeweled cup. Give 3.",
            "It was a king's tomb. Everyone else drinks 1.",
          ],
        ),
      ),
    ],
    keeper: keeper(
      barrow,
      "the-manager",
      "The Barrow King",
      "A crown, a sword, and no patience for visitors. Roll d20.",
      vs(
        "He buries you, a little. Drink 4.",
        "You knock his crown off. Give 4.",
        {
          crit: "You take the crown. Everyone else drinks 3.",
        },
      ),
      {
        jinx: {
          name: "Grave Manners",
          rule: "The jinxed player bows before every sentence. Forgets: drink 1.",
        },
        drops: [
          trinket("Grave Gold", { loot: ["round", "shield"] }),
          trinket("Barrow Blade", { roll: { boss: 1, monster: 1 } }),
        ],
      },
    ),
  },
  {
    label: "The Drowned Shrine",
    intro: "Bells ringing underwater",
    plea: plea(
      "nets",
      "The Fisherman's Plea",
      "A fisherman says the old shrine sings at night and his nets come up empty. Everyone hums low.",
    ),
    guards: [
      guard(
        shrine,
        "card-sharp",
        "The Merfolk Gambler",
        "He deals you a hand of wet cards and smiles too wide. Roll 2d6 for your hand.",
        pair(
          "His hand is better. Drink 3.",
          "Full house. Give 3.",
          "A pair! Four of a kind. Everyone else drinks 2.",
        ),
      ),
      guard(
        shrine,
        "the-tell",
        "The Siren",
        "The siren only trusts liars. Tell two truths and a lie. Anyone spots the lie: you drink 3.",
        null,
      ),
      guard(
        shrine,
        "the-dealer",
        "The Drowned Priest",
        "He has prayed underwater for a hundred years and wants you to join him. Roll d20.",
        vs(
          "He blesses you, wetly. Drink 3.",
          "You ring his bell. Bless someone; they drink 3.",
        ),
      ),
    ],
    keeper: keeper(
      shrine,
      "big-mike",
      "The Sea Witch",
      "She trades in voices and has never lost a bargain. Roll d20.",
      vs("She takes your voice. Drink 4.", "You crack her shell. Give 4.", {
        crit: "You take her voice instead. Everyone else drinks 3.",
      }),
      {
        jinx: {
          name: "Voiceless",
          rule: "The jinxed player may only whisper. Speaks up: drink 1.",
        },
        drops: [
          trinket("Siren's Scale", { crit: 19 }),
          trinket("Pearl Purse", { hearts: 1, loot: ["die"] }),
        ],
      },
    ),
  },
  {
    label: "The Sunless Vault",
    intro: "Stairs into the mountain",
    plea: plea(
      "vault",
      "The Dwarf's Plea",
      "A dwarf says something big took his family's vault. Everyone strokes an imaginary beard.",
    ),
    guards: [
      guard(
        vault,
        "arm-wrestle",
        "The Last Guard",
        "The vault's last guard wants a test of strength. Arm-wrestle your right neighbor. Lose: drink 3.",
        null,
      ),
      guard(
        vault,
        "the-ref",
        "The Rune Door",
        "A door covered in runes that change when you look away. Roll d20.",
        vs(
          "The runes bite. Drink 3.",
          "It swings open. Hold the door for someone; they drink 3.",
        ),
      ),
      guard(
        vault,
        "the-undercard",
        "The Cave Troll",
        "A young cave troll, warming up on you. Roll d6.",
        moves(
          ["Club, club, club. Drink 3.", "Headlock. Drink 3."],
          [
            "You slip the club. Give 2.",
            "You counter. Give 3.",
            "You knock it down the stairs. Give 3.",
            "The dwarves cheer. Everyone else drinks 1.",
          ],
        ),
      ),
    ],
    keeper: keeper(
      vault,
      "the-undefeated",
      "The Deep Worm",
      "A worm the size of a hall, coiled around the dwarf's gold. Roll d20.",
      vs(
        "It flattens you. Drink 4.",
        "You hit it with a dwarf's hammer. Give 4.",
        {
          fumble: "It swallows you and spits you out. Finish your drink.",
        },
      ),
      {
        jinx: {
          name: "Deep Silence",
          rule: "Nobody says the word 'gold'. Slip: drink 1.",
        },
        drops: [
          trinket("Dwarven Hammer", { roll: { boss: 2 } }),
          trinket("Deepsteel Shirt", { hurt: { boss: -1 } }),
        ],
      },
    ),
  },
];

export const hiddenRoomCards: CardDefinition[] = hiddenRooms.flatMap((r) => [
  r.plea,
  ...r.guards,
  r.keeper,
]);
