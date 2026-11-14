import type { CardDefinition, Offer } from "../../game/types";
import { LORE, card } from "./shared";

// Dragon signs (The Quest 2.0 Phase 3, 2026-11-14): one dealt after the
// first region's boss. The dragon passes over, or leaves something behind;
// a table beat, then a choice: learn about it (lore, a Lucky Coin until
// Phase 4) or take what is there. `{dragon}` is filled when the card is
// dealt. The Quest only.
const sign = (
  id: string,
  title: string,
  rules: string,
  offers: [Offer, Offer],
): CardDefinition => ({
  ...card(`sign-${id}`, title, "group", rules),
  ribbon: "Dragon Sign",
  ribbonTone: "crimson",
  encounter: "shrine",
  offers,
});

export const signCards: CardDefinition[] = [
  sign(
    "shadow",
    "The Shadow",
    "A shadow crosses the sun: {dragon}. Everyone ducks. Last head down drinks 2.",
    [{ label: "Watch it · drink 2", ...LORE }, { label: "Stay down" }],
  ),
  sign(
    "scale",
    "A Fallen Scale",
    "A scale the size of a shield, still warm, fallen from {dragon}. Everyone touches it.",
    [
      { label: "Study it · drink 2", ...LORE },
      { label: "Wear it", loot: "shield" },
    ],
  ),
  sign(
    "knights",
    "The Fleeing Knights",
    "Knights gallop past the wrong way, shouting '{dragon}!' Everyone shouts it too.",
    [{ label: "Stop one", cost: 1, ...LORE }, { label: "Let them run" }],
  ),
  sign(
    "mill",
    "The Burned Mill",
    "A mill, still smoking. {dragon} was here an hour ago. Everyone pours out a sip.",
    [
      { label: "Search · drink 2", ...LORE },
      { label: "Fill a flask", loot: "draught" },
    ],
  ),
  sign(
    "tracks",
    "Tracks",
    "One footprint, big enough to sit in. Everyone sits in it. Last down drinks 2.",
    [{ label: "Follow them", cost: 1, ...LORE }, { label: "Go around" }],
  ),
  sign(
    "song",
    "The Old Song",
    "A shepherd sings the old song about {dragon}. Everyone hums along. Nobody knows it.",
    [
      { label: "Learn it · drink 2", ...LORE },
      { label: "Tip him", heal: 1 },
    ],
  ),
];
