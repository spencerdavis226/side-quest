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

// Kanto: the original eight, Lorelei's Elite Four, Blue and Red, and the
// first Legendaries. Everything here but Red and Mew was written on
// 2026-10-05 for the badge-meter League; the IDs and rules are unchanged.
export const kanto: Region = {
  gyms: [
    leader(
      0,
      "brock",
      "Brock",
      "Boulder",
      "Brock is busy hitting on Nurse Joy. Hit on someone here for him, then roll d20.",
      rollTable(1, 20, [
        { min: 1, max: 12, instruction: "Onix flattens you. Drink 5." },
        {
          min: 13,
          max: 19,
          instruction: "You chip through. Give 3.",
          win: true,
        },
        { min: 20, max: 20, instruction: "Critical hit. Give 6.", win: true },
      ]),
    ),
    leader(
      1,
      "misty",
      "Misty",
      "Cascade",
      "Misty's Cascade. Chug for 10 seconds without stopping. Stop early: drink 4 more.",
    ),
    leader(
      2,
      "lt-surge",
      "Lt. Surge",
      "Thunder",
      "Lt. Surge wants to see your service record. Salute him and roll 2d6.",
      {
        ...rollTable(2, 6, [
          { min: 2, max: 7, instruction: "Shocked. Drink 4." },
          {
            min: 8,
            max: 12,
            instruction: "You ground him. Give 4.",
            win: true,
          },
        ]),
        doubles: "A pair! Paralyzed. Finish your drink.",
      },
    ),
    leader(
      3,
      "erika",
      "Erika",
      "Rainbow",
      "Erika's Sleep Powder. Shut your eyes and roll d6.",
      rollTable(1, 6, [
        ...[1, 2, 3, 4].map((n) => ({
          min: n,
          max: n,
          instruction: `Asleep. Drink ${7 - n} with your eyes shut.`,
        })),
        {
          min: 5,
          max: 6,
          instruction: "You shake it off. Give 4.",
          win: true,
        },
      ]),
    ),
    leader(
      4,
      "koga",
      "Koga",
      "Soul",
      "Ninja test: sneak a sip of someone's drink within 30 seconds. Caught: drink 5.",
    ),
    leader(
      5,
      "sabrina",
      "Sabrina",
      "Marsh",
      "Answer 3 yes-or-no questions from the table. Any pause or lie: drink 3.",
    ),
    leader(
      6,
      "blaine",
      "Blaine",
      "Volcano",
      "Quiz! The table asks 3 trivia questions. Get 2 right. Each miss: drink 3.",
    ),
    leader(
      7,
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
        {
          min: 11,
          max: 19,
          instruction: "You scrape by. Give 4.",
          win: true,
        },
        {
          min: 20,
          max: 20,
          instruction: "You beat the boss. Everyone else finishes their drink.",
          win: true,
        },
      ]),
    ),
  ],

  // Since 2026-10-16 every gauntlet card is a battle: catching a Legendary
  // and beating an Elite Four member are its wins. Cards whose tables had no
  // win gained one on their best rolls; their rules are unchanged.
  eliteFour: [
    eliteFour(
      "lorelei",
      "Lorelei",
      "Ice",
      "Lorelei freezes you solid. Hold perfectly still, mid-pose, while you roll d6.",
      rollTable(1, 6, [
        ...[1, 2, 3, 4].map((n) => ({
          min: n,
          max: n,
          instruction: `Frozen solid. Drink ${5 - n}.`,
        })),
        ...[5, 6].map((n) => ({
          min: n,
          max: n,
          instruction: `You crack the ice. Give ${n}.`,
          win: true,
        })),
      ]),
    ),
    eliteFour(
      "bruno",
      "Bruno",
      "Fighting",
      "Bruno trains to the limit. Handstand against a wall for 10 seconds. Drop: drink 5.",
    ),
    {
      ...eliteFour(
        "agatha",
        "Agatha",
        "Ghost",
        "Nobody says a name for one minute. Anyone else who slips drinks 3. You slip: you lose.",
      ),
      jinx: {
        name: "No Names",
        rule: "Nobody says a first name. Slip: drink 1.",
      },
    },
  ],

  champions: [
    champion(
      "blue",
      "Blue",
      "Kanto",
      "Blue got here first and won't shut up about it. The whole table fights. Roll d20.",
      rollTable(1, 20, [
        {
          min: 1,
          max: 5,
          instruction: "Blue sweeps your team. Everyone finishes their drink.",
        },
        {
          min: 6,
          max: 10,
          instruction:
            'Close fight. Everyone drinks 4 and says "smell ya later."',
        },
        {
          min: 11,
          max: 20,
          instruction: "A clean hit. Hand out 10.",
          win: true,
        },
      ]),
    ),
    champion(
      "red",
      "Red",
      "Kanto",
      "Red hasn't spoken since 1996. The table fights in silence. Anyone talks: drink 2. Roll d20.",
      d20(
        CHAMPION_NEED,
        "Pikachu Volt Tackles the table. Everyone drinks 4 in silence.",
        "A hit on Mt. Silver. Everyone who stayed silent gives 2.",
        {
          crit: "Red nods once. Give 10.",
          fumble: "Red says nothing. Everyone finishes their drink.",
        },
      ),
    ),
  ],

  legendaries: [
    legendary(
      "articuno",
      "Articuno",
      "Articuno freezes the table. Everyone shivers dramatically while you roll d20.",
      rollTable(1, 20, [
        {
          min: 1,
          max: 13,
          instruction:
            "Frozen. Everyone drinks 3; the first to stop shivering drinks 2 more.",
        },
        { min: 14, max: 20, instruction: "A hit! Give 8.", win: true },
      ]),
    ),
    legendary(
      "zapdos",
      "Zapdos",
      "Zapdos used Thunder. Hold hands with both neighbors to ground it, then roll 2d6.",
      rollTable(2, 6, [
        {
          min: 2,
          max: 7,
          instruction: "Struck. You and both neighbors drink {total}.",
        },
        {
          min: 8,
          max: 12,
          instruction: "You ground it. Give {total}.",
          win: true,
        },
      ]),
    ),
    legendary(
      "moltres",
      "Moltres",
      "Moltres is on fire and so is your throat. Roll d20.",
      rollTable(1, 20, [
        { min: 1, max: 12, instruction: "Scorched. Take a high-proof shot." },
        { min: 13, max: 20, instruction: "A hit! Give a shot.", win: true },
      ]),
    ),
    legendary(
      "mewtwo",
      "Mewtwo",
      "Mewtwo reads your mind. Tell the table your worst thought, then roll d20.",
      d20(
        LEGENDARY_NEED,
        "Overpowered. Finish your drink.",
        "You hold on. Pick a player: they share their worst thought or drink 4.",
        { crit: "Mewtwo reels. Everyone else finishes their drink." },
      ),
    ),
    legendary(
      "mew",
      "Mew",
      "Mew is invisible, pink and giggling at you. Shut your eyes, point at a player, then roll d20.",
      d20(
        LEGENDARY_NEED,
        "It giggles off. You and whoever you pointed at drink 3.",
        "Got it by the tail. Give 4.",
        { crit: "It was under the truck. Give 8." },
      ),
    ),
  ],
};
