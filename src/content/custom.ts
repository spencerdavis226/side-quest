import type { CardDefinition } from "../game/types";
import { cardFactory, choice, roll, rollTable } from "./author";

// "The House deck": one card per nonblank row of the supplied Sheet1 CSV
// (`Drink at Ron - Sheet1.csv`). Copy is restored verbatim from that sheet —
// no permission-seeking, no softened pours, no rewritten threats. Dice rows
// keep the sheet's wording and let the engine compute the exact pour. Numeric
// IDs are the original 1-based sheet row numbers (`core.house-NNN`), so
// duplicate titles stay distinct (`house.sheet-NNN` until 2026-11-15;
// `src/app/renamed-ids.ts` moves saved games on).
// Exception: at the owner's request (2026-10-07) thirteen flat rows gained a
// crude kicker after their original first sentence; see reference/README.md.
const houseCard = cardFactory("core");
const vipCard = cardFactory("vip");

const sheetRows: CardDefinition[] = [
  houseCard(
    "house-003",
    "That's Two Beers?",
    "challenge",
    "Give 4d6 drinks",
    roll(4, 6, "Give {total}."),
  ),
  houseCard(
    "house-004",
    "California Sober",
    "sip",
    "Get pitted and smoke something, then drink 1d6 water. Else, take a shot.",
    choice(roll(1, 6, "Drink {total} water."), "Take a shot", "Got pitted"),
  ),
  houseCard(
    "house-005",
    "Dog Vision",
    "group",
    "Anyone wearing blue or yellow gives 2",
  ),
  houseCard(
    "house-006",
    "The Game Giveth",
    "sip",
    "Give 3. If The Game Taketh came up earlier tonight, give 3 more.",
  ),
  houseCard(
    "house-007",
    "The Game Taketh",
    "sip",
    "Drink 3. If The Game Giveth came up earlier tonight, drink 3 more.",
  ),
  houseCard(
    "house-008",
    "Fetch",
    "challenge",
    "Get something from outside in under 30 seconds or drink 1d20",
    choice(roll(1, 20, "Drink {total}."), "Got it", "Drink"),
  ),
  houseCard(
    "house-009",
    "Steve's Beans",
    "challenge",
    "Text Steve and tell him his beans are good. Else, drink 2d6",
    choice(roll(2, 6, "Drink {total}."), "Text Steve", "Refuse"),
  ),
  houseCard(
    "house-010",
    "Caveman",
    "rule",
    "You can only grunt until your next turn. Slip: drink 2.",
  ),
  houseCard(
    "house-011",
    "Drink at Ron",
    "challenge",
    "If Ron is there, drink at him. Else, call and drink at him. Else else, drink 2",
  ),
  houseCard(
    "house-012",
    "Maddy Booty",
    "challenge",
    "Roll 1d20. You drink until the group counts to it, or you finish your drink.",
    roll(
      1,
      20,
      "Drink until the group counts to {total}, or finish your drink.",
    ),
  ),
  houseCard(
    "house-013",
    "Ron Stop",
    "group",
    'Everyone drinks for as long as you can say "Ron stop"',
  ),
  houseCard(
    "house-014",
    "Medusa",
    "challenge",
    "Until your next turn, anyone who meets your eyes turns to stone and drinks 2.",
  ),
  houseCard(
    "house-015",
    "Mr Freeze",
    "rule",
    "Until your next turn, anyone you touch freezes until you let go. Move or talk: drink 2.",
  ),
  houseCard("house-016", "Ursaring", "sip", "Give 13 and apologize"),
  houseCard(
    "house-017",
    "Send Help",
    "challenge",
    "Convince someone to drink 1. Else, take a shot.",
  ),
  houseCard(
    "house-018",
    "Story Time",
    "category",
    "Say a word. Clockwise, each player repeats the story and adds a word. First to slip drinks 4.",
  ),
  houseCard(
    "house-019",
    "And the Chicks",
    "group",
    "Pick one guy to drink. All girls drink too.",
  ),
  houseCard("house-020", "Weinerschnitzel", "group", "All dudes drink"),
  houseCard(
    "house-021",
    "Disney Marathon",
    "category",
    "Name Disney movies, one each, clockwise. First repeat or blank drinks 3.",
  ),
  houseCard(
    "house-022",
    "Fourth Meal",
    "category",
    "Name Taco Bell menu items, one each, clockwise. First repeat or blank drinks 3.",
  ),
  houseCard(
    "house-023",
    "Headache Simulator",
    "challenge",
    "Wear Becca's glasses until your next turn. Else drink 2d6",
    choice(roll(2, 6, "Drink {total}."), "Wear them", "Refuse"),
  ),
  houseCard(
    "house-024",
    "Wench",
    "rule",
    "You are the drink wench until your next turn",
  ),
  houseCard(
    "house-025",
    "Lick It",
    "category",
    "Name things you lick, one each, clockwise. First repeat or blank drinks 3.",
  ),
  houseCard(
    "house-026",
    "Tequila Water",
    "sip",
    "Never have I ever been to Mexico. Drink if you have, 3 if you drank the water and blamed tequila",
  ),
  houseCard(
    "house-027",
    "Michael Mouse",
    "sip",
    "How many distinct Disney parks have you been to? Drink that many",
  ),
  houseCard(
    "house-028",
    "No take, Give",
    "sip",
    "Give d6 drinks",
    roll(1, 6, "Give {total}."),
  ),
  houseCard(
    "house-029",
    "Pop Punk FMK",
    "challenge",
    "Fuck, marry, kill: Blink-182, Green Day, Weezer. Defend your picks. Table boos one: drink 2.",
  ),
  houseCard(
    "house-030",
    "Potty Mouth",
    "rule",
    "No more cursing for the rest of the game. Drink when you fuck up.",
  ),
  houseCard("house-031", "Batrick", "sip", "Take a (rabies) shot"),
  houseCard(
    "house-032",
    "Rawr XD",
    "rule",
    "You have to use T-Rex arms until your next turn. Slip: drink 2.",
  ),
  houseCard(
    "house-033",
    "Threequel",
    "category",
    "Name trilogy movies, one each, clockwise. First repeat or blank drinks 3.",
  ),
  houseCard(
    "house-034",
    "Technophoria",
    "group",
    "Anyone who has touched a phone drinks 1d6",
    roll(1, 6, "Anyone who's touched a phone drinks {total}."),
  ),
  houseCard(
    "house-035",
    "World Tour",
    "category",
    "Name countries, one each, clockwise. First repeat or blank drinks 3.",
  ),
  houseCard(
    "house-036",
    "Called It",
    "sip",
    "Call high or low out loud, then roll d6. Right: give what it shows. Wrong: drink it.",
    rollTable(1, 6, [
      {
        min: 1,
        max: 3,
        instruction: "Low. Called it? Give {total}. Didn't? Drink {total}.",
      },
      {
        min: 4,
        max: 6,
        instruction: "High. Called it? Give {total}. Didn't? Drink {total}.",
      },
    ]),
  ),
  houseCard(
    "house-038",
    "The Rock",
    "sip",
    "Finish your drink, you don't get to pass it along",
  ),
  houseCard(
    "house-039",
    "This Sucks",
    "rule",
    "Buffalo flips: rest of the game, anyone caught holding a drink in their off hand finishes it.",
  ),
  houseCard(
    "house-040",
    "Pokemon",
    "rule",
    "Speak only your first name until your next turn. Slip: drink 2.",
  ),
  houseCard(
    "house-041",
    "Hat Trick",
    "category",
    "Name hockey players, one each, clockwise. First repeat or blank drinks 3.",
  ),
  houseCard(
    "house-042",
    "Pet that dog",
    "challenge",
    "Better pet any dog in the room, or take 1d6",
    choice(roll(1, 6, "Drink {total}."), "Pet the dog", "Refuse"),
  ),
  houseCard(
    "house-043",
    "QUICK",
    "group",
    "Both hands up, last person to do it drinks",
  ),
  houseCard(
    "house-044",
    "Points",
    "group",
    "Count to 3 and everyone points at a person to drink. Drink how many points you get",
  ),
  houseCard(
    "house-045",
    "Drink, bitch",
    "sip",
    "Everyone who drank on the last card drinks again, bitch.",
  ),
  houseCard(
    "house-046",
    "Fiend",
    "challenge",
    "Pop in a fresh Zyn, Velo or nic pouch. Don't have one? Drink 2.",
  ),
  houseCard(
    "house-047",
    "Battery Life",
    "challenge",
    "Everyone guesses your phone's battery. Closest guess gives 2.",
  ),
  houseCard(
    "house-048",
    "Rock, Paper, Scissors",
    "challenge",
    "Challenge a player, loser drinks 1d6",
    roll(1, 6, "Loser drinks {total}."),
  ),
  houseCard(
    "house-049",
    "Mexico v China",
    "group",
    "Thumbs up for Mexican food, thumbs down for Chinese. Minority drinks",
  ),
  houseCard(
    "house-050",
    "Mile High",
    "sip",
    "Never have I ever flown First Class. Drink if you have, 3 if you've joined the mile-high club",
  ),
  houseCard(
    "house-051",
    "The Cino",
    "sip",
    "Drink if you've lost money in the casino",
  ),
  houseCard(
    "house-052",
    "Gotta Name 'Em",
    "category",
    "Name Pokémon, one each, clockwise. First repeat or blank drinks 3.",
  ),
  houseCard(
    "house-053",
    "Abra like a Slut",
    "rule",
    "Reverse the turn order for the rest of the game",
  ),
  houseCard("house-055", "Could ya just", "sip", "Drink 1"),
  houseCard(
    "house-056",
    "Mt. Crumpit",
    "challenge",
    "Dump out your drink and get a fresh one",
  ),
  houseCard(
    "house-057",
    "I'm an Idiot",
    "challenge",
    "Say I'm an idiot. Whoever replies \"you're an idiot\" drinks 2",
  ),
  houseCard(
    "house-058",
    "Accent",
    "challenge",
    "Speak like a high lord and give 1d6 drinks",
    roll(1, 6, "Give {total}."),
  ),
  houseCard(
    "house-059",
    "Bu-bu-buff…",
    "sip",
    "Drink 1d6 for almost getting buffaloed",
    roll(1, 6, "Drink {total}."),
  ),
  houseCard(
    "house-060",
    "Spirit Airlines",
    "challenge",
    "Tell your worst vacation story. Table agrees it's bad: give 2. Table says not bad: drink 2.",
  ),
  houseCard(
    "house-061",
    "Damn, you're old",
    "group",
    "Oldest takes a drink and tells us what sex was like before phones",
  ),
  houseCard(
    "house-062",
    "What was that?",
    "challenge",
    "Read your last text message out loud. Else, drink 1d6.",
    choice(roll(1, 6, "Drink {total}."), "Read it", "Refuse"),
  ),
  houseCard("house-063", "Straight to jail", "sip", "Finish your drink"),
  houseCard(
    "house-064",
    "Singles",
    "sip",
    "Drink if you're single. Drink 2 more if it's \"by choice\"",
  ),
  houseCard(
    "house-065",
    "Couples",
    "sip",
    "Take 1 drink for every year you've been in a relationship",
  ),
  houseCard(
    "house-066",
    "Reality Check",
    "category",
    "Name reality TV series, one each, clockwise. First repeat or blank drinks 3.",
  ),
  houseCard(
    "house-067",
    "Bier Garden",
    "sip",
    "Never have I ever been to Germany. Drink if you have, 3 if you pissed in public there",
  ),
  houseCard(
    "house-068",
    "Luck of the Irish",
    "sip",
    "Never have I ever been to Ireland. Drink if you have, finish your drink if you came back sober",
  ),
  houseCard(
    "house-069",
    "Table for Two",
    "sip",
    "Never have I ever been to Italy. Drink if you have, 3 if you hooked up with a waiter",
  ),
  houseCard(
    "house-070",
    "City of Light Fingers",
    "sip",
    "Never have I ever been to Paris. Drink if you have, 3 if you got pickpocketed or dumped there",
  ),
  houseCard(
    "house-071",
    "Legal at 19",
    "sip",
    "Never have I ever been to Canada. Drink if you have, 3 if it was to drink legally at 19",
  ),
  houseCard(
    "house-072",
    "Lost in Thailand",
    "sip",
    "Never have I ever been to Thailand. Drink if you have, 3 if you can't say what happened there",
  ),
  houseCard(
    "house-073",
    "Vending Roulette",
    "sip",
    "Never have I ever been to Japan. Drink if you have, 3 if a vending machine sold you something weird",
  ),
  houseCard(
    "house-074",
    "Code Brown",
    "sip",
    "Never have I ever shit my pants. Drink if you have, 2 if you've shit yourself at the cabin.",
  ),
  houseCard(
    "house-076",
    "Big Baby",
    "group",
    "Drink if you're the youngest, then explain one slang word to the oldest",
  ),
  houseCard(
    "house-077",
    "Nicetitties",
    "challenge",
    "Say something genuinely nice about the person to your right",
  ),
  houseCard(
    "house-078",
    "Clean Split",
    "challenge",
    "Split the G: drink yours down to exactly halfway. Table says nailed it: give 4. Missed: drink 4.",
  ),
  houseCard(
    "house-080",
    "Work it",
    "challenge",
    "Do a runway walk. The table scores it; under 7, drink 3",
  ),
  houseCard(
    "house-081",
    "ABCs",
    "challenge",
    "Say the alphabet backwards, every mistake is a drink",
  ),
  houseCard(
    "house-082",
    "GOALLLL",
    "group",
    "Everyone drinks while the person on your left says GOAAAAALLLLL",
  ),
  houseCard(
    "house-083",
    "Overpacker",
    "group",
    "Who would overpack for a 1 night stay? They drink",
  ),
  houseCard(
    "house-084",
    "Left on Read",
    "group",
    "Who reads the group chat but never replies? They drink",
  ),
  houseCard(
    "house-085",
    "Notes App Hoarder",
    "group",
    "Who uses their notes app the most? They drink",
  ),
  houseCard(
    "house-086",
    "Saturday Morning",
    "category",
    "Name animated movies, one each, clockwise. First repeat or blank drinks 3.",
  ),
  houseCard(
    "house-087",
    "Freddies Run",
    "category",
    "Name things on sale at Freddies, one each, clockwise. First repeat or blank drinks 3.",
  ),
  houseCard(
    "house-088",
    "Tin Hat Society",
    "challenge",
    "Share one conspiracy theory you really believe. The table votes if it's believable. If not, drink 2.",
  ),
  houseCard(
    "house-089",
    "Happy Holidays",
    "challenge",
    "You have 10 seconds to come up with a fake holiday. Drink 2 if you blow it",
  ),
  houseCard(
    "house-090",
    "Stare down",
    "challenge",
    "Challenge someone to a staring contest. Loser drinks",
  ),
  houseCard(
    "house-091",
    "Goof Dog",
    "rule",
    "Keep your eyes as open as possible until your next turn. Caught squinting: drink 2.",
  ),
  houseCard(
    "house-092",
    "Shot Starter",
    "group",
    "Who is most likely to suggest shots? They drink (a shot if they're not scared)",
  ),
  houseCard(
    "house-093",
    "Spelling Contest",
    "challenge",
    "The person to your left gives you a word to spell. U wrong U drink. U right, they drink",
  ),
  houseCard(
    "house-094",
    "Blessing & a Curse",
    "sip",
    "Give 1d6 drinks and take a different 1d6 drinks",
    roll(2, 6, "Give {first} and drink {second}."),
  ),
  houseCard(
    "house-095",
    "Kitchen Raid",
    "category",
    "Name things in a kitchen, one each, clockwise. First repeat or blank drinks 3.",
  ),
  houseCard(
    "house-096",
    "Knickers",
    "challenge",
    "Guess the person to your right's underwear color. You right, they drink. You wrong, you drink",
  ),
  houseCard(
    "house-097",
    "Hands Off",
    "rule",
    "Until your next turn, you can't use your hands to drink. Slip: drink 2.",
  ),
  houseCard(
    "house-098",
    "Weatherman",
    "challenge",
    "Give your best weather forecast for the vibes for the rest of the day/night",
  ),
  houseCard(
    "house-099",
    "Magic Word",
    "rule",
    'Until your next turn, the next person to say "beer" drinks',
  ),
  houseCard(
    "house-100",
    "Dare",
    "challenge",
    "Balance your drink on your head for 10 seconds. Drop it or refuse: drink 3.",
  ),
  houseCard(
    "house-101",
    "Banana Peel",
    "rule",
    "Until your next turn, you have to peel your drink like a banana",
  ),
  houseCard("house-102", "Vowels", "sip", "Drink for every vowel in your name"),
  houseCard(
    "house-103",
    "Capital Idea",
    "category",
    "Name US state capitals, one each, clockwise. First repeat or blank drinks 3.",
  ),
  houseCard(
    "house-104",
    "Opinions",
    "challenge",
    "Give your most Joe/Becca opinion",
  ),
  houseCard(
    "house-105",
    "Know Your Rights",
    "category",
    "Name things you'd never say to a cop, one each clockwise. First repeat or blank drinks 3.",
  ),
];

// Rows that are CABIIN board spaces written into the sheet. At the owner's
// request (2026-10-05) they belong to Cabin weekend alone: same sheet wording,
// `core.cabin-*` IDs, and no longer in the House deck. Their sheet-row IDs
// are retired; saved games keep their own snapshot.
const cabinRows: Record<string, string> = {
  "core.house-012": "maddy-booty",
  "core.house-016": "ursaring",
  "core.house-024": "wench",
  "core.house-028": "no-take-give",
  "core.house-040": "pokemon",
  "core.house-042": "pet-that-dog",
  "core.house-053": "abra-like-a-slut",
};

/**
 * Sheet rows retired in the 2026-11-25 card review (owner: "retire any cards
 * that need it"; Whinnie the Pooh: "drop it entirely"). Saved games keep
 * their snapshot; these IDs are never reused. `src/app/renamed-ids.ts` still
 * points their old IDs here, so its test accepts them as retired.
 */
export const RETIRED_SHEET_IDS = [
  "core.house-037", // Same Card, Wrong: narrated a Ride the Bus hand nobody played
  "core.cabin-whinnie-the-pooh", // sheet row 54
  "core.house-079", // Missed the G: folded into Clean Split (row 78)
];

export const houseCards = sheetRows.filter((card) => !cabinRows[card.id]);

export const cabinSheetCards: CardDefinition[] = sheetRows
  .filter((card) => cabinRows[card.id])
  .map((card) => ({ ...card, id: `core.cabin-${cabinRows[card.id]}` }));

// VIP rows from the same sheet, same rule: exact copy, no softening.
export const customVipCards: CardDefinition[] = [
  vipCard(
    "sheet-003",
    "Fast as Fuck Boi",
    "challenge",
    "The VIP drinks for one minute while the table counts sips. They give 3 per sip.",
  ),
  vipCard(
    "sheet-004",
    "Your Big Night",
    "group",
    "Everyone has to say something nice about the VIP. Then everyone drinks.",
  ),
  vipCard(
    "sheet-005",
    "One Year Older",
    "sip",
    "Give out the last digit of the VIP's new age. A zero gives 10.",
  ),
  vipCard(
    "sheet-006",
    "It's Gotta Go",
    "sip",
    "Congrats, the VIP finishes their drink",
  ),
];
