import type { QuestArt } from "../presentation/quest-art.generated";

// A class's mark (The Quest 2.1), by its card: the level-up moment and the
// prologue strike it. Type-only import: callers already load the art.
const CLASS_MARK: Record<string, QuestArt> = {
  barbarian: "class-barbarian",
  rogue: "class-rogue",
  wizard: "class-wizard",
  bard: "class-bard",
  paladin: "class-paladin",
  ranger: "class-ranger",
  "drunken-monk": "class-monk",
  necromancer: "class-necromancer",
  alchemist: "class-alchemist",
  warlock: "class-warlock",
  knight: "class-knight",
  innkeeper: "class-innkeeper",
  sellsword: "class-sellsword",
  druid: "class-druid",
  peasant: "class-peasant",
  squire: "class-squire",
  mimic: "class-mimic",
  dragonslayer: "class-dragonslayer",
};
export const classMark = (id: string): QuestArt =>
  CLASS_MARK[id.replace("dungeon.class-", "")] ?? "shield";
