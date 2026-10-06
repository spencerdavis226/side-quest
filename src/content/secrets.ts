import type {
  CardDefinition,
  PackDefinition,
  TimerDefinition,
} from "../game/types";
import { cardFactory } from "./author";

// Secrets & fuses: hold-to-read secrets, hidden fuses and a visible clock.
// The mechanics are borrowed from party games (Paranoia, Killer, Heads Up,
// Taboo, charades, 5 Second Rule, hot potato); every prompt is written for
// this table. A secret shows only while a player holds the card's plaque; a
// timed card can't be put aside until its time is up. Nothing is saved
// between cards.
//
// IDs are `secrets.<kind>-NN` by position in each list; append new entries
// at the end of a list and never reuse a number.
const card = cardFactory("secrets");
const id = (kind: string, index: number) =>
  `${kind}-${String(index + 1).padStart(2, "0")}`;
const fuse = (end: string, min = 15, max = 45): TimerDefinition => ({
  version: 1,
  kind: "fuse",
  min,
  max,
  end,
});
const countdown = (seconds: number, end: string): TimerDefinition => ({
  version: 1,
  kind: "countdown",
  seconds,
  end,
});
const withSecret = (c: CardDefinition, secret: string): CardDefinition => ({
  ...c,
  secret,
});
const withTimer = (c: CardDefinition, timer: TimerDefinition) => ({
  ...c,
  timer,
});

// --- Secrets ---------------------------------------------------------------

const paranoia = [
  "Who here would you least trust with your unlocked phone?",
  "Who here is most likely to have a secret account?",
  "Who here would you call to help hide a body?",
  "Who here has the worst taste in partners?",
  "Who here would last longest in a zombie apocalypse?",
  "Who here talks about you behind your back?",
  "Who here would you want to be stuck in an elevator with?",
  "Who here is the worst kisser, judging by vibes alone?",
  "Who here would sell out the whole group for $10,000?",
  "Who here has the most embarrassing search history?",
  "Who here is secretly the most competitive?",
  "Who here would you trust to dress you for a wedding?",
  "Who here dies first in a horror movie?",
  "Who here has the highest body count?",
  "Who here would you least want to share a bed with?",
  "Who here is most likely to have a dark side nobody's seen?",
  "Who here gives the worst advice?",
  "Who here would you call at 3 a.m. in a real crisis?",
  "Who here should never be allowed to plan a trip?",
  "Who here is most likely to get arrested this year?",
  "Who is the best-looking person at this table?",
  "Who here would you swap lives with for a week?",
  "Who here is faking having their life together?",
  "Who here would cry first in an argument?",
  "Who here has the most annoying laugh?",
  "Who here would you pick as your wingman tonight?",
  "Who here is the worst driver?",
  "Who here wins a fistfight against everyone else?",
  "Who here is most likely to ghost someone?",
  "Who here owes someone at this table an apology?",
];

const missions = [
  'Get someone to say the word "literally."',
  "Get someone to give you a high five.",
  "Get two people to cheers with you at once.",
  "Get someone to tell you what time it is.",
  'Work the word "pineapple" into conversation twice.',
  "Get someone to repeat a sentence back to you.",
  "Get someone to stand up.",
  "Get someone to hand you something.",
  "Get the table singing, even one line.",
  "Get someone to show you a photo on their phone.",
  'Make someone say "what?" three times.',
  "Get someone to swap seats with you.",
  "Get someone to say your name.",
  "Get someone to agree with an obviously false fact.",
  "Say one full sentence in a British accent without explaining it.",
  "Tell a terrible joke and get someone to laugh at it.",
  "Get someone to ask you about your childhood.",
  'Get someone to say "I love you."',
  "Make someone drink at the same moment as you, three times.",
  "Get someone to compliment your outfit.",
];

// Answers checked against standard references; keep only claims with a
// settled answer.
const facts = [
  "FACT: Octopuses have three hearts.",
  "CAP: Goldfish only have a three-second memory.",
  "FACT: Honey found in ancient Egyptian tombs was still edible.",
  "CAP: You can see the Great Wall of China from space with the naked eye.",
  "FACT: Bananas are berries, but strawberries are not.",
  "FACT: A day on Venus is longer than its year.",
  "CAP: Bulls charge because the color red makes them angry.",
  "FACT: Scotland's national animal is the unicorn.",
  "CAP: Napoleon was unusually short for his time.",
  "FACT: Cleopatra lived closer to the Moon landing than to the building of the Great Pyramid.",
  "FACT: Wombat poop is cube-shaped.",
  "CAP: Humans only use 10% of their brains.",
  "FACT: Oxford University is older than the Aztec Empire.",
  "CAP: Lightning never strikes the same place twice.",
  "CAP: Shaving makes hair grow back thicker.",
  "FACT: Sharks have been around longer than trees.",
];

const TRUTH = "Tell the truth. Every word.";
const LIE = "Lie. Make it up and sell it.";
const stories: [title: string, topic: string, secret: string][] = [
  ["Worst Date", "your worst date story", LIE],
  ["Police Story", "your best cop story", TRUTH],
  ["Celebrity Sighting", "your best celebrity story", LIE],
  ["ER Visit", "your dumbest injury story", TRUTH],
  ["Worst Job", "your worst job story", LIE],
  ["Worst Hangover", "your worst hangover story", TRUTH],
];

const secretRules = [
  'Nobody may say the word "drink."',
  "Nobody may point with a finger.",
  "Nobody may say anyone's name.",
];

const secretCards: CardDefinition[] = [
  ...paranoia.map((question, i) =>
    withSecret(
      card(
        id("paranoia", i),
        "Paranoia",
        "group",
        "Left neighbor reads alone, then names someone, who can drink 2 to see the question.",
      ),
      question,
    ),
  ),
  ...missions.map((mission, i) =>
    withSecret(
      card(
        id("mission", i),
        "Secret Mission",
        "challenge",
        "Read alone, then do it before your next turn. Done: others drink 3. Caught: you drink 3.",
      ),
      mission,
    ),
  ),
  ...facts.map((claim, i) =>
    withSecret(
      card(
        id("fact", i),
        "Fact or Cap",
        "group",
        "Read alone, say just the claim. On three, all vote fact or cap; wrong voters drink 2.",
      ),
      claim,
    ),
  ),
  ...stories.map(([title, topic, secret], i) =>
    withSecret(
      card(
        id("story", i),
        title,
        "challenge",
        `Read alone, tell ${topic}. Table votes truth or lie; wrong voters drink 2.`,
      ),
      secret,
    ),
  ),
  ...secretRules.map((rule, i) =>
    withSecret(
      card(
        id("rule", i),
        "Secret Rule",
        "rule",
        "Read alone. This rule holds the rest of the game; anyone you catch breaking it drinks 2.",
      ),
      rule,
    ),
  ),
];

// --- The clock -------------------------------------------------------------

const foreheadWords = [
  "Hangover",
  "Karaoke",
  "Bachelor party",
  "Designated driver",
  "Walk of shame",
  "Beer pong",
  "Group chat",
  "Pub crawl",
];

const banned = [
  "TEQUILA. Banned: shot, Mexico, lime, salt, margarita.",
  "WEDDING. Banned: marry, bride, groom, ring, dress.",
  "BARTENDER. Banned: bar, drink, serve, tip, cocktail.",
  "VEGAS. Banned: casino, gamble, Nevada, strip, Elvis.",
  "DATING APP. Banned: swipe, date, match, profile, phone.",
  "CAMPFIRE. Banned: fire, camp, s'mores, wood, marshmallow.",
  "BRUNCH. Banned: mimosa, eggs, Sunday, breakfast, lunch.",
  "SUNBURN. Banned: sun, beach, red, burn, lotion.",
];

const charades = [
  "Parallel parking a limo.",
  "Sneaking in at 4 a.m. and getting caught.",
  "A bartender ignoring you.",
  "Dropping your phone in a pool.",
];

const quickfire = [
  "beers you'd actually order",
  "things in a junk drawer",
  "reasons to call in sick",
  "things never to say on a date",
  "wrong pizza toppings",
];

const clockCards: CardDefinition[] = [
  ...foreheadWords.map((word, i) =>
    withTimer(
      withSecret(
        card(
          id("forehead", i),
          "Forehead",
          "challenge",
          "Start the clock. Phone on your forehead, press Hold to read. Table gives clues; you guess.",
        ),
        word,
      ),
      countdown(30, "Time. Got it? Give 3. Still guessing? Drink 3."),
    ),
  ),
  ...banned.map((word, i) =>
    withTimer(
      withSecret(
        card(
          id("banned", i),
          "No Saying It",
          "challenge",
          "Read alone. Start the clock; get the table to guess the word without a banned word.",
        ),
        word,
      ),
      countdown(
        60,
        "Time. Guessed? Give 3. Not guessed, or a banned word slipped? Drink 3.",
      ),
    ),
  ),
  ...charades.map((scene, i) =>
    withTimer(
      withSecret(
        card(
          id("charade", i),
          "Act It Out",
          "challenge",
          "Read this alone. Start the clock and act it out, no words or sounds. The table guesses.",
        ),
        scene,
      ),
      countdown(
        45,
        "Time. Someone guessed? You both give 2. Nobody did? You drink 3.",
      ),
    ),
  ),
  ...quickfire.map((topic, i) =>
    withTimer(
      card(
        id("quick", i),
        "Three in Five",
        "category",
        `Start the clock: name three ${topic} before it ends. Table judges duds.`,
      ),
      countdown(5, "Time. Didn't get three? Drink 3. Did? Give 3."),
    ),
  ),
  withTimer(
    card(
      "clock-silence",
      "Dead Silence",
      "group",
      "Start the clock. Everyone stays silent until time's up; first to make a sound drinks 3.",
    ),
    countdown(30, "Time. Everyone who stayed silent gives 1."),
  ),
  withTimer(
    card(
      "clock-stare",
      "Staring Contest",
      "challenge",
      "Start the clock and stare down your left neighbor. First to look away or laugh drinks 3.",
    ),
    countdown(30, "Time. Nobody broke? You both drink 2."),
  ),
  withTimer(
    card(
      "clock-straight-face",
      "Straight Face",
      "challenge",
      "Start the clock. Everyone tries to make you laugh; keep a straight face the whole time.",
    ),
    countdown(30, "Time. Cracked? Drink 3. Held it? Everyone else drinks 2."),
  ),
  withTimer(
    card(
      "clock-plank",
      "Plank It",
      "challenge",
      "Start the clock and hold a plank until time's up. Drop early and you drink 4.",
    ),
    countdown(30, "Time. Still up? Give 4."),
  ),
  withTimer(
    card(
      "clock-alphabet",
      "Backwards",
      "challenge",
      "Start the clock and say the alphabet backwards, Z to A, before time runs out.",
    ),
    countdown(20, "Time. Made it to A? Give 3. Didn't? Drink 3."),
  ),
];

// --- Fuses -----------------------------------------------------------------

const potato: [topic: string, end: string][] = [
  ["beer brand", "Boom. Whoever's holding this drinks 3."],
  ["car brand", "Boom. Whoever's holding this drinks 3."],
  ["fast-food chain", "Boom. Whoever's holding this drinks 3."],
  ["Pokémon", "Boom. Whoever's holding this drinks 4."],
  ["Disney movie", "Boom. Whoever's holding this drinks 3."],
  ["cocktail", "Boom. Whoever's holding this takes a shot."],
  ["U.S. state", "Boom. Whoever's holding this drinks 3."],
  ["country in Europe", "Boom. Whoever's holding this drinks 3."],
  ["boy band", "Boom. Whoever's holding this drinks 3."],
  ["cereal", "Boom. Whoever's holding this drinks 3."],
  ["Marvel character", "Boom. Whoever's holding this drinks 4."],
  ["dog breed", "Boom. Whoever's holding this drinks 3."],
  ["Taylor Swift song", "Boom. Whoever's holding this drinks 4."],
  ["breakfast food", "Boom. Whoever's holding this drinks 3."],
  ["sitcom", "Boom. Whoever's holding this drinks 3."],
  ["cheese", "Boom. Whoever's holding this drinks 3."],
  ["NFL team", "Boom. Whoever's holding this drinks 4."],
  ["thing in a purse", "Boom. Whoever's holding this drinks 3."],
  ["excuse for being late", "Boom. Whoever's holding this drinks 3."],
  ["app on your phone", "Boom. Whoever's holding this drinks 3."],
  ['word for "drunk"', "Boom. Whoever's holding this takes a shot."],
  ["famous Chris", "Boom. Whoever's holding this drinks 3."],
  ["reality TV show", "Boom. Whoever's holding this drinks 3."],
  ["Harry Potter character", "Boom. Whoever's holding this drinks 4."],
  ["pasta shape", "Boom. Whoever's holding this drinks 3."],
  ["airline", "Boom. Whoever's holding this drinks 3."],
  ["board game", "Boom. Whoever's holding this drinks 3."],
  ["pizza topping", "Boom. Whoever's holding this drinks 3."],
  ["sticky thing", "Boom. Whoever's holding this drinks 3."],
  ["famous duo", "Boom. The holder drinks 3 and whoever passed it drinks 2."],
];

const HOLDER_3 = "Boom. Whoever's holding this drinks 3.";
const fuseCards: CardDefinition[] = [
  ...potato.map(([topic, end], i) =>
    withTimer(
      card(
        id("potato", i),
        "Hot Potato",
        "category",
        `Light the fuse. Name a ${topic}, then pass the phone left. No repeats.`,
      ),
      fuse(end),
    ),
  ),
  withTimer(
    card(
      "fuse-compliment",
      "Compliment Bomb",
      "group",
      "Light the fuse. Give your left neighbor a real compliment, then pass the phone to them.",
    ),
    fuse(HOLDER_3),
  ),
  withTimer(
    card(
      "fuse-rhyme",
      "Rhyme Bomb",
      "category",
      "Light the fuse. Say a word that rhymes with beer, then pass the phone left. No repeats.",
    ),
    fuse(HOLDER_3),
  ),
  withTimer(
    card(
      "fuse-alphabet",
      "Alphabet Bomb",
      "category",
      "Light the fuse. Say a word starting with A, the next player B, and so on, passing left.",
    ),
    fuse(HOLDER_3),
  ),
  withTimer(
    card(
      "fuse-buzz",
      "Buzz Bomb",
      "group",
      "Light the fuse. Count up passing left; say buzz on any number with a 7 or divisible by 7.",
    ),
    fuse(HOLDER_3),
  ),
  withTimer(
    card(
      "fuse-questions",
      "Questions Only",
      "group",
      "Light the fuse. Pass left, speaking only in questions. Anyone who answers plainly drinks 2.",
    ),
    fuse(HOLDER_3),
  ),
  withTimer(
    card(
      "fuse-accent",
      "Accent Bomb",
      "group",
      "Light the fuse. Say a sentence in an accent, then pass the phone left. No repeat accents.",
    ),
    fuse(HOLDER_3),
  ),
  withTimer(
    card(
      "fuse-colors",
      "Wrong Way",
      "category",
      "Light the fuse. Name a song with a color in the title, then pass the phone right.",
    ),
    fuse(HOLDER_3),
  ),
  withTimer(
    card(
      "fuse-confess",
      "Confession Bomb",
      "group",
      "Light the fuse. Confess one small sin, then pass the phone left. No repeats.",
    ),
    fuse(HOLDER_3),
  ),
  withTimer(
    card(
      "fuse-story",
      "Chain Story",
      "group",
      "Light the fuse. Add one sentence to a story, then pass the phone left.",
    ),
    fuse(HOLDER_3),
  ),
  withTimer(
    card(
      "fuse-last-letter",
      "Last Letter",
      "category",
      "Light the fuse. Say a word starting with the last word's last letter, then pass left.",
    ),
    fuse(HOLDER_3),
  ),
  withTimer(
    card(
      "fuse-short",
      "Short Fuse",
      "group",
      "Light the fuse. Say a swear word, then pass the phone left fast. No repeats.",
    ),
    fuse("Boom. Whoever's holding this takes a shot.", 5, 15),
  ),
  withTimer(
    card(
      "fuse-long",
      "Long Fuse",
      "category",
      "Light the fuse. Name a movie with a number in its title, then pass left. No repeats.",
    ),
    fuse("Boom. Whoever's holding this finishes their drink.", 40, 80),
  ),
  withTimer(
    card(
      "fuse-toll",
      "Toll Bomb",
      "sip",
      "Light the fuse. Drink 1, then pass the phone left. Everyone pays the toll every time.",
    ),
    fuse("Boom. Whoever's holding this drinks 3 more."),
  ),
  withTimer(
    card(
      "fuse-hot-seat",
      "Hot Seat Bomb",
      "group",
      "Light the fuse. The holder answers one question from the table, then passes left.",
    ),
    fuse(HOLDER_3),
  ),
  withTimer(
    card(
      "fuse-meow",
      "Cat Bomb",
      "group",
      "Light the fuse. Meow at your left neighbor straight-faced, then pass. Laugh and drink 2.",
    ),
    fuse(HOLDER_3),
  ),
];

export const secretsCards: CardDefinition[] = [
  ...secretCards,
  ...clockCards,
  ...fuseCards,
];

export const secretsPack: PackDefinition = {
  version: 1,
  id: "secrets",
  logo: "art/packs/secrets.svg",
  title: "Secrets & fuses",
  description:
    "Hold-to-read secrets, hidden fuses and the clock: Paranoia, missions, hot potato and Heads Up.",
  cardIds: secretsCards.map((c) => c.id),
};
