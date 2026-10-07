import type { CardDefinition, PackDefinition } from "../game/types";
import { cardFactory, roll, rollTable } from "./author";
import { classicCards } from "./classics";
import { standardExpansionCards } from "./standard-expansion";

// The generated main deck: the supplied 40-card sample set, the classic /
// King's Cup basics, and the trimmed voice/dice expansion. The supplied Sheet1
// house cards now live in their own pack (`./custom`). Cards with a `dice`
// definition pause the deck until the roll is resolved. Cheers, Idiots keeps
// its individual illustrated scene; everything else renders in the shared
// painted frame with its deterministic imprint.
const card = cardFactory("core");

export const sampleCards: CardDefinition[] = [
  card(
    "house-special",
    "House Special",
    "sip",
    "Drink 3. The bartender spit in it and you can taste it.",
  ),
  card("bar-tab", "Bar Tab", "sip", "Give 3. Put it on your dad's card."),
  card(
    "bad-influence",
    "Bad Influence",
    "sip",
    "Pick someone. You both drink 2. Their mom was right about you.",
  ),
  card(
    "last-call",
    "Last Call",
    "group",
    "Everyone drinks 2. Look around: one of these people is your best option tonight.",
  ),
  card(
    "cheap-date",
    "Cheap Date",
    "group",
    "Cheapest drink at the table drinks 3. Broke behavior.",
  ),
  card(
    "baller",
    "Big Money",
    "group",
    "Priciest drink at the table gives 4. Trickle-down economics.",
  ),
  card(
    "group-project",
    "Group Project",
    "group",
    "Hands up. Last hand up drinks 3 and does all the work.",
  ),
  card(
    "bad-text",
    "U Up?",
    "sip",
    "Anyone who sent a regrettable late-night text drinks 3. Anyone who answered one drinks 1.",
  ),
  card(
    "fake-sick",
    "Corporate Wellness",
    "sip",
    "Anyone who faked sick to skip work drinks 3. Hungover counts.",
  ),
  card(
    "crypto-bro",
    "Financial Genius",
    "sip",
    "Crypto owners drink 2. Everyone else gives 2.",
  ),
  card(
    "cheers-idiots",
    "Cheers, Idiots",
    "group",
    "Everyone clinks with everyone. Break eye contact and it's seven years of bad sex. Drink 2.",
    undefined,
    "art/cheers.webp",
  ),
  card(
    "dice-tax",
    "Dice Tax",
    "challenge",
    "The IRS is auditing your drink. Roll d6.",
    rollTable(1, 6, [
      { min: 1, max: 2, instruction: "Clean books. Drink 1." },
      { min: 3, max: 4, instruction: "Creative accounting. Drink 2." },
      {
        min: 5,
        max: 6,
        instruction: "Fraud. Drink 4 and open your banking app for the table.",
      },
    ]),
  ),
  card(
    "give-a-shit",
    "Give a Shit",
    "challenge",
    "Roll d6. Give that many to whoever you'd least want to see naked.",
    roll(1, 6, "Give {total} to whoever you'd least want to see naked."),
  ),
  card(
    "high-roller",
    "Big Dick Energy",
    "challenge",
    "Roll d6. That's your size.",
    rollTable(1, 6, [
      { min: 1, max: 2, instruction: "Two inches. Drink 4 and sit quietly." },
      { min: 3, max: 4, instruction: "Average. Drink 2. Nobody's impressed." },
      { min: 5, max: 6, instruction: "Hung. Give 5 and adjust yourself." },
    ]),
  ),
  card(
    "same-shit",
    "Same Shit",
    "challenge",
    "Roll 2d6. Matching dice means you're exactly as basic as we thought.",
    {
      ...rollTable(2, 6, [
        { min: 2, max: 12, instruction: "Weirdly original. Give 3." },
      ]),
      doubles: "Basic as hell. Say your coffee order and drink {total}.",
    },
  ),
  card(
    "fuck-around",
    "Fuck Around & Find Out",
    "challenge",
    "Roll d20 and find out.",
    rollTable(1, 20, [
      {
        min: 1,
        max: 1,
        instruction: "Take a shot and tell us your worst hookup.",
      },
      { min: 2, max: 19, instruction: "Drink 2. You found out nothing." },
      { min: 20, max: 20, instruction: "Give a shot. Smug bastard." },
    ]),
  ),
  card(
    "chosen-one",
    "God's Drunkest Soldier",
    "challenge",
    "Roll d20. Odd: drink it. Even: give it. God gave you this burden.",
    rollTable(1, 20, [
      { min: 1, max: 19, step: 2, instruction: "Drink {total}." },
      { min: 2, max: 20, step: 2, instruction: "Give {total}." },
    ]),
  ),
  card(
    "categories",
    "Categories",
    "category",
    "Pick a category. First repeat or blank drinks 3.",
  ),
  card(
    "rhyme-time",
    "Rhyme Time",
    "category",
    "Pick a word. Clockwise, rhyme it. First bad rhyme or blank drinks 3.",
  ),
  card(
    "rock-paper-drink",
    "Rock Paper Drink",
    "challenge",
    "Rock paper scissors anyone you want. Loser drinks 3 and calls the winner daddy.",
  ),
  card(
    "never-have-i",
    "Never Have I Ever",
    "category",
    "Say one. Make it dirty. Anyone who has drinks 2.",
  ),
  card(
    "rulemaster",
    "Rulemaster",
    "rule",
    "Make a rule for the rest of the game. Make it stupid. Breakers drink 2.",
  ),
  card(
    "no-names",
    "Who the Fuck Are You?",
    "rule",
    "Until your next turn, nobody uses names. Slip = drink 2.",
  ),
  card(
    "potty-mouth",
    "Church Mode",
    "rule",
    "Until your next turn, nobody swears. Slip = drink 2.",
  ),
  card(
    "cursed-number",
    "Cursed Number",
    "rule",
    "Roll d6. Nobody may say that number until your next turn. Slip = drink 2.",
    roll(1, 6, "{total} is banned until your next turn. Say it: drink 2."),
  ),
];

// The generated main deck. All three packs are opt-in at setup.
export const coreCards: CardDefinition[] = [
  ...sampleCards,
  ...classicCards,
  ...standardExpansionCards,
];

export const samplePack: PackDefinition = {
  version: 1,
  id: "core",
  logo: "art/packs/core.svg",
  title: "The Core deck",
  description:
    "The main deck: sample prompts, King's Cup basics, and the dice-forward standard cards.",
  cardIds: coreCards.map((card) => card.id),
};
