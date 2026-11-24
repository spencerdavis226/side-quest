import type { CardDefinition } from "../game/types";
import { packCardIds } from "../game/engine";
import { packs } from "./manifest.generated";

// Card text is the largest part of the app, so each pack's cards are a lazy
// chunk fetched only when a game starts. A resumed game never needs them: its
// save carries its own card snapshot. `loadPackCards` keeps the chosen packs'
// cards, their Last Call pools, their planted callbacks and their quest
// finales.
const loaders: Record<string, () => Promise<CardDefinition[]>> = {
  core: () => import("./core-deck").then((m) => m.coreDeckCards),
  vip: () => import("./vip").then((m) => m.vipCards),
  pokemon: () => import("./pokemon").then((m) => m.pokemonCards),
  likely: () => import("./likely").then((m) => m.likelyCards),
  never: () => import("./never").then((m) => m.neverCards),
  secrets: () => import("./secrets").then((m) => m.secretsCards),
  dungeon: () => import("./dungeon").then((m) => m.dungeonCards),
  minds: () => import("./minds").then((m) => m.mindsCards),
  outbreak: () => import("./outbreak").then((m) => m.outbreakCards),
  dealer: () => import("./dealer").then((m) => m.dealerCards),
};

export const loadablePackIds = Object.keys(loaders);

// Packs already fetched this session, so a warmed selection starts a game
// synchronously, exactly as before card text was split out.
const loadedPacks = new Map<string, CardDefinition[]>();

const select = (chosen: typeof packs, loaded: CardDefinition[][]) => {
  const wanted = new Set(chosen.flatMap(packCardIds));
  const byId = new Map<string, CardDefinition>();
  for (const card of loaded.flat())
    if (wanted.has(card.id)) byId.set(card.id, card);
  return [...byId.values()];
};

/** The chosen packs' cards if every one is already loaded, else null. */
export function loadedPackCards(packIds: readonly string[]) {
  const chosen = packs.filter((pack) => packIds.includes(pack.id));
  const loaded = chosen.map((pack) => loadedPacks.get(pack.id));
  return loaded.every((cards) => cards)
    ? select(chosen, loaded as CardDefinition[][])
    : null;
}

export async function loadPackCards(
  packIds: readonly string[],
): Promise<CardDefinition[]> {
  const chosen = packs.filter((pack) => packIds.includes(pack.id));
  const loaded = await Promise.all(
    chosen.map(async (pack) => {
      const cards = loadedPacks.get(pack.id) ?? (await loaders[pack.id]());
      loadedPacks.set(pack.id, cards);
      return cards;
    }),
  );
  return select(chosen, loaded);
}
