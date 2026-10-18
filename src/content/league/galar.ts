import {
  CHAMPION_NEED,
  champion,
  cupFinalist,
  d20,
  ELITE_NEED,
  GYM_NEED,
  LEGENDARY_NEED,
  leader,
  legendary,
  type Region,
} from "./shared";

// Galar (2026-10-16), gyms in Sword and Shield's order. Where the games
// split by version, Bea (4th), Gordie (6th) and Piers's 7th stand in; Galar
// badges are named for their type. With no Elite Four, Galar sends its
// Champion Cup finalists: Marnie, Hop, Bede and Allister.
export const galar: Region = {
  gyms: [
    leader(
      0,
      "milo",
      "Milo",
      "Grass",
      "Milo herds Wooloo. Baa like a sheep for 20 seconds. Nobody laughs: drink 4.",
    ),
    leader(
      1,
      "nessa",
      "Nessa",
      "Water",
      "Nessa is a model and you are not. Pout for the camera, then roll d20.",
      d20(
        GYM_NEED[1],
        "Drowned in looks. Drink 4 and keep pouting.",
        "You make the cover. Pick a player: they strike a pose or drink 3.",
        {
          fumble: "Gigantamax Drednaw. Finish your drink.",
        },
      ),
    ),
    leader(
      2,
      "kabu",
      "Kabu",
      "Fire",
      "Kabu jogs every morning. Do ten jumping jacks, then roll d20.",
      d20(
        GYM_NEED[2],
        "Burnt out. Drink 5, then ten more jumping jacks.",
        "You outlast the old man. Give 5.",
        {
          fumble: "Fire Spin. Take a spicy shot.",
        },
      ),
    ),
    leader(
      3,
      "bea",
      "Bea",
      "Fighting",
      "Bea trains hard. Hold a plank for 30 seconds. Drop early: drink 6.",
    ),
    leader(
      4,
      "opal",
      "Opal",
      "Fairy",
      "Opal wants a pink successor. Name 5 pink things in 10 seconds. Miss one: drink 5.",
    ),
    leader(
      5,
      "gordie",
      "Gordie",
      "Rock",
      "Gordie's mom runs the next gym and he won't shut up about it. Yell \"MOM!\" then roll d20.",
      d20(
        GYM_NEED[5],
        "Stealth Rock. Drink 5 and yell for your mom again.",
        "Mama's boy goes down. Give 5.",
        {
          crit: "You call his mom. Everyone else drinks 3.",
          fumble: "Gigantamax Coalossal. Finish your drink.",
        },
      ),
    ),
    leader(
      6,
      "piers",
      "Piers",
      "Dark",
      "Piers is a punk. Scream a verse of any song like you mean it. Not punk enough: drink 6.",
    ),
    leader(
      7,
      "raihan",
      "Raihan",
      "Dragon",
      "Raihan takes a selfie mid-battle. Pose for his phone, then roll d20.",
      d20(
        GYM_NEED[7],
        "Sandstorm. Drink 6, and the table writes your caption.",
        "You trend. Take a selfie with a player; they drink 4.",
        {
          crit: "Most-liked post ever. Everyone else drinks 4.",
          fumble: "Posted and roasted. Finish your drink.",
        },
      ),
    ),
  ],

  eliteFour: [
    cupFinalist(
      "marnie",
      "Marnie",
      "Dark",
      "Lead the table in a Team Yell chant for Marnie. Anyone doesn't join in: you drink 5.",
    ),
    {
      ...cupFinalist(
        "hop",
        "Hop",
        "Rival",
        "Hop is Leon's little brother and he won't stop saying so. Say \"Mate!\" then roll d20.",
        d20(
          ELITE_NEED,
          "Still not Leon. Drink 5.",
          "He cries to his brother. Give 5.",
          {
            crit: "Unbeatable! Everyone else drinks 3.",
          },
        ),
      ),
      jinx: {
        name: "Mate",
        rule: "The jinxed player ends every sentence with 'mate'. Forget: drink 1.",
      },
    },
    cupFinalist(
      "bede",
      "Bede",
      "Fairy",
      "Bede is a spoiled brat. Throw a 10-second tantrum. Table votes not bratty enough: drink 5.",
    ),
    cupFinalist(
      "allister",
      "Allister",
      "Ghost",
      "Allister hides behind a mask. Cover your face with your hands, then roll d20.",
      d20(
        ELITE_NEED,
        "Shadow Ball. Drink 5 with your face still covered.",
        "Peekaboo! The first player to flinch drinks 4.",
        {
          fumble: "Gigantamax Gengar. Finish your drink.",
        },
      ),
    ),
  ],

  champions: [
    champion(
      "leon",
      "Leon",
      "Galar",
      "Leon is unbeaten and always lost. Everyone strikes the Charizard pose. Roll d20.",
      d20(
        CHAMPION_NEED,
        "Max Wildfire. Everyone drinks 4, still holding the pose.",
        "Leon got lost on the way back. Point in a random direction and give 4.",
        {
          crit: "His cape falls off. Give 10.",
          fumble: "Still undefeated. Everyone finishes their drink.",
        },
      ),
    ),
  ],

  legendaries: [
    legendary(
      "zacian",
      "Zacian",
      "Zacian is a dog with a sword in its mouth. Bark, then roll d20.",
      d20(
        LEGENDARY_NEED,
        "Behemoth Blade. Drink 5 and fetch something for the table.",
        "Good dog. Everyone pets you; give 5.",
        {
          crit: "Belly rubs. Give 8.",
        },
      ),
    ),
    legendary(
      "eternatus",
      "Eternatus",
      "Eternatus is a giant space worm. Everyone looks up, then you roll d20.",
      d20(
        LEGENDARY_NEED,
        "Eternabeam. Drink 6 while everyone keeps looking up.",
        "You end the Darkest Day. The last player still looking up drinks 4.",
        {
          fumble: "The Darkest Day. Finish your drink.",
        },
      ),
    ),
  ],
};
