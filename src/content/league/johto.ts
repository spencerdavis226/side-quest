import { rollTable } from "../author";
import {
  champion,
  d20,
  eliteFour,
  LEGENDARY_NEED,
  leader,
  legendary,
  type Region,
} from "./shared";

// Johto: written on 2026-10-05 for the badge-meter League (IDs and rules
// unchanged), plus the legendary beasts and Celebi (2026-10-16).
export const johto: Region = {
  gyms: [
    leader(
      0,
      "falkner",
      "Falkner",
      "Zephyr",
      "Drink 3 standing on one foot. Touch down before you finish and you lose: drink 3 more.",
    ),
    leader(
      1,
      "bugsy",
      "Bugsy",
      "Hive",
      "Bugsy's bugs got in your pants. Roll 3d6 and check your shorts.",
      rollTable(3, 6, [
        ...Array.from({ length: 8 }, (_, i) => ({
          min: i + 3,
          max: i + 3,
          instruction: `Bitten. Drink ${Math.ceil((10 - i) / 2)}.`,
        })),
        {
          min: 11,
          max: 18,
          instruction: "You squash them. Give 4.",
          win: true,
        },
      ]),
    ),
    leader(
      2,
      "whitney",
      "Whitney",
      "Plain",
      "Whitney's Miltank used Rollout. It gets worse every hit. Roll d6.",
      rollTable(1, 6, [
        { min: 1, max: 1, instruction: "Rollout hits once. Drink 1." },
        { min: 2, max: 2, instruction: "Rollout hits twice. Drink 3." },
        { min: 3, max: 3, instruction: "Three hits. Drink 6." },
        { min: 4, max: 4, instruction: "Four hits. Drink 10." },
        {
          min: 5,
          max: 6,
          instruction: "Whitney bursts into tears. Give 5.",
          win: true,
        },
      ]),
    ),
    leader(
      3,
      "morty",
      "Morty",
      "Fog",
      "Morty's Gastly stares you down. Staring contest with the player opposite. Blink first: drink 4.",
    ),
    leader(
      4,
      "chuck",
      "Chuck",
      "Storm",
      "Arm-wrestle the strongest player. Loser drinks 6. If they refuse, they drink 6.",
    ),
    leader(
      5,
      "jasmine",
      "Jasmine",
      "Mineral",
      "Hold a full drink at arm's length for 30 seconds. Lower it: finish it. Make it: give 4.",
    ),
    leader(
      6,
      "pryce",
      "Pryce",
      "Glacier",
      "Pryce's ice bath. Chug a full glass of ice water without stopping. Stop for air: drink 5.",
    ),
    leader(
      7,
      "clair",
      "Clair",
      "Rising",
      "Clair says you're too weak for dragons. Tell her she's right, then roll 2d6.",
      rollTable(2, 6, [
        { min: 2, max: 7, instruction: "Dragonbreath. Drink {total}." },
        {
          min: 8,
          max: 12,
          instruction: "You tame the dragon. Give {total}.",
          win: true,
        },
      ]),
    ),
  ],

  eliteFour: [
    eliteFour(
      "will",
      "Will",
      "Psychic",
      "The table secretly picks a number from 1 to 10. Three guesses; each miss: drink 2.",
    ),
    eliteFour(
      "karen",
      "Karen",
      "Dark",
      "Tell the table something you've never told them, or finish your drink.",
    ),
  ],

  champions: [
    champion(
      "lance",
      "Lance",
      "Johto",
      "Lance used Hyper Beam on the whole table. Roll d20 and pray.",
      rollTable(1, 20, [
        {
          min: 1,
          max: 5,
          instruction:
            "Hyper Beam sweeps the table. Everyone finishes their drink.",
        },
        {
          min: 6,
          max: 10,
          instruction: "Dragonite's Outrage. Everyone drinks 3 and yells.",
        },
        {
          min: 11,
          max: 20,
          instruction:
            "Dragonite staggers. Make a rule for the rest of the game.",
          win: true,
        },
      ]),
    ),
  ],

  legendaries: [
    legendary(
      "lugia",
      "Lugia",
      "Lugia floods the table. Roll d20; miss, and everyone drinks for that many seconds.",
      d20(
        LEGENDARY_NEED,
        "Aeroblast. Everyone drinks for {total} seconds.",
        "A hit! Everyone else drinks for 10 seconds.",
        { fumble: "It floods the table. Everyone drinks for 15 seconds." },
      ),
    ),
    legendary(
      "ho-oh",
      "Ho-Oh",
      "Ho-Oh used Sacred Fire. It burns going down and comes back twice as hot. Roll d6.",
      rollTable(
        1,
        6,
        [1, 2, 3, 4, 5, 6].map((n) =>
          n >= 4
            ? {
                min: n,
                max: n,
                instruction: `You ride the fire. Give ${n - 2}, then ${(n - 2) * 2} more.`,
                win: true,
              }
            : {
                min: n,
                max: n,
                instruction: `Sacred Fire. Drink ${5 - n}, then ${(5 - n) * 2} more.`,
              },
        ),
      ),
    ),
    legendary(
      "beasts",
      "Raikou, Entei, Suicune",
      "Three dogs that bolt the moment you look. Point at the guiltiest player, then roll d20.",
      d20(
        LEGENDARY_NEED,
        "It ran away. Again. You and the guilty one drink 3.",
        "Cornered one. Give 4.",
        { fumble: "All three bite. Finish your drink." },
      ),
    ),
    legendary(
      "celebi",
      "Celebi",
      "Celebi travels in time. Relive your most regrettable night out for the table, then roll d20.",
      d20(
        LEGENDARY_NEED,
        "It makes you live it again. Drink 5 and tell the ending you skipped.",
        "You rewrite history. Pick a player: they tell their worst night out or drink 4.",
        { crit: "That night never happened. Give 8." },
      ),
    ),
  ],
};
