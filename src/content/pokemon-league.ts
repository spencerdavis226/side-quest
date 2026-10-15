import type { CardDefinition, DiceDefinition, RibbonTone } from "../game/types";
import { cardFactory, choice, rollTable } from "./author";

// Pokémon League mode only: the 24 gym leaders of Kanto, Johto and Hoenn and
// the League finale. None of these is in the regular Pokémon deck; the mode
// adds them (`quest.cardIds`). Every leader earns the table a badge when the
// card is put aside, win or lose, so the challenge is the price of the badge:
// most battles are lost more often than won, and losing costs real drinks.
// Written for this mode at the owner's request (2026-10-05); they replace the
// gentler leader cards that came from the supplied board sheets.
const card = cardFactory("pokemon");

const leader = (
  id: string,
  name: string,
  badge: string,
  rules: string,
  dice?: DiceDefinition,
): CardDefinition => ({
  ...card(`gym-${id}`, name, "challenge", rules, dice),
  quest: "pokemon",
  ribbon: `Gym Leader · ${badge} Badge`,
});

// d6/d20 helpers for "drink half, rounded up" and "roll plus N".
const half = (count: number, sides: 6 | 20) =>
  rollTable(
    count,
    sides,
    Array.from({ length: count * sides - count + 1 }, (_, i) => {
      const total = i + count;
      return {
        min: total,
        max: total,
        instruction: `Drink ${Math.ceil(total / 2)}.`,
      };
    }),
  );

export const gymLeaders: CardDefinition[] = [
  // --- Kanto -------------------------------------------------------------------
  leader(
    "brock",
    "Brock",
    "Boulder",
    "Brock is busy hitting on Nurse Joy. Hit on someone here for him, then roll d20.",
    rollTable(1, 20, [
      { min: 1, max: 12, instruction: "Onix flattens you. Drink 5." },
      { min: 13, max: 19, instruction: "You chip through. Drink 2." },
      { min: 20, max: 20, instruction: "Critical hit. Give 6." },
    ]),
  ),
  leader(
    "misty",
    "Misty",
    "Cascade",
    "Start a waterfall. You can't stop until everyone else has, then drink 2 more.",
  ),
  leader(
    "lt-surge",
    "Lt. Surge",
    "Thunder",
    "Lt. Surge wants to see your service record. Salute him and roll 2d6.",
    {
      ...rollTable(2, 6, [
        { min: 2, max: 7, instruction: "Shocked. Drink 4." },
        { min: 8, max: 12, instruction: "You ground him. Give 4." },
      ]),
      doubles: "Paralyzed. Finish your drink.",
    },
  ),
  leader(
    "erika",
    "Erika",
    "Rainbow",
    "Erika's Sleep Powder. Roll d6, then keep your eyes shut until your next turn.",
    rollTable(
      1,
      6,
      [1, 2, 3, 4, 5, 6].map((n) => ({
        min: n,
        max: n,
        instruction: `Drink ${n + 2}, eyes shut.`,
      })),
    ),
  ),
  leader(
    "koga",
    "Koga",
    "Soul",
    "Toxic. Drink 3 now. Until your next turn, drink 1 every time anyone else drinks.",
  ),
  leader(
    "sabrina",
    "Sabrina",
    "Marsh",
    "Answer 3 yes-or-no questions from the table. Any pause or lie: drink 3.",
  ),
  leader(
    "blaine",
    "Blaine",
    "Volcano",
    "Quiz time! The table asks you 3 trivia questions. Each miss: drink 3. All right: give 6.",
  ),
  leader(
    "giovanni",
    "Giovanni",
    "Earth",
    "The mob boss of Kanto runs a gym on the side. Kiss his ring, then roll d20.",
    rollTable(1, 20, [
      {
        min: 1,
        max: 10,
        instruction: "Team Rocket wins. Take a shot and drink 3.",
      },
      { min: 11, max: 19, instruction: "You scrape by. Drink 4." },
      {
        min: 20,
        max: 20,
        instruction: "You beat the boss. Everyone else finishes their drink.",
      },
    ]),
  ),

  // --- Johto -------------------------------------------------------------------
  leader(
    "falkner",
    "Falkner",
    "Zephyr",
    "Stand on one foot until your next turn. Each time you touch down: drink 3.",
  ),
  leader(
    "bugsy",
    "Bugsy",
    "Hive",
    "Bugsy's bugs got in your pants. Roll 3d6 and check your shorts.",
    half(3, 6),
  ),
  leader(
    "whitney",
    "Whitney",
    "Plain",
    "Whitney's Miltank used Rollout. It gets worse every hit. Roll d6.",
    rollTable(1, 6, [
      { min: 1, max: 1, instruction: "Rollout hits once. Drink 1." },
      { min: 2, max: 2, instruction: "Rollout hits twice. Drink 3." },
      { min: 3, max: 3, instruction: "Three hits. Drink 6." },
      { min: 4, max: 4, instruction: "Four hits. Drink 10." },
      { min: 5, max: 6, instruction: "Whitney bursts into tears. Give 5." },
    ]),
  ),
  leader(
    "morty",
    "Morty",
    "Fog",
    "Curse. Drink 2 now. Until your next turn, drink 2 whenever anyone says your name.",
  ),
  leader(
    "chuck",
    "Chuck",
    "Storm",
    "Arm-wrestle the strongest player. Loser drinks 6. If they refuse, they drink 6.",
  ),
  leader(
    "jasmine",
    "Jasmine",
    "Mineral",
    "Hold a full drink at arm's length for 30 seconds. Lower it: finish it. Make it: give 4.",
  ),
  leader(
    "pryce",
    "Pryce",
    "Glacier",
    "Chug a glass of ice water, or roll d20 and drink half, rounded up.",
    choice(half(1, 20), "Chugged it", "Roll"),
  ),
  leader(
    "clair",
    "Clair",
    "Rising",
    "Clair says you're too weak for dragons. Tell her she's right, then roll 2d6.",
    rollTable(2, 6, [
      { min: 2, max: 8, instruction: "Dragonbreath. Drink {total}." },
      { min: 9, max: 12, instruction: "You tame the dragon. Give {total}." },
    ]),
  ),

  // --- Hoenn -------------------------------------------------------------------
  leader(
    "roxanne",
    "Roxanne",
    "Stone",
    "Name 8 Pokémon types in 10 seconds. Drink 2 for each one you miss.",
  ),
  leader(
    "brawly",
    "Brawly",
    "Knuckle",
    "Ten push-ups, or roll d20 and drink half, rounded up.",
    choice(half(1, 20), "Did them", "Roll"),
  ),
  leader(
    "wattson",
    "Wattson",
    "Dynamo",
    "Wahahaha! Wattson licks a battery and dares you to do the same. Roll 2d6.",
    {
      ...rollTable(2, 6, [
        { min: 2, max: 12, instruction: "Shocked. Drink {total}." },
      ]),
      doubles: "Overcharge. Everyone else drinks {total}.",
    },
  ),
  leader(
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
      { min: 5, max: 6, instruction: "You douse her. Give a shot." },
    ]),
  ),
  leader(
    "norman",
    "Norman",
    "Balance",
    "Drink 4 and call the player on your left Dad for the rest of the game. Refuse: drink 8.",
  ),
  leader(
    "winona",
    "Winona",
    "Feather",
    "Drink 4 standing on a chair. Stay up until your next turn or finish your drink.",
  ),
  leader(
    "tate-liza",
    "Tate & Liza",
    "Mind",
    "Creepy twins. Pick a partner and speak in unison while you roll 2d6.",
    {
      ...rollTable(2, 6, [
        { min: 2, max: 7, instruction: "They outmatch you. You both drink 5." },
        {
          min: 8,
          max: 12,
          instruction: "You hold them off. You both drink 2.",
        },
      ]),
      doubles: "Perfect sync. You both give 8.",
    },
  ),
  leader(
    "wallace",
    "Wallace",
    "Rain",
    "Cross the room heel to toe, drink balanced on your head. Spill or wobble: finish it.",
  ),
];

// --- The League gauntlet ------------------------------------------------------
// After the eighth badge: one Legendary, four of the Elite Four, then the
// Champion, each picked at random when the game starts and dealt one at a
// time. None is ever shuffled into the deck. Beating the Champion ends the
// game.

const finale = (
  id: string,
  name: string,
  ribbon: string,
  ribbonTone: RibbonTone,
  rules: string,
  dice?: DiceDefinition,
): CardDefinition => ({
  ...card(id, name, "challenge", rules, dice),
  ribbon,
  ribbonTone,
});

const legendary = (
  id: string,
  name: string,
  rules: string,
  dice?: DiceDefinition,
) =>
  finale(`legendary-${id}`, name, "Legendary Encounter", "pearl", rules, dice);

export const legendaries: CardDefinition[] = [
  legendary(
    "articuno",
    "Articuno",
    "Articuno freezes the table. Everyone shivers dramatically while you roll d20.",
    rollTable(1, 20, [
      { min: 1, max: 13, instruction: "Frozen. Everyone drinks 3." },
      { min: 14, max: 20, instruction: "Caught! Give 8." },
    ]),
  ),
  legendary(
    "zapdos",
    "Zapdos",
    "Zapdos used Thunder. Hold hands with both neighbors to ground it, then roll 2d6.",
    rollTable(2, 6, [
      {
        min: 2,
        max: 8,
        instruction: "Struck. You and both neighbors drink {total}.",
      },
      { min: 9, max: 12, instruction: "Caught! Give {total}." },
    ]),
  ),
  legendary(
    "moltres",
    "Moltres",
    "Moltres is on fire and so is your throat. Roll d20.",
    rollTable(1, 20, [
      { min: 1, max: 12, instruction: "Scorched. Take a high-proof shot." },
      { min: 13, max: 20, instruction: "Caught! Give a shot." },
    ]),
  ),
  legendary(
    "mewtwo",
    "Mewtwo",
    "Mewtwo reads your mind and tells the table your worst thought. Only a 20 catches it. Roll d20.",
    rollTable(1, 20, [
      { min: 1, max: 15, instruction: "Overpowered. Finish your drink." },
      { min: 16, max: 19, instruction: "You hold on. Drink 4." },
      {
        min: 20,
        max: 20,
        instruction: "Caught! Everyone else finishes their drink.",
      },
    ]),
  ),
  legendary(
    "lugia",
    "Lugia",
    "Lugia floods the table. Roll d20 for how long everyone drinks.",
    rollTable(1, 20, [
      {
        min: 1,
        max: 19,
        instruction: "Everyone drinks for {total} seconds.",
      },
      {
        min: 20,
        max: 20,
        instruction: "Caught! Everyone else drinks for 20 seconds.",
      },
    ]),
  ),
  legendary(
    "ho-oh",
    "Ho-Oh",
    "Ho-Oh used Sacred Fire. It burns going down and comes back twice as hot. Roll d6.",
    rollTable(
      1,
      6,
      [1, 2, 3, 4, 5, 6].map((n) => ({
        min: n,
        max: n,
        instruction: `Drink ${n}, then give ${n * 2}.`,
      })),
    ),
  ),
  legendary(
    "eon-duo",
    "Latias & Latios",
    "Pick a partner. Spoon them while you roll 2d6. Matching dice catches the pair.",
    {
      ...rollTable(
        2,
        6,
        Array.from({ length: 11 }, (_, i) => ({
          min: i + 2,
          max: i + 2,
          instruction: `They slip away. You both drink ${Math.ceil((i + 2) / 2)}.`,
        })),
      ),
      doubles: "Caught both! You both give 10.",
    },
  ),
  legendary(
    "deoxys",
    "Deoxys",
    "A space virus with a laser. Only a 20 catches it. Roll d20.",
    rollTable(1, 20, [
      { min: 1, max: 10, instruction: "Psycho Boost lands. Drink 6." },
      { min: 11, max: 19, instruction: "Glancing blow. Drink 3." },
      { min: 20, max: 20, instruction: "Caught! Give 10." },
    ]),
  ),
];

const eliteFour = (
  id: string,
  name: string,
  type: string,
  rules: string,
  dice?: DiceDefinition,
) => finale(`elite-${id}`, name, `Elite Four · ${type}`, "violet", rules, dice);

export const eliteFourMembers: CardDefinition[] = [
  eliteFour(
    "lorelei",
    "Lorelei",
    "Ice",
    "Chug a glass of ice water, then roll d6. Lorelei likes it cold.",
    rollTable(
      1,
      6,
      [1, 2, 3, 4, 5, 6].map((n) => ({
        min: n,
        max: n,
        instruction: `Brain freeze. Drink ${n}.`,
      })),
    ),
  ),
  eliteFour(
    "bruno",
    "Bruno",
    "Fighting",
    "Arm-wrestle the two strongest players back to back. Each loss: drink 5.",
  ),
  eliteFour(
    "agatha",
    "Agatha",
    "Ghost",
    "Drink 3. Until your next turn you can't say anyone's name. Each slip: drink 3.",
  ),
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
  eliteFour(
    "sidney",
    "Sidney",
    "Dark",
    "Sidney thinks you're a little bitch. Prove him wrong: roll 2d6.",
    rollTable(2, 6, [
      { min: 2, max: 6, instruction: "Crunched. Finish your drink." },
      { min: 7, max: 7, instruction: "A standoff. Drink 7." },
      { min: 8, max: 12, instruction: "You beat him. Give 5." },
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
      { min: 1, max: 12, instruction: "Sheer Cold. Drink 6." },
      { min: 13, max: 19, instruction: "You thaw out. Drink 3." },
      { min: 20, max: 20, instruction: "You shatter her ice. Give 8." },
    ]),
  ),
  eliteFour(
    "drake",
    "Drake",
    "Dragon",
    "Drake is a sailor. Drink like one. Roll 3d6.",
    rollTable(
      3,
      6,
      Array.from({ length: 16 }, (_, i) => ({
        min: i + 3,
        max: i + 3,
        instruction: `Drink ${Math.ceil((i + 3) / 2) + 2}.`,
      })),
    ),
  ),
];

const champion = (
  id: string,
  name: string,
  region: string,
  rules: string,
  dice: DiceDefinition,
) =>
  finale(
    `league-champion-${id}`,
    name,
    `Champion · ${region}`,
    "crimson",
    rules,
    dice,
  );

// The last card of the run: the whole table fights, and winning ends it.
export const champions: CardDefinition[] = [
  champion(
    "blue",
    "Blue",
    "Kanto",
    "Your rival got here first and smells like your mom's perfume. The whole table fights. Roll d20.",
    rollTable(1, 20, [
      {
        min: 1,
        max: 8,
        instruction: "Blue smells you. Everyone finishes their drink.",
      },
      { min: 9, max: 16, instruction: "Close fight. Everyone drinks 4." },
      {
        min: 17,
        max: 20,
        instruction: "Champion! Hand out 10 and take a victory lap.",
      },
    ]),
  ),
  champion(
    "lance",
    "Lance",
    "Johto",
    "Lance used Hyper Beam on the whole table. Roll d20. Pray for a 19.",
    rollTable(1, 20, [
      {
        min: 1,
        max: 10,
        instruction:
          "Hyper Beam sweeps the table. Everyone finishes their drink.",
      },
      { min: 11, max: 18, instruction: "Close fight. Everyone drinks 3." },
      {
        min: 19,
        max: 20,
        instruction: "Hall of Fame! Make a rule for the rest of the night.",
      },
    ]),
  ),
  champion(
    "steven",
    "Steven",
    "Hoenn",
    "Steven wants to show the whole table his rock collection. Roll 2d6 to escape.",
    rollTable(2, 6, [
      {
        min: 2,
        max: 8,
        instruction: "Meteor Mash. Everyone drinks {total}.",
      },
      {
        min: 9,
        max: 12,
        instruction: "Champion! Give {total}, split however you like.",
      },
    ]),
  ),
];
