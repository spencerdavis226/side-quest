// Pokémon League type marks (2026-10-24): each gym's badge, each typed card
// and the starter's panel in the team dialog wear their type's mark and
// colours. Since 2026-10-25 types are in the cards (`CardDefinition.type`,
// set by `content/league/types.ts`) because they bend rolls; the gym table
// below stays only so the badge case of a game saved before then still
// shows its badges' types (`tests/pokemon-types.test.ts` holds the two
// tables equal).

import type { CardDefinition, PokemonType } from "../game/types";
export type { PokemonType };

/** Each type's name and its medallion's light and deep tones. */
export const pokemonTypes: Readonly<
  Record<PokemonType, { name: string; light: string; deep: string }>
> = {
  normal: { name: "Normal", light: "#d8d2b4", deep: "#77714f" },
  fire: { name: "Fire", light: "#ffa45a", deep: "#b63a1a" },
  water: { name: "Water", light: "#7cbcff", deep: "#1f4fa6" },
  grass: { name: "Grass", light: "#9ee27a", deep: "#2c7428" },
  electric: { name: "Electric", light: "#ffe36a", deep: "#b97f08" },
  ice: { name: "Ice", light: "#b8f2f0", deep: "#2f8199" },
  fighting: { name: "Fighting", light: "#f0806a", deep: "#8c2118" },
  poison: { name: "Poison", light: "#d08ae4", deep: "#5d2878" },
  ground: { name: "Ground", light: "#ecce84", deep: "#86602a" },
  flying: { name: "Flying", light: "#bfcaff", deep: "#4c5eb2" },
  psychic: { name: "Psychic", light: "#ff92b8", deep: "#9c2858" },
  bug: { name: "Bug", light: "#cfe070", deep: "#587010" },
  rock: { name: "Rock", light: "#dcc886", deep: "#725c26" },
  ghost: { name: "Ghost", light: "#a894dc", deep: "#3c2c70" },
  dragon: { name: "Dragon", light: "#998cff", deep: "#3820aa" },
  dark: { name: "Dark", light: "#a88e7c", deep: "#382820" },
  steel: { name: "Steel", light: "#dadfe8", deep: "#5a6176" },
  fairy: { name: "Fairy", light: "#ffbade", deep: "#ac4c7c" },
  trio: { name: "Fire, Water and Grass", light: "#ffd27a", deep: "#2c7428" },
};

// Every gym leader and island trial by its specialty type: the badge
// case's fallback for games saved before types were in the cards.
const gymTypes: Readonly<Record<string, PokemonType>> = {
  // Kanto
  brock: "rock",
  misty: "water",
  "lt-surge": "electric",
  erika: "grass",
  koga: "poison",
  sabrina: "psychic",
  blaine: "fire",
  giovanni: "ground",
  // Johto
  falkner: "flying",
  bugsy: "bug",
  whitney: "normal",
  morty: "ghost",
  chuck: "fighting",
  jasmine: "steel",
  pryce: "ice",
  clair: "dragon",
  // Hoenn
  roxanne: "rock",
  brawly: "fighting",
  wattson: "electric",
  flannery: "fire",
  norman: "normal",
  winona: "flying",
  "tate-liza": "psychic",
  wallace: "water",
  // Sinnoh
  roark: "rock",
  gardenia: "grass",
  maylene: "fighting",
  "crasher-wake": "water",
  fantina: "ghost",
  byron: "steel",
  candice: "ice",
  volkner: "electric",
  // Unova
  "striaton-trio": "trio",
  lenora: "normal",
  burgh: "bug",
  elesa: "electric",
  clay: "ground",
  skyla: "flying",
  brycen: "ice",
  drayden: "dragon",
  // Kalos
  viola: "bug",
  grant: "rock",
  korrina: "fighting",
  ramos: "grass",
  clemont: "electric",
  valerie: "fairy",
  olympia: "psychic",
  wulfric: "ice",
  // Alola
  ilima: "normal",
  hala: "fighting",
  lana: "water",
  kiawe: "fire",
  mallow: "grass",
  olivia: "rock",
  nanu: "dark",
  hapu: "ground",
  // Galar
  milo: "grass",
  nessa: "water",
  kabu: "fire",
  bea: "fighting",
  opal: "fairy",
  gordie: "rock",
  piers: "dark",
  raihan: "dragon",
  // Paldea
  katy: "bug",
  brassius: "grass",
  iono: "electric",
  kofu: "water",
  larry: "normal",
  ryme: "ghost",
  tulip: "psychic",
  grusha: "ice",
};

/** A gym card's type, by its ID (`pokemon.gym-<leader>`). */
export const gymType = (cardId: string): PokemonType | undefined =>
  gymTypes[cardId.replace(/^pokemon\.gym-/, "")];

/** A badge's type: its card's, or by its ID in a game saved before. */
export const badgeType = (card: CardDefinition): PokemonType =>
  card.type ?? gymType(card.id) ?? "normal";

/** The Striaton brother each of the trio's types sends out. */
export const trioBrother: Partial<Record<PokemonType, string>> = {
  fire: "Chili",
  water: "Cress",
  grass: "Cilan",
};

/** The medallion's custom properties for a type. */
export const typeStyle = (type: PokemonType) => ({
  "--type-light": pokemonTypes[type].light,
  "--type-deep": pokemonTypes[type].deep,
});
