import type { PackDefinition } from "../game/types";
import { packs } from "../content/manifest.generated";
/** Cosmetic identity comes from the installed catalog, never changes the saved draw order. */
export function cardPacks(
  cardId: string,
  selected?: readonly string[],
  catalog: readonly PackDefinition[] = packs,
) {
  return catalog.filter(
    (pack) =>
      (!selected || selected.includes(pack.id)) &&
      (pack.cardIds.includes(cardId) ||
        !!pack.planted?.includes(cardId) ||
        cardId.startsWith(`${pack.id}.`)),
  );
}
export function selectedPacks(ids: readonly string[]) {
  return packs.filter((pack) => ids.includes(pack.id));
}
