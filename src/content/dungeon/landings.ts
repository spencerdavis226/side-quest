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
    "Fresh air, a dead heater, somebody's vape. Everyone names their best moment so far.",
    "Breathe",
  ),
  landing(
    "coat-check",
    "The Coat Check",
    "An empty coat check. Everyone names the coat they'd steal. Level up, or nap on the pile.",
    "Nap",
  ),
  landing(
    "bathroom-line",
    "The Bathroom Line",
    "Twelve deep, and everyone's best friends now. Everyone hypes their left neighbor.",
    "Wait it out",
  ),
];

/** After the second floor's boss. */
export const lowerLandings: CardDefinition[] = [
  landing(
    "boiler-room",
    "The Boiler Room",
    "Warm pipes and somebody's cot. Everyone warms their hands. Level up, or lie down.",
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
    "A kettle and a sign: WASH YOUR OWN MUG. Everyone mimes washing one.",
    "Kettle on",
  ),
  landing(
    "fire-escape",
    "The Fire Escape",
    "Stars, a city, and the street far below. Everyone toasts how far you've come.",
    "Take it in",
  ),
];
