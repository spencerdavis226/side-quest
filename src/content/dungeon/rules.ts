import type { StageRule } from "../../game/types";

// Floor rules (2026-10-25): every floor has one, from its banner until its
// boss falls (the third floor's, until closing time): a table rule the app
// shows but never tracks, and one twist to the odds, so the 27 dungeons
// play differently, not just read differently. A rule never moves hearts
// or items. Keyed by the floor's stage label.
export const floorRules: Readonly<Record<string, StageRule>> = {
  "The Cellar": {
    name: "Rat Run",
    rule: "When a card mentions a rat, everyone squeaks. Last to squeak drinks 1.",
    effect: { roll: { monster: 1 } },
  },
  "The Wine Cellar": {
    name: "Tasting Notes",
    rule: "Before every sip, describe your drink in one fancy word. Forget: drink 1.",
    effect: { crit: 19 },
  },
  "The Brewery": {
    name: "Prost!",
    rule: "After every lost fight, everyone clinks glasses and says 'Prost!' Last to clink drinks 1.",
    effect: { heal: 1 },
  },
  "The Catacombs": {
    name: "Echoes",
    rule: "The player on the drawer's left repeats the drawer's last word, every turn. Forget: drink 1.",
    effect: { fumble: 2, roll: { boss: 1 } },
  },
  "The Sewers": {
    name: "The Smell",
    rule: "Pinch your nose to talk. Caught talking without it: drink 1.",
    effect: { hurt: { trap: 1 }, roll: { monster: 1 } },
  },
  "The Walk-in Freezer": {
    name: "Frostbite",
    rule: "Hold your drink in your off hand. Caught with the other: drink 1.",
    effect: { roll: { all: -1 }, crit: 19 },
  },
  "The Drowned Taproom": {
    name: "Waterlogged",
    rule: "Anyone who says 'water' drinks 1. Everyone else says 'wet beer'.",
    effect: { hurt: { ambush: -1 }, roll: { trap: -1 } },
  },
  "The Kitchen": {
    name: "Health Inspection",
    rule: "Anyone who touches their face drinks 1. The table watches.",
    effect: { heal: 1, hurt: { monster: 1 } },
  },
  "The Rooftop Bar": {
    name: "High Winds",
    rule: "Hold your drink with both hands. One hand: drink 1.",
    effect: { roll: { boss: 1, monster: -1 }, crit: 19 },
  },
};
