import type { CardDefinition } from "../../game/types";
import { landing } from "./shared";

// The inns between regions (2026-10-17 as landings; Realms, 2026-11-03):
// the quest's campfires. Rest for hearts, or stock up on what the inn has
// for drinks; never both. Each inn has its own pool (eight), so the two in
// a run are never the same card. The Quest only.

/** After the first region's boss. */
export const upperLandings: CardDefinition[] = [
  landing(
    "stairwell",
    "The Sleeping Goat",
    "A fat cat on every chair. Everyone gives the cat on their left a noble name.",
    "Take a room",
  ),
  landing(
    "smoking-area",
    "The Crooked Lantern",
    "A crooked inn with a straight fire. Everyone names their best moment of the quest so far.",
    "Rest",
    "shield",
  ),
  landing(
    "coat-check",
    "A Hayloft",
    "A barn's hayloft, warm and itchy. Everyone names the animal they'd ride into battle.",
    "Nap in the hay",
    "die",
  ),
  landing(
    "bathroom-line",
    "The Ferry House",
    "The ferryman's inn, and everyone's soaked. Everyone hypes their left neighbor like a herald.",
    "Dry off",
    "smoke",
  ),
  landing(
    "loading-dock",
    "A Shepherd's Hut",
    "A shepherd shares his bread and his opinions. Everyone names a snack worth fighting for.",
    "Sit by the fire",
  ),
  landing(
    "phone-booth",
    "The Pilgrims' Rest",
    "A shrine by the door and a bell that rings itself. Everyone says one thing they'd pray for.",
    "Pray",
    "shield",
  ),
  landing(
    "mop-closet",
    "The Drunken Dwarf",
    "The dwarf who runs it arm-wrestles every guest. Everyone gives their left neighbor a dwarf name.",
    "Rest",
    "die",
  ),
  landing(
    "photo-booth",
    "A Painted Wagon",
    "Traveling players let you sleep in their wagon. Everyone strikes a heroic pose on three.",
    "Sleep",
    "smoke",
  ),
];

/** After the second region's boss. */
export const lowerLandings: CardDefinition[] = [
  landing(
    "boiler-room",
    "The Last Warm Fire",
    "Past here, no more inns. Everyone warms their hands and names one thing they'll miss.",
    "Lie down",
  ),
  landing(
    "campfire",
    "A Campfire",
    "A fire under the stars. Everyone tells the scariest thing that's happened on the road.",
    "Rest",
    "shield",
  ),
  landing(
    "staff-room",
    "The Monastery",
    "Silent monks pour you soup. Everyone stays silent for one minute. First to make a sound drinks 2.",
    "Meditate",
    "die",
  ),
  landing(
    "fire-escape",
    "The Watchtower",
    "A ruined tower, and below it the whole road you walked. Everyone toasts how far you've come.",
    "Take it in",
    "smoke",
  ),
  landing(
    "service-stairs",
    "The Hermit's Cave",
    "A hermit with soup and no news since the old king. Everyone tells him one piece of gossip.",
    "Sit",
  ),
  landing(
    "the-bunker",
    "The Empty Fort",
    "An empty fort with full barrels. Everyone names who they'd want on these walls.",
    "Bunk down",
    "shield",
  ),
  landing(
    "laundry-room",
    "The Hot Springs",
    "Steam in the rocks. Everyone confesses one thing they've never told the party.",
    "Soak",
    "die",
  ),
  landing(
    "stuck-elevator",
    "The Haunted Inn",
    "The innkeeper is a ghost, and very polite about it. Everyone hums his song on three.",
    "Sleep, nervously",
    "smoke",
  ),
];
