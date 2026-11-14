// Writes src/presentation/quest-art.generated.ts: the Quest's emblems (the
// coin's faces, dragons, allies, classes, bosses and the map's terrain) as
// SVG path data in a 512 box, from the vendored game-icons set (CC BY 3.0,
// docs/licenses). The app paints them on canvas (the coin) and as inline
// SVG (medallions, the map). Rerun only to change a pick:
// `npx tsx scripts/quest-art.ts`.
import { readdir, readFile, writeFile } from "node:fs/promises";

const ROOT = "assets/icons/game-icons";
// name -> icon file name (any author; "author/name" pins one).
const picks: Record<string, string> = {
  // The coin.
  crown: "lorc/crown",
  dragon: "lorc/dragon-head",
  tankard: "lorc/beer-stein",
  skull: "lorc/crowned-skull",
  ball: "skoll/achievement",
  // Dragons.
  "dragon-fire": "lorc/dragon-breath",
  "dragon-hungry": "lorc/spiked-dragon-head",
  "dragon-ancient": "lorc/dragon-spiral",
  "dragon-ice": "lorc/wyvern",
  "dragon-storm": "lorc/double-dragon",
  "dragon-gold": "delapouite/dragon-orb",
  "dragon-sea": "lorc/sea-dragon",
  "dragon-whisper": "lorc/hydra",
  "dragon-wreck": "lorc/sea-serpent",
  "dragon-tea": "delapouite/dragon-shield",
  "dragon-king": "lorc/dragon-head",
  // Allies.
  goat: "goat",
  mule: "donkey",
  "ally-skull": "desert-skull",
  "cabin-boy": "pirate-hat",
  dwarf: "dwarf-face",
  blade: "swordman",
  "frozen-knight": "frozen-body",
  hatchling: "egg-clutch",
  chester: "mimic-chest",
  bard: "lyre",
  bradley: "black-knight-helm",
  // Map terrain and stops.
  gate: "castle",
  road: "mountain-road",
  forest: "forest",
  marsh: "swamp",
  crypt: "crypt-entrance",
  mines: "mine-wagon",
  tower: "tower-flag",
  coast: "lighthouse",
  caverns: "mountain-cave",
  pass: "peaks",
  inn: "tavern-sign",
  compass: "compass",
  quill: "quill-ink",
  tombstone: "tombstone",
  // Classes (The Quest 2.1): the rank-up's re-forged mark.
  "class-barbarian": "barbarian",
  "class-rogue": "hooded-assassin",
  "class-wizard": "wizard-staff",
  "class-bard": "lyre",
  "class-paladin": "templar-shield",
  "class-ranger": "bowman",
  "class-monk": "monk-face",
  "class-necromancer": "skull-staff",
  "class-alchemist": "fizzing-flask",
  "class-warlock": "warlock-eye",
  "class-knight": "cross-shield",
  "class-innkeeper": "beer-stein",
  "class-sellsword": "swordman",
  "class-druid": "leaf-swirl",
  "class-peasant": "pitchfork",
  "class-squire": "helmet",
  "class-mimic": "mimic-chest",
  "class-dragonslayer": "dragon-shield",
  // Landmarks (The Quest 2.1): each place's mark on its banner.
  "mark-gallows": "rope-coil",
  "mark-tourney": "horse-head",
  "mark-toll": "hanging-sign",
  "mark-fairy": "fairy-wand",
  "mark-tree": "tree-face",
  "mark-feast": "roast-chicken",
  "mark-chapel": "candle-light",
  "mark-hag": "hooded-figure",
  "mark-frog": "frog",
  "mark-ferry": "skull-crossed-bones",
  "mark-kings": "crown",
  "mark-statue": "prayer",
  "mark-market": "swap-bag",
  "mark-lift": "elevator",
  "mark-ghosts": "ghost",
  "mark-doors": "doorway",
  "mark-library": "open-book",
  "mark-cat": "cat",
  "mark-bones": "skull-crossed-bones",
  "mark-forge": "anvil",
  "mark-hoard": "coins",
  "mark-army": "frozen-body",
  "mark-shrine": "prayer-beads",
  "mark-bridge": "bridge",
  "mark-bells": "holy-grail",
  "mark-town": "village",
  "mark-lighthouse": "lighthouse",
  // Trophies (The Quest 2.1): a mark for each kind of boss.
  "boss-hydra": "hydra",
  "boss-frog": "frog-prince",
  "boss-skeleton": "skeleton",
  "boss-troll": "troll",
  "boss-boar": "boar",
  "boss-dead": "dead-head",
  "boss-tower": "tower-fall",
  "boss-wizard": "wizard-face",
  "boss-puppet": "puppet",
  "boss-mine": "mining",
  "boss-wolf": "wolf-head",
  "boss-bear": "bear-head",
  "boss-knight": "black-knight-helm",
  "boss-tree": "tree-face",
  "boss-witch": "witch-face",
  // Bosses and keepers.
  troll: "ogre",
  witch: "cauldron",
  goblin: "goblin-head",
  golem: "golem-head",
  kraken: "kraken-tentacle",
  bandit: "bandit",
  wight: "skull-staff",
  fairy: "fairy",
  capes: "cape",
  sword: "sword-in-stone",
  anvil: "anvil",
  shield: "shield",
  scroll: "scroll-unfurled",
};

const authors = await readdir(ROOT, { withFileTypes: true });
async function find(name: string) {
  if (name.includes("/")) {
    try {
      await readFile(`${ROOT}/${name}.svg`);
      return `${ROOT}/${name}.svg`;
    } catch {
      name = name.split("/")[1];
    }
  }
  for (const a of authors) {
    if (!a.isDirectory()) continue;
    const file = `${ROOT}/${a.name}/${name}.svg`;
    try {
      await readFile(file);
      return file;
    } catch {
      /* next author */
    }
  }
  throw Error(`No icon named ${name}`);
}
const out: Record<string, string> = {};
for (const [key, name] of Object.entries(picks)) {
  const file = await readFile(await find(name), "utf8");
  const paths = [...file.matchAll(/<path[^>]*\sd="([^"]+)"[^>]*\/>/g)]
    .map((m) => m[1])
    .filter((d) => d !== "M0 0h512v512H0z");
  if (!paths.length) throw Error(`No artwork in ${name}`);
  out[key] = paths.join("");
}
await writeFile(
  "src/presentation/quest-art.generated.ts",
  `// Generated by scripts/quest-art.ts from the vendored game-icons set\n` +
    `// (CC BY 3.0, docs/licenses). Do not edit.\n` +
    `export const questArt = ${JSON.stringify(out, null, 2)} as const;\n` +
    `export type QuestArt = keyof typeof questArt;\n`,
);
console.log(
  `Wrote ${Object.keys(out).length} emblems (${Math.round(JSON.stringify(out).length / 1024)} KiB raw).`,
);
