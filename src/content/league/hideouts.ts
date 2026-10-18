import type { CardDefinition } from "../../game/types";
import { grunt, moves, pair, villain, vs } from "./journey";

// After the fourth badge the run detours through one villain team's hideout,
// picked when the game starts: two of its three grunts, then its boss, who
// has to be beaten twice. Never write Team HP or items into these rules.

const hideout = (
  team: string,
  label: string,
  intro: string,
  grunts: CardDefinition[],
  boss: CardDefinition,
) => ({ team, label, intro, grunts, boss });

export const hideouts = [
  hideout(
    "Team Rocket",
    "Rocket Hideout",
    "Team Rocket's hideout",
    [
      grunt(
        "Team Rocket",
        "rocket-grunt-slots",
        "Rocket Grunt",
        "A Rocket Grunt guards the basement under the Game Corner. He has a Zubat. Of course. Roll 2d6.",
        pair(
          "Zubat. Of course. Drink 3.",
          "He gives up the Lift Key. Give 3.",
          "A pair! Jackpot on the slots upstairs. Give {total}.",
        ),
      ),
      grunt(
        "Team Rocket",
        "rocket-grunt-slowpoke",
        "Slowpoke Tail Seller",
        "A Grunt is selling Slowpoke Tails. They're still twitching. Roll d20.",
        vs(
          "You bought one. Drink 3, slowly.",
          "You free the Slowpoke. Give 3, very slowly.",
        ),
        { curse: "bleed" },
      ),
      grunt(
        "Team Rocket",
        "rocket-grunt-spinner",
        "Spinner Tiles",
        "Spinner tiles! A Grunt laughs while you spin in your chair. Then roll d20.",
        vs(
          "Dizzy and beaten. Drink 3, then stand and walk a straight line.",
          "You spin into him. Give 3.",
        ),
      ),
    ],
    villain(
      "Team Rocket",
      "boss-giovanni",
      "Giovanni",
      "Giovanni strokes his Persian and doesn't look up. Roll d6.",
      moves(
        ["Persian's Slash. Drink 5.", "Earthquake. Drink 4 and kiss his ring."],
        [
          "He looks up. Give 4.",
          "Team Rocket disbands. For now. Give 4.",
          "Persian switches sides. Give 4 and meow.",
          "He says you remind him of his son. Give 5.",
        ],
      ),
    ),
  ),
  hideout(
    "Team Magma",
    "Magma Hideout",
    "Team Magma's volcano",
    [
      grunt(
        "Team Magma",
        "magma-grunt-hood",
        "Magma Grunt",
        "A Magma Grunt in a red hood wants more land. Stand up and claim your chair. Roll d20.",
        vs("He claims your chair. Drink 3 standing.", "Your land now. Give 3."),
      ),
      grunt(
        "Team Magma",
        "magma-grunt-sweat",
        "Sweaty Grunt",
        "A Grunt inside a volcano in a full hoodie. He is so sweaty. Roll d20.",
        vs(
          "He hugs you. Drink 3 and fan yourself.",
          "He passes out from heat. Everyone in a hoodie or jacket drinks 2.",
        ),
      ),
      grunt(
        "Team Magma",
        "magma-admin-tabitha",
        "Tabitha",
        "Admin Tabitha laughs like a cartoon villain. Laugh back like one, then roll 2d6.",
        pair(
          "His laugh wins. Drink 3.",
          "Yours wins. Give 3.",
          "A pair! Everyone laughs evilly; the worst laugh drinks 3.",
        ),
        { curse: "bleed" },
      ),
    ],
    villain(
      "Team Magma",
      "boss-maxie",
      "Maxie",
      "Maxie pushes up his glasses and wakes Groudon. The room heats up. Roll d20.",
      vs(
        "Drought. Fan yourself, then drink 5.",
        "Groudon goes back to sleep. Give 4.",
      ),
      "bleed",
    ),
  ),
  hideout(
    "Team Aqua",
    "Aqua Hideout",
    "Team Aqua's sea cave",
    [
      grunt(
        "Team Aqua",
        "aqua-grunt-bandana",
        "Aqua Grunt",
        "An Aqua Grunt in a bandana wants more sea. Spit your drink back in the glass. Roll d20.",
        vs(
          "More sea for him. Drink 3, and add a splash of water to your drink.",
          "You stay dry. Whoever's drink is fullest drinks 2.",
        ),
      ),
      grunt(
        "Team Aqua",
        "aqua-grunt-submarine",
        "Submarine Thief",
        "A Grunt is stealing a submarine. He asks you to look away. Roll d6.",
        moves(
          [
            "You looked away. Drink 3.",
            "You helped him park it. Drink 3 and salute.",
          ],
          [
            "You sink his plan. Give 3.",
            "You steal the sub. Give 3.",
            "A Wailord rams it. Give 3.",
            "He surfaces in the wrong ocean. Give 4.",
          ],
        ),
      ),
      grunt(
        "Team Aqua",
        "aqua-admin-shelly",
        "Shelly",
        "Admin Shelly yawns at you. Everyone yawns. Roll d20.",
        vs(
          "Asleep. Drink 3 with your eyes shut.",
          "Awake. The first player who yawned drinks 2.",
        ),
        { curse: "hex" },
      ),
    ],
    villain(
      "Team Aqua",
      "boss-archie",
      "Archie",
      "Archie rips his shirt open and wakes Kyogre. It starts raining indoors. Roll d20.",
      vs(
        "Drenched. Drink 5 and wring out your shirt.",
        "Kyogre goes back to sleep and Archie buttons his shirt. Give 4.",
      ),
    ),
  ),
  hideout(
    "Team Galactic",
    "Galactic HQ",
    "Team Galactic's headquarters",
    [
      grunt(
        "Team Galactic",
        "galactic-grunt-bowl",
        "Galactic Grunt",
        "A Galactic Grunt with a bowl cut that's also a uniform. Roll 2d6.",
        pair(
          "Bowl cut to the face. Drink 3.",
          "You laugh at the haircut. Whoever had the worst haircut as a kid drinks 3.",
          "A pair! You give him a trim. Give {total}.",
        ),
      ),
      grunt(
        "Team Galactic",
        "galactic-commander-mars",
        "Mars",
        "Commander Mars wants your Pokémon for science. Roll d20.",
        vs("For science. Drink 3.", "Science denied. Give 3."),
        {
          jinx: {
            name: "Lab Rat",
            rule: "Everyone calls the jinxed player Subject 7. Slip: drink 1.",
          },
        },
      ),
      grunt(
        "Team Galactic",
        "galactic-scientist-charon",
        "Charon",
        "Charon the scientist cackles and points a ray gun at the drawer. Roll d6.",
        moves(
          [
            "Zapped. Drink 3.",
            "Shrink ray. Drink 2, and talk tiny until your next turn.",
          ],
          [
            "The gun was a hairdryer. Give 3.",
            "It zaps his own foot. Give 3.",
            "You take the gun. Give 3.",
            "It zaps your left neighbor. They drink 3.",
          ],
        ),
        { curse: "hex" },
      ),
    ],
    villain(
      "Team Galactic",
      "boss-cyrus",
      "Cyrus",
      "Cyrus wants to erase all emotion. Everyone hold a straight face while the drawer rolls d20.",
      vs(
        "Feelings erased. Drink 5 without any expression.",
        "Cyrus learns to feel. The first player who smiled drinks 3.",
      ),
      "hex",
    ),
  ),
  hideout(
    "Team Plasma",
    "Plasma Castle",
    "Team Plasma's castle",
    [
      grunt(
        "Team Plasma",
        "plasma-grunt-knight",
        "Plasma Grunt",
        "A Plasma Grunt dressed as a knight tells you to free your Pokémon. Roll d20.",
        vs(
          "Freed and beaten. Drink 3, and your left neighbor sips your drink.",
          "You keep them. Give 3.",
        ),
      ),
      grunt(
        "Team Plasma",
        "plasma-sage",
        "Sage",
        "One of the Seven Sages lectures you about Pokémon liberation. Roll d20.",
        vs(
          "Lectured. Drink 3, then lecture the table for five seconds.",
          "You walk out. Give 3.",
        ),
      ),
      grunt(
        "Team Plasma",
        "plasma-n",
        "N",
        "N rambles about truth and ideals. Your left neighbor does N for 5 seconds; you roll 2d6.",
        pair(
          "You can't keep up. Drink 3.",
          "N spins away on a Ferris wheel. Give 3.",
          "A pair! N asks you onto the Ferris wheel. Pick a date; you both give 3.",
        ),
      ),
    ],
    villain(
      "Team Plasma",
      "boss-ghetsis",
      "Ghetsis",
      "Ghetsis, in a cape with eyes on it, calls you a worthless trash. Roll d20.",
      vs(
        "Worthless. Drink 5 and call yourself trash.",
        "His cape rips. Give 4.",
      ),
      "bleed",
    ),
  ),
  hideout(
    "Team Flare",
    "Flare Lab",
    "Team Flare's lab",
    [
      grunt(
        "Team Flare",
        "flare-grunt-suit",
        "Flare Grunt",
        "A Flare Grunt in a red suit says your outfit is ugly. Defend your outfit and roll d20.",
        vs(
          "It's ugly. Drink 3, and the table rates your outfit out of 10.",
          "Fashion wins. The table points at the worst-dressed player; they drink 3.",
        ),
      ),
      grunt(
        "Team Flare",
        "flare-scientist",
        "Flare Scientist",
        "A Flare scientist in orange goggles shows you a doomsday weapon. Roll d6.",
        moves(
          [
            "It works. Drink 3.",
            "It's a laser pointer, aimed at your eye. Drink 3.",
          ],
          [
            "It's a toaster. Give 3.",
            "It's a hair straightener. Give 3.",
            "It explodes in his hand. Give 3.",
            "It's a disco ball. Everyone dances; the stiffest drinks 3.",
          ],
        ),
        { curse: "bleed" },
      ),
      grunt(
        "Team Flare",
        "flare-admin",
        "Flare Admin",
        "A Flare admin charges five million to join. Roll d20.",
        vs(
          "You paid. Drink 3 and compliment everyone's outfit.",
          "You talk her down. Give 3.",
        ),
      ),
    ],
    villain(
      "Team Flare",
      "boss-lysandre",
      "Lysandre",
      "Lysandre's hair is on fire, figuratively. He wants a beautiful world. Roll 2d6.",
      pair(
        "Beautiful. Drink 5.",
        "The ultimate weapon misfires. Give 4.",
        "A pair! His hair catches fire for real. Give {total}.",
      ),
    ),
  ),
  hideout(
    "Team Skull",
    "Shady House",
    "Team Skull's Shady House",
    [
      grunt(
        "Team Skull",
        "skull-grunt-yo",
        "Skull Grunt",
        "A Skull Grunt does the Skull pose and says YO. Everyone does the pose. Roll d20.",
        vs(
          "YO. Do the Skull pose, then drink 3.",
          "No YO. The table picks the worst pose; that player drinks 2.",
        ),
      ),
      grunt(
        "Team Skull",
        "skull-grunt-rap",
        "Rapping Grunt",
        "A Skull Grunt raps at you badly. Rap back four lines, then roll d20.",
        vs("His bars were better. Drink 3.", "No bars. Give 3, in rhyme."),
      ),
      grunt(
        "Team Skull",
        "skull-admin-plumeria",
        "Plumeria",
        "Big sis Plumeria wants to know why you hurt her boys. Roll d6.",
        moves(
          [
            "She hurts you. Drink 3.",
            "She calls your mom. Drink 3 and apologize.",
          ],
          [
            "She respects you. Give 3.",
            "She lets her boys go home. Give 3.",
            "She buys you a drink. Give 4.",
            "She joins your side. Give 4.",
          ],
        ),
        { curse: "bleed" },
      ),
    ],
    villain(
      "Team Skull",
      "boss-guzma",
      "Guzma",
      "Guzma is the hated boss who beats you down. He says so himself. Roll d20.",
      vs(
        'Beaten down. Drink 5, and shout "Guzma!" like he does.',
        "Guzma, what is you doing? Give 4.",
      ),
    ),
  ),
  hideout(
    "Macro Cosmos",
    "Rose Tower",
    "Rose Tower",
    [
      grunt(
        "Macro Cosmos",
        "cosmos-oleana",
        "Oleana",
        "Oleana, Chairman Rose's secretary, has a meeting with you. Roll d20.",
        vs(
          "The meeting ran long. Drink 3 and summarize it for the table.",
          "Meeting cancelled. Give 3.",
        ),
      ),
      grunt(
        "Macro Cosmos",
        "cosmos-intern",
        "Macro Intern",
        "An intern asks you to fill out a feedback survey before battling. Roll d6.",
        moves(
          [
            "Twenty questions. Drink 3.",
            "Mandatory feedback. Drink 2 and name one thing the table could do better.",
          ],
          [
            "You lie on the survey. Give 3.",
            "You give it five stars. Give 3.",
            "You fill it out for him. Give 3.",
            "He quits. Give 4.",
          ],
        ),
      ),
      grunt(
        "Macro Cosmos",
        "cosmos-security",
        "Tower Security",
        "Tower Security wants your badge. Not that badge, your ID badge. Roll d20.",
        vs(
          "You don't have one. Drink 3 and say your full name.",
          "You walk right past. Give 3.",
        ),
        { curse: "hex" },
      ),
    ],
    villain(
      "Macro Cosmos",
      "boss-rose",
      "Chairman Rose",
      "Chairman Rose woke Eternatus to fix the energy crisis a thousand years early. Roll 2d6.",
      pair(
        "Darkest Day. Drink 5 with your eyes shut.",
        "The lights stay on. Give 4.",
        "A pair! You pull his plug. Give {total}.",
      ),
      "hex",
    ),
  ),
  hideout(
    "Team Star",
    "Star Base",
    "Team Star's base",
    [
      grunt(
        "Team Star",
        "star-grunt-dance",
        "Star Grunt",
        "A Team Star grunt does the Star Shuffle. Do it with her, then roll d20.",
        vs(
          "Starstruck. Shuffle while you drink 3.",
          "You shuffle past. Give 3.",
        ),
      ),
      grunt(
        "Team Star",
        "star-car",
        "Starmobile",
        "A boss revs a Starmobile, a car made of Revavroom. Rev with your mouth, roll 2d6.",
        pair(
          "Run over. Drink 3.",
          "It stalls. Give 3.",
          "A pair! You hijack it. Give {total}.",
        ),
      ),
      grunt(
        "Team Star",
        "star-squad",
        "Star Squad",
        "Thirty grunts. Thirty seconds. Everyone points at the drawer. Roll d20.",
        vs(
          "Overrun. Drink {total}.",
          "Thirty down. Everyone who pointed drinks 1.",
          {
            fumble:
              "Thirty grunts sit on you. Drink 4, and everyone who pointed points again.",
          },
        ),
        { curse: "bleed" },
      ),
    ],
    villain(
      "Team Star",
      "boss-cassiopeia",
      "Cassiopeia",
      "Cassiopeia was the Champion's classmate all along. Plot twist. Roll d6.",
      moves(
        [
          "Twist. Drink 5.",
          "Double twist: she's also your left neighbor. You both drink 3.",
        ],
        [
          "Team Star disbands. Give 4.",
          "She hands over the Star Badge. Give 4.",
          "Everyone makes up. Give 4.",
          "She cries. Give 5.",
        ],
      ),
    ),
  ),
];

export const hideoutCards: CardDefinition[] = hideouts.flatMap((h) => [
  ...h.grunts,
  h.boss,
]);
