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

// Unova (2026-10-16), gyms in Black and White's order. Iris is a Champion
// here (Black 2 and White 2), so Drayden holds the eighth gym.
export const unova: Region = {
  gyms: [
    leader(
      0,
      "striaton-trio",
      "Cilan, Chili & Cress",
      "Trio",
      "Waiters' test: recite everyone's drink in seat order. Each miss: drink 2. Two misses lose.",
    ),
    leader(
      1,
      "lenora",
      "Lenora",
      "Basic",
      "Lenora runs a museum and you're the exhibit. Hold a statue pose while you roll d20.",
      d20(GYM_NEED[1], "Retaliate. Drink 4.", "You beat the curator. Give 4.", {
        crit: "Masterpiece. Give 8.",
      }),
    ),
    leader(
      2,
      "burgh",
      "Burgh",
      "Insect",
      "Burgh is an artist. Draw a bug on your left neighbor's arm. Table can't name it: drink 4.",
    ),
    leader(
      3,
      "elesa",
      "Elesa",
      "Bolt",
      "Elesa wants a runway walk. Strut to the door and back. The table scores you; under 7 of 10: drink 5.",
    ),
    leader(
      4,
      "clay",
      "Clay",
      "Quake",
      "Clay is a cowboy with a mine and no patience. Tip your hat, partner, and roll d20.",
      d20(GYM_NEED[4], "Earthquake. Drink 5.", "You strike gold. Give 5.", {
        fumble: "Buried in the mine. Finish your drink.",
      }),
    ),
    leader(
      5,
      "skyla",
      "Skyla",
      "Jet",
      "Skyla is your pilot. Arms out, make engine noises, then roll d20 for turbulence.",
      d20(GYM_NEED[5], "Turbulence. Drink 5.", "Smooth landing. Give 5.", {
        crit: "Mile-high club. You and a partner give 5 each.",
        fumble: "Nosedive. Finish your drink.",
      }),
    ),
    leader(
      6,
      "brycen",
      "Brycen",
      "Freeze",
      "Brycen was a movie star. Act out a movie; the table has 20 seconds to name it. They can't: drink 6.",
    ),
    leader(
      7,
      "drayden",
      "Drayden",
      "Legend",
      "Drayden is the mayor, ancient, and owns a dragon. Make the table a campaign promise, then roll d20.",
      d20(GYM_NEED[7], "Voted out. Drink 6.", "You win the election. Give 6.", {
        crit: "Landslide. Everyone else drinks 5.",
        fumble: "Impeached. Finish your drink.",
      }),
    ),
  ],

  eliteFour: [
    eliteFour(
      "shauntal",
      "Shauntal",
      "Ghost",
      "Shauntal writes smut about trainers. Narrate 20 seconds of it about two players. Stop: drink 5.",
    ),
    eliteFour(
      "grimsley",
      "Grimsley",
      "Dark",
      "Grimsley bets your drink on this. Push it into the middle of the table, then roll d20.",
      d20(ELITE_NEED, "House wins. Drink 6.", "Jackpot. Give 6.", {
        crit: "Royal flush. Everyone else drinks 4.",
        fumble: "You lost the house. Finish your drink.",
      }),
    ),
    eliteFour(
      "caitlin",
      "Caitlin",
      "Psychic",
      "Caitlin naps mid-battle. Fake-snore through a whole sip. Laugh or spill: drink 5.",
    ),
    eliteFour(
      "marshal",
      "Marshal",
      "Fighting",
      "Marshal trains under waterfalls. Flick some water on your own face, then roll d20.",
      d20(ELITE_NEED, "Close Combat. Drink 5.", "You knock him out. Give 5.", {
        fumble: "Black belt to the face. Finish your drink.",
      }),
    ),
  ],

  champions: [
    champion(
      "alder",
      "Alder",
      "Unova",
      "Alder skipped work to get drunk with you. The whole table cheers him, then you roll d20.",
      d20(
        CHAMPION_NEED,
        "Volcarona burns the table. Everyone drinks 3.",
        "Alder spills his beer. Give 4.",
        {
          crit: "Alder passes out. Give 10.",
          fumble: "He's still up at 4 a.m. Everyone finishes their drink.",
        },
      ),
    ),
    champion(
      "iris",
      "Iris",
      "Unova",
      "Iris is the Champion and she's literally a child. The whole table fights a kid. Roll d20.",
      d20(
        CHAMPION_NEED,
        "Beaten by a child. Everyone drinks 4.",
        "You land one on a kid. Give 4.",
        {
          crit: "She sends you to bed. Give 10.",
          fumble: "Outrage. Everyone finishes their drink.",
        },
      ),
    ),
  ],

  legendaries: [
    legendary(
      "reshiram",
      "Reshiram",
      "Reshiram seeks truth. Tell the table the truth about your last hookup, then roll d20.",
      d20(LEGENDARY_NEED, "Blue Flare. Drink 5.", "The truth wins. Give 5."),
    ),
    legendary(
      "zekrom",
      "Zekrom",
      "Zekrom seeks ideals. Toast your most delusional ambition, then roll d20.",
      d20(LEGENDARY_NEED, "Bolt Strike. Drink 5.", "Your ideals win. Give 5.", {
        fumble: "Fusion Bolt. Finish your drink.",
      }),
    ),
  ],
};
