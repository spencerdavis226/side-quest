import type { CardDefinition, QuestState, SessionState } from "../types";
import { finaleCard, stageKind } from "./stages";
// Text filled at display time and never saved.
/** `{dragon}` names the run's dragon (Realms, 2026-11-03): the dragon is
 * picked when the game starts, so the King's Summons can name it and the
 * roads can follow its trail. */
export const DRAGON = "{dragon}";
/** `{lair}` names the region that holds the dragon's lair, with a leading
 * "The" lowered ("the Fire Caverns"); authors use it mid-sentence only (The
 * Quest 2.0 Phase 3, 2026-11-14). */
export const LAIR = "{lair}";
const PLACEHOLDER = /\{(dragon|lair)\}/;
/** The run's dragon and its lair. The dragon is the card in the run with a
 * lair fight, else (a save from before the battle) the last finale card;
 * the lair is the last region of rooms before the dragon's stage. */
export function runNames(quest: QuestState | undefined) {
  if (!quest) return {};
  let first = 0;
  let at = -1;
  let dragon: CardDefinition | undefined;
  for (const [i, stage] of quest.stages.entries()) {
    for (const id of quest.finale.slice(first, first + stage.pick)) {
      const card = finaleCard(quest, id);
      if (card?.lairFight) {
        dragon = card;
        at = i;
      }
    }
    first += stage.pick;
  }
  if (!dragon) {
    dragon = finaleCard(quest, quest.finale[quest.finale.length - 1]);
    at = quest.stages.length - 1;
  }
  const lairStage = quest.stages
    .slice(0, Math.max(0, at))
    .filter((st) => stageKind(st) === "floor")
    .at(-1);
  return {
    dragon: dragon?.title,
    lair: lairStage?.label.replace(/^The /, "the "),
    /** The dragon's card ID (its colours). */
    id: dragon?.id,
  };
}
/** A line with the run's names filled in. */
export function fillNames(quest: QuestState | undefined, text: string) {
  if (!PLACEHOLDER.test(text)) return text;
  const { dragon, lair } = runNames(quest);
  let out = text;
  if (dragon) out = out.split(DRAGON).join(dragon);
  if (lair) out = out.split(LAIR).join(lair);
  return out;
}
/** Whether any line a card shows holds a placeholder: its rules, dice
 * text, phases and lair fight. Checked field by field (no copy), since a
 * boss's beat is a new object on every read. */
function named(card: CardDefinition): boolean {
  const has = (text: string | undefined) => !!text && PLACEHOLDER.test(text);
  const dice = (d: CardDefinition["dice"]) =>
    !!d &&
    (has(d.instruction) ||
      has(d.doubles) ||
      !!d.outcomes?.some((o) => has(o.instruction)));
  const fight = card.lairFight;
  return (
    has(card.rules) ||
    dice(card.dice) ||
    !!card.phases?.some((p) => has(p.rules) || dice(p.dice)) ||
    (!!fight &&
      (has(fight.enrage.rules) ||
        [...fight.calm, ...fight.enraged].some((m) => has(m.rules))))
  );
}
/** A card with the run's names filled into every line it shows: its rules,
 * its dice outcomes, its phases and its lair fight's moves. */
export function withNames(
  s: SessionState,
  card: CardDefinition,
): CardDefinition {
  if (!s.quest || !named(card)) return card;
  const json = JSON.stringify(card);
  const { dragon, lair } = runNames(s.quest);
  // Names are plain words; written into JSON they keep it well formed.
  const safe = (name: string) => JSON.stringify(name).slice(1, -1);
  let out = json;
  if (dragon) out = out.split(DRAGON).join(safe(dragon));
  if (lair) out = out.split(LAIR).join(safe(lair));
  return JSON.parse(out) as CardDefinition;
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
