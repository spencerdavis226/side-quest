import type { CardDefinition, Category, DiceDefinition } from "../game/types";
import { cardFactory, flip, roll, rollTable } from "./author";

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
    "Roll d6, count that many players left, skipping yourself. They get a 10-second lap dance.",
    roll(
      1,
      6,
      "{total} players left, skipping you. Dance for them or drink 5.",
    ),
  ],
  [
    "hot-seat",
    "Hot Seat",
    "challenge",
    "Roll d6 and answer that many yes-or-no questions from the table. Lie and it costs you.",
    roll(1, 6, "{total} questions. Each one the table calls a lie: drink 3."),
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
          "Natural 1! Critical fail. Finish your drink; the table picks your next one.",
      },
      { min: 2, max: 10, instruction: "Miss. Drink 3. The gods are bored." },
      { min: 11, max: 19, instruction: "Hit. Give 3. The gods nod, barely." },
      {
        min: 20,
        max: 20,
        instruction: "Natural 20! Make anyone finish their drink.",
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
    "Right neighbor pitches your dating profile. Table swipes left: they drink 3. Right: you do.",
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
    "Sniff your right neighbor's armpit and rate it out of 10. Under 5: they drink 3.",
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
    "All phones face up until your next turn. First to buzz drinks 3 and reads it aloud.",
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
    "Clockwise, name terrible baby names. First repeat or blank drinks 3.",
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
    "Clockwise, name cheap beers. First repeat or blank drinks 3.",
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
  // --- The coin (The Quest 2.1): one flip, two lines -----------------------
  [
    "coin-double-nothing",
    "Double or Nothing",
    "sip",
    "You owe the table 2 drinks. Flip the coin to double it or dodge it.",
    flip("Tails. Doubled. Drink 4.", "Heads. Nothing. Give 2 instead."),
  ],
  [
    "coin-sudden-death",
    "Sudden Death",
    "challenge",
    "You and the player across from you, one coin. Stare each other down, then flip it.",
    flip("Tails. You drink 3.", "Heads. They drink 3."),
  ],
  [
    "coin-the-decider",
    "The Decider",
    "group",
    "The table can't agree on anything. Flip the coin to settle which half is wrong.",
    flip(
      "Tails. Everyone on your right drinks 2.",
      "Heads. Everyone on your left drinks 2.",
    ),
  ],
  [
    "coin-two-faced",
    "Two-Faced",
    "challenge",
    "Say something nice about your left neighbor. Then flip the coin.",
    flip(
      "Tails. You lied. Drink 2 and say what you really think.",
      "Heads. You meant it. They give 2.",
    ),
  ],
  [
    "coin-heads-you-win",
    "Heads You Win",
    "sip",
    "Heads you win, tails everyone else does. Flip the coin.",
    flip("Tails. Everyone else gives you 1 each.", "Heads. Give 4."),
  ],
  [
    "coin-bad-penny",
    "Bad Penny",
    "sip",
    "A bad penny always turns up, and tonight it's turned up for you. Flip the coin.",
    flip(
      "Tails. It's yours. Drink 3.",
      "Heads. It's someone else's problem. Give 3.",
    ),
  ],
  [
    "coin-wishing-well",
    "Wishing Well",
    "group",
    "Make a wish out loud, then flip the coin into the well.",
    flip(
      "Tails. Denied. Drink 2 and wish smaller.",
      "Heads. Granted. Everyone else drinks 2 to your wish.",
    ),
  ],
  [
    "coin-the-ref",
    "The Ref",
    "challenge",
    "You're the ref. Point at two players, one hand each, then flip the coin for kick-off.",
    flip(
      "Tails. Your left hand's player drinks 3.",
      "Heads. Your right hand's player drinks 3.",
    ),
  ],
  [
    "coin-fifty-fifty",
    "Fifty-Fifty",
    "group",
    "Half the table is safe. Hands freeze where they are, then flip the coin.",
    flip(
      "Tails. Everyone holding a drink in their left hand drinks 2.",
      "Heads. Everyone holding a drink in their right hand drinks 2.",
    ),
  ],
  [
    "coin-heads-or-tails",
    "Heads or Tails",
    "group",
    "Everyone puts both hands on their head or on their tail. Then flip the coin.",
    flip("Tails. Hands on tails drink 2.", "Heads. Hands on heads drink 2."),
  ],
  // --- 2026-11-24: researched additions, CABIIN voice ----------------------
  [
    "trust-fall",
    "Trust Fall",
    "sip",
    "You trusted a fart and it lied. Tell the story. Everyone drinks 2.",
  ],
  [
    "two-truths-shart",
    "Two Truths and a Shart",
    "challenge",
    "Tell two truths and a lie about your bowels. Everyone who guesses wrong drinks 2.",
  ],
  [
    "taco-bell-roulette",
    "Taco Bell Roulette",
    "challenge",
    "You ordered the Grande Meal at 2 AM. Roll d6.",
    rollTable(1, 6, [
      { min: 1, max: 1, instruction: "You shat. Drink 6." },
      { min: 2, max: 5, instruction: "Cramps. Drink {total}." },
      { min: 6, max: 6, instruction: "Iron gut. Give 6." },
    ]),
  ],
  [
    "hold-my-beer",
    "Hold My Beer",
    "challenge",
    "Hand your drink right and pull a stunt from your chair. If nobody laughs, drink 4.",
  ],
  [
    "ope",
    "Ope",
    "rule",
    "Until your next turn, anyone who says sorry drinks 1.",
  ],
  [
    "per-my-last-email",
    "Per My Last Email",
    "challenge",
    "Say something passive-aggressive to your left neighbor, office style. They drink 2.",
  ],
  [
    "bench-warmer",
    "Bench Warmer",
    "group",
    "Whoever has been sitting longest stands up, airs it out, and drinks 2.",
  ],
  [
    "venmo-request",
    "Venmo Request",
    "group",
    "Everyone who owes someone here money drinks 2. Name names.",
  ],
  [
    "who-hurt-you",
    "Who Hurt You",
    "challenge",
    "Your left neighbor guesses your trauma. Right, you drink 3. Wrong, they drink 3.",
  ],
  [
    "ghost-protocol",
    "Ghost Protocol",
    "group",
    "Point at whoever leaves without saying bye. They drink 3 now, before they vanish.",
  ],
  [
    "dirty-pint",
    "Dirty Pint",
    "group",
    "Everyone pours a splash into your cup. You pick who drinks it.",
  ],
  [
    "coin-brown-note",
    "Brown Note",
    "sip",
    "Something in your gut just changed key. Flip the coin.",
    flip(
      "Tails. It's you. Drink 4 and step out for a minute.",
      "Heads. False alarm. Everyone else drinks 2 for the scare.",
    ),
  ],
  [
    "hostile-takeover",
    "Hostile Takeover",
    "sip",
    "Swap seats with anyone. They drink 2 for the trouble.",
  ],
];

export const standardExpansionCards: CardDefinition[] = drafts.map(
  ([id, title, category, rules, dice]) =>
    card(id, title, category, rules, dice),
);
