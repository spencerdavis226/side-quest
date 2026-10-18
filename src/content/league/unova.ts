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
      d20(
        GYM_NEED[1],
        "Retaliate. Drink 4 without breaking the pose.",
        "You beat the curator. Give 4.",
        {
          crit: "Masterpiece. Give 8.",
        },
      ),
    ),
    leader(
      2,
      "burgh",
      "Burgh",
      "Insect",
      "Burgh's art test: finger-draw a bug on your neighbor's back. They can't name it: drink 4.",
    ),
    leader(
      3,
      "elesa",
      "Elesa",
      "Bolt",
      "Elesa wants a runway walk. Strut to the door and back. Table scores you under 7/10: drink 5.",
    ),
    leader(
      4,
      "clay",
      "Clay",
      "Quake",
      "Clay is a cowboy with a mine and no patience. Tip your hat, partner, and roll d20.",
      d20(
        GYM_NEED[4],
        'Earthquake. Yell "yeehaw", then drink 5.',
        "You strike gold. Everyone tips their hat; the last one drinks 3.",
        {
          fumble: "Buried in the mine. Finish your drink.",
        },
      ),
    ),
    leader(
      5,
      "skyla",
      "Skyla",
      "Jet",
      "Skyla is your pilot. Arms out, make engine noises, then roll d20 for turbulence.",
      d20(
        GYM_NEED[5],
        "Turbulence. Drink 5 while your neighbors shake your chair.",
        "Smooth landing. The table claps like passengers; give 5.",
        {
          crit: "Mile-high club. You and a partner give 5 each.",
          fumble: "Nosedive. Finish your drink.",
        },
      ),
    ),
    leader(
      6,
      "brycen",
      "Brycen",
      "Freeze",
      "Brycen was a movie star. Act out a movie. Table can't name it in 20 seconds: drink 6.",
    ),
    leader(
      7,
      "drayden",
      "Drayden",
      "Legend",
      "Drayden: mayor, ancient, owns a dragon. Make the table a campaign promise, then roll d20.",
      d20(
        GYM_NEED[7],
        "Voted out. Drink 6 and give a concession speech.",
        "You win the election. Appoint a cabinet: two players drink 3 each.",
        {
          crit: "Landslide. Everyone else drinks 5.",
          fumble: "Impeached. Finish your drink.",
        },
      ),
    ),
  ],

  eliteFour: [
    eliteFour(
      "shauntal",
      "Shauntal",
      "Ghost",
      "Shauntal writes smut. Narrate 20 seconds of it about two players. Stop: drink 5.",
    ),
    eliteFour(
      "grimsley",
      "Grimsley",
      "Dark",
      "Grimsley bets your drink on this. Push it into the middle of the table, then roll d20.",
      d20(
        ELITE_NEED,
        "House wins. Drink 6 from the drink in the middle.",
        "Jackpot. Take your drink back and give 6.",
        {
          crit: "Royal flush. Everyone else drinks 4.",
          fumble: "You lost the house. Finish your drink.",
        },
      ),
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
      d20(
        ELITE_NEED,
        "Close Combat. Drink 5 and flick more water on your face.",
        "You knock him out. Give 5 with a bow.",
        {
          fumble: "Black belt to the face. Finish your drink.",
        },
      ),
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
        "Volcarona burns the table. Everyone drinks 3 and blows on their fingers.",
        "Alder spills his beer on you. Give 4 and sip anyone's drink.",
        {
          crit: "Alder nods off mid-battle. Give 10.",
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
        "Beaten by a child. Everyone drinks 4 and apologizes to her.",
        "You land one on a kid. The table boos you; give 4 anyway.",
        {
          crit: "You send her to bed. Give 10.",
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
      d20(
        LEGENDARY_NEED,
        "Blue Flare. Drink 5, and the table asks one follow-up question.",
        "The truth wins. Pick a player: they tell the truth about theirs or drink 4.",
      ),
    ),
    legendary(
      "zekrom",
      "Zekrom",
      "Zekrom seeks ideals. Toast your most delusional ambition, then roll d20.",
      d20(
        LEGENDARY_NEED,
        "Bolt Strike. Drink 5 while the table rates your ambition out of 10.",
        "Your ideals win. Everyone else toasts your ambition and drinks 2.",
        {
          fumble: "Fusion Bolt. Finish your drink.",
        },
      ),
    ),
  ],
};
