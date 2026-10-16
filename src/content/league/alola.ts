import {
  CHAMPION_NEED,
  champion,
  d20,
  ELITE_NEED,
  eliteFour,
  GYM_NEED,
  islandTrial,
  LEGENDARY_NEED,
  legendary,
  type Region,
} from "./shared";

// Alola (2026-10-16) has no gyms. Its eight are island challenge stops in
// story order: Ilima, Kahuna Hala, Lana, Kiawe, Mallow, Kahuna Olivia,
// Kahuna Nanu and Kahuna Hapu (Sophocles, Acerola and Mina's trials are left
// out; Acerola is in the Ultra Sun and Moon Elite Four instead).
export const alola: Region = {
  gyms: [
    islandTrial(
      0,
      "ilima",
      "Ilima",
      "Trial Captain",
      "Normalium Z",
      "Ilima is pretty and knows it. Compliment yourself for 10 seconds straight, then roll d20.",
      d20(GYM_NEED[0], "Totem Gumshoos. Drink 4.", "Trial cleared. Give 3.", {
        crit: "Prettier than Ilima. Give 6.",
      }),
    ),
    islandTrial(
      1,
      "hala",
      "Hala",
      "Kahuna",
      "Fightinium Z",
      "Hala wants a sumo match. Palm-push your right neighbor; first to move a foot loses. Lose: drink 5.",
    ),
    islandTrial(
      2,
      "lana",
      "Lana",
      "Trial Captain",
      "Waterium Z",
      "Lana lies about everything. Tell two truths and a lie. The table spots the lie: drink 5.",
    ),
    islandTrial(
      3,
      "kiawe",
      "Kiawe",
      "Trial Captain",
      "Firium Z",
      "Kiawe's fire dance. Shirt off or hips going, the table picks. Then roll d20.",
      d20(GYM_NEED[3], "Burned. Drink 5.", "Totem Marowak falls. Give 5.", {
        crit: "Inferno Overdrive. Give a shot.",
        fumble: "Third-degree burns. Take a spicy shot.",
      }),
    ),
    islandTrial(
      4,
      "mallow",
      "Mallow",
      "Trial Captain",
      "Grassium Z",
      "Mallow's cooking: pour a splash of three players' drinks into yours, then down it. Gag: drink 6.",
    ),
    islandTrial(
      5,
      "olivia",
      "Olivia",
      "Kahuna",
      "Rockium Z",
      "Olivia just got dumped again. Tell her about your worst breakup, then roll d20.",
      d20(
        GYM_NEED[5],
        "She cries on you. Drink 6.",
        "You cheer her up. Give 5.",
        {
          fumble: "She dates your ex. Finish your drink.",
        },
      ),
    ),
    islandTrial(
      6,
      "nanu",
      "Nanu",
      "Kahuna",
      "Darkinium Z",
      "Nanu's a cop who can't be bothered. Get anyone here to confess a crime in 30 seconds or drink 6.",
    ),
    islandTrial(
      7,
      "hapu",
      "Hapu",
      "Kahuna",
      "Groundium Z",
      "Hapu's Mudsdale stomps. Stomp your feet like a horse, then roll d20.",
      d20(GYM_NEED[7], "Trampled. Drink 7.", "You ride her horse. Give 6.", {
        crit: "Island Kahuna. Everyone else drinks 4.",
        fumble: "Buried in mud. Finish your drink.",
      }),
    ),
  ],

  eliteFour: [
    eliteFour(
      "acerola",
      "Acerola",
      "Ghost",
      "Hide your drink. Acerola (your left neighbor) gets 15 seconds to find it. Found: drink 5.",
    ),
    eliteFour(
      "kahili",
      "Kahili",
      "Flying",
      "Kahili golfs. Flick a bottle cap into a cup across the table in 3 tries. Miss all three: drink 5.",
    ),
    eliteFour(
      "molayne",
      "Molayne",
      "Steel",
      "Molayne fixes computers. Let the table read your last web search, then roll d20.",
      d20(ELITE_NEED, "Flash Cannon. Drink 5.", "You reboot him. Give 5.", {
        fumble: "Clear your history. Finish your drink.",
      }),
    ),
  ],

  champions: [
    champion(
      "kukui",
      "Professor Kukui",
      "Alola",
      'Professor Kukui fights shirtless in a lab coat. The whole table yells "Woo!" Then roll d20.',
      d20(CHAMPION_NEED, "Woo! Everyone drinks 3.", "A hit, cousin! Give 4.", {
        crit: "Woo! Give 10.",
        fumble: "Lab coat to the face. Everyone finishes their drink.",
      }),
    ),
  ],

  legendaries: [
    legendary(
      "tapu-koko",
      "Tapu Koko",
      "Tapu Koko guards the island and is an asshole about it. Bow to the island, then roll d20.",
      d20(
        LEGENDARY_NEED,
        "Electric Terrain. Drink 5.",
        "You earn its respect. Give 5.",
      ),
    ),
    legendary(
      "necrozma",
      "Necrozma",
      "Necrozma ate the light. Shut your eyes, then roll d20.",
      d20(
        LEGENDARY_NEED,
        "Prismatic Laser. Drink 6.",
        "The light comes back. Give 5.",
        {
          fumble: "Blinded. Finish your drink.",
        },
      ),
    ),
  ],
};
