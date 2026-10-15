import type { CardDefinition } from "../game/types";
import { cardFactory, roll } from "./author";

/**
 * Classic party and King's Cup content for the generated main deck. Traditional
 * rules are adapted to this game's pour and "pass is always allowed" contract,
 * keeping the blunt table voice.
 *
 * This file was trimmed hard: near-duplicate reaction cards, redundant "roll a
 * die, do a thing" branches, and cards already covered by the sample set were
 * removed. King's Cup ranks for 9, 10, Jack and Queen stay covered by Rhyme
 * Time, Categories, Rulemaster and Questions Only in the sample set.
 */
const card = cardFactory("core");

export const classicCards: CardDefinition[] = [
  // --- Table standards -----------------------------------------------------
  card(
    "girls-drink",
    "Girls Drink",
    "group",
    "Girls drink 2. Anyone who's cried in a bar bathroom this year drinks 2 more.",
  ),
  card(
    "guys-drink",
    "Guys Drink",
    "group",
    "Guys drink 2. Anyone who's ever peed in a sink drinks 2 more.",
  ),
  card(
    "tallest",
    "Big Friendly Giant",
    "group",
    "Tallest player drinks 2. Shortest player gives 2 and finally feels powerful.",
  ),
  card(
    "new-blood",
    "New Blood",
    "group",
    "First time Side Quest players drink 13. Get absolutely fucked.",
  ),
  card(
    "late-arrival",
    "Fashionably Late",
    "group",
    "Last to arrive drinks 2 and gives the real reason. We all know it was a poop.",
  ),
  card(
    "couples",
    "Couples Drink",
    "group",
    "Couples drink 2 and say where they last had sex. Singles give 2 and pretend not to care.",
  ),
  // --- Reaction and reflex -------------------------------------------------
  card(
    "kings-four",
    "Four Is Floor",
    "challenge",
    "Everyone touches the floor. Last one down drinks 2.",
  ),
  // --- Verbal games --------------------------------------------------------
  card(
    "truth-or-drink",
    "Truth or Drink",
    "challenge",
    "The table asks you one filthy question. Answer honestly, or roll d6 and drink it.",
    roll(1, 6, "Coward. Drink {total}."),
  ),
  card(
    "rant",
    "Rant Mode",
    "challenge",
    "Rant for 20 seconds about something you hate. Run dry early: roll d6 and drink it.",
    roll(1, 6, "Ran out of hate. Drink {total}."),
  ),
  card(
    "impression",
    "Do the Impression",
    "challenge",
    "Do an impression of someone here having sex. You both drink 3.",
  ),
  card(
    "stare-down",
    "Stare Down",
    "challenge",
    "Stare down someone. First to blink or laugh drinks 2.",
  ),
  card(
    "story-time",
    "Story Time",
    "category",
    "Clockwise, build an erotic story one word at a time. First to stall or laugh drinks 2.",
  ),
  // --- Temporary rules -----------------------------------------------------
  card("buffalo", "Buffalo", "rule", "It's gotta go."),
  card(
    "little-green-man",
    "Little Green Man",
    "rule",
    "Until your next turn, everyone removes the tiny man before drinking. Slip = drink 2.",
  ),
  card(
    "question-master",
    "Question Master",
    "rule",
    "Until your next turn: anyone who answers your question drinks 2.",
  ),
  // --- King's Cup ranks ----------------------------------------------------
  card(
    "waterfall",
    "Ace Is Waterfall",
    "group",
    "Start a waterfall. Everyone drinks until the player before them stops.",
  ),
  card(
    "kings-two",
    "Two Is You",
    "sip",
    "Give 2 to the person you'd least want to share a bed with. Point so it's personal.",
  ),
  card(
    "kings-three",
    "Three Is Me",
    "sip",
    "Drink 3. The cards have seen your browser history.",
  ),
  card(
    "kings-eight",
    "Eight Is Mate",
    "rule",
    "Pick a mate until your next turn. When one of you drinks, both drink, holding hands.",
  ),
  // --- Flavorful one-offs --------------------------------------------------
  card(
    "dragon-breath",
    "Dragon's Breath",
    "challenge",
    "Breathe on the person to your right. They rate it out of 10. Over 5: you drink 3.",
  ),
  card(
    "potion-courage",
    "Potion of Courage",
    "sip",
    "Drink as many as you want, then pick someone to drink that many.",
  ),
  card(
    "dungeon-master",
    "Dungeon Master",
    "rule",
    "Until your next turn, you narrate in third person. Slip = drink 2.",
  ),
  card(
    "prophecy",
    "Prophecy",
    "challenge",
    "Predict who finishes their drink next. Right: give 3. Wrong: drink 3.",
  ),
  card(
    "side-quest",
    "Side Quest",
    "challenge",
    "Give the table a dare. Anyone who refuses drinks 2.",
  ),
];
