import type { CardDefinition, PackDefinition } from "../game/types";
import { cardFactory } from "./author";

// Most Likely To: a vote pack in the spirit of Drunk Stoned or Stupid. Every
// card is one prompt; on three the whole table points, and whoever gets the
// most votes drinks. Cards are standalone: nothing is tallied between cards.
// The body holds the whole instruction ("Most likely to ...? ...") and
// the title is only flavor, so a player who skips the title loses nothing.
// Prompts are original, written for this table after reviewing the usual
// public "most likely to" lists for range (nights out, embarrassing moments,
// spicy, future predictions, friend-group habits).
//
// IDs are `likely.NNN` by position in this list; append new prompts at the
// end and never reuse a number.
const card = cardFactory("likely");

type Payout = 2 | 3 | "finish" | "shot";
// A retired prompt stays as `null` so later IDs keep their numbers.
type Prompt = [title: string, prompt: string, payout?: Payout] | null;

const prompts: Prompt[] = [
  // --- Nights out --------------------------------------------------------------
  ["Hello, It's Me Again", "text their ex tonight"],
  ["Out Cold by Ten", "fall asleep first tonight"],
  ["Find My Phone, Please", "lose their phone before the night ends"],
  ["Bouncer Beef", "start a fight with a bouncer", 3],
  ["Unsolicited Round", "order a round nobody asked for"],
  ["Bar Stool Waterworks", "cry at the bar for no reason"],
  ["Where Am I Now?", "wake up somewhere they don't recognize", 3],
  ["Cart Full of Regret", "drunk-buy something expensive online"],
  ["Escorted Out", "get kicked out of a bar", 3],
  ["Sole Survivor", "lose a shoe on a night out"],
  ["Bathroom Line Besties", "make best friends in the bathroom line"],
  ["One More, Times Six", 'say "one more" and mean six'],
  ["Any Bush Will Do", "pee somewhere they absolutely shouldn't"],
  ["Brunch, Still Buzzed", "show up to brunch still drunk"],
  ["Reception Shotgun", "shotgun a beer at a wedding", "shot"],
  ["Tap, Tap, Speech", "give a toast nobody asked for"],
  ["Reset Button", "puke and rally", 3],
  ["Mic Snatcher", "grab the karaoke mic uninvited"],
  ["Open Tab Orphan", "leave their card at the bar"],
  ["Wall of Text", "drunk-text the group chat a paragraph"],
  ["It Was a Bit", "fall down the stairs and call it a bit"],
  ["Drive-Thru Disciple", "hit the drive-through at 3 a.m."],
  ["Vacation Rules", "start drinking before noon on vacation"],
  ["Who Said That?", "forget a conversation they started"],
  ["Bartender's Favorite", "tip 50% because they love the bartender"],
  ["Fully Dressed Dip", "go swimming fully clothed"],
  ["Goose Beef", "try to fight a goose"],
  ["Perfectly Fine, Thanks", 'swear they\'re "not even that drunk"'],
  ["Four A.M. Club", "still be awake at 4 a.m."],
  ["Fireman's Carry", "need to be carried home", "finish"],
  ["Sip Thief", "finish someone else's drink and deny it"],
  ["Top Shelf Shot", "order the most expensive shot on the menu", "shot"],
  ["Tabletop Dancer", "dance on a table"],
  ["Water, Please", "get cut off by a bartender", 3],
  ["DJ's New Bestie", "become best friends with the DJ"],
  ["Hi Mom, It's Late", "call their mom drunk"],
  ["Concession Smuggler", "sneak alcohol into a movie theater"],
  ["Mad Scientist Cup", "mix three liquors in one cup"],
  ["Empty-Handed Guest", "show up to a party empty-handed"],
  ["Heart-to-Heart Hour", "start a drunk heart-to-heart"],
  ["Midnight Smooch", "kiss a stranger at midnight"],
  ["Conga Captain", "start a conga line"],
  ["Afterparty Orphan", "end up at an afterparty with strangers"],
  ["Power Nap, Round Two", "nap at a party and wake up for round two"],
  ["Pizza at the Bar", "order pizza to the bar"],
  ["Inked on a Dare", "get a tattoo on a dare", 3],
  ["Five-Star Mess", "throw up in an Uber", 3],
  ["Fishbowl Solo", "order a fishbowl and drink it alone"],
  ["Closing Crew", "be the last one to leave every party"],
  ["Friend Swap", "lose their friends and find new ones"],

  // --- Embarrassing ------------------------------------------------------------
  ["Locked Out Again", "lock themselves out of the house"],
  null, // 52: retired 2026-10-07 ("get scammed online")
  ["Talking About You", "text the person they were talking about", 3],
  ["Reply-All Disaster", "reply-all to the whole company"],
  null, // 55: retired 2026-10-07 ("get lost with the GPS on")
  ["Gate Closed", "miss a flight"],
  ["Wrong Airport Energy", "go to the wrong airport"],
  null, // 58: retired 2026-10-07 ("believe a fake headline")
  null, // 59: retired 2026-10-07 ("pay for something that's free")
  ["Beaten by a Kid", "lose rock-paper-scissors to a child"],
  ["Teacher Called Mom", 'call a teacher "mom"'],
  null, // 62: retired 2026-10-07 ("get sunburned on a cloudy day")
  null, // 63: retired 2026-10-07 ("wear a shirt inside out all day")
  null, // 64: retired 2026-10-07 ("walk into a glass door")
  null, // 65: retired 2026-10-07 ("wave back at someone who wasn't waving")
  null, // 66: retired 2026-10-07 ("get hurt opening a bag of chips")
  null, // 67: retired 2026-10-07 ("push a pull door")
  ["Archaeology Like", "like a three-year-old photo by accident"],
  ["Be Your Own Boss", "join a pyramid scheme"],
  ["Driveway Ticket", "get a parking ticket in their own driveway"],
  null, // 71: retired 2026-10-07 ("burn water")
  ["Right Behind You", "talk shit about someone right behind them", 3],
  null, // 73: retired 2026-10-07 ("microwave something metal")
  null, // 74: retired 2026-10-07 ("forget their own phone number")
  ["Wallet Wanderer", "lose their wallet twice on one trip"],
  null, // 76: retired 2026-10-07 ("trip over absolutely nothing")
  ["Smoke Alarm Chef", "set the kitchen on fire"],
  ["Gullible's Travels", "fall for an obvious prank"],
  null, // 79: retired 2026-10-07 ("get stuck in a revolving door")
  ["Wrong Pump", "put the wrong fuel in a car"],
  ["Pocket Dial Disaster", "butt-dial their boss"],
  ["Giggles at the Wake", "laugh at a funeral", 3],
  null, // 83: retired 2026-10-07 ("forget the name of someone they just met")
  ["You Too, Sir", 'say "you too" when the waiter says enjoy'],
  ["Ha. Ha. Ha?", "fake-laugh at a joke they didn't get"],
  ["Talks to Self", "get caught talking to themselves"],
  ["Wrong Words, Proudly", "sing the wrong lyrics with full confidence"],
  null, // 88: retired 2026-10-07 ("leave the house in slippers by accident")
  null, // 89: retired 2026-10-07 ("search for the keys in their hand")
  ["Head First, Stuck", "get their head stuck in something"],
  ["Wrong Recipient", "send a text meant for someone else"],
  ["Deep Scroll Detective", "get caught stalking someone's Instagram"],
  null, // 93: retired 2026-10-07 ("wear socks with sandals unironically")
  ["Bathroom Prisoner", "get locked in a bathroom"],
  ["A Day Early", "show up on the wrong day"],
  null, // 96: retired 2026-10-07 ("forget why they walked into a room")
  null, // 97: retired 2026-10-07 ("lose a fight with a vending machine")
  ["Accidentally Live", "go live on social media by accident"],
  null, // 99: retired 2026-10-07 ("lose their car in a parking garage")
  ["Oops, Emergency", "call 911 by accident"],

  // --- Stoned ------------------------------------------------------------------
  ["Whole Pie Energy", "eat an entire pizza alone"],
  null, // 102: retired 2026-10-07 ("forget what they were saying mid-sentence")
  null, // 103: retired 2026-10-07 ("rewatch the same show for the tenth time")
  ["Aliens Are Real", "believe in aliens with their whole chest"],
  null, // 105: retired 2026-10-07 ("spend 20 minutes choosing a snack")
  ["Dog Whisperer", "have a deep conversation with a dog"],
  ["Second Dinner Order", "order delivery twice in one night"],
  ["Giggle Loop", "laugh at nothing for five straight minutes"],
  ["Wake Up, Sheeple", "start a conspiracy podcast"],
  null, // 110: retired 2026-10-07 ("put the milk in the cupboard")
  ["2 A.M. Pitch", "pitch a genius business idea at 2 a.m."],
  ["Phantom Cop", "get paranoid about a cop who isn't there"],
  null, // 113: retired 2026-10-07 ("watch nature documentaries for fun")
  ["Good Vibes Only", "buy crystals and mean it"],
  null, // 115: retired 2026-10-07 ("take three hours to get ready")
  null, // 116: retired 2026-10-07 ("get obsessed with a new hobby for a month")
  ["Reply: lol", 'reply "lol" to a serious text'],
  null, // 118: retired 2026-10-07 ("eat cereal for dinner")
  ["Universe Explained", "explain the universe to a bartender"],
  null, // 120: retired 2026-10-07 ("name their houseplants")
  ["Bird Break", "get distracted by a bird mid-argument"],
  ["Bro, What If", 'start every sentence with "bro, what if…"'],
  null, // 123: retired 2026-10-07 ("play one album all night")
  ["Movie Night Casualty", "fall asleep during a movie they picked"],
  ["Five-Second Rule", "eat something off the floor"],
  ["Bong Named Gerald", "own a bong with a name"],
  ["Fridge Raider", "raid someone else's fridge uninvited"],
  ["Raccoon Rival", "get chased by a raccoon on the way home"],
  null, // 129: retired 2026-10-07 ("forget their own birthday")
  ["Fry Bandit", "eat fries off a stranger's plate"],

  // --- Spicy -------------------------------------------------------------------
  ["Vacation Vows", "marry someone they met on vacation", 3],
  ["Back Together, Again", "get back with their ex", 3],
  ["Swipe Right, Fast", "fall in love on a dating app in a week"],
  ["Double Booked", "date two people at once", 3],
  ["Sneak Out Special", "get caught sneaking out of someone's place"],
  ["Secret Side Hustle", "have a secret OnlyFans", 3],
  ["Wrong Send", "send a risky photo to the wrong person", "shot"],
  ["Office Romance", "hook up with a coworker", 3],
  ["DM Dreamer", "slide into a celebrity's DMs"],
  ["What Happens in Vegas", "get married in Vegas"],
  ["Secret Crush", "have a crush on someone in this room", "shot"],
  ["Ghost Mode", "ghost someone after a great date"],
  ["Incognito Tab", "have the weirdest search history", 3],
  ["Window Shopper", "keep a dating app open just to look"],
  ["Fan Mail, Romantic", "write a love letter to a celebrity"],
  ["Public Proposal", "propose in public"],
  null, // 147: retired 2026-10-07 ("cry at a romcom")
  ["Save the Date, Already", "plan the wedding before the second date"],
  ["Knock First", "get walked in on", 3],
  ["Charm Offensive", "flirt their way out of a ticket"],
  ["Burner Energy", "have a secret second phone"],
  ["Age Is Just a Number", "date someone twice their age"],
  ["Swipe Gone Wrong", "match with a friend's ex", 3],
  ["Hall Pass Holder", "have a celebrity hall pass ready"],
  ["First Down the Aisle", "be the first one here to get married"],
  ["Eternal Bachelor", "be the last one here to get married"],
  ["Shortest Marriage", "get divorced before the thank-you cards go out"],
  ["Stall Romance", "make out in a public bathroom"],
  ["Animated Affection", "have had a crush on a cartoon character"],
  ["Name on the Arm", "tattoo a partner's name on themselves", 3],
  ["You Up?", 'send a "you up?" text this weekend'],
  ["Wedding Crasher", "hook up at a wedding"],
  ["In It for the Dog", "date someone just for their dog"],
  ["Moonlit Mishap", "get caught skinny-dipping", 3],
  ["Bartender Crush", "fall for the bartender"],
  ["Kiss and Tell", "kiss someone in this room tonight", "shot"],
  ["Hoodie Hostage", "still have their ex's hoodie"],
  ["Fake Emergency Call", "fake a phone call to escape a date"],
  ["Bachelor Party Special", "get a lap dance at a bachelor party"],
  ["Baffling Taste", "have a type nobody understands"],

  // --- The future ----------------------------------------------------------------
  null, // 171: retired 2026-10-07 ("become famous")
  ["Do Not Pass Go", "go to jail", 3],
  ["Easy Come, Easy Go", "win the lottery and lose it all"],
  null, // 174: retired 2026-10-07 ("become a millionaire")
  ["One-Way Ticket", "move to another country on a whim"],
  ["Confessional Cam", "end up on reality TV"],
  ["Charismatic Leader", "start a cult"],
  null, // 178: retired 2026-10-07 ("start a business that actually works")
  ["Canceled Overnight", "get canceled online"],
  ["Viral for Shame", "go viral for the wrong reason"],
  null, // 181: retired 2026-10-07 ("live to 100")
  ["Beam Me Up", "get abducted by aliens"],
  null, // 183: retired 2026-10-07 ("survive a zombie apocalypse")
  ["First to Go", "die first in a horror movie"],
  null, // 185: retired 2026-10-07 ("run for office")
  null, // 186: retired 2026-10-07 ("write a memoir nobody asked for")
  ["Breaking News", "end up on the news"],
  ["Mic Drop Resignation", "quit their job dramatically", 3],
  null, // 189: retired 2026-10-07 ("have ten kids")
  null, // 190: retired 2026-10-07 ("retire first")
  null, // 191: retired 2026-10-07 ("become a crazy cat person")
  null, // 192: retired 2026-10-07 ("run a marathon")
  null, // 193: retired 2026-10-07 ("adopt a pet on a whim")
  ["Picket Line Pinch", "get arrested at a protest"],
  ["Boat Payments", "own a boat they can't afford"],
  ["Boomerang Kid", "move back in with their parents"],
  ["Link in Bio", "become an influencer"],
  ["Dog Days Champion", "win a hot dog eating contest"],
  ["New Name, New Life", "end up in witness protection"],
  ["Timeshare Sucker", "buy a timeshare"],
  ["Riding Mower Rally", "get a DUI on a lawn mower"],
  ["Bar Owner Dreams", "open a bar"],
  null, // 203: retired 2026-10-07 ("star in a commercial")
  ["Slumlord Supreme", "become a landlord everyone hates"],
  null, // 205: retired 2026-10-07 ("follow a band on tour")
  ["Van Life", "live in a van by choice"],
  ["Dateline Material", "show up on a true crime show"],
  ["Staged Exit", "fake their own death", 3],
  ["Rent on Twenty-One", "bet their rent on one hand of blackjack"],
  ["Midlife Face Ink", "get a face tattoo at 50"],

  // --- The group -----------------------------------------------------------------
  ["Fashionably Late", "be late to their own wedding"],
  null, // 212: retired 2026-10-07 ("be the group therapist")
  ["Who, Me?", "start drama and act surprised"],
  ["Keeper of Secrets", "know everyone's secrets"],
  ["Loose Lips", "leak a secret by accident", 3],
  null, // 216: retired 2026-10-07 ("cancel plans last minute")
  null, // 217: retired 2026-10-07 ("plan the whole trip and get no thanks")
  null, // 218: retired 2026-10-07 ("forget to pay you back")
  ["Last Slice Thief", "eat the last slice without asking"],
  ["Aux Cord Dictator", "hog the aux"],
  null, // 221: retired 2026-10-07 ("take 200 selfies on one trip")
  null, // 222: retired 2026-10-07 ("overpack for a weekend")
  ["Off the Trail", "get lost on a group hike"],
  ["Grumbling Good Time", "complain all trip and have the best time"],
  null, // 225: retired 2026-10-07 ("read the group chat and never reply")
  ["Voice Memo Epic", "send a five-minute voice memo"],
  ["Group Chat Warrior", "start a fight in the group chat"],
  ["Plans Are Fluid", "change the plan at the last second"],
  ["Main Character Energy", "become the main character on vacation"],
  null, // 230: retired 2026-10-07 ("make a spreadsheet for the trip")
  ["Sleeping Passenger", "fall asleep in the car every time"],
  ["Restaurant Roulette", "pick the worst restaurant"],
  null, // 233: retired 2026-10-07 ("argue with the GPS")
  ["Hotel Robe Bandit", "steal a souvenir from a hotel"],
  ["Irish Exit", "leave the party without saying goodbye"],
  ["Loudest Wins", "win every argument by yelling"],
  ["Velvet Rope Charmer", "talk their way into a VIP section"],
  ["Embellished Resume", "lie on their resume"],
  ["Board Game Bandit", "cheat at board games"],
  ["Game Face On", "take a game way too seriously"],
  ["Table Flip", "flip the board when they lose"],
  ["Lucky Lick", "lick the dice for luck", 3],
  null, // 243: retired 2026-10-07 ("read the rules and still not get it")
  null, // 244: retired 2026-10-07 ("keep score when nobody asked")
  null, // 245: retired 2026-10-07 ("bring a lucky charm to game night")
  ["Banned for Life", "be the reason we can't go back somewhere", 3],
  ["Hangry, Then Sorry", "yell at a waiter, then tip 40%"],
  null, // 248: retired 2026-10-07 ("have a secret talent nobody knows")
  ["Gas Station Gourmet", "survive on gas station food for a week"],
  ["Tomorrow's Legend", "be talking about this game tomorrow", "finish"],
  // --- Filthy (appended 2026-10-07) --------------------------------------------
  ["Back Seat Driver", "have sex in a car this year", 3],
  ["Oscar-Worthy", "fake an orgasm tonight"],
  ["Leaked Footage", "have a sex tape somewhere", "shot"],
  ["Adult Accident", "shit their pants as an adult", 3],
  ["Deep End Secret", "pee in a pool on purpose"],
  ["Family Plan", "sleep with an ex's sibling", 3],
  ["Locked Drawer", "have a fetish they'd never admit", 3],
  ["Toilet Seat Alibi", "blame an STD on a toilet seat", 3],
  ["Ceiling Hardware", "own a sex swing"],
  ["Whoopsie Wind", "fart during sex"],
  ["Post-Game Tears", "cry after sex"],
  ["Family Chat Flash", "send a nude to the family group chat", "shot"],
  ["Caught Red-Handed", "get caught masturbating", 3],
  ["Burner Account Spy", "keep a burner account to spy on exes"],
  ["Jealousy Campaign", "make out with someone to make an ex jealous"],
  ["Hot Tub Time Machine", "hook up in a hot tub", 3],
  ["Name Unknown", "sleep with someone and never learn their name", 3],
  ["Loose Change Tipper", "tip a stripper in loose change", 3],
  ["Name Mix-Up", "call someone the wrong name in bed", 3],
  ["Mood Killer", "puke on someone mid-hookup", "finish"],
  ["Wax On, Scream Out", "scream during a Brazilian wax"],
  ["Number Fudger", "lie about their body count"],
  ["Ring on Finger", "hook up with a married person", "shot"],
  ["Gold Digger", "date someone for their money"],
  ["Subscribed", "pay for someone's OnlyFans", 3],
  ["Sink Sinner", "pee in a sink at a party"],
  ["Dessert Before Dinner", "eat ass on a first date", 3],
  ["Table Texting", "get caught sexting at the dinner table"],
  ["Funeral Fling", "hook up with someone at a funeral", 3],
  ["Plumber's Nightmare", "clog a hookup's toilet", 3],
  ["Open-Door Policy", "shit with the door open"],
  ["Sniff Test", "sniff their own fingers"],
  ["Day Three Briefs", "wear the same underwear three days straight"],
  ["Public Picker", "eat a booger in public"],
  ["Biohazard Sock", "have a crusty sock under their bed"],
  ["Blame the Dog", "fart and blame the dog"],
  ["Poor Timing", "pop a boner at the worst possible moment"],
  ["Thin Tent Walls", "have loud tent sex on a group trip", 3],
  ["Officer, Hello", "flash a cop", 3],
  ["Itchy Situation", "get crabs"],
  ["Party of Three", "have had a threesome", 3],
  ["Walk of Shame Cam", "do the walk of shame on a Ring camera", "shot"],
  ["Corner Office Fling", "sleep with their boss", 3],
  ["Private Office Hours", "jerk off at work"],
  ["Porcelain Nap", "fall asleep on the toilet at a party", 3],
  ["Swallowed Pride", "throw up in their mouth and swallow it"],
  ["Lick Dare", "lick a stranger on a dare"],
  ["Teenage Flashback", "get a hickey after 30"],
  ["Formal Keg Stand", "do a keg stand in a dress"],
  ["Full Monty Sprint", "streak through somewhere public", 3],
  ["Date Night Betrayal", "make out with a stranger in front of their date", 3],
  ["Shared Brush", "use their roommate's toothbrush"],
  ["First-Time Tale", "have the most embarrassing virginity story"],
  ["Awkward Pillow Talk", "talk dirty and make it weird"],
  ["Dr. Google Visit", "google their symptoms after a hookup"],
  ["Nature Calls", "shit in the woods this weekend"],
  ["Impulse Piercing", "get a nipple piercing on a whim"],
  ["Noisy Sleeper", "moan in their sleep"],
  ["Pool Party Lie", "have sex in a pool and lie about it", 3],
  ["Scarred for Life", "walk in on their parents", 3],
  ["Snooze Button", "fall asleep mid-hookup"],
];

const payoutText = (payout: Payout = 2) =>
  payout === "finish"
    ? "Most votes finishes their drink."
    : payout === "shot"
      ? "Most votes takes a shot."
      : `Most votes drinks ${payout}.`;

const question = (prompt: string) => `Most likely to ${prompt}?`;

export const likelyCards: CardDefinition[] = prompts.flatMap((entry, index) =>
  entry
    ? [
        card(
          String(index + 1).padStart(3, "0"),
          entry[0],
          "group",
          `${question(entry[1])} Point on three. ${payoutText(entry[2])}`,
        ),
      ]
    : [],
);

export const likelyPack: PackDefinition = {
  version: 1,
  id: "likely",
  logo: "art/packs/likely.svg",
  title: "Most Likely To",
  description:
    "Everyone points on three; the table decides who it's talking about.",
  cardIds: likelyCards.map((card) => card.id),
};
