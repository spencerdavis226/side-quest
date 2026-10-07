import type { CardDefinition, PackDefinition } from "../game/types";
import { cardFactory, choice, roll } from "./author";

// "The House deck": one card per nonblank row of the supplied Sheet1 CSV
// (`Drink at Ron - Sheet1.csv`). Copy is restored verbatim from that sheet —
// no permission-seeking, no softened pours, no rewritten threats. Dice rows
// keep the sheet's wording and let the engine compute the exact pour. Numeric
// IDs are the original 1-based sheet row numbers, so duplicate titles stay
// distinct and `house.` keeps saved sessions working.
// Exception: at the owner's request (2026-10-07) thirteen flat rows gained a
// crude kicker after their original first sentence; see reference/README.md.
const houseCard = cardFactory("house");
const vipCard = cardFactory("vip");

const sheetRows: CardDefinition[] = [
  houseCard(
    "sheet-003",
    "That's Two Beers?",
    "challenge",
    "Give 4d6 drinks",
    roll(4, 6, "Give {total}."),
  ),
  houseCard(
    "sheet-004",
    "California Sober",
    "sip",
    "Get pitted and smoke something, then drink 1d6 water. Else, take a shot.",
    choice(roll(1, 6, "Drink {total} water."), "Take a shot", "Got pitted"),
  ),
  houseCard(
    "sheet-005",
    "Dog Vision",
    "group",
    "Anyone wearing blue or yellow gives 2",
  ),
  houseCard(
    "sheet-006",
    "The Game Giveth",
    "sip",
    'Give 3 drinks. If "The Game Taketh" was already played, multiply by 1d6.',
  ),
  houseCard(
    "sheet-007",
    "The Game Taketh",
    "sip",
    'Take 3 drinks. If "The Game Giveth" was already played, multiply by 1d6.',
  ),
  houseCard(
    "sheet-008",
    "Fetch",
    "challenge",
    "Get something from outside in under 30 seconds or drink 1d20",
    choice(roll(1, 20, "Drink {total}."), "Got it", "Drink"),
  ),
  houseCard(
    "sheet-009",
    "Steve's Beans",
    "challenge",
    "Text Steve and tell them his beans are good. Else drink 2d6",
    choice(roll(2, 6, "Drink {total}."), "Text Steve", "Refuse"),
  ),
  houseCard(
    "sheet-010",
    "Caveman",
    "rule",
    "You can only grunt until your next turn",
  ),
  houseCard(
    "sheet-011",
    "Drink at Ron",
    "challenge",
    "If Ron is there, drink at him. Else, call and drink at him. Else else, drink 2",
  ),
  houseCard(
    "sheet-012",
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
    "sheet-013",
    "Ron Stop",
    "group",
    'Everyone drinks for as long as you can say "Ron stop"',
  ),
  houseCard(
    "sheet-014",
    "Medusa",
    "challenge",
    "The first person you make eye contact with must get stoned.",
  ),
  houseCard(
    "sheet-015",
    "Mr Freeze",
    "rule",
    "Anyone you touch can't move or talk until you stop touching them",
  ),
  houseCard("sheet-016", "Ursaring", "sip", "Give 13 and apologize"),
  houseCard(
    "sheet-017",
    "Send Help",
    "challenge",
    "Convince someone to drink 1. Else, take a shot.",
  ),
  houseCard(
    "sheet-018",
    "Story Time",
    "category",
    "Say a word. The next person repeats and adds on. Loser drink 4.",
  ),
  houseCard(
    "sheet-019",
    "And the Chicks",
    "group",
    "1 guy drinks. All girls drink",
  ),
  houseCard("sheet-020", "Weinerschnitzel", "group", "All dudes drink"),
  houseCard("sheet-021", "Categories", "category", "Disney Movies"),
  houseCard("sheet-022", "Categories", "category", "Taco Bell menu items"),
  houseCard(
    "sheet-023",
    "Headache Simulator",
    "challenge",
    "Wear Becca's glasses for a round. Else drink 2d6",
    choice(roll(2, 6, "Drink {total}."), "Wear them", "Refuse"),
  ),
  houseCard(
    "sheet-024",
    "Wench",
    "rule",
    "You are the drink wench until your next turn",
  ),
  houseCard("sheet-025", "Categories", "category", "Things you lick"),
  houseCard(
    "sheet-026",
    "Never Have I Ever",
    "sip",
    "Drink if you've been to Mexico. Drink 3 if you drank the water and blamed the tequila",
  ),
  houseCard(
    "sheet-027",
    "Michael Mouse",
    "sip",
    "How many distinct Disney parks have you been to? Drink that many",
  ),
  houseCard(
    "sheet-028",
    "No take, Give",
    "sip",
    "Give d6 drinks",
    roll(1, 6, "Give {total}."),
  ),
  houseCard("sheet-029", "FMK", "challenge", "Blink 182, Green Day, Weezer"),
  houseCard(
    "sheet-030",
    "Potty Mouth",
    "rule",
    "No more cursing for the rest of the game. Drink when you fuck up.",
  ),
  houseCard("sheet-031", "Batrick", "sip", "Take a (rabies) shot"),
  houseCard(
    "sheet-032",
    "Rawr XD",
    "rule",
    "You have to use T-Rex arms until your next turn",
  ),
  houseCard("sheet-033", "Categories", "category", "Trilogy movies"),
  houseCard(
    "sheet-034",
    "Technophoria",
    "group",
    "Anyone who has touched a phone drinks 1d6",
    roll(1, 6, "Everyone drinks {total}."),
  ),
  houseCard("sheet-035", "Categories", "category", "Countries"),
  houseCard(
    "sheet-036",
    "Same",
    "sip",
    "You called Same, give d6",
    roll(1, 6, "Give {total}."),
  ),
  houseCard(
    "sheet-037",
    "Same",
    "sip",
    "You didn't call Same, take d6",
    roll(1, 6, "Drink {total}."),
  ),
  houseCard(
    "sheet-038",
    "The Rock",
    "sip",
    "Finish your drink, you don't get to pass it along",
  ),
  houseCard(
    "sheet-039",
    "This Sucks",
    "rule",
    "Buffalo switches hands for the rest of the game",
  ),
  houseCard(
    "sheet-040",
    "Pokemon",
    "rule",
    "Speak only your first name until your next turn",
  ),
  houseCard("sheet-041", "Categories", "category", "Hockey players"),
  houseCard(
    "sheet-042",
    "Pet that dog",
    "challenge",
    "Better pet any dog in the room, or take 1d6",
    choice(roll(1, 6, "Drink {total}."), "Pet the dog", "Refuse"),
  ),
  houseCard(
    "sheet-043",
    "QUICK",
    "group",
    "Both hands up, last person to do it drinks",
  ),
  houseCard(
    "sheet-044",
    "Points",
    "group",
    "Count to 3 and everyone points at a person to drink. Drink how many points you get",
  ),
  houseCard(
    "sheet-045",
    "Drink, bitch",
    "sip",
    "If you drank last card, drink again, bitch",
  ),
  houseCard(
    "sheet-046",
    "Fiend",
    "challenge",
    "Pop in a fresh zyn, velo, nic pouch",
  ),
  houseCard(
    "sheet-047",
    "Battery Life",
    "challenge",
    "Closest guess to your phone's battery gives 2 drinks",
  ),
  houseCard(
    "sheet-048",
    "Rock, Paper, Scissors",
    "challenge",
    "Challenge a player, loser drinks 1d6",
    roll(1, 6, "Drink {total}."),
  ),
  houseCard(
    "sheet-049",
    "Mexico v China",
    "group",
    "Thumbs up for Mexican food, thumbs down for chinese. Minority drinks",
  ),
  houseCard(
    "sheet-050",
    "Never Have I Ever",
    "sip",
    "Drink if you've flown First Class. Drink 3 if you've joined the mile-high club",
  ),
  houseCard(
    "sheet-051",
    "The Cino",
    "sip",
    "Drink if you've lost money in the casino",
  ),
  houseCard("sheet-052", "Categories", "category", "Name those Pokémon"),
  houseCard(
    "sheet-053",
    "Abra like a Slut",
    "rule",
    "Reverse the turn order for the rest of the game",
  ),
  houseCard(
    "sheet-054",
    "Whinnie the Pooh",
    "sip",
    "Pooh-bear 1d6 drinks",
    roll(1, 6, "Drink {total}."),
  ),
  houseCard("sheet-055", "Could ya just", "sip", "Drink 1"),
  houseCard(
    "sheet-056",
    "Mt. Krumpit",
    "challenge",
    "Dump out your drink and get a fresh one",
  ),
  houseCard(
    "sheet-057",
    "I'm an Idiot",
    "challenge",
    "Say I'm an idiot. Whoever replies \"you're an idiot\" drinks ",
  ),
  houseCard(
    "sheet-058",
    "Accent",
    "challenge",
    "Speak like a high lord and give 1d6 drinks",
    roll(1, 6, "Give {total}."),
  ),
  houseCard(
    "sheet-059",
    "Bu-bu-buff..",
    "sip",
    "Drink 1d6 for almost getting buffaloed",
    roll(1, 6, "Drink {total}."),
  ),
  houseCard(
    "sheet-060",
    "Spirit airlines",
    "challenge",
    "Tell your worst vacation story. If team agrees it's bad, give 2 drinks. If team agrees it's not bad, drink 2 drinks.",
  ),
  houseCard(
    "sheet-061",
    "Damn, you're old",
    "group",
    "Oldest takes a drink and tells us what sex was like before phones",
  ),
  houseCard(
    "sheet-062",
    "What was that?",
    "challenge",
    "Read the last text message you said out loud. Else, drink 1d6.",
    choice(roll(1, 6, "Drink {total}."), "Read it", "Refuse"),
  ),
  houseCard("sheet-063", "Straight to jail", "sip", "Finish your drink"),
  houseCard(
    "sheet-064",
    "Singles",
    "sip",
    "Drink if you're single. Drink 2 more if it's \"by choice\"",
  ),
  houseCard(
    "sheet-065",
    "Couples",
    "sip",
    "Take 1 drink for every year you've been in a relationship",
  ),
  houseCard("sheet-066", "Categories", "category", "Reality TV series"),
  houseCard(
    "sheet-067",
    "Never Have I Ever",
    "sip",
    "Drink if you've been to Germany. Drink 3 if you pissed in public there",
  ),
  houseCard(
    "sheet-068",
    "Never Have I Ever",
    "sip",
    "Drink if you've been to Ireland. Finish your drink if you came back sober",
  ),
  houseCard(
    "sheet-069",
    "Never Have I Ever",
    "sip",
    "Drink if you've been to Italy. Drink 3 if you hooked up with a waiter",
  ),
  houseCard(
    "sheet-070",
    "Never Have I Ever",
    "sip",
    "Drink if you've been to Paris. Drink 3 if you got pickpocketed or dumped there",
  ),
  houseCard(
    "sheet-071",
    "Never Have I Ever",
    "sip",
    "Drink if you've been to Canada. Drink 3 if it was just to drink legally at 19",
  ),
  houseCard(
    "sheet-072",
    "Never Have I Ever",
    "sip",
    "Drink if you've been to Thailand. Drink 3 if you can't tell us what happened there",
  ),
  houseCard(
    "sheet-073",
    "Never Have I Ever",
    "sip",
    "Drink if you've been to Japan. Drink 3 if a vending machine sold you something weird",
  ),
  houseCard(
    "sheet-074",
    "Never Have I Ever",
    "sip",
    "Drink if you've literally shit your pants. Drink 2 if you've shit yourself at the cabin.",
  ),
  houseCard(
    "sheet-076",
    "Big Baby",
    "group",
    "Drink if you're the youngest, then explain one slang word to the oldest",
  ),
  houseCard(
    "sheet-077",
    "Nicetitties",
    "challenge",
    "Say something genuinely nice about the person to your right",
  ),
  houseCard(
    "sheet-078",
    "Split the G",
    "sip",
    "Congrats ya nailed it, give 1d6 drinks",
    roll(1, 6, "Give {total}."),
  ),
  houseCard(
    "sheet-079",
    "Split the G",
    "sip",
    "You fucking blew it, drink 1d6 drinks",
    roll(1, 6, "Drink {total}."),
  ),
  houseCard(
    "sheet-080",
    "Work it",
    "challenge",
    "Do a runway walk. The table scores it; under 7, drink 3",
  ),
  houseCard(
    "sheet-081",
    "ABC's",
    "challenge",
    "Say the alphabet backwards, every mistake is a drink",
  ),
  houseCard(
    "sheet-082",
    "GOALLLL",
    "group",
    "Everyone drinks while the person on your left says GOAAAAALLLLL",
  ),
  houseCard(
    "sheet-083",
    "Call Out",
    "group",
    "Who would overpack for a 1 night stay? They drink",
  ),
  houseCard(
    "sheet-084",
    "Call Out",
    "group",
    "Who reads the group chat but never replies? They drink",
  ),
  houseCard(
    "sheet-085",
    "Call Out",
    "group",
    "Who uses their notes app the most? They drink",
  ),
  houseCard("sheet-086", "Categories", "category", "Animated movies"),
  houseCard("sheet-087", "Categories", "category", "Sales at Freddies"),
  houseCard(
    "sheet-088",
    "Tin Hat Society",
    "challenge",
    "One conspiracy theory you really believe",
  ),
  houseCard(
    "sheet-089",
    "Happy Holidays",
    "challenge",
    "You have 10 seconds to come up with a fake holiday. Drink 2 if you blow it",
  ),
  houseCard(
    "sheet-090",
    "Stare down",
    "challenge",
    "Challenge someone to a staring contest. Loser drinks",
  ),
  houseCard(
    "sheet-091",
    "Goof Dog",
    "rule",
    "Keep your eyes as open as possible until your next turn",
  ),
  houseCard(
    "sheet-092",
    "Call Out",
    "group",
    "Who is most likely to suggest shots? They drink (a shot if they're not scared)",
  ),
  houseCard(
    "sheet-093",
    "Spelling Contest",
    "challenge",
    "The person to your left gives you a word to spell. U wrong U drink. U right, they drink",
  ),
  houseCard(
    "sheet-094",
    "Blessing & a Curse",
    "sip",
    "Give 1d6 drinks and take a different 1d6 drinks",
    roll(2, 6, "Give {first} and drink {second}."),
  ),
  houseCard("sheet-095", "Categories", "category", "Things in a kitchen"),
  houseCard(
    "sheet-096",
    "Knickers",
    "challenge",
    "Guess the person to your rights underwear color. You right, they drink. You wrong, you drink",
  ),
  houseCard(
    "sheet-097",
    "Da Rulez",
    "rule",
    "Until your next turn, you can't use your hands to drink",
  ),
  houseCard(
    "sheet-098",
    "Weatherman",
    "challenge",
    "Give your best weather forecast for the vibes for the rest of the day/night",
  ),
  houseCard(
    "sheet-099",
    "Da Rulez",
    "rule",
    'Until your next turn, the next person to say "beer" drinks',
  ),
  houseCard(
    "sheet-100",
    "Dare",
    "challenge",
    "Balance your drink on your head for 10 seconds",
  ),
  houseCard(
    "sheet-101",
    "Da Rulez",
    "rule",
    "Until your next turn, you have to peel your drink like a banana",
  ),
  houseCard("sheet-102", "Vowels", "sip", "Drink for every vowel in your name"),
  houseCard("sheet-103", "Categories", "category", "US Capitols"),
  houseCard(
    "sheet-104",
    "Opinions",
    "challenge",
    "Give your most Joe/Becca opinion",
  ),
  houseCard(
    "sheet-105",
    "Categories",
    "category",
    "Things you should never say to a police officer",
  ),
];

// Rows that are CABIIN board spaces written into the sheet. At the owner's
// request (2026-10-05) they belong to Cabin weekend alone: same sheet wording,
// `cabin.*` IDs, and no longer in the House deck. Their old `house.sheet-*`
// IDs are retired; saved games keep their own snapshot.
const cabinRows: Record<string, string> = {
  "house.sheet-012": "maddy-booty",
  "house.sheet-016": "ursaring",
  "house.sheet-024": "wench",
  "house.sheet-028": "no-take-give",
  "house.sheet-040": "first-name-only",
  "house.sheet-042": "pet-that-dog",
  "house.sheet-053": "abra-like-a-slut",
  "house.sheet-054": "whinnie-the-pooh",
};

export const houseCards = sheetRows.filter((card) => !cabinRows[card.id]);

export const cabinSheetCards: CardDefinition[] = sheetRows
  .filter((card) => cabinRows[card.id])
  .map((card) => ({ ...card, id: `cabin.${cabinRows[card.id]}` }));

// VIP rows from the same sheet, same rule: exact copy, no softening.
export const customVipCards: CardDefinition[] = [
  vipCard(
    "sheet-003",
    "Fast as Fuck Boi",
    "challenge",
    "VIP gives 3x what they can drink in 1 minute.",
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
    "Give out the ones place of your new age",
  ),
  vipCard(
    "sheet-006",
    "It's Gotta Go",
    "sip",
    "Congrats, the VIP finishes their drink",
  ),
];

export const housePack: PackDefinition = {
  version: 1,
  id: "house",
  logo: "art/packs/house.svg",
  title: "The House deck",
  description:
    "The supplied house sheet, played exactly as written. Cabin call-outs, private jokes, and zero permission slips.",
  cardIds: houseCards.map((card) => card.id),
};
