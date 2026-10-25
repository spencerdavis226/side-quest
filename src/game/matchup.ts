import type { Edge, PokemonType } from "./types";

// Pokémon League type matchups (owner, 2026-10-25). The games' chart (since
// Gen 6): each attacking type's super-effective targets, the targets that
// resist it, and the ones it can't touch. A matchup reads both ways, like a
// real battle: whoever hits the other harder has the edge, so Fire against
// Water is a disadvantage even though Fire only resists nothing of Water's.
// An immunity is "not very effective", never an automatic loss.

type Attacking = Exclude<PokemonType, "trio">;
const chart: Record<
  Attacking,
  { strong: Attacking[]; weak: Attacking[]; none?: Attacking[] }
> = {
  normal: { strong: [], weak: ["rock", "steel"], none: ["ghost"] },
  fire: {
    strong: ["grass", "ice", "bug", "steel"],
    weak: ["fire", "water", "rock", "dragon"],
  },
  water: {
    strong: ["fire", "ground", "rock"],
    weak: ["water", "grass", "dragon"],
  },
  electric: {
    strong: ["water", "flying"],
    weak: ["electric", "grass", "dragon"],
    none: ["ground"],
  },
  grass: {
    strong: ["water", "ground", "rock"],
    weak: ["fire", "grass", "poison", "flying", "bug", "dragon", "steel"],
  },
  ice: {
    strong: ["grass", "ground", "flying", "dragon"],
    weak: ["fire", "water", "ice", "steel"],
  },
  fighting: {
    strong: ["normal", "ice", "rock", "dark", "steel"],
    weak: ["poison", "flying", "psychic", "bug", "fairy"],
    none: ["ghost"],
  },
  poison: {
    strong: ["grass", "fairy"],
    weak: ["poison", "ground", "rock", "ghost"],
    none: ["steel"],
  },
  ground: {
    strong: ["fire", "electric", "poison", "rock", "steel"],
    weak: ["grass", "bug"],
    none: ["flying"],
  },
  flying: {
    strong: ["grass", "fighting", "bug"],
    weak: ["electric", "rock", "steel"],
  },
  psychic: {
    strong: ["fighting", "poison"],
    weak: ["psychic", "steel"],
    none: ["dark"],
  },
  bug: {
    strong: ["grass", "psychic", "dark"],
    weak: ["fire", "fighting", "poison", "flying", "ghost", "steel", "fairy"],
  },
  rock: {
    strong: ["fire", "ice", "flying", "bug"],
    weak: ["fighting", "ground", "steel"],
  },
  ghost: {
    strong: ["psychic", "ghost"],
    weak: ["dark"],
    none: ["normal"],
  },
  dragon: { strong: ["dragon"], weak: ["steel"], none: ["fairy"] },
  dark: {
    strong: ["psychic", "ghost"],
    weak: ["fighting", "dark", "fairy"],
  },
  steel: {
    strong: ["ice", "rock", "fairy"],
    weak: ["fire", "water", "electric", "steel"],
  },
  fairy: {
    strong: ["fighting", "dragon", "dark"],
    weak: ["fire", "poison", "steel"],
  },
};

/** The damage multiplier of `attack` on `defend`: 2, 1, 0.5 or 0. */
export function effectiveness(attack: Attacking, defend: Attacking): number {
  const row = chart[attack];
  if (row.strong.includes(defend)) return 2;
  if (row.weak.includes(defend)) return 0.5;
  if (row.none?.includes(defend)) return 0;
  return 1;
}

/** The Striaton trio sends out the brother whose type beats the starter's
 * (as in Black and White): the worst matchup of fire, water and grass for
 * it, the first of them when none is worse. */
export function resolveType(theirs: PokemonType, mine: Attacking): Attacking {
  if (theirs !== "trio") return theirs;
  const brothers: Attacking[] = ["fire", "water", "grass"];
  const worst = (t: Attacking) =>
    effectiveness(t, mine) - effectiveness(mine, t);
  return brothers.reduce((a, b) => (worst(b) > worst(a) ? b : a));
}

/** A Tera Orb's type against `theirs`: the one with the widest edge over
 * it (the hardest hitter that takes least back), first in chart order on a
 * tie. Every type has one: Fighting beats Normal, Dark beats Ghost. */
export function teraType(theirs: Attacking): Attacking {
  const all = Object.keys(chart) as Attacking[];
  const edge = (t: Attacking) =>
    effectiveness(t, theirs) - effectiveness(theirs, t);
  return all.reduce((a, b) => (edge(b) > edge(a) ? b : a));
}

export interface Matchup {
  mine: Attacking;
  /** The foe's type as it plays (the trio resolved). */
  theirs: Attacking;
  /** Absent when the matchup is neutral. */
  edge: Edge | null;
  /** The starter Terastallized for this fight: `mine` is its Tera type. */
  tera?: true;
}

/** The starter's type against a foe's. */
export function matchup(mine: PokemonType, theirs: PokemonType): Matchup {
  // A starter is never the trio; read it as normal if one ever were.
  const me: Attacking = mine === "trio" ? "normal" : mine;
  const foe = resolveType(theirs, me);
  const dealt = effectiveness(me, foe);
  const taken = effectiveness(foe, me);
  return {
    mine: me,
    theirs: foe,
    edge: dealt > taken ? "advantage" : dealt < taken ? "disadvantage" : null,
  };
}

/** A Terastallized starter against a foe: always the edge. */
export function teraMatchup(mine: PokemonType, theirs: PokemonType): Matchup {
  const foe = resolveType(theirs, mine === "trio" ? "normal" : mine);
  return { mine: teraType(foe), theirs: foe, edge: "advantage", tera: true };
}

/** The types `mine` has the edge on, and the ones that have it on `mine`,
 * in chart order (the team dialog's "Strong against" and "Weak against"). */
export function typeEdges(mine: PokemonType) {
  const all = Object.keys(chart) as Attacking[];
  const of = (edge: Edge) => all.filter((t) => matchup(mine, t).edge === edge);
  return { strong: of("advantage"), weak: of("disadvantage") };
}
