import type { CardDefinition } from "../../game/types";
import { landing } from "./shared";

// The landings between floors (2026-10-17): the crawl's campfires. Level the
// adventurer up for drinks, or rest for hearts; never both. Each landing has
// its own four, so the two in a run are never the same card. Pub Crawl only.

/** After the first floor's boss. */
export const upperLandings: CardDefinition[] = [
  landing(
    "stairwell",
    "The Stairwell",
    "A cold stairwell and one flickering bulb. Everyone stretches. Level up, or sit down.",
  ),
  landing(
    "smoking-area",
    "The Smoking Area",
    "Fresh air, a broken heater and somebody's vape. Everyone tells the table one thing so far.",
    "Breathe",
  ),
  landing(
    "coat-check",
    "The Coat Check",
    "Nobody's working the coat check. Everyone tries on one coat. Level up, or nap on the pile.",
    "Nap",
  ),
  landing(
    "bathroom-line",
    "The Bathroom Line",
    "The line is twelve people long and everyone is your best friend. Hype up the person beside you.",
    "Wait it out",
  ),
];

/** After the second floor's boss. */
export const lowerLandings: CardDefinition[] = [
  landing(
    "boiler-room",
    "The Boiler Room",
    "Warm pipes and a cot someone clearly lives on. Everyone warms their hands. Level up, or lie down.",
    "Lie down",
  ),
  landing(
    "campfire",
    "A Campfire",
    "Someone lit a fire in a keg. Everyone tells the scariest thing that's happened tonight.",
  ),
  landing(
    "staff-room",
    "The Staff Room",
    "Lockers, a kettle and a sign: WASH YOUR OWN MUG. Everyone washes a mug. Level up, or put the kettle on.",
    "Kettle on",
  ),
  landing(
    "fire-escape",
    "The Fire Escape",
    "Stars, a city, and the street far below. Everyone toasts how far you've come.",
    "Take it in",
  ),
];
