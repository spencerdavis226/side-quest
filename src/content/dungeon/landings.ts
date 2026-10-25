import type { CardDefinition } from "../../game/types";
import { landing } from "./shared";

// The landings between floors (2026-10-17): the crawl's campfires. Level the
// adventurer up for drinks, or rest for hearts; never both. Each landing has
// its own pool (eight since 2026-10-25), so the two in a run are never the
// same card. Pub Crawl only.

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
  // Four more (2026-10-25).
  landing(
    "loading-dock",
    "The Loading Dock",
    "Pallets, a puddle, one working vending machine. Everyone names the snack they'd get.",
    "Sit on a pallet",
  ),
  landing(
    "phone-booth",
    "The Phone Booth",
    "An old phone booth, and the phone works. Everyone says who they'd call right now.",
    "Lean on it",
  ),
  landing(
    "mop-closet",
    "The Mop Closet",
    "Mops, buckets, one comfy bucket. Everyone gives their left neighbor a wrestling name.",
    "Sit on a bucket",
  ),
  landing(
    "photo-booth",
    "The Photo Booth",
    "A broken photo booth that still flashes. Everyone pulls their best face on three.",
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
  // Four more (2026-10-25).
  landing(
    "service-stairs",
    "The Service Stairs",
    "Halfway down, a step wide enough to sit on. Everyone says what they'd order right now.",
    "Sit",
  ),
  landing(
    "the-bunker",
    "The Bunker",
    "An old bomb shelter with canned beans. Everyone names who they'd want down here.",
    "Bunk down",
  ),
  landing(
    "laundry-room",
    "The Laundry Room",
    "Warm dryers humming. Everyone confesses their worst laundry crime.",
    "Lean on a dryer",
  ),
  landing(
    "stuck-elevator",
    "The Stuck Elevator",
    "An elevator stuck between floors, the music still playing. Everyone hums along on three.",
    "Wait for it",
  ),
];
