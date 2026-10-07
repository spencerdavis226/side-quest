import type { CardDefinition, Category, DiceDefinition } from "../game/types";
import { cardFactory, roll, rollTable } from "./author";

/**
 * The generated standard deck. The 2026-10-07 rewrite cut the bare "roll d6,
 * drink or give a number" cards (and their duplicates) and replaced them with
 * cards where something happens between people. Dice stay where the roll is
 * the joke: each result is a punchline with its pour attached.
 *
 * Design rules for this file:
 * - One instruction per card; nobody tracks state between cards.
 * - A dice card's rules give the premise; its outcomes carry the numbers, and
 *   every result resolves to one exact instruction.
 * - Crude, specific, and aimed at the people at the table; no generic
 *   party-game boilerplate.
 *
 * Keep IDs stable: active sessions snapshot their text and order.
 */
type Draft = [
  id: string,
  title: string,
  category: Category,
  rules: string,
  dice?: DiceDefinition,
];
const card = cardFactory("core");

const drafts: Draft[] = [
  // --- Dice: the roll is the joke -------------------------------------------
  [
    "prostate-exam",
    "Prostate Exam",
    "sip",
    "Roll d6. That's how many fingers the doctor used.",
    roll(1, 6, "{total} fingers. Drink {total} and say thank you, doctor."),
  ],
  [
    "walk-of-shame",
    "Walk of Shame",
    "sip",
    "Roll d6 to find out where you woke up this morning.",
    rollTable(1, 6, [
      {
        min: 1,
        max: 1,
        instruction: "Behind a Waffle House. Finish your drink.",
      },
      { min: 2, max: 3, instruction: "Your ex's couch. Drink 3." },
      { min: 4, max: 5, instruction: "Your own bed, alone. Drink 1." },
      { min: 6, max: 6, instruction: "A yacht. Give 6." },
    ]),
  ],
  [
    "gas-station-sushi",
    "Gas Station Sushi",
    "challenge",
    "You ate the gas station sushi. Roll d6.",
    rollTable(1, 6, [
      { min: 1, max: 1, instruction: "You shit yourself. Finish your drink." },
      { min: 2, max: 3, instruction: "Cold sweats. Drink 3." },
      { min: 4, max: 5, instruction: "Rumbling, but holding. Drink 2." },
      { min: 6, max: 6, instruction: "Iron gut. Give 4." },
    ]),
  ],
  [
    "body-count",
    "Body Count",
    "group",
    "Roll d20. Anyone whose body count beats it drinks 3. Lying is between you and God.",
    roll(1, 20, "Body count over {total}? Drink 3."),
  ],
  [
    "lap-dance",
    "Lap Dance Roulette",
    "challenge",
    "Roll d6 and count that many seats to your left. That's who gets a 10-second lap dance.",
    roll(1, 6, "{total} seats left. Dance for them or drink 5."),
  ],
  [
    "hot-seat",
    "Hot Seat",
    "challenge",
    "Roll d6. That many players each ask you a yes-or-no question. Lie and the table knows.",
    roll(1, 6, "{total} questions. Each lie: drink 3."),
  ],
  [
    "nat-one",
    "Nat One",
    "challenge",
    "Roll d20. Pray.",
    rollTable(1, 20, [
      {
        min: 1,
        max: 1,
        instruction:
          "Critical fail. Finish your drink and confess your worst hookup.",
      },
      { min: 2, max: 19, instruction: "Drink 3. The gods are bored." },
      {
        min: 20,
        max: 20,
        instruction: "Natural 20. Make anyone finish their drink.",
      },
    ]),
  ],

  // --- Table moments --------------------------------------------------------
  [
    "hostage-video",
    "Hostage Video",
    "challenge",
    "Film a hostage video begging your mom for bail. Show the table. Weak acting: drink 3.",
  ],
  [
    "dramatic-reading",
    "Dramatic Reading",
    "challenge",
    "Your left neighbor picks one of your texts. Read it aloud like erotica. Refuse: drink 4.",
  ],
  [
    "search-history",
    "Search History",
    "challenge",
    "Read your last three searches aloud. Each one you won't read: drink 2.",
  ],
  [
    "hall-pass",
    "Hall Pass",
    "challenge",
    "Name your celebrity hall pass. If anyone laughs, drink 3.",
  ],
  [
    "dating-profile",
    "Dating Profile",
    "challenge",
    "Your right neighbor pitches you as a dating profile. Hate it: drink 3. Love it: they do.",
  ],
  [
    "bad-kisser",
    "Bad Kisser",
    "challenge",
    "Describe your worst kiss in detail. Anyone winces: give 3. Nobody winces: drink 3.",
  ],
  [
    "pickup-artist",
    "Pickup Artist",
    "challenge",
    "Try your worst pickup line on someone. They laugh: give 3. They don't: drink 3.",
  ],
  [
    "drunk-dial",
    "Drunk Dial",
    "challenge",
    'Call the third person in your recents and say "I know what you did." Chicken out: drink 4.',
  ],
  [
    "meg-ryan",
    "Meg Ryan",
    "challenge",
    "Fake an orgasm for the table. Weak effort, as judged by the table: drink 3.",
  ],
  [
    "confession-booth",
    "Confession Booth",
    "challenge",
    "Confess the grossest thing you did this year. Not gross enough for the table: drink 3.",
  ],
  [
    "roast-me",
    "Roast Me",
    "challenge",
    "Clockwise, everyone describes you in one word. Drink 1 for every word that stings.",
  ],
  [
    "wet-willy",
    "Wet Willy",
    "challenge",
    "Pick someone. They take a wet willy from you or drink 3. Their call.",
  ],
  [
    "smell-check",
    "Smell Check",
    "challenge",
    "Sniff your right neighbor's armpit and rate it out loud. Under 5: they drink 3.",
  ],
  [
    "ugly-crier",
    "Ugly Crier",
    "challenge",
    "Do your best ugly cry for 10 seconds. If the table isn't moved, drink 3.",
  ],
  [
    "useless-fact",
    "Useless Fact",
    "challenge",
    "Share an impressive useless fact. If nobody reacts, drink 2.",
  ],
  [
    "the-receipt",
    "The Receipt",
    "challenge",
    "Read your last purchase aloud. Cringe? Drink 3.",
  ],
  [
    "gym-class",
    "Gym Class",
    "challenge",
    "Do 10 jumping jacks or drink 3. Anyone caught watching too closely drinks 1.",
  ],
  [
    "debate-club",
    "Debate Club",
    "challenge",
    "Defend an opinion nobody shares. Lose the vote: drink 3.",
  ],

  // --- Whole table ----------------------------------------------------------
  [
    "who-farted",
    "Who Farted",
    "group",
    "On three, point at whoever farted. Most pointed drinks 3. Denying it costs 2 more.",
  ],
  [
    "phone-check",
    "Phone Check",
    "group",
    "Everyone puts their phone face up on the table. First to buzz drinks 3 and reads it aloud.",
  ],
  [
    "screenshot",
    "Screenshot",
    "group",
    "Everyone opens their last screenshot. The most damning, by vote, drinks 3.",
  ],
  [
    "camera-roll",
    "Spicy Camera Roll",
    "group",
    "Anyone with a nude in their camera roll right now drinks 2. Liars burn in hell.",
  ],
  [
    "toilet-talk",
    "Toilet Talk",
    "group",
    "Everyone says how long their longest dump lasted. Longest drinks 3. Call bullshit freely.",
  ],
  [
    "ex-files",
    "Ex Files",
    "group",
    "Anyone who's hooked up with someone at this table drinks 3. Don't look at each other.",
  ],
  [
    "wipe-check",
    "Wipe Check",
    "group",
    "Everyone says whether they wipe standing or sitting. The smaller side drinks 2.",
  ],
  [
    "nipple-check",
    "Nipple Check",
    "group",
    "Pierced nipples, past or present, give 3. Everyone else drinks 1 out of respect.",
  ],
  [
    "still-following",
    "Still Following",
    "sip",
    "Drink 1 for every ex you still follow. The table may audit your phone.",
  ],
  [
    "sloppy-seconds",
    "Sloppy Seconds",
    "sip",
    "Finish your left neighbor's drink, then get them a fresh one.",
  ],

  // --- Categories -----------------------------------------------------------
  [
    "bad-baby-names",
    "Bad Baby Names",
    "category",
    "Name terrible baby names. First repeat or blank drinks 3.",
  ],
  [
    "ex-cuses",
    "Ex-Cuses",
    "category",
    "Clockwise, name reasons you dumped someone. First repeat or blank drinks 3.",
  ],
  [
    "cheap-beers",
    "Cheap Beers",
    "category",
    "Name cheap beers. First repeat or blank drinks 3.",
  ],
  [
    "euphemisms",
    "Euphemisms",
    "category",
    "Clockwise, name words for a penis. First repeat or blank drinks 3.",
  ],
  [
    "kama-sutra",
    "Kama Sutra",
    "category",
    "Clockwise, name sex positions; made-up ones count. First repeat or blank drinks 3.",
  ],
  [
    "pillow-talk",
    "Pillow Talk",
    "category",
    "Clockwise, name things you should never say during sex. First repeat or blank drinks 3.",
  ],

  // --- Temporary rules ------------------------------------------------------
  [
    "phone-sex",
    "Phone Sex Operator",
    "rule",
    "Until your next turn, everyone talks like a phone sex operator. Slip: drink 2.",
  ],
  [
    "moms-here",
    "Mom's Here",
    "rule",
    "Until your next turn, everyone acts like their mom is here. Anything she'd hate: drink 2.",
  ],
  [
    "what-she-said",
    "That's What She Said",
    "rule",
    'For the rest of the game, the first to call "that\'s what she said" on a setup gives 2.',
  ],
  [
    "hall-monitor",
    "Hall Monitor",
    "rule",
    "Until your next turn, nobody pees without asking you. Ask nicely or drink 2.",
  ],
  [
    "horny-jail",
    "Horny Jail",
    "rule",
    "Until your next turn, anyone who says something horny gets bonked and drinks 2.",
  ],
  [
    "formal-night",
    "Formal Night",
    "rule",
    "Until your next turn, everyone addresses others as my liege. Slip: drink 2.",
  ],
];

export const standardExpansionCards: CardDefinition[] = drafts.map(
  ([id, title, category, rules, dice]) =>
    card(id, title, category, rules, dice),
);
