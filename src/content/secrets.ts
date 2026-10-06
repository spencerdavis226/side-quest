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
// timed card can't be put aside until its time is up. A fuse never asks
// anyone to pass the phone: it stays on the table while a beer goes round.
// Nothing is saved between cards.
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
  "Tailgate",
  "Hot tub",
  "Bar fight",
  "Spring break",
  "Wine mom",
  "Ugly sweater",
  "Fake ID",
  "Jägerbomb",
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
  "KARAOKE. Banned: sing, song, microphone, bar, lyrics.",
  "PIZZA. Banned: cheese, slice, pepperoni, Italy, delivery.",
  "UBER. Banned: car, ride, app, driver, Lyft.",
  "AIRPORT. Banned: plane, flight, gate, security, TSA.",
  "BEACH. Banned: sand, ocean, sun, waves, towel.",
  "WINE. Banned: grape, red, white, glass, bottle.",
  "BACHELORETTE. Banned: bride, party, wedding, sash, Nashville.",
  "TATTOO. Banned: ink, needle, skin, arm, artist.",
];

const charades = [
  "Parallel parking a limo.",
  "Sneaking in at 4 a.m. and getting caught.",
  "A bartender ignoring you.",
  "Dropping your phone in a pool.",
  "Doing a keg stand.",
  "Walking into a glass door.",
  "A group selfie going wrong.",
  "Opening a beer with your teeth.",
  "Failing a sobriety test.",
  "Building IKEA furniture drunk.",
];

const quickfire = [
  "beers you'd actually order",
  "things in a junk drawer",
  "reasons to call in sick",
  "things never to say on a date",
  "wrong pizza toppings",
  "drinking games",
  "things at a frat house",
  "excuses to leave a party",
  "songs everyone knows",
  "texts not to send your boss",
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
  withTimer(
    card(
      "clock-waterfall",
      "Timed Waterfall",
      "sip",
      "Start the clock. Everyone drinks until time's up; anyone who stops early drinks 2 more.",
    ),
    countdown(5, "Time. Everyone stops drinking."),
  ),
  withTimer(
    card(
      "clock-wall-sit",
      "Wall Sit",
      "challenge",
      "Start the clock and wall sit until time's up. Stand early and you drink 4.",
    ),
    countdown(30, "Time. Still sitting? Give 4."),
  ),
  withTimer(
    card(
      "clock-flamingo",
      "Flamingo",
      "group",
      "Start the clock. Everyone stands on one leg; the first to touch down drinks 3.",
    ),
    countdown(30, "Time. Everyone still standing gives 1."),
  ),
  withTimer(
    card(
      "clock-no-blinking",
      "No Blinking",
      "challenge",
      "Start the clock and don't blink until time's up. Your left neighbor watches.",
    ),
    countdown(15, "Time. Blinked? Drink 3. Didn't? Give 3."),
  ),
  withTimer(
    card(
      "clock-tongue-twister",
      "Tongue Twister",
      "challenge",
      'Start the clock and say "red lorry, yellow lorry" five times before time runs out.',
    ),
    countdown(10, "Time. Tripped up or ran out? Drink 3. Nailed it? Give 3."),
  ),
  withTimer(
    card(
      "clock-hum",
      "Hum That Tune",
      "group",
      "Start the clock and hum a song. Everyone else races to name it.",
    ),
    countdown(30, "Time. Named? You and the guesser give 2. Nobody? Drink 3."),
  ),
];

// --- Fuses -----------------------------------------------------------------
// The phone stays on the table; a beer goes round. Nobody throws the phone.

const BEER_3 = "Boom. Whoever's holding the beer drinks 3.";
const potato: [topic: string, end: string][] = [
  ["beer brand", BEER_3],
  ["fast-food chain", BEER_3],
  ["Pokémon", "Boom. Whoever's holding the beer drinks 4."],
  ["cocktail", "Boom. Whoever's holding the beer takes a shot."],
  ["Taylor Swift song", "Boom. Whoever's holding the beer drinks 4."],
  ['word for "drunk"', "Boom. Whoever's holding the beer finishes it."],
];

const fuseCards: CardDefinition[] = [
  ...potato.map(([topic, end], i) =>
    withTimer(
      card(
        id("potato", i),
        "Hot Potato",
        "category",
        `Light the fuse. Name a ${topic}, then pass a beer left. No repeats.`,
      ),
      fuse(end),
    ),
  ),
  withTimer(
    card(
      "fuse-compliment",
      "Compliment Bomb",
      "group",
      "Light the fuse. Compliment your left neighbor, then pass them a beer.",
    ),
    fuse(BEER_3),
  ),
  withTimer(
    card(
      "fuse-rhyme",
      "Rhyme Bomb",
      "category",
      "Light the fuse. Rhyme with beer, then pass a beer left. No repeats.",
    ),
    fuse(BEER_3),
  ),
  withTimer(
    card(
      "fuse-buzz",
      "Buzz Bomb",
      "group",
      "Light the fuse. Pass a beer left counting up; say buzz on 7s and multiples of 7.",
    ),
    fuse(BEER_3),
  ),
  withTimer(
    card(
      "fuse-last-letter",
      "Last Letter",
      "category",
      "Light the fuse. Start a word with the last word's last letter, then pass a beer left.",
    ),
    fuse(BEER_3),
  ),
  withTimer(
    card(
      "fuse-toll",
      "Toll Bomb",
      "sip",
      "Light the fuse. Drink 1, then pass a beer left. Everyone pays every time.",
    ),
    fuse("Boom. Whoever's holding the beer drinks 3 more."),
  ),
  withTimer(
    card(
      "fuse-short",
      "Short Fuse",
      "group",
      "Light the fuse. Say a swear word, pass a beer left fast. No repeats.",
    ),
    fuse("Boom. Whoever's holding the beer takes a shot.", 5, 15),
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
    "Hold-to-read secrets and the clock: Paranoia, missions, Heads Up, charades, and a beer for hot potato.",
  cardIds: secretsCards.map((c) => c.id),
};
