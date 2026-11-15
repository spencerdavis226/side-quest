import type { CardDefinition } from "../../game/types";
import { ask, hire, landing } from "./shared";

// The inns between regions (2026-10-17 as landings; Realms, 2026-11-03):
// the quest's campfires. Rest for hearts, or stock up on what the inn has
// for drinks; never both. Since The Quest 2.0 Phase 4 (2026-11-14) the
// first inn also hires a blade (an ally) and the last tells of the dragon
// (lore), each for drinks. Each inn has its own pool (eight), so the two in
// a run are never the same card. The Quest only.

/** After the first region's boss. */
export const upperLandings: CardDefinition[] = [
  landing(
    "stairwell",
    "The Sloppy Goat",
    "Sticky floors, stickier sheets. Everyone gives their left neighbor a tavern-wench name.",
    "Take a room",
  ),
  landing(
    "smoking-area",
    "The Crooked Lantern",
    "A crooked inn, a straight fire, a one-toothed barmaid. Everyone names their best moment so far.",
    "Rest",
    "shield",
  ),
  landing(
    "coat-check",
    "A Hayloft",
    "A warm hayloft, and the farmer's kid keeps checking on you. Everyone names their battle mount.",
    "Nap in the hay",
    "die",
  ),
  landing(
    "bathroom-line",
    "The Ferry House",
    "Everyone's soaked to the taint. Everyone hypes their left neighbor like a herald.",
    "Dry off",
    "smoke",
  ),
  landing(
    "loading-dock",
    "A Shepherd's Hut",
    "A shepherd shares his bread and his theories about the queen. Everyone names a snack to kill for.",
    "Sit by the fire",
  ),
  landing(
    "phone-booth",
    "The Pilgrims' Rest",
    "Monks who brew, and brew hard. Everyone confesses one thing they'd never tell their mother.",
    "Pray",
    "shield",
  ),
  landing(
    "mop-closet",
    "The Drunken Dwarf",
    "The dwarf who runs it arm-wrestles every guest, naked. Everyone gives their left a dwarf name.",
    "Rest",
    "die",
  ),
  landing(
    "photo-booth",
    "A Painted Wagon",
    "Actors let you sleep in their wagon. It smells like sex. Everyone strikes a heroic pose on three.",
    "Sleep",
    "smoke",
  ),
].map(hire);

/** After the second region's boss. Each names the run's dragon (The Quest
 * 2.0 Phase 3, 2026-11-14). */
export const lowerLandings: CardDefinition[] = [
  landing(
    "boiler-room",
    "The Last Warm Fire",
    "Past here, only {dragon}. Everyone warms their hands and names one thing they'll miss.",
    "Lie down",
  ),
  landing(
    "campfire",
    "A Campfire",
    "A fire under the stars. Everyone tells the dirtiest rumor they've heard about {dragon}.",
    "Rest",
    "shield",
  ),
  landing(
    "staff-room",
    "The Monastery",
    "Monks sworn to silence and to wine. Everyone stays silent a minute. First sound drinks 2.",
    "Meditate",
    "die",
  ),
  landing(
    "fire-escape",
    "The Watchtower",
    "A ruined tower; far off, smoke from {dragon}. Everyone toasts how far you've come.",
    "Take it in",
    "smoke",
  ),
  landing(
    "service-stairs",
    "The Hermit's Cave",
    "A hermit met {dragon} and won't say what happened. Everyone tells him some gossip.",
    "Sit",
  ),
  landing(
    "the-bunker",
    "The Empty Fort",
    "A fort abandoned when {dragon} woke. Everyone names who they'd want on its walls.",
    "Bunk down",
    "shield",
  ),
  landing(
    "laundry-room",
    "The Hot Springs",
    "Naked hot springs. Someone definitely peed. Everyone confesses one secret to the party.",
    "Soak",
    "die",
  ),
  landing(
    "stuck-elevator",
    "The Haunted Inn",
    "The innkeeper is a ghost; {dragon} got him. Everyone hums his song on three.",
    "Sleep, nervously",
    "smoke",
  ),
].map(ask);
