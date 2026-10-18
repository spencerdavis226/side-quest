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
      "Katy's bugs got in the cake batter. Take a big bite of nothing, then roll d20.",
      d20(
        GYM_NEED[0],
        "Sticky Web. Drink 4 with your elbows stuck to the table.",
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
      "Brassius demands art. Napkin-sculpt a Pokémon in 20 seconds. Nobody can name it: drink 4.",
    ),
    leader(
      2,
      "iono",
      "Iono",
      "Electric",
      "Iono is streaming this. Say hi to chat in your best influencer voice, then roll d20.",
      d20(
        GYM_NEED[2],
        "Chat hates you. Drink 4 and read your own hate comment aloud.",
        "You're trending. Shout out a player by name; they drink 3.",
        {
          crit: "Top donor. Give 8.",
          fumble: "Banned from chat. Finish your drink.",
        },
      ),
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
      d20(
        GYM_NEED[4],
        "Overtime. Drink 5 and sigh again.",
        "You clock out early. Give 5.",
        {
          crit: "Promoted. Give a shot.",
          fumble: "Performance review. Finish your drink.",
        },
      ),
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
      "Tulip does your makeup. Your left neighbor mimes it, narrating every stroke. Roll d20.",
      d20(
        GYM_NEED[6],
        "Hideous. Drink 6.",
        "Gorgeous. You and your makeup artist give 3 each.",
        {
          crit: "Supermodel. Everyone else drinks 4.",
          fumble: "Clown face. Finish your drink.",
        },
      ),
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
      d20(
        ELITE_NEED,
        "Gigaton Hammer. Drink 5, and she bonks you again.",
        "You take her toy. Bonk a player once; they drink 3.",
        {
          fumble: "Bonked silly. Finish your drink.",
        },
      ),
    ),
    eliteFour(
      "larry",
      "Larry",
      "Flying",
      "It's Larry again. He's on unpaid overtime. Sigh with him, then roll d20.",
      d20(
        ELITE_NEED,
        "Unpaid overtime. Drink 6 and sigh again, sadder.",
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
      d20(
        ELITE_NEED,
        "Burnout. Drink 5, then talk at half speed until your next turn.",
        "He crashes. Whoever looks most tired drinks 3.",
        {
          fumble: "Heart palpitations. Finish your drink.",
        },
      ),
    ),
    eliteFour(
      "amarys",
      "Amarys",
      "Steel",
      'Amarys doesn\'t do friends. Get your right neighbor to say "friend" in 30 seconds or drink 5.',
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
        "You tried harder. Give 5, with minimal effort.",
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
        "Tera Blast. Everyone drinks 4 and replies all.",
        "The meeting ends early. Give 4 and leave the room for five seconds.",
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
        'Rematch! Everyone drinks 3 and says "one more!"',
        "She loves it. Give 4, and hug your left neighbor for her.",
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
      d20(
        LEGENDARY_NEED,
        "Wipeout. Drink 5 standing, like you just fell off.",
        "Wheelie. Pick a passenger; you both give 3.",
        {
          fumble: "Road rash. Finish your drink.",
        },
      ),
    ),
    legendary(
      "miraidon",
      "Miraidon",
      "Miraidon is a robot dragon bike from the future. Predict tomorrow's hangover, then roll d20.",
      d20(
        LEGENDARY_NEED,
        "Electro Drift. Drink 5; your hangover prediction just got worse.",
        "The future's bright. Predict a player's hangover; they drink 3.",
      ),
    ),
  ],
};
