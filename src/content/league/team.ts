import type { CardDefinition, PokemonType } from "../../game/types";

// The League's team (2026-10-25): the core Pokémon fantasy the journey was
// missing. A wild Pokémon the table beats can be caught for a drink, and
// every route's catch card adds its Pokémon too; the team holds two, and a
// third catch lets the oldest go. Before a typed battle, a teammate whose
// type is super effective on the foe can be sent in, once a gym. Trainers,
// grunts and bosses are never caught. Applied after the types.

/** The catch cards' Pokémon types, by card ID without `pokemon.`. */
const catchTypes: Readonly<Record<string, PokemonType>> = {
  "route-caterpie": "bug",
  "route-clefairy": "fairy",
  "route-abra": "psychic",
  "route-lapras": "water",
  "route-chansey": "normal",
  "route-dratini": "dragon",
  "route-eevee-gift": "normal",
  "route-snorlax-catch": "normal",
};

export function applyTeam(cards: CardDefinition[]) {
  for (const c of cards) {
    if (!c.id.startsWith("pokemon.") || !c.ribbon?.endsWith(" · Wild"))
      continue;
    if ((c.battle || c.strike) && !c.hits && c.type && c.type !== "trio")
      c.catchable = true;
  }
  for (const [id, type] of Object.entries(catchTypes)) {
    const c = cards.find((card) => card.id === `pokemon.${id}`);
    const offer = c?.offers?.find((o) => o.heal !== undefined);
    if (!c || !offer) throw new Error(`No catch card: pokemon.${id}`);
    c.type = type;
    offer.catch = true;
  }
}
