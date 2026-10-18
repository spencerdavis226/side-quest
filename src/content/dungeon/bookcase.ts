import type { CardDefinition } from "../../game/types";
import { guard, keeper, moves, pair, trinket, vs } from "./shared";

// Behind the bookcase (2026-10-17, the League's villain hideouts done as a
// bar): between the first landing and the second floor, the party finds one
// of five hidden rooms. Two of its three guards, then its keeper, beaten
// twice, who offers spoils and lays a jinx on a missed swing that holds only
// while the fight lasts. Pub Crawl only.

export interface HiddenRoom {
  label: string;
  intro: string;
  guards: CardDefinition[];
  keeper: CardDefinition;
}

const speakeasy = "Speakeasy";
const vip = "VIP Room";
const office = "Back Office";
const poker = "Poker Night";
const basement = "Basement";

export const hiddenRooms: HiddenRoom[] = [
  {
    label: "The Speakeasy",
    intro: "Behind the bookcase",
    guards: [
      guard(
        speakeasy,
        "peephole",
        "The Peephole",
        "A slot opens. Invent a password in 5 seconds and sell it. Table says no: drink 3.",
        null,
      ),
      guard(
        speakeasy,
        "flapper-fran",
        "Flapper Fran",
        "Fran challenges you to a Charleston. Do five seconds of it, then roll d20.",
        vs("Two left feet. Drink 3.", "The room applauds. Give 3."),
      ),
      guard(
        speakeasy,
        "bathtub-gin",
        "Bathtub Gin",
        "A bathtub full of homemade gin, and a ladle. Roll d6.",
        moves(
          [
            "It tastes like a radiator. Drink 3.",
            "You go blind for a minute. Drink 3.",
          ],
          [
            "Smooth, somehow. Give 2.",
            "You ladle out a round. Give 3.",
            "You find the still's off switch. Give 3.",
            "You bottle it and sell it. Everyone else drinks 1.",
          ],
        ),
      ),
    ],
    keeper: keeper(
      speakeasy,
      "the-proprietor",
      "The Proprietor",
      "A bootlegger, dead since Prohibition, still running the room. Roll d20.",
      vs(
        "He pours you the bathtub special. Drink 4.",
        "You tip off the feds. Give 4.",
        { crit: "You buy the place. Everyone else drinks 3." },
      ),
      {
        jinx: {
          name: "Prohibition",
          rule: "Nobody says the word 'drink'. Slip: drink 1.",
        },
        drops: [
          trinket("Bootlegger's Flask", { loot: ["draught", "draught"] }),
          trinket("The Password", { roll: { elite: 2, ambush: 1 } }),
        ],
      },
    ),
  },
  {
    label: "The VIP Room",
    intro: "Past the velvet rope",
    guards: [
      guard(
        vip,
        "bottle-service",
        "Bottle Service",
        "A server brings a sparkler bottle and a bill for $900. Roll 2d6.",
        pair(
          "You sign it. Drink 3.",
          "It was for the next table. Give 3.",
          "A pair! It's on the house. Everyone else drinks 2.",
        ),
      ),
      guard(
        vip,
        "the-influencer",
        "The Influencer",
        "Take the most flattering photo of the table in 10 seconds. The table hates it: drink 3.",
        null,
      ),
      guard(
        vip,
        "the-bodyguard",
        "The Bodyguard",
        "Six-five, an earpiece, no neck. He wants to see your wristband. Roll d20.",
        vs("No wristband. Drink 3.", "You walk in like you own it. Give 3."),
      ),
    ],
    keeper: keeper(
      vip,
      "the-promoter",
      "The Promoter",
      "He's put your name on a list. You don't know which list. Roll d20.",
      vs("The bad list. Drink 4.", "You're on his list now. Give 4.", {
        fumble: "You're the promoter now. Finish your drink.",
      }),
      {
        jinx: {
          name: "Talk to My Agent",
          rule: "Nobody speaks to the jinxed player except through someone else. Slip: drink 1.",
        },
        drops: [
          trinket("Velvet Rope", { hurt: { monster: -1 } }),
          trinket("The Guest List", { roll: { ambush: 1, boss: 1 } }),
        ],
      },
    ),
  },
  {
    label: "The Back Office",
    intro: "A door marked PRIVATE",
    guards: [
      guard(
        office,
        "the-accountant",
        "The Accountant",
        "He's found a discrepancy in the books, and it's you. Roll d20.",
        vs("Audited. Drink 3.", "You find his discrepancy. Give 3."),
      ),
      guard(
        office,
        "security-camera",
        "The Security Camera",
        "Freeze like a statue for 15 seconds while the table tries to crack you. Move: drink 3.",
        null,
      ),
      guard(
        office,
        "the-safe",
        "The Safe",
        "The combination is somebody's birthday. Guess whose and roll d6.",
        moves(
          ["The alarm goes off. Drink 3.", "A dye pack. Drink 3, blue."],
          [
            "It's empty. Give 2.",
            "Petty cash. Give 3.",
            "Petty cash and a bottle. Give 3.",
            "It was the owner's birthday. Everyone else drinks 1.",
          ],
        ),
      ),
    ],
    keeper: keeper(
      office,
      "the-manager",
      "The Manager",
      "He needs you to come in on Saturday. He's not asking. Roll d20.",
      vs("You're working Saturday. Drink 4.", "You quit, loudly. Give 4.", {
        crit: "You get his job. Everyone else drinks 3.",
      }),
      {
        jinx: {
          name: "Per My Last Email",
          rule: "The jinxed player starts every sentence with 'Per my last email'. Forget: drink 1.",
        },
        drops: [
          trinket("Petty Cash", { loot: ["round", "shield"] }),
          trinket("Employee of the Month", { roll: { boss: 1, monster: 1 } }),
        ],
      },
    ),
  },
  {
    label: "Poker Night",
    intro: "A card game in the back",
    guards: [
      guard(
        poker,
        "card-sharp",
        "The Card Sharp",
        "He deals you in with a smile you don't like. Roll 2d6 for your hand.",
        pair(
          "Two pair. His is better. Drink 3.",
          "Full house. Give 3.",
          "A pair! Four of a kind. Everyone else drinks 2.",
        ),
      ),
      guard(
        poker,
        "the-tell",
        "The Tell",
        "Tell two truths and a lie. Anyone at the table spots the lie: drink 3.",
        null,
      ),
      guard(
        poker,
        "the-dealer",
        "The Dealer",
        "She's dealing from the bottom of the deck and smiling about it. Roll d20.",
        vs("Busted. Drink 3.", "You catch her. Give 3."),
      ),
    ],
    keeper: keeper(
      poker,
      "big-mike",
      "Big Mike",
      "He has never lost a hand, and he plays with real money and fake teeth. Roll d20.",
      vs("Big Mike takes the pot. Drink 4.", "You call his bluff. Give 4.", {
        crit: "You take the pot and his teeth. Everyone else drinks 3.",
      }),
      {
        jinx: {
          name: "Poker Face",
          rule: "The jinxed player may not smile. Caught: drink 1.",
        },
        drops: [
          trinket("Ace Up the Sleeve", { crit: 19 }),
          trinket("Big Mike's Pot", { hearts: 1, loot: ["die"] }),
        ],
      },
    ),
  },
  {
    label: "The Basement",
    intro: "Down the stairs nobody uses",
    guards: [
      guard(
        basement,
        "arm-wrestle",
        "The Arm Wrestle",
        "Arm-wrestle the player on your right, best of one. Lose: drink 3.",
        null,
      ),
      guard(
        basement,
        "the-ref",
        "The Ref",
        "A ref with one rule: there are no rules. Roll d20.",
        vs("He calls it on you. Drink 3.", "He raises your hand. Give 3."),
      ),
      guard(
        basement,
        "the-undercard",
        "The Undercard",
        "The undercard fighter is warming up, on you. Roll d6.",
        moves(
          ["Jab, jab, hook. Drink 3.", "Headlock. Drink 3."],
          [
            "You duck. Give 2.",
            "You counter. Give 3.",
            "You knock him out of the ring. Give 3.",
            "The crowd lifts you up. Everyone else drinks 1.",
          ],
        ),
      ),
    ],
    keeper: keeper(
      basement,
      "the-undefeated",
      "The Undefeated",
      "He has a belt, a mouthguard and a grudge he can't remember starting. Roll d20.",
      vs("Down for the count. Drink 4.", "You take the belt. Give 4.", {
        fumble: "You go through a table. Finish your drink.",
      }),
      {
        jinx: {
          name: "First Rule",
          rule: "Nobody talks about the basement. Mention it: drink 1.",
        },
        drops: [
          trinket("The Belt", { roll: { boss: 2 } }),
          trinket("Mouthguard", { hurt: { boss: -1 } }),
        ],
      },
    ),
  },
];

export const hiddenRoomCards: CardDefinition[] = hiddenRooms.flatMap((r) => [
  ...r.guards,
  r.keeper,
]);
