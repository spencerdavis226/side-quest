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

// Paldea (2026-10-16), gyms in Scarlet and Violet's suggested order; Paldea
// badges are named for their type. Its Elite Four is joined by the Blueberry
// Academy Elite Four (The Indigo Disk). Larry runs a gym and sits on the
// Elite Four, so he gets one card for each, and he is tired of both.
export const paldea: Region = {
  gyms: [
    leader(
      0,
      "katy",
      "Katy",
      "Bug",
      "Katy baked you a cake and her bugs got in the batter. Take a big bite of nothing, then roll d20.",
      d20(
        GYM_NEED[0],
        "Sticky Web. Drink 4.",
        "Sugar crash for Katy. Give 3.",
        {
          fumble: "You found a leg. Finish your drink.",
        },
      ),
    ),
    leader(
      1,
      "brassius",
      "Brassius",
      "Grass",
      "Brassius demands art. Sculpt a Pokémon from a napkin in 20 seconds. Table can't name it: drink 4.",
    ),
    leader(
      2,
      "iono",
      "Iono",
      "Electric",
      "Iono is streaming this. Say hi to chat in your best influencer voice, then roll d20.",
      d20(GYM_NEED[2], "Chat hates you. Drink 4.", "You're trending. Give 4.", {
        crit: "Top donor. Give 8.",
        fumble: "Banned from chat. Finish your drink.",
      }),
    ),
    leader(
      3,
      "kofu",
      "Kofu",
      "Water",
      "Kofu sells fish. Sell your drink to the table in 20 seconds. Nobody buys it: drink 5.",
    ),
    leader(
      4,
      "larry",
      "Larry",
      "Normal",
      "Larry is a tired salaryman. Do your saddest desk-job sigh, then roll d20.",
      d20(GYM_NEED[4], "Overtime. Drink 5.", "You clock out early. Give 5.", {
        crit: "Promoted. Give a shot.",
        fumble: "Performance review. Finish your drink.",
      }),
    ),
    leader(
      5,
      "ryme",
      "Ryme",
      "Ghost",
      "Ryme is a rapper. Freestyle four bars about your left neighbor. Table votes trash: drink 6.",
    ),
    leader(
      6,
      "tulip",
      "Tulip",
      "Psychic",
      "Tulip does your makeup. Shut your eyes while your left neighbor finger-paints your face. Roll d20.",
      d20(GYM_NEED[6], "Hideous. Drink 6.", "Gorgeous. Give 6.", {
        crit: "Supermodel. Everyone else drinks 4.",
        fumble: "Clown face. Finish your drink.",
      }),
    ),
    leader(
      7,
      "grusha",
      "Grusha",
      "Ice",
      "Grusha wrecked his knees snowboarding. Wall-sit for 30 seconds. Drop early: drink 7.",
    ),
  ],

  eliteFour: [
    eliteFour(
      "rika",
      "Rika",
      "Ground",
      "Rika runs the interview. Name your three worst habits in 10 seconds. Stall: drink 5.",
    ),
    eliteFour(
      "poppy",
      "Poppy",
      "Steel",
      "Poppy is eight and has a hammer. Let your left neighbor bonk your head, then roll d20.",
      d20(ELITE_NEED, "Gigaton Hammer. Drink 5.", "You take her toy. Give 5.", {
        fumble: "Bonked silly. Finish your drink.",
      }),
    ),
    eliteFour(
      "larry",
      "Larry",
      "Flying",
      "It's Larry again. He's on unpaid overtime. Sigh with him, then roll d20.",
      d20(
        ELITE_NEED,
        "Unpaid overtime. Drink 6.",
        "Larry gets to go home. Give 5.",
        {
          crit: "Larry smiles. Everyone else drinks 4.",
        },
      ),
    ),
    eliteFour(
      "hassel",
      "Hassel",
      "Dragon",
      "Hassel weeps at art. Describe the table like a painting. Nobody laughs or tears up: drink 5.",
    ),
    eliteFour(
      "crispin",
      "Crispin",
      "Fire",
      "Crispin is on nine energy drinks. Talk at double speed for 10 seconds, then roll d20.",
      d20(ELITE_NEED, "Burnout. Drink 5.", "He crashes. Give 5.", {
        fumble: "Heart palpitations. Finish your drink.",
      }),
    ),
    eliteFour(
      "amarys",
      "Amarys",
      "Steel",
      'Amarys doesn\'t do friends. Get your right neighbor to say "friend" in 30 seconds. Fail: drink 5.',
    ),
    eliteFour(
      "lacey",
      "Lacey",
      "Fairy",
      "Lacey's quiz: spell your full name backwards in 10 seconds. Slip once: drink 5.",
    ),
    eliteFour(
      "drayton",
      "Drayton",
      "Dragon",
      "Drayton couldn't be bothered to read this card. Neither could you. Roll d20.",
      d20(
        ELITE_NEED,
        "He beats you without trying. Drink 6.",
        "You tried harder. Give 5.",
      ),
    ),
  ],

  champions: [
    champion(
      "geeta",
      "Geeta",
      "Paldea",
      'Geeta booked your fight in a meeting. The whole table says "per my last email." Roll d20.',
      d20(
        CHAMPION_NEED,
        "Glimmora's Tera Blast. Everyone drinks 4.",
        "Meeting ends early. Give 4.",
        {
          crit: "You're the boss now. Give 10.",
          fumble: "Mandatory overtime. Everyone finishes their drink.",
        },
      ),
    ),
    champion(
      "nemona",
      "Nemona",
      "Paldea",
      "Nemona wants to battle you again. And again. And again. The whole table fights. Roll d20.",
      d20(
        CHAMPION_NEED,
        "Rematch! Everyone drinks 3.",
        "She loves it. Give 4.",
        {
          crit: "She finally needs a nap. Give 10.",
          fumble: "One more battle! Everyone finishes their drink.",
        },
      ),
    ),
  ],

  legendaries: [
    legendary(
      "koraidon",
      "Koraidon",
      "Koraidon is your motorcycle. Make engine noises and lean into a turn, then roll d20.",
      d20(LEGENDARY_NEED, "Wipeout. Drink 5.", "Wheelie. Give 5.", {
        fumble: "Road rash. Finish your drink.",
      }),
    ),
    legendary(
      "miraidon",
      "Miraidon",
      "Miraidon is a robot dragon bike from the future. Predict tomorrow's hangover, then roll d20.",
      d20(
        LEGENDARY_NEED,
        "Electro Drift. Drink 5.",
        "The future's bright. Give 5.",
      ),
    ),
  ],
};
