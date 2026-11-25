import type { CardDefinition } from "../game/types";
import { cardFactory, choice, roll, rollTable } from "./author";
import { cabinSheetCards } from "./custom";

// Cabin weekend: Spencer's CABIIN 2.0 board game (raw sheet kept at
// `reference/cabiin-2/`) translated into the one-card format. Teams became
// the drawing player or a home-state call-out, board movement and skipped
// turns became pours, and multi-round effects last until the drawer's next
// turn. Spaces that only work on the board (the legend, zone scaffolding),
// guess-the-roll spaces, spaces that depend on another card, and lore that
// needs its backstory were left out. The CABIIN-born cards that used to sit
// in Core, and the CABIIN spaces written into the house sheet (verbatim, from
// `custom.ts`), live here now under `core.cabin-*` IDs (`cabin.*` until 2026-11-15;
// `src/app/renamed-ids.ts` moves saved games on). No card is shared with another pack.
const card = cardFactory("core");

const authored: CardDefinition[] = [
  // --- Sip -------------------------------------------------------------------
  card(
    "cabin-fuck-you",
    "Fuck You In Particular",
    "sip",
    "The game has a personal problem with you. Roll d6 and take it.",
    rollTable(1, 6, [
      { min: 1, max: 1, instruction: "It hates you a lot. Drink 9." },
      { min: 2, max: 2, instruction: "Drink 8." },
      { min: 3, max: 3, instruction: "Drink 7." },
      { min: 4, max: 4, instruction: "Drink 6." },
      { min: 5, max: 5, instruction: "Drink 5." },
      { min: 6, max: 6, instruction: "It only mildly hates you. Drink 4." },
    ]),
  ),
  card(
    "cabin-for-safety",
    "For Safety",
    "sip",
    "Make your next drink a water or something hydrating.",
  ),
  card(
    "cabin-international-eric",
    "International Eric",
    "sip",
    "Take a shot of liquor. You like it now.",
  ),
  card(
    "cabin-drinks-on-me",
    "Drinks On Me",
    "sip",
    "Get someone a fresh drink. They pay you something. You both drink 1.",
  ),
  card(
    "cabin-ride-the-bus",
    "Ride the Bus",
    "sip",
    "You picked a suit and you're totally wrong. Drink 4.",
  ),
  card(
    "cabin-atlanta-airport",
    "Atlanta Airport",
    "sip",
    "These planes are sus. Roll d6 and drink that many.",
    roll(1, 6, "Drink {total}."),
  ),
  card(
    "cabin-going-the-distance",
    "Going the Distance",
    "sip",
    "Give 1 for every hour it took you to get here. Idle time doesn't count.",
  ),
  card(
    "cabin-bartender-greg",
    "Bartender Greg",
    "sip",
    "Hit on someone. Roll d6. You both drink that many.",
    roll(1, 6, "You both drink {total}."),
  ),
  card(
    "cabin-allegiant-airlines",
    "Allegiant Airlines",
    "sip",
    "Cheap as fuck until it's not. Roll d6 and give that many.",
    roll(1, 6, "Give {total}."),
  ),
  card(
    "cabin-soooo-thursday",
    "Soooo It's Thursday",
    "sip",
    "Give 3 to someone to calm their nerves.",
  ),
  card(
    "cabin-get-natured",
    "Get Natured",
    "sip",
    "Go outside and drink 1 out there.",
  ),
  card(
    "cabin-how-many-holes",
    "How Many Holes?",
    "sip",
    "Give 1 for every drink you've finished tonight, plus 1.",
  ),
  card(
    "cabin-miller-mike",
    "Miller Mike",
    "sip",
    "The group picks your next full drink. No complaints.",
  ),
  card(
    "cabin-lance",
    "Lance",
    "sip",
    "The dragon champion. He's dragon his nuts across your face. Drink 4.",
  ),
  card(
    "cabin-michigan",
    "Michigan",
    "sip",
    "Drink 3 from an ice-cold drink; explain how it's not even cold. Michigander? Give 3 instead.",
  ),
  card(
    "cabin-yoink",
    "Yoink!",
    "sip",
    "Pick someone. Roll d6. They drink that many.",
    roll(1, 6, "They drink {total}."),
  ),
  card(
    "cabin-gods-chosen",
    "God's Chosen",
    "sip",
    "Had COVID? Drink 3. Never had it? Give 3.",
  ),
  card(
    "cabin-do-not-cum",
    "Do Not Cum",
    "sip",
    "Roll d6. Cum. Drink that many.",
    roll(1, 6, "Drink {total}."),
  ),
  card(
    "cabin-mustard-tiger",
    "Mustard Tiger",
    "sip",
    "Point at whoever's drunk the most tonight. Drink until they say stop.",
  ),

  // --- Group -----------------------------------------------------------------
  card(
    "cabin-thanos-snap",
    "Thanos Snap",
    "group",
    "Pick half the table. Everyone you didn't pick drinks 2.",
  ),
  card(
    "cabin-corporate-meeting",
    "Corporate Meeting",
    "group",
    "This could have been an email. Anyone working tomorrow drinks 3.",
  ),
  card(
    "cabin-cafe-depoque",
    "Café d'Époque",
    "group",
    "Everyone here is a total skank. Now you are too. Hit on someone; you both drink 2.",
  ),
  card(
    "cabin-neighbors",
    "Neighbors",
    "group",
    "Anyone not sleeping under your roof tonight drinks 1.",
  ),
  card(
    "cabin-comradery",
    "Comradery",
    "group",
    "Make up a table cheer. Everyone shouts it, then drinks 2.",
  ),
  card(
    "cabin-birthday",
    "85.21% Birthday",
    "group",
    "Pick someone. You both drink 85.21% of a drink of your choosing.",
  ),
  card(
    "cabin-team-speech",
    "Team Speech",
    "group",
    "Clockwise from you, build a speech one word per person. Then everyone drinks 1.",
  ),
  card(
    "cabin-someone-call-911",
    "Someone Call 9-1",
    "group",
    "Everyone drinks 1 for every injury on this trip so far.",
  ),
  card(
    "cabin-final-showdown",
    "Final Showdown",
    "group",
    "Play Thunderstruck. Anyone who finishes 2 drinks before it ends gives 5.",
  ),
  card(
    "cabin-medium-rare-chicken",
    "Medium Rare Chicken",
    "group",
    "Everyone drinks 2 for every player who has thrown up this trip.",
  ),
  card(
    "cabin-ski-team",
    "Ski Team",
    "group",
    "Skier? Skiers drink 2. Snowboarder? Snowboarders drink 2. Neither? Drink 4 and grow up.",
  ),

  // --- Challenge -------------------------------------------------------------
  card(
    "cabin-smooth-brain",
    "Smooth Brain",
    "challenge",
    "Tell a story about a time you were REAL dumb. Drink 2.",
  ),
  card(
    "cabin-facetime-trivia",
    "FaceTime Trivia",
    "challenge",
    "The group asks you trivia. Wrong: drink 2 and nobody talks to you until your next turn.",
  ),
  card(
    "cabin-county-commissioner",
    "County Commissioner",
    "challenge",
    "Campaign to be in charge. Drink 1 per player who wouldn't vote for you.",
  ),
  card(
    "cabin-drunken-clam",
    "Drunken Clam",
    "challenge",
    "How the fuck did this get here? Roll d6. 1: drink 1. Else finish your drink.",
    rollTable(1, 6, [
      { min: 1, max: 1, instruction: "Drink 1." },
      { min: 2, max: 6, instruction: "Blindsided. Finish your drink." },
    ]),
  ),
  card(
    "cabin-mint-chev",
    "Mint Chev",
    "challenge",
    "Crush a full beer and leave the can on the table. Else roll d6 and drink.",
    choice(
      rollTable(1, 6, [
        { min: 1, max: 3, instruction: "Drink 1." },
        { min: 4, max: 6, instruction: "Drink 2." },
      ]),
      "Crushed it",
      "Roll",
    ),
  ),
  card(
    "cabin-i-dont-know-shit",
    "I Don't Know Shit",
    "challenge",
    "Tell the group something you embarrassingly don't understand. Everyone drinks 2.",
  ),
  card(
    "cabin-dafuq",
    "Dafuq Did I Just Hear?",
    "challenge",
    "You just admitted to loving Lance. Drink until the group is happy.",
  ),
  card(
    "cabin-alakazam",
    "Alakazam",
    "challenge",
    "Pick someone. Spoon them and you both drink 3.",
  ),
  card(
    "cabin-voltorb",
    "Voltorb",
    "challenge",
    "Roll d6. Pick that many players to finish their drinks.",
    rollTable(1, 6, [
      { min: 1, max: 1, instruction: "Pick 1 player to finish their drink." },
      {
        min: 2,
        max: 6,
        instruction: "Pick {total} players to finish their drinks.",
      },
    ]),
  ),
  card(
    "cabin-ow-scratchies",
    "Ow Scratchies",
    "challenge",
    "Show the group a scar and explain it. Everyone drinks 2 in pain.",
  ),
  card("cabin-chaud", "Chaud", "challenge", "Microwave your drink."),
  card(
    "cabin-thats-two-beers",
    "That's Two Beers",
    "challenge",
    "Give out 24 drinks.",
  ),
  card(
    "cabin-guess-ill-die",
    "Guess I'll Die",
    "challenge",
    "Roll 2d6. Doubles: finish your drink. Else drink 2.",
    {
      ...rollTable(2, 6, [{ min: 2, max: 12, instruction: "Drink 2." }]),
      doubles: "Matching dice. Finish your drink.",
    },
  ),
  card(
    "cabin-not-that-drunk",
    "We're Not That Drunk",
    "challenge",
    "Pound a full drink, then take another card now.",
  ),
  card(
    "cabin-cave-herpes",
    "Cave Herpes",
    "challenge",
    "Roll d6. 4 or 5: you escape and give 2. Anything else: you're stuck, drink 2.",
    rollTable(1, 6, [
      { min: 1, max: 3, instruction: "Stuck in the cave. Drink 2." },
      { min: 4, max: 5, instruction: "You escape. Give 2." },
      { min: 6, max: 6, instruction: "Stuck in the cave. Drink 2." },
    ]),
  ),
  card(
    "cabin-fourth-meal",
    "4th Meal",
    "challenge",
    "Fly to Ireland and get a tattoo right now. Else roll d6 and drink.",
    choice(
      rollTable(1, 6, [
        { min: 1, max: 3, instruction: "Drink 1." },
        { min: 4, max: 6, instruction: "Drink 2." },
      ]),
      "Booked it",
      "Roll",
    ),
  ),
  card(
    "cabin-wisconsin",
    "Wisconsin",
    "challenge",
    "The real mitten state. Roll d6. From Wisconsin? You give instead of drinking.",
    rollTable(1, 6, [
      { min: 1, max: 1, instruction: "Drink 6. From Wisconsin? Give 6." },
      { min: 2, max: 2, instruction: "Drink 5. From Wisconsin? Give 5." },
      { min: 3, max: 3, instruction: "Drink 4. From Wisconsin? Give 4." },
      { min: 4, max: 4, instruction: "Drink 3. From Wisconsin? Give 3." },
      { min: 5, max: 5, instruction: "Drink 2. From Wisconsin? Give 2." },
      { min: 6, max: 6, instruction: "Drink 1. From Wisconsin? Give 1." },
    ]),
  ),
  card(
    "cabin-samesies",
    "Samesies",
    "challenge",
    "Roll 2d6. Matching dice means the universe agrees with you.",
    {
      version: 1,
      count: 2,
      sides: 6,
      doubles: "Samesies! Give {total}.",
      outcomes: [
        { min: 2, max: 2, instruction: "Drink 1." },
        { min: 3, max: 4, instruction: "Drink 2." },
        { min: 5, max: 6, instruction: "Drink 3." },
        { min: 7, max: 8, instruction: "Drink 4." },
        { min: 9, max: 10, instruction: "Drink 5." },
        { min: 11, max: 12, instruction: "Drink 6." },
      ],
    },
  ),
  card(
    "cabin-numbers",
    "Numbers",
    "challenge",
    "Drink for every number that exists, or until the group is happy.",
  ),
  card(
    "cabin-king-of-the-hill",
    "King of the Hill",
    "challenge",
    "Roll d6. A 6: everyone else drinks 2. Anything else: drink 2.",
    rollTable(1, 6, [
      { min: 1, max: 5, instruction: "Drink 2." },
      {
        min: 6,
        max: 6,
        instruction: "King of the Hill. Everyone else drinks 2.",
      },
    ]),
  ),
  card(
    "cabin-cant-believe-this",
    "I Can't Believe This",
    "challenge",
    "Pour out someone's drink. They get a fresh one and drink 2.",
  ),
  card(
    "cabin-silly-salmon",
    "Silly Salmon",
    "challenge",
    "Flop on the floor like a fish. Drink 1.",
  ),
  card(
    "cabin-florida",
    "Florida",
    "challenge",
    "Tell everyone how nice Florida is, then roll d6. From Florida? You give instead.",
    rollTable(1, 6, [
      { min: 1, max: 2, instruction: "Drink 1, warm. From Florida? Give 1." },
      { min: 3, max: 4, instruction: "Drink 2, warm. From Florida? Give 2." },
      { min: 5, max: 6, instruction: "Drink 3, warm. From Florida? Give 3." },
    ]),
  ),
  card(
    "cabin-almost-lost-my-cool",
    "Almost Lost My Cool",
    "challenge",
    "If someone here is mad, calm them and give 3. Else rage and drink 3.",
  ),
  card(
    "cabin-crypto",
    "Crypto",
    "challenge",
    "You bought the dip. Roll d6 to see if it kept dipping.",
    rollTable(1, 6, [
      { min: 1, max: 5, step: 2, instruction: "Rug pulled. Drink {total}." },
      { min: 2, max: 6, step: 2, instruction: "To the moon. Give {total}." },
    ]),
  ),
  card(
    "cabin-what-an-idiot",
    "What an Idiot",
    "challenge",
    "Make someone finish their drink.",
  ),
  card(
    "cabin-im-sorry-baby",
    "I'm Sorry Baby",
    "challenge",
    "Roll d6 to find out how sorry you are.",
    rollTable(1, 6, [
      { min: 1, max: 1, instruction: "You're a nobody. Drink 4." },
      { min: 2, max: 4, instruction: "Smoochie-smoochie. Drink 2." },
      { min: 5, max: 6, instruction: "The night closes in. Give 3." },
    ]),
  ),
  card(
    "cabin-son-of-a-bitch",
    "Son of a Bitch, I'm In",
    "challenge",
    "Until your next turn, anyone can offer you a drink and an amount. You're in: you both drink.",
  ),
  card(
    "cabin-get-good",
    "Get Good",
    "challenge",
    "Insult someone's skills. They prove you wrong or drink 3.",
  ),
  card(
    "cabin-what-is-give",
    "What Is? Give",
    "challenge",
    "Swap drinks with someone. Roll d6: you both drink your roll minus 3.",
    rollTable(1, 6, [
      { min: 1, max: 3, instruction: "Nobody drinks." },
      { min: 4, max: 4, instruction: "You both drink 1." },
      { min: 5, max: 5, instruction: "You both drink 2." },
      { min: 6, max: 6, instruction: "You both drink 3." },
    ]),
  ),
  card(
    "cabin-kadabra",
    "Kadabra",
    "challenge",
    "Abra's dumbass brother. Swap seats with anyone.",
  ),
  card("cabin-send-it", "Send It", "challenge", "Finish your drink."),

  // --- Rule ------------------------------------------------------------------
  card(
    "cabin-bitch-babe",
    "Bitch Babe",
    "rule",
    "Give 2. Until your next turn, call your left neighbor babe and everyone else bitch.",
  ),
  card(
    "cabin-freddies-run",
    "Freddie's Run",
    "rule",
    "Until your next turn, fetch anything anyone asks for. Refuse: drink 3.",
  ),
  card(
    "cabin-im-the-captain-now",
    "I'm the Captain Now",
    "rule",
    "Reverse the turn order for the rest of the game, then take another card now.",
  ),
  card(
    "cabin-ultra-low-fare",
    "Ultra Low Fare",
    "rule",
    "Drink 3. Until your next turn, anyone whose die lands on 1 pays the bag fee: drink 1 more.",
  ),
  card(
    "cabin-stonks",
    "Stonks",
    "rule",
    "Smoke something if you've got it. Either way, you're immune to drinks until your next turn.",
  ),
  card(
    "cabin-asshole",
    "Asshole",
    "rule",
    "Until your next turn, do whatever anyone tells you. Refuse: drink 3.",
  ),
  card(
    "cabin-childrens-cabin",
    "Children's Cabin",
    "rule",
    "Get absolutely stoned, or drink 1 whenever anyone draws until your next turn.",
  ),
  card(
    "cabin-like-i-said",
    "Like I Said",
    "rule",
    "Drink 2. Until your next turn, copy everything the next player says and does.",
  ),
  card(
    "cabin-steves-beanie",
    "Steve's Spyder Beanie",
    "rule",
    "Until your next turn, send every drink given to you back to the sender.",
  ),
  card(
    "cabin-deez-nuts",
    "Deez Nuts",
    "rule",
    "You are Deez for the rest of the game. Anyone who falls for your deez nuts joke drinks 3.",
  ),
  card(
    "cabin-ohio",
    "Ohio",
    "rule",
    'That sucks. Drink 2, and until your next turn answer everything with "It\'s not that bad."',
  ),
  card(
    "cabin-part-of-the-crew",
    "Part of the Crew",
    "rule",
    "Pick up to 3 crew. Until your next turn, when one of you drinks, all of you drink.",
  ),
  card(
    "cabin-dream-team",
    "Dream Team",
    "rule",
    "Until your next turn, you may split your drinks with anyone beside you.",
  ),
  card(
    "cabin-president",
    "President",
    "rule",
    "Until your next turn, give anyone orders. Anyone who refuses drinks 2.",
  ),
  card(
    "cabin-christmas",
    "3rd World Christmas",
    "challenge",
    "Give someone an imaginary gift and describe it. They act thrilled, or drink 3.",
  ),
];

// The CABIIN spaces from the house sheet join the authored cards.
export const cabinCards: CardDefinition[] = [...authored, ...cabinSheetCards];
