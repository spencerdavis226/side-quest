import type { CardDefinition } from "../../game/types";
import { grunt, gruntStrike, moves, pair, villain, vs } from "./journey";

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
      gruntStrike(
        "Team Rocket",
        "rocket-grunt-slowpoke",
        "Slowpoke Tail Seller",
        "A Grunt is selling Slowpoke Tails. They're still twitching.",
        {
          even: "You buy one out of fear. Drink 2, slowly.",
          advantage: "You free the Slowpoke. Give 4, very slowly.",
          disadvantage: "He sells you two. Drink 5, slowly.",
        },
        { curse: "bleed" },
      ),
      gruntStrike(
        "Team Rocket",
        "rocket-grunt-spinner",
        "Spinner Tiles",
        "Spinner tiles! A Grunt laughs while you spin in your chair.",
        {
          even: "Dizzy. Drink 2.",
          advantage: "You spin into him. Give 3.",
          disadvantage: "Dizzy and beaten. Drink 5, then walk a straight line.",
        },
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
          "He finally looks worried. Give 4.",
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
      gruntStrike(
        "Team Magma",
        "magma-grunt-hood",
        "Magma Grunt",
        "A Magma Grunt in a red hood wants more land. Stand up and claim your chair.",
        {
          even: "You hold the chair. Drink 2.",
          advantage: "He gets the floor. Give 3.",
          disadvantage: "He takes the chair. Drink 5 standing.",
        },
      ),
      gruntStrike(
        "Team Magma",
        "magma-grunt-sweat",
        "Sweaty Grunt",
        "A Grunt inside a volcano in a full hoodie. He is so sweaty.",
        {
          even: "He hugs you. Drink 2.",
          advantage: "He faints from the heat. Give 3.",
          disadvantage: "Eruption. Drink 5.",
        },
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
        { rank: "Admin", curse: "bleed" },
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
      gruntStrike(
        "Team Aqua",
        "aqua-grunt-bandana",
        "Aqua Grunt",
        "An Aqua Grunt in a bandana wants more sea. Spit your drink back in the glass.",
        {
          even: "Soggy. Drink 2.",
          advantage: "He floods himself. Give 3.",
          disadvantage: "Tidal wave. Drink 5.",
        },
      ),
      gruntStrike(
        "Team Aqua",
        "aqua-grunt-submarine",
        "Submarine Thief",
        "A Grunt is stealing a submarine. He asks you to look away.",
        {
          even: "You look away. Drink 2.",
          advantage: "You report him. Give 3.",
          disadvantage: "He steals your drink too. Drink 5.",
        },
      ),
      grunt(
        "Team Aqua",
        "aqua-admin-shelly",
        "Shelly",
        "Admin Shelly yawns at you, big. Everyone else: don't yawn back. Roll d20.",
        vs(
          "Asleep. Drink 3 with your eyes shut.",
          "Awake. Anyone who yawned drinks 2.",
        ),
        { rank: "Admin", curse: "hex" },
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
      gruntStrike(
        "Team Galactic",
        "galactic-grunt-bowl",
        "Galactic Grunt",
        "A Galactic Grunt with a bowl cut that's also a uniform.",
        {
          even: "You can't stop staring. Drink 2.",
          advantage: "You cut the bowl. Give 3.",
          disadvantage: "Poison Jab. Drink 5.",
        },
      ),
      grunt(
        "Team Galactic",
        "galactic-commander-mars",
        "Mars",
        "Commander Mars wants your Pokémon for science. Roll d20.",
        vs("For science. Drink 3.", "Science denied. Give 3."),
        {
          rank: "Commander",
          jinx: {
            name: "Lab Rat",
            rule: "Everyone calls the jinxed player Subject 7. Slip: drink 1.",
          },
        },
      ),
      gruntStrike(
        "Team Galactic",
        "galactic-scientist-charon",
        "Charon",
        "Charon the scientist cackles and points a ray gun at you.",
        {
          even: "Zap. Drink 2.",
          advantage: "You swap its batteries. Give 3.",
          disadvantage: "Full blast. Drink 5.",
        },
        { rank: "Scientist", curse: "hex" },
      ),
    ],
    villain(
      "Team Galactic",
      "boss-cyrus",
      "Cyrus",
      "Cyrus wants to erase all emotion. Everyone hold a straight face while the drawer rolls d20.",
      vs(
        "Feelings erased. Drink 5 without any expression.",
        "Cyrus flinches. The first player who smiled drinks 3.",
      ),
      "hex",
    ),
  ),
  hideout(
    "Team Plasma",
    "Plasma Castle",
    "Team Plasma's castle",
    [
      gruntStrike(
        "Team Plasma",
        "plasma-grunt-knight",
        "Plasma Grunt",
        "A Plasma Grunt dressed as a knight tells you to free your Pokémon.",
        {
          even: "You nod politely. Drink 2.",
          advantage: "You free his Pokémon instead. Give 3.",
          disadvantage: "He lectures you. Drink 5.",
        },
      ),
      gruntStrike(
        "Team Plasma",
        "plasma-sage",
        "Sage",
        "One of the Seven Sages lectures you about Pokémon liberation.",
        {
          even: "You sit through it. Drink 2.",
          advantage: "You win the debate. Give 3.",
          disadvantage: "Three more lectures. Drink 5.",
        },
        { rank: "Sage" },
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
        { rank: "King" },
      ),
    ],
    villain(
      "Team Plasma",
      "boss-ghetsis",
      "Ghetsis",
      "Ghetsis, in a cape with eyes on it, calls you worthless trash. Roll d20.",
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
      gruntStrike(
        "Team Flare",
        "flare-grunt-suit",
        "Flare Grunt",
        "A Flare Grunt in a red suit says your outfit is ugly. Defend your outfit.",
        {
          even: "You pout. Drink 2.",
          advantage: "His suit is worse. Give 3.",
          disadvantage: "He's right. Drink 5.",
        },
      ),
      gruntStrike(
        "Team Flare",
        "flare-scientist",
        "Flare Scientist",
        "A Flare scientist in orange goggles shows you a doomsday weapon.",
        {
          even: "It's a hair dryer. Drink 2.",
          advantage: "You press the red button. Give 3.",
          disadvantage: "It works. Drink 5.",
        },
        { rank: "Scientist", curse: "bleed" },
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
        { rank: "Admin" },
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
      gruntStrike(
        "Team Skull",
        "skull-grunt-yo",
        "Skull Grunt",
        "A Skull Grunt does the Skull pose and says YO. Everyone does the pose.",
        {
          even: "Yo. The worst pose drinks 2.",
          advantage: "You out-pose him. Give 3.",
          disadvantage: "YO. Drink 5.",
        },
      ),
      gruntStrike(
        "Team Skull",
        "skull-grunt-rap",
        "Rapping Grunt",
        "A Skull Grunt raps at you badly. Rap back four lines.",
        {
          even: "A draw. Drink 2.",
          advantage: "He's wrecked. Give 3.",
          disadvantage: "He destroys you. Drink 5.",
        },
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
        { rank: "Admin", curse: "bleed" },
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
        { rank: "Secretary" },
      ),
      gruntStrike(
        "Macro Cosmos",
        "cosmos-intern",
        "Macro Intern",
        "An intern asks you to fill out a feedback survey before battling.",
        {
          even: "Five stars. Drink 2.",
          advantage: "You rate him one star. Give 3.",
          disadvantage: "Mandatory follow-up. Drink 5.",
        },
        { rank: "Intern" },
      ),
      gruntStrike(
        "Macro Cosmos",
        "cosmos-security",
        "Tower Security",
        "Tower Security wants your badge. Not that badge, your ID badge.",
        {
          even: "You show your phone. Drink 2.",
          advantage: "You walk through. Give 3.",
          disadvantage: "You're escorted out. Drink 5.",
        },
        { rank: "Security", curse: "hex" },
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
      gruntStrike(
        "Team Star",
        "star-grunt-dance",
        "Star Grunt",
        "A Team Star grunt does the Star Shuffle. Do it with her.",
        {
          even: "Good shuffle. Drink 2.",
          advantage: "You out-shuffle her. Give 3.",
          disadvantage: "She spins you. Drink 5.",
        },
      ),
      grunt(
        "Team Star",
        "star-car",
        "Starmobile",
        "A boss revs a Starmobile made of Revavroom. Rev with your mouth, then roll 2d6.",
        pair(
          "Run over. Drink 3.",
          "It stalls. Give 3.",
          "A pair! You hijack it. Give {total}.",
        ),
        { rank: "Squad Boss" },
      ),
      gruntStrike(
        "Team Star",
        "star-squad",
        "Star Squad",
        "Thirty grunts. Thirty seconds. Everyone points at you.",
        {
          even: "You hold your ground. Drink 2.",
          advantage: "You point back. Give 3.",
          disadvantage: "Everyone pounces. Drink 5.",
        },
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
          "Her Sylveon flinches. Give 4.",
          "Her Umbreon trips. Give 4.",
          "Her headset glitches. Give 4.",
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
