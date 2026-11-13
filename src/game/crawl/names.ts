import type { CardDefinition, SessionState } from "../types";
import { finaleCard } from "./stages";
// Text filled at display time and never saved.
/** `{dragon}` in a card's rules names the run's last card (Realms,
 * 2026-11-03): the dragon is picked when the game starts, so the King's
 * Summons can name it and the roads can follow its trail. */
export const DRAGON = "{dragon}";
export function withNames(
  s: SessionState,
  card: CardDefinition,
): CardDefinition {
  if (!card.rules.includes(DRAGON) || !s.quest) return card;
  const last = finaleCard(s.quest, s.quest.finale[s.quest.finale.length - 1]);
  return last
    ? { ...card, rules: card.rules.split(DRAGON).join(last.title) }
    : card;
}
/** A card with a `secretPool` holds one of them for the whole game: picked by
 * hashing the game's shuffle and the card's id, so it is stable across
 * reloads, differs between games, and needs nothing saved. */
export function withSecret(
  s: SessionState,
  card: CardDefinition,
): CardDefinition {
  const pool = card.secretPool;
  if (!pool?.length) return card;
  const key = `${s.order.join(",")}|${s.quest?.finale.join(",") ?? ""}|${card.id}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++)
    h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return { ...card, secret: pool[(h >>> 0) % pool.length] };
}
