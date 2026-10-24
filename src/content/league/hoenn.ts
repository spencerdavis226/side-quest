import { rollTable } from "../author";
import {
  CHAMPION_NEED,
  champion,
  d20,
  eliteFour,
  LEGENDARY_NEED,
  leader,
  legendary,
  type Region,
} from "./shared";

// Hoenn: written on 2026-10-05 for the badge-meter League (IDs and rules
// unchanged), plus Champion Wallace and the weather trio and Regis
// (2026-10-16). Gym Wallace (Ruby/Sapphire's eighth leader) and Champion
// Wallace (Emerald's) are two cards.
export const hoenn: Region = {
  gyms: [
    leader(
      0,
      "roxanne",
      "Roxanne",
      "Stone",
      "Name 8 Pokémon types in 10 seconds. Miss any and you lose: drink 2 per miss.",
    ),
    leader(
      1,
      "brawly",
      "Brawly",
      "Knuckle",
      "Brawly wants 10 push-ups in 20 seconds. Fall short: drink 6.",
    ),
    leader(
      2,
      "wattson",
      "Wattson",
      "Dynamo",
      "Wahahaha! Wattson licks a battery and dares you to do the same. Roll 2d6.",
      {
        ...rollTable(2, 6, [
          { min: 2, max: 7, instruction: "Shocked. Drink {total}." },
          {
            min: 8,
            max: 12,
            instruction: "You lick it first. Give 5.",
            win: true,
          },
        ]),
        doubles: "A pair! Overcharge. Everyone else drinks {total}.",
        doublesWin: true,
      },
    ),
    leader(
      3,
      "flannery",
      "Flannery",
      "Heat",
      "Flannery is new and nervous and set the gym on fire. Roll d6.",
      rollTable(1, 6, [
        {
          min: 1,
          max: 4,
          instruction: "Burned. Take a high-proof or spicy shot.",
        },
        {
          min: 5,
          max: 6,
          instruction: "You douse her. Give a shot.",
          win: true,
        },
      ]),
    ),
    leader(
      4,
      "norman",
      "Norman",
      "Balance",
      "Your dad Norman is disappointed. Make the table laugh in 30 seconds or drink 6.",
    ),
    leader(
      5,
      "winona",
      "Winona",
      "Feather",
      "Drink 4 standing on a chair, flapping like a bird. Wobble off or spill: finish your drink.",
    ),
    leader(
      6,
      "tate-liza",
      "Tate & Liza",
      "Mind",
      "Creepy twins. Pick a partner and speak in unison while you roll 2d6.",
      {
        ...rollTable(2, 6, [
          {
            min: 2,
            max: 7,
            instruction: "They outmatch you. You both drink 5.",
          },
          {
            min: 8,
            max: 12,
            instruction: "You hold them off. You both give 2.",
            win: true,
          },
        ]),
        doubles: "A pair! Perfect sync. You both give 8.",
        doublesWin: true,
      },
    ),
    leader(
      7,
      "wallace",
      "Wallace",
      "Rain",
      "Cross the room heel to toe, drink balanced on your head. Spill or wobble: finish it.",
    ),
  ],

  eliteFour: [
    eliteFour(
      "sidney",
      "Sidney",
      "Dark",
      "Sidney thinks you're a little bitch. Prove him wrong: roll 2d6.",
      rollTable(2, 6, [
        { min: 2, max: 6, instruction: "Crunched. Finish your drink." },
        { min: 7, max: 7, instruction: "A standoff. Drink 7." },
        { min: 8, max: 12, instruction: "You beat him. Give 5.", win: true },
      ]),
    ),
    eliteFour(
      "phoebe",
      "Phoebe",
      "Ghost",
      "Eyes shut; someone swaps drinks with you. Guess who, or drink 4 of theirs.",
    ),
    eliteFour(
      "glacia",
      "Glacia",
      "Ice",
      "Glacia says your drink is warm and your heart is too. Roll d20.",
      rollTable(1, 20, [
        {
          min: 1,
          max: 12,
          instruction:
            "Sheer Cold. Drink 6, and give your left neighbor the cold shoulder until your next turn.",
        },
        {
          min: 13,
          max: 19,
          instruction: "You thaw out. Give 4.",
          win: true,
        },
        {
          min: 20,
          max: 20,
          instruction: "You shatter her ice. Give 8.",
          win: true,
        },
      ]),
    ),
    eliteFour(
      "drake",
      "Drake",
      "Dragon",
      "Drake is a sailor. Drink like one. Roll 3d6.",
      rollTable(3, 6, [
        ...Array.from({ length: 9 }, (_, i) => ({
          min: i + 3,
          max: i + 3,
          instruction: `Drink ${Math.ceil((11 - i) / 2) + 2}.`,
        })),
        {
          min: 12,
          max: 18,
          instruction: "You outdrink a sailor. Give 6.",
          win: true,
        },
      ]),
    ),
  ],

  champions: [
    champion(
      "steven",
      "Steven",
      "Hoenn",
      "Steven wants to show the whole table his rock collection. Roll 2d6 to escape.",
      rollTable(2, 6, [
        {
          min: 2,
          max: 7,
          instruction: "Meteor Mash. Everyone drinks {total}.",
        },
        {
          min: 8,
          max: 12,
          instruction:
            "Metagross staggers. Give {total}, split however you like.",
          win: true,
        },
      ]),
    ),
    champion(
      "wallace",
      "Wallace",
      "Hoenn",
      "Wallace wants a beautiful fight. Everyone strikes a fabulous pose, then roll d20.",
      d20(
        CHAMPION_NEED,
        "Ugly. Everyone drinks 3; the table names the ugliest pose and that player drinks 2 more.",
        "Stunning hit. The table names the best pose; that player gives 4.",
        {
          crit: "Ribbon-worthy. Make a rule for the rest of the game.",
          fumble: "Milotic sweeps. Everyone finishes their drink.",
        },
      ),
    ),
  ],

  legendaries: [
    legendary(
      "eon-duo",
      "Latias & Latios",
      "Pick a partner and spoon them while you roll 2d6.",
      {
        ...rollTable(2, 6, [
          ...Array.from({ length: 6 }, (_, i) => ({
            min: i + 2,
            max: i + 2,
            instruction: `They slip away. You both drink ${Math.ceil((i + 2) / 2)}.`,
          })),
          {
            min: 8,
            max: 12,
            instruction: "They falter. You both give 6.",
            win: true,
          },
        ]),
        doubles: "A pair! They collide midair. You both give 10.",
        doublesWin: true,
      },
    ),
    legendary(
      "deoxys",
      "Deoxys",
      "A space virus with a laser. Everyone covers their mouth. Roll d20.",
      d20(
        LEGENDARY_NEED,
        "Psycho Boost lands. Drink 6; anyone who uncovered their mouth drinks 2.",
        "A hit! Give 6.",
        {
          crit: "Caught clean! Give 12.",
        },
      ),
    ),
    legendary(
      "groudon",
      "Groudon",
      "Groudon dried up the oceans, and now your drink. Drink 2, then roll d20.",
      d20(
        LEGENDARY_NEED,
        "Drought. Drink 4, panting.",
        "You crack its crust. Give 5.",
        {
          fumble: "Precipice Blades. Drink 4, then take a spicy shot.",
        },
      ),
    ),
    legendary(
      "kyogre",
      "Kyogre",
      "Kyogre is flooding the world. Everyone drinks 2 to lower the sea, then you roll d20.",
      d20(
        LEGENDARY_NEED,
        "Tidal wave. You and both neighbors drink 3.",
        "You surf it. Give 5, arms out.",
        {
          crit: "You drain the ocean. Everyone else drinks 4.",
        },
      ),
    ),
    legendary(
      "rayquaza",
      "Rayquaza",
      "Rayquaza flew down to stop a fight. Name the two players likeliest to brawl. Roll d20.",
      d20(
        LEGENDARY_NEED,
        "Dragon Ascent. You and both brawlers drink 3.",
        "You ride the dragon. The two brawlers hug it out or drink 4 each.",
      ),
    ),
    legendary(
      "regi-trio",
      "The Regi Trio",
      "Nobody beat the Regi puzzle without a guide. Admit you used one, then roll d20.",
      d20(
        LEGENDARY_NEED,
        "Explosion. Drink 5, and admit what else you looked up a guide for.",
        "You crack the code. Give 5.",
        {
          fumble: "Three Explosions. Finish your drink.",
        },
      ),
    ),
  ],
};
