import type { StageRule } from "../../game/types";

// Route rules (2026-10-25): the weather on each route, from its banner until
// its gym falls: a table rule the app shows but never tracks, and one twist
// to the odds. A rule never moves HP or items. In route order.
export const routeRules: readonly StageRule[] = [
  {
    name: "Clear Skies",
    rule: "When a card names a flying Pokémon, everyone points up. Last to point drinks 1.",
    effect: { heal: 1 },
  },
  {
    name: "Tall Grass",
    rule: "When a wild Pokémon appears, the drawer does its cry. The table boos a bad one: drink 1.",
    effect: { roll: { monster: 1 } },
  },
  {
    name: "Rain",
    rule: "Lost a battle? Do a short rain dance. Refuse: drink 1.",
    effect: { crit: 19 },
  },
  {
    name: "Nightfall",
    rule: "Whisper until the gym falls. Too loud: drink 1.",
    effect: { fumble: 2, roll: { boss: 1 } },
  },
  {
    name: "Sandstorm",
    rule: "Squint until the gym falls. Caught with your eyes wide open: drink 1.",
    effect: { roll: { all: -1 }, heal: 1 },
  },
  {
    name: "Hail",
    rule: "Shiver before every roll. Forget: drink 1.",
    effect: { hurt: { trap: 1 }, roll: { monster: 1 } },
  },
  {
    name: "Fog",
    rule: "Call everyone 'Trainer' instead of their name. Slip: drink 1.",
    effect: { roll: { elite: 2, monster: -1 } },
  },
  {
    name: "Harsh Sunlight",
    rule: "Fan yourself before every roll. Forget: drink 1.",
    effect: { roll: { boss: 1 }, hurt: { monster: 1 } },
  },
];
