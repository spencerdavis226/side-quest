import type {
  CardDefinition,
  DiceOutcome,
  PackDefinition,
} from "../game/types";
import { cardFactory, flip, rollTable } from "./author";

// Dealer's Choice (2026-11-24, owner): bar card games done with dice. Ride
// the Bus, Pyramid and Screw the Dealer push your luck; here a pot card
// (`pot`) is rolled again and again: a win offers Cash out (give the pot) or
// Ride on (roll for the next, bigger pot), a bust drinks the pot. The pot on
// the line wears the card's ribbon. The rest are one-roll calls (red or
// black, high or low) and table moments. Every line is original.
//
// IDs are by slug. Never reuse one.
const card = cardFactory("dealer");

const win = (min: number, max: number, instruction: string): DiceOutcome => ({
  min,
  max,
  instruction,
  win: true,
});
const bust = (min: number, max: number, instruction: string): DiceOutcome => ({
  min,
  max,
  instruction,
});

/** A pot card: push your luck, one pot per pull. */
const potCard = (
  id: string,
  title: string,
  rules: string,
  dice: CardDefinition["dice"],
  pot: number[],
): CardDefinition => ({ ...card(id, title, "challenge", rules, dice), pot });

const pots: CardDefinition[] = [
  potCard(
    "night-bus",
    "Night Bus",
    "Roll to stay on the bus. Cash out and give the pot, or ride on. Bust and drink it.",
    rollTable(1, 6, [
      bust(1, 2, "Thrown off the bus."),
      win(3, 6, "Still riding."),
    ]),
    [2, 3, 5, 8],
  ),
  potCard(
    "roulette",
    "Roulette",
    "One chamber is loaded. Pull the trigger: cash out and give the pot, or go again.",
    rollTable(1, 6, [bust(1, 1, "Bang."), win(2, 6, "Click.")]),
    [1, 2, 3, 5, 8],
  ),
  potCard(
    "let-it-ride",
    "Let It Ride",
    "Double or nothing. Flip: cash out and give the pot, or let it ride.",
    flip("Tails. The house takes it.", "Heads. It rides.", true),
    [2, 4, 8],
  ),
  potCard(
    "snake-eyes",
    "Snake Eyes",
    "Roll 2d6 and pray for more than 4. Cash out and give the pot, or roll on.",
    rollTable(2, 6, [bust(2, 4, "Snakes. Bust."), win(5, 12, "Safe.")]),
    [2, 4, 6, 10],
  ),
  potCard(
    "penny-slots",
    "Penny Slots",
    "Pull the lever. Cash out and give the pot, or pull again. Lose and drink it.",
    rollTable(1, 20, [
      bust(1, 1, "Natural 1! The machine eats your card. Bust."),
      bust(2, 6, "Nothing. Bust."),
      win(7, 19, "Cherries."),
      win(20, 20, "Natural 20! Jackpot row."),
    ]),
    [1, 2, 3, 4, 6, 10],
  ),
  potCard(
    "high-roller",
    "High Roller",
    "Big table, big pot. Roll: cash out and give it, or go again. Bust and drink it.",
    rollTable(1, 20, [
      bust(1, 1, "Natural 1! Security walks you out. Bust."),
      bust(2, 10, "The house wins."),
      win(11, 19, "You win the hand."),
      win(20, 20, "Natural 20! The table applauds."),
    ]),
    [5, 10, 15],
  ),
  potCard(
    "seven-out",
    "Seven Out",
    "Roll 2d6. Anything but a 7 keeps you shooting. Cash out and give the pot, or roll on.",
    rollTable(2, 6, [
      win(2, 6, "Point. Keep shooting."),
      bust(7, 7, "Crapped out."),
      win(8, 12, "Point. Keep shooting."),
    ]),
    [2, 3, 5, 8, 12],
  ),
  potCard(
    "pyramid",
    "Pyramid",
    "Climb the pyramid one row a roll. Cash out and give the pot, or climb on.",
    rollTable(1, 6, [bust(1, 2, "You fall off."), win(3, 6, "Up a row.")]),
    [1, 2, 3, 4, 5],
  ),
  potCard(
    "chicken",
    "Chicken",
    "Roll to keep driving at the wall. Cash out and give the pot, or floor it.",
    rollTable(1, 20, [
      bust(1, 1, "Natural 1! Through the wall. Bust."),
      bust(2, 4, "Crash."),
      win(5, 19, "Still driving."),
      win(20, 20, "Natural 20! The wall flinched."),
    ]),
    [1, 2, 4, 8, 16],
  ),
  potCard(
    "card-counter",
    "Card Counter",
    "Roll 2d6. Doubles and the pit boss spots you. Cash out and give the pot, or keep counting.",
    {
      ...rollTable(2, 6, [win(2, 12, "Clean.")]),
      doubles: "A pair. Spotted. Bust.",
    },
    [2, 4, 6, 8, 12],
  ),
  potCard(
    "beer-run",
    "Beer Run",
    "Run for the store before last call. Cash out and give the pot, or run on.",
    rollTable(1, 6, [
      bust(1, 1, "Cops. Bust."),
      bust(2, 2, "Closed. Bust."),
      win(3, 6, "Made it."),
    ]),
    [2, 4, 6],
  ),
  potCard(
    "hot-streak",
    "Hot Streak",
    "You can't miss tonight. Roll: cash out and give the pot, or stay hot.",
    rollTable(1, 20, [
      bust(1, 1, "Natural 1! Frozen solid. Bust."),
      bust(2, 8, "Ice cold."),
      win(9, 19, "Still hot."),
      win(20, 20, "Natural 20! On fire."),
    ]),
    [2, 4, 6, 9, 12],
  ),
];

const calls: CardDefinition[] = [
  card(
    "coin-red-or-black",
    "Red or Black",
    "group",
    "Everyone calls red or black. Then flip the coin.",
    flip(
      "Tails is black. Everyone who called red drinks 2.",
      "Heads is red. Everyone who called black drinks 2.",
    ),
  ),
  card(
    "higher-or-lower",
    "Higher or Lower",
    "group",
    "Everyone calls high or low. Then roll d6.",
    rollTable(1, 6, [
      {
        min: 1,
        max: 3,
        instruction: "Low. Everyone who called high drinks 2.",
      },
      {
        min: 4,
        max: 6,
        instruction: "High. Everyone who called low drinks 2.",
      },
    ]),
  ),
  card(
    "over-under",
    "Over Under",
    "group",
    "Everyone calls over or under 7. Then roll 2d6.",
    rollTable(2, 6, [
      {
        min: 2,
        max: 6,
        instruction: "Under. Everyone who called over drinks 2.",
      },
      {
        min: 7,
        max: 7,
        instruction: "Dead center. Everyone drinks 3. House wins.",
      },
      {
        min: 8,
        max: 12,
        instruction: "Over. Everyone who called under drinks 2.",
      },
    ]),
  ),
  card(
    "slot-machine",
    "Slot Machine",
    "challenge",
    "Pull the lever. Roll 3d6.",
    {
      ...rollTable(3, 6, [
        { min: 3, max: 18, instruction: "No jackpot. Drink {first}." },
      ]),
      doubles: "Jackpot! Everyone else drinks {total}.",
    },
  ),
  card(
    "boxcars",
    "Boxcars",
    "challenge",
    "Roll 2d6. A pair pays out; anything else costs you.",
    {
      ...rollTable(2, 6, [
        { min: 2, max: 12, instruction: "No pair. Drink {second}." },
      ]),
      doubles: "A pair! Give {total}.",
    },
  ),
  card(
    "coin-free-bet",
    "Free Bet",
    "sip",
    "The house gives you a free bet. Flip the coin.",
    flip("Tails. Give 2.", "Heads. Give 5."),
  ),
];

const table: CardDefinition[] = [
  card(
    "screw-the-dealer",
    "Screw the Dealer",
    "challenge",
    "Left neighbor picks 1 to 6 in their head. Two guesses. Hit: they drink 3. Miss both: you drink 3.",
  ),
  card(
    "pit-boss",
    "Pit Boss",
    "rule",
    "Until your next turn, you're the pit boss: anyone who touches their phone drinks 2.",
  ),
  card(
    "tip-your-dealer",
    "Tip Your Dealer",
    "sip",
    "Your left neighbor drinks 2 for the service.",
  ),
  card("comped", "Comped", "sip", "The house likes you. Give 4."),
  card(
    "poker-face",
    "Poker Face",
    "challenge",
    "Stare down your right neighbor. First to smile drinks 3.",
  ),
  card(
    "all-in",
    "All In",
    "sip",
    "Push it all in: finish your drink, then give out 6.",
  ),
  card(
    "whale",
    "Whale",
    "group",
    "Whoever has spent the most money tonight drinks 3. Money talks.",
  ),
  card(
    "house-always-wins",
    "House Always Wins",
    "group",
    "Everyone drinks 2. The house always wins.",
  ),
  card(
    "bad-beat",
    "Bad Beat",
    "challenge",
    "Tell the table your worst luck story. Everyone drinks 1 in sympathy.",
  ),
  card(
    "counting-cards",
    "Counting Cards",
    "group",
    "The table counts to 20, one number each, no order. Two say a number at once: both drink 2.",
  ),
  card(
    "ace-up-the-sleeve",
    "Ace Up the Sleeve",
    "rule",
    "Until your next turn, you may pass one drink you're given to someone else.",
  ),
  card(
    "dealers-choice",
    "Dealer's Choice",
    "challenge",
    "You deal: everyone drinks 2, or one person of your choice drinks 5.",
  ),
];

export const dealerCards: CardDefinition[] = [...pots, ...calls, ...table];

export const dealerPack: PackDefinition = {
  version: 1,
  id: "dealer",
  logo: "art/packs/dealer.svg",
  title: "Dealer's Choice",
  description:
    "Bar card games with dice. Push your luck: cash out and give the pot, or ride on and risk drinking it.",
  cardIds: dealerCards.map((c) => c.id),
};
