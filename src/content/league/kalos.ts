import {
  CHAMPION_NEED,
  champion,
  d20,
  ELITE_NEED,
  eliteFour,
  GYM_NEED,
  LEGENDARY_NEED,
  leader,
  legendary,
  type Region,
} from "./shared";

// Kalos (2026-10-16), gyms in X and Y's order.
export const kalos: Region = {
  gyms: [
    leader(
      0,
      "viola",
      "Viola",
      "Bug",
      "Viola's photo shoot: hold a pose for 30 seconds while the table heckles. Laugh: drink 4.",
    ),
    leader(
      1,
      "grant",
      "Grant",
      "Cliff",
      "Grant makes you climb. Crawl under the table and out the other side, then roll d20.",
      d20(
        GYM_NEED[1],
        "You fall off the wall. Drink 4 from under the table.",
        "You top out. Give 4.",
        {
          crit: "Free solo. Give 8.",
        },
      ),
    ),
    leader(
      2,
      "korrina",
      "Korrina",
      "Rumble",
      "Korrina's on roller skates. Spin around 5 times, then walk a straight line. Wobble: drink 5.",
    ),
    leader(
      3,
      "ramos",
      "Ramos",
      "Plant",
      "Ramos is 90 and tougher than you. Talk like a grumpy grandpa, then roll d20.",
      d20(
        GYM_NEED[3],
        "Leech Seed. Drink 5, and your right neighbor steals a sip of yours.",
        "You prune the old man. Give 5, and talk like him until your next turn.",
        {
          fumble: "Rototilled. Finish your drink.",
        },
      ),
    ),
    leader(
      4,
      "clemont",
      "Clemont",
      "Voltage",
      'Clemont\'s invention will blow. Shout "The future is now, thanks to science!" and roll d20.',
      d20(
        GYM_NEED[4],
        "It explodes. Drink 5 and shout the slogan again.",
        "It works for once. Give 5.",
        {
          crit: "Science! Everyone else drinks 3.",
          fumble: "Singed afro. Finish your drink.",
        },
      ),
    ),
    leader(
      5,
      "valerie",
      "Valerie",
      "Fairy",
      "Valerie's orders: trade an item of clothing with your right neighbor. Refuse: both drink 6.",
    ),
    leader(
      6,
      "olympia",
      "Olympia",
      "Psychic",
      "Olympia has seen your future and it's bleak. Stare into her eyes, then roll d20.",
      d20(
        GYM_NEED[6],
        "As foretold. Drink 6 without breaking eye contact.",
        "You change fate. Tell a player's future; they drink 4.",
        {
          crit: "You foresaw her loss. Everyone else drinks 4.",
          fumble: "Doomed. Finish your drink.",
        },
      ),
    ),
    leader(
      7,
      "wulfric",
      "Wulfric",
      "Iceberg",
      "Wulfric loves a bear hug. Hug three players on one breath. Breathe early: drink 7.",
    ),
  ],

  eliteFour: [
    eliteFour(
      "malva",
      "Malva",
      "Fire",
      "Malva reads the news. Break a scandal about a player, anchor voice. Nobody laughs: drink 5.",
    ),
    eliteFour(
      "siebold",
      "Siebold",
      "Water",
      "Siebold is a chef. Describe your drink's flavor like a snob critic, then roll d20.",
      d20(
        ELITE_NEED,
        "Sent back to the kitchen. Drink 5 and describe your drink again, nicer.",
        "Michelin star. Critique a player's drink; they drink 3.",
      ),
    ),
    eliteFour(
      "wikstrom",
      "Wikstrom",
      "Steel",
      "Sir Wikstrom wants a duel. Straw-fence your right neighbor; first poked loses. Lose: drink 5.",
    ),
    eliteFour(
      "drasna",
      "Drasna",
      "Dragon",
      "Drasna is a sweet granny with four dragons. Kiss your left neighbor's cheek, then roll d20.",
      d20(
        ELITE_NEED,
        "Dragon Pulse. Drink 6, and your left neighbor pinches your cheek.",
        "Granny's proud and slips you cookie money. Give 5.",
        {
          fumble: "Granny's dragon. Finish your drink.",
        },
      ),
    ),
  ],

  champions: [
    champion(
      "diantha",
      "Diantha",
      "Kalos",
      "Diantha is a movie star. The whole table acts out a dramatic death, then you roll d20.",
      d20(
        CHAMPION_NEED,
        "Moonblast. Everyone drinks 4; the worst death scene drinks 2 more.",
        "An award-worthy hit. Thank the Academy, then give 4.",
        {
          crit: "Standing ovation. Give 10.",
          fumble: "Box-office flop. Everyone finishes their drink.",
        },
      ),
    ),
  ],

  legendaries: [
    legendary(
      "xerneas",
      "Xerneas",
      "Xerneas gives life. Give the sleepiest player a pep talk until they perk up, then roll d20.",
      d20(
        LEGENDARY_NEED,
        "Geomancy. Drink 5, and the sleepy player drinks 2.",
        "Full of life. You and the sleepy player give 3 each.",
      ),
    ),
    legendary(
      "yveltal",
      "Yveltal",
      "Yveltal drains life. Name the deadest-looking player; they drink 2. Then roll d20.",
      d20(
        LEGENDARY_NEED,
        "Oblivion Wing. Drink 5 and play dead for 10 seconds.",
        "You live. The deadest-looking player drinks 3 more.",
        {
          fumble: "Drained dry. Finish your drink.",
        },
      ),
    ),
  ],
};
