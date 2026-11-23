import type { CardDefinition, PackDefinition } from "../game/types";
import { cardFactory, flip, roll } from "./author";
import { neverLastCall } from "./last-call";

// Never Have I Ever (2026-11-23, owner): the reader says the card's line and
// everyone who has done it drinks. Every card is standalone: nothing is
// counted between cards, so the classic "fingers down" game lives on a few
// cards as one round (Five Fingers, Speed Round) instead of across the night.
// The body holds the whole instruction; the title is only flavor.
//
// Prompts are `never.NNN` by position in this list; append new prompts at
// the end and never reuse a number. A retired prompt stays as `null`.
const card = cardFactory("never");

type Payout = 2 | 3 | "shot" | "story";
type Prompt = [title: string, prompt: string, payout?: Payout] | null;

const prompts: Prompt[] = [
  // --- Nights out --------------------------------------------------------------
  ["Irish Goodbye", "left a party without telling anyone"],
  ["Wrong Ride", "gotten into a stranger's car by mistake"],
  ["Sole Survivor", "lost a shoe on a night out"],
  ["Mystery Bruise", "woken up with a mystery bruise", "story"],
  ["Tab Still Open", "left my card behind the bar"],
  ["Walk of Fame", "walked home in last night's outfit"],
  ["Mic Hostage", "refused to give back the karaoke mic"],
  ["Porcelain Pillow", "fallen asleep on a toilet"],
  ["Puke and Rally", "puked and kept drinking", 3],
  ["Mom, It's Me", "drunk dialed my parents"],
  ["Bathroom Bestie", "made a best friend in a bathroom line"],
  ["Call Me Gary", "given a stranger a fake name at a bar"],
  ["Brunch Zombie", "shown up to brunch still drunk"],
  ["Persona Non Grata", "been banned from a bar", "story"],
  ["Purse Bar", "snuck my own booze into a bar"],
  ["Finders Keepers", "finished a drink that wasn't mine"],
  ["Floor Is Lava", "fallen over on a dance floor"],
  ["Splashdown", "dropped my phone in a toilet"],
  ["Ghost Order", "woken up to food I don't remember ordering"],
  ["Couch Tourist", "woken up on a stranger's couch", "story"],
  ["Cart Full of Regret", "bought something online while drunk"],
  ["Locked Out", "been locked out of my own place drunk"],
  ["Ink Regret", "gotten a tattoo I regret", 3],
  ["Any Bush Will Do", "peed somewhere I definitely shouldn't have"],
  ["Reception Shotgun", "shotgunned a beer at a wedding"],
  ["Lost the Group", "lost my friends and gone home alone"],
  ["Sunrise Club", "watched the sun come up before going to bed"],
  ["Shot Caller", "ordered a round of shots nobody wanted"],
  // --- Dating and worse --------------------------------------------------------
  ["Ghost Story", "ghosted someone after a good date"],
  ["After Midnight", "texted an ex after midnight"],
  ["Same Name Twice", "dated two people with the same name"],
  ["Name Escapes Me", "forgotten a hookup's name", "story"],
  ["Forbidden Swipe", "swiped right on a friend's ex"],
  ["Burner Account", "had a secret account to stalk someone"],
  ["Fake Emergency", "faked an emergency to escape a date"],
  ["Plus-One Benefits", "hooked up at a wedding", "story"],
  ["Sext Misfire", "sent a sext to the wrong person", 3],
  ["Office Romance", "hooked up with a coworker"],
  ["Back Seat", "fooled around in a car"],
  ["Thin Walls", "had a neighbor bang on the wall"],
  ["Six Foot, Allegedly", "lied about my height on a dating app"],
  ["Old Photo", "used a five-year-old photo on a dating app"],
  ["Snooze Button", "fallen asleep mid-hookup", 3],
  ["Close to Home", "kissed someone at this table", 3],
  ["Family Business", "hooked up with a friend's sibling", 3],
  ["Knock First", "been walked in on", "story"],
  ["No Tan Lines", "gone skinny dipping"],
  ["Stranger Plus-One", "brought someone I'd just met to a wedding"],
  ["Dumped by Text", "broken up with someone by text"],
  ["Sneaking Out", "snuck someone past my parents"],
  ["Back Together", "gotten back with an ex I swore off"],
  // --- Work --------------------------------------------------------------------
  ["Sick, Allegedly", "called in sick hungover"],
  ["Reply All", "hit reply-all on something I shouldn't have", 3],
  ["You're Not Muted", "trashed someone on a call I thought was muted", 3],
  ["Desk Nap", "fallen asleep at my desk"],
  ["Supply Closet Heist", "stolen office supplies"],
  ["Busy Typing", "pretended to type when my boss walked by"],
  ["Resume Fiction", "lied on my resume"],
  ["Pack Your Desk", "been fired", "story"],
  ["Gone Forever", "quit a job by just not showing up"],
  ["Company Party", "puked at a work party", 3],
  ["Throne Room", "taken a work call on the toilet"],
  ["Calendar Block", "booked a fake meeting to avoid real work"],
  ["Love You, Bye", "ended a work call with 'love you'"],
  // --- Gross -------------------------------------------------------------------
  ["Five-Second Rule", "eaten food off a bar floor"],
  ["Day Three", "worn the same underwear three days running"],
  ["Pool Warmer", "peed in a pool as an adult"],
  ["Smell Check", "sniffed my own armpit in public"],
  ["Borrowed Brush", "used someone's toothbrush without asking"],
  ["Hotel Robe", "stolen a hotel bathrobe"],
  ["Plumber's Nightmare", "clogged a toilet at someone else's house", 3],
  ["Sock Sacrifice", "used a sock as toilet paper", 3],
  ["Carry-On Bag", "puked in a bag on public transport"],
  ["Smells Fine", "eaten something I knew had gone off"],
  ["Blame the Dog", "blamed a fart on a pet"],
  ["Double Dog Dare", "eaten something disgusting on a dare"],
  // --- Petty crime -------------------------------------------------------------
  ["Dine and Dash", "dined and dashed", 3],
  ["Five-Finger Discount", "shoplifted as an adult"],
  ["McLovin", "used a fake ID"],
  ["Waterworks", "cried to get out of a ticket"],
  ["Borrowed Forever", "never returned something I borrowed"],
  ["Freeloader", "used an ex's streaming password"],
  ["After Hours", "snuck into a pool after it closed"],
  ["Back of the Cruiser", "been in the back of a cop car", "story"],
  ["Souvenir Glass", "stolen a glass from a bar"],
  ["Accent Night", "faked an accent for a whole night"],
  ["Hop the Fence", "snuck into a concert or a game"],
  // --- Lies and social disasters ------------------------------------------------
  ["Seen It, Loved It", "pretended to have seen a movie I hadn't"],
  ["Book Club Fraud", "faked reading the book for book club"],
  ["Hey... You!", "forgotten someone's name mid-conversation"],
  ["That's Not My Name", "let someone call me the wrong name for months"],
  ["Polite Laugh", "laughed at a joke I didn't get"],
  ["Return to Sender", "regifted a present to the person who gave it", 3],
  ["Deep Scroll", "liked an old photo while stalking someone"],
  ["Wrong Chat", "trashed someone in a chat they were in", 3],
  ["Sudden Illness", "faked being sick to skip a party"],
  ["Not You", "waved back at someone waving at someone else"],
  ["Glass Door", "walked into a glass door"],
  ["Front Camera", "screamed at my own front camera"],
  ["Self-Talk", "been caught talking to myself"],
  ["Ear to the Door", "listened through a door on purpose"],
  ["Roommate's Leftovers", "eaten a roommate's food and denied it"],
  ["House Rules", "cheated at a board game"],
  ["Table Flip", "flipped a board game", 3],
  ["Spoiler Alert", "spoiled a show on purpose"],
  ["Fake Fan", "pretended to like a band to impress someone"],
  ["Phantom Call", "faked a phone call to escape a conversation"],
  ["Hide and Seek", "hidden to avoid someone I know"],
  ["Celebrity Sighting", "lied about meeting someone famous"],
  ["Shower Debate", "rehearsed an argument in the shower"],
  // --- Family ------------------------------------------------------------------
  ["Watered Down", "watered down my parents' liquor"],
  ["Family Group Chat", "sent something filthy to the family chat", "story"],
  ["Forged", "forged a parent's signature"],
  ["Holiday Spirits", "gotten drunk at a family holiday"],
  ["Kids' Table", "been sent to the kids' table as an adult"],
  ["Pass the Gravy", "started a fight at a family dinner"],
  ["Borrowed the Car", "dented a parent's car and said nothing", 3],
  // --- Travel ------------------------------------------------------------------
  ["Final Boarding Call", "missed a flight"],
  ["Passport Panic", "lost my passport abroad", "story"],
  ["Mile High", "joined the mile-high club", 3],
  ["Seat Thief", "taken someone's seat on a plane"],
  ["Wheels Up", "gotten drunk at an airport before noon"],
  ["Tourist Tax", "gotten scammed on vacation"],
  ["Lobster Mode", "fallen asleep on a beach and burned"],
  ["Point and Pray", "ordered abroad by pointing and regretted it"],
  ["Wrong Bed", "woken up in the wrong hotel room"],
  // --- Phones ------------------------------------------------------------------
  ["Left on Read", "left someone on read for a week"],
  ["Location Shared", "tracked someone's location in secret"],
  ["Drafts Folder", "rewritten a text ten times and never sent it"],
  ["Ego Search", "googled myself this month"],
  ["Screen Time", "hit eight hours of screen time in a day"],
  ["Wrong Tab", "shared my screen with the wrong tab open", 3],
  ["Keyboard Warrior", "argued with a stranger online for an hour"],
  ["Untagged", "untagged myself from every photo of a night"],
  // --- Money -------------------------------------------------------------------
  ["Venmo Ghost", "never paid a friend back"],
  ["Split It Evenly", "ordered the most and asked to split evenly"],
  ["Overdraft", "overdrawn my account on a night out"],
  ["Tags Still On", "worn something once and returned it"],
  ["Price Inflation", "lied about how much something cost"],
  // --- The rest ----------------------------------------------------------------
  ["Baby Voice", "used a baby voice on an adult"],
  ["Parked and Crying", "cried in a parked car"],
  ["Sleepwalker", "sleepwalked out of my own room"],
  ["Breakup Haircut", "cut my own hair after a breakup"],
  ["One Brow", "shaved off an eyebrow"],
  ["Rabbit Hole", "believed a conspiracy theory for a whole week"],
  ["Wrong Party", "crashed the wrong party and stayed", "story"],
  ["Lights Out at Nine", "gone to bed before nine on a Saturday"],
  ["Chipped", "chipped a tooth on a bottle"],
  ["Singed", "set my own hair on fire"],
  ["Talking to Plants", "named a houseplant and talked to it"],
  ["Ugly Crier", "cried at a commercial", 2],
];

const payoutText = (payout: Payout = 2) =>
  payout === "shot"
    ? "Anyone who has takes a shot."
    : payout === "story"
      ? "Anyone who has drinks 2. Tell it."
      : `Anyone who has drinks ${payout}.`;

const promptCards: CardDefinition[] = prompts.flatMap((entry, index) =>
  entry
    ? [
        card(
          String(index + 1).padStart(3, "0"),
          entry[0],
          "group",
          `Never have I ever ${entry[1]}. ${payoutText(entry[2])}`,
        ),
      ]
    : [],
);

// Rounds, dice and the coin: the classic game played inside one card.
const specials: CardDefinition[] = [
  card(
    "five-fingers",
    "Five Fingers",
    "category",
    "Three fingers up. Clockwise, say a never have I ever; fold if you have. First fist drinks 3.",
  ),
  card(
    "speed-round",
    "Speed Round",
    "category",
    "Clockwise, fast: a never have I ever each. Anyone who has drinks 1. Stall: drink 2.",
  ),
  card(
    "lone-wolf",
    "Lone Wolf",
    "challenge",
    "Say a never have I ever only you've done. Nobody else has: give 4. Someone has: drink 2.",
  ),
  card(
    "lie-detector",
    "Lie Detector",
    "challenge",
    "Say a never have I ever you HAVE done. Caught lying: drink 3. Got away with it: give 3.",
  ),
  card(
    "called-out",
    "Called Out",
    "challenge",
    "Aim a never have I ever at your left neighbor. If they have, they drink 3. If not, you do.",
  ),
  card(
    "hot-seat",
    "Hot Seat",
    "challenge",
    "Everyone asks you one never have I ever. Drink 1 for each you've done.",
  ),
  card(
    "clean-record",
    "Clean Record",
    "group",
    "Never have I ever done anything on these cards. Anyone who can say that honestly gives 3.",
  ),
  card(
    "thrown-out",
    "Thrown Out",
    "group",
    "Never have I ever been thrown out of somewhere. Anyone who has drinks the roll.",
    roll(1, 6, "Anyone who has drinks {total}."),
  ),
  card(
    "still-drunk",
    "Still Drunk",
    "group",
    "Never have I ever woken up still drunk. Anyone who has drinks the roll.",
    roll(1, 6, "Anyone who has drinks {total}."),
  ),
  card(
    "send-nudes",
    "Pressed Send",
    "group",
    "Never have I ever sent a nude. Anyone who has drinks the roll.",
    roll(1, 6, "Anyone who has drinks {total}."),
  ),
  card(
    "flip-side",
    "Flip Side",
    "group",
    "Never have I ever been dumped. Flip the coin to see who drinks.",
    flip(
      "Tails. Anyone who's been dumped drinks 2.",
      "Heads. Anyone who did the dumping drinks 2.",
    ),
  ),
  card(
    "honest-liars",
    "Honest Liars",
    "group",
    "Never have I ever lied during this game. Flip the coin.",
    flip(
      "Tails. Anyone who hasn't drinks 2. Sure you haven't.",
      "Heads. Anyone who has drinks 2.",
    ),
  ),
  card(
    "call-it",
    "Call It",
    "group",
    "Never have I ever cheated at a coin toss. Everyone calls heads or tails, then flip.",
    flip(
      "Tails. Everyone who called heads drinks 2.",
      "Heads. Everyone who called tails drinks 2.",
    ),
  ),
  card(
    "double-life",
    "Double Life",
    "sip",
    "Never have I ever kept a secret from this whole table. Flip the coin.",
    flip(
      "Tails. Anyone who has drinks 3.",
      "Heads. Anyone who hasn't drinks 1. Boring.",
    ),
  ),
  card(
    "confessional",
    "Confessional",
    "challenge",
    "Name the worst thing you did this year. Then flip the coin.",
    flip(
      "Tails. Tell the whole story, then drink 2.",
      "Heads. Your secret's safe. Everyone else drinks 1.",
    ),
  ),
];

/** The pack's deck: the prompts, then the rounds, dice and coin cards. */
const neverDeck = [...promptCards, ...specials];

export const neverCards: CardDefinition[] = [...neverDeck, ...neverLastCall];

export const neverPack: PackDefinition = {
  version: 1,
  id: "never",
  logo: "art/packs/never.svg",
  title: "Never Have I Ever",
  description:
    "Read the line out loud. Everyone who has done it drinks, and the best ones come with a story.",
  cardIds: neverDeck.map((c) => c.id),
  lastCall: neverLastCall.map((c) => c.id),
};
