import type { CardDefinition } from "../../game/types";
import { applyPowers, leaguePowerWords, type PowerLine } from "../powers";

// The League's signature moves (2026-10-25): one a starter, used when the
// table says, once (or twice) until the next gym or boss falls; an
// evolution's move replaces the last (`null` keeps it). Eevee's three are
// alternatives, one per branch. The bad starters' moves are bad on purpose.

const lines: Readonly<Record<string, PowerLine>> = {
  bulbasaur: [
    ["Leech Seed", "heal", { amount: 1 }],
    ["Leech Seed", "heal", { amount: 2 }],
    ["Synthesis", "heal", { amount: 3 }],
  ],
  charmander: [
    ["Ember", "double"],
    ["Flamethrower", "double", { uses: 2 }],
    ["Blast Burn", "win", { cost: 1, uses: 2 }],
  ],
  squirtle: [["Withdraw", "spare"], null, ["Hydro Pump", "win", { cost: 1 }]],
  pikachu: [["Volt Tackle", "win", { cost: 1 }]],
  eevee: [
    ["Quick Attack", "edge"],
    ["Aqua Ring", "heal", { amount: 2 }],
    ["Pin Missile", "double", { uses: 2 }],
    ["Flare Blitz", "win", { cost: 1, uses: 2 }],
  ],
  cyndaquil: [
    ["Smokescreen", "flee"],
    ["Flame Wheel", "double"],
    ["Eruption", "win", { cost: 1 }],
  ],
  totodile: [
    ["Bite", "edge"],
    ["Ice Fang", "edge", { uses: 2 }],
    ["Hydro Cannon", "win", { cost: 1 }],
  ],
  treecko: [
    ["Detect", "spare"],
    ["Leaf Blade", "double"],
    ["Leaf Storm", "win", { cost: 1 }],
  ],
  torchic: [
    ["Focus Energy", "edge"],
    ["Double Kick", "double"],
    ["Blaze Kick", "win", { cost: 1 }],
  ],
  mudkip: [
    ["Mud Sport", "flee"],
    ["Mud-Slap", "reroll"],
    ["Earthquake", "double"],
  ],
  piplup: [
    ["Bubble Beam", "double"],
    ["Metal Claw", "edge", { uses: 2 }],
    ["Hydro Cannon", "win", { cost: 1 }],
  ],
  turtwig: [
    ["Withdraw", "spare"],
    ["Razor Leaf", "double"],
    ["Earthquake", "win", { cost: 1 }],
  ],
  oshawott: [
    ["Razor Shell", "edge"],
    ["Fury Cutter", "double"],
    ["Megahorn", "win", { cost: 1 }],
  ],
  chespin: [
    ["Spiky Shield", "spare"],
    ["Needle Arm", "double"],
    ["Spiky Shield", "spare", { uses: 2 }],
  ],
  fennekin: [
    ["Mystical Fire", "edge"],
    ["Psybeam", "double"],
    ["Mystical Fire", "win", { cost: 1 }],
  ],
  froakie: [
    ["Quick Attack", "flee"],
    ["Water Shuriken", "double"],
    ["Water Shuriken", "double", { uses: 2 }],
  ],
  rowlet: [
    ["Leafage", "edge"],
    ["Razor Leaf", "double"],
    ["Spirit Shackle", "win", { cost: 1 }],
  ],
  scorbunny: [
    ["Quick Attack", "flee"],
    ["Double Kick", "double"],
    ["Pyro Ball", "win", { cost: 1 }],
  ],
  fuecoco: [
    ["Slack Off", "heal", { amount: 1 }],
    ["Ember", "double"],
    ["Torch Song", "double", { uses: 2 }],
  ],
  spheal: [
    ["Rollout", "double"],
    ["Rest", "heal", { amount: 2 }],
    ["Sheer Cold", "win", { cost: 2 }],
  ],
  riolu: [
    ["Quick Guard", "spare"],
    ["Aura Sphere", "win", { cost: 1 }],
  ],
  cubone: [
    ["Bonemerang", "double"],
    ["Bonemerang", "double", { uses: 2 }],
  ],
  rookidee: [
    ["Peck", "edge"],
    ["Roost", "heal", { amount: 1 }],
    ["Iron Defense", "spare"],
  ],
  caterpie: [
    ["String Shot", "flee"],
    ["Harden", "spare"],
    ["Quiver Dance", "edge"],
  ],
  larvitar: [
    ["Bite", "edge"],
    ["Harden", "spare"],
    ["Stone Edge", "win", { cost: 1 }],
  ],
  gastly: [
    ["Lick", "edge"],
    ["Hypnosis", "flee", { uses: 2 }],
    ["Shadow Ball", "double", { uses: 2 }],
  ],
  gible: [
    ["Dragon Rage", "double"],
    ["Dig", "spare"],
    ["Dragon Rush", "win", { cost: 1 }],
  ],
  zorua: [
    ["Feint Attack", "edge"],
    ["Night Daze", "double", { uses: 2 }],
  ],
  aron: [
    ["Iron Defense", "spare"],
    ["Headbutt", "double"],
    ["Heavy Slam", "win", { cost: 1 }],
  ],
  // The bad ones.
  bidoof: [
    ["Defense Curl", "flee"],
    ["Surf", "heal", { amount: 1 }],
  ],
  magikarp: [
    ["Splash", "flee"],
    ["Hyper Beam", "win", { cost: 2 }],
  ],
  // Togepi does nothing, happily: its Metronome never does much.
  togepi: [
    ["Metronome", "flee"],
    ["Wish", "heal", { amount: 1 }],
  ],
  sunkern: [
    ["Absorb", "heal", { amount: 1 }],
    ["Solar Beam", "double"],
  ],
  drowzee: [
    ["Hypnosis", "flee"],
    ["Dream Eater", "heal", { amount: 2 }],
  ],
  zubat: [
    ["Leech Life", "heal", { amount: 1 }],
    ["Wing Attack", "double"],
  ],
};

export const applyStarterPowers = (cards: CardDefinition[]) =>
  applyPowers(cards, lines, "pokemon.starter-", leaguePowerWords);
