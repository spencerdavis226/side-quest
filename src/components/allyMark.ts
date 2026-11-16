import type { QuestArt } from "../presentation/quest-art.generated";

// An ally's emblem, by name (The Quest 2.1): the join moment and the
// tray's party page strike it. Type-only import: callers already load the
// art in their own lazy chunk.
const ALLY_MARK: [RegExp, QuestArt][] = [
  [/Goat/, "goat"],
  [/Mule/, "mule"],
  [/Mort|Skull/, "ally-skull"],
  [/Pip|Cabin/, "cabin-boy"],
  [/Durla|Dwarf/, "dwarf"],
  [/Frozen Knight/, "frozen-knight"],
  [/Hatchling/, "hatchling"],
  [/Chester/, "chester"],
  // The rivals, joined (Rivals Phase 5): their own medallions' marks.
  [/Chad/, "rival-chad"],
  [/Fingerbang/, "rival-fingerbang"],
  [/Saggynuts/, "rival-sensei"],
  [/Chuck/, "rival-chuck"],
  [/Queefington/, "rival-queef"],
  [/Nocap/, "rival-nocap"],
  [/Bard/, "bard"],
  // Sir Bradley: an ally in a save from before the 2026-11-15 rename.
  [/Bradley/, "chad"],
  [/Blade|Sword/, "blade"],
];
export const allyMark = (name: string): QuestArt =>
  ALLY_MARK.find(([re]) => re.test(name))?.[1] ?? "shield";
