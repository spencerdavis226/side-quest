import type {
  CardDefinition,
  PackDefinition,
  PackQuest,
  QuestStage,
  QuestState,
  SessionState,
} from "../types";
import { shuffle, type Random } from "../engine";
import { omenForm, partyBoons, satchelSize } from "./party";
import { isBossCard } from "./bosses";
// A quest's stages: the routes, the picks made at game start, and the run
// so far.
/** Every card a pack can deal: its deck, its quest-only cards and its
 * quest's finale. */
export function packCardIds(pack: PackDefinition): string[] {
  // A crawl's rooms are in both its deck and its stages; list each once.
  return [
    ...new Set([
      ...pack.cardIds,
      ...(pack.quest
        ? [...pack.quest.cardIds, ...finaleCardIds(pack.quest)]
        : []),
    ]),
  ];
}
/** Every stage a quest's finale can deal, on every route. */
export function questStages(rules: PackQuest): QuestStage[] {
  return rules.finale.flatMap((slot) =>
    "oneOf" in slot
      ? slot.oneOf.flat()
      : "choose" in slot
        ? [...slot.choose.card, ...slot.choose.routes.flat()]
        : [slot],
  );
}
/** One game's stages: each `oneOf` slot's route is picked at random. A
 * `choose` slot (The Quest 2.0 Phase 5) leaves one route out at random and
 * deals the choice card for the other two, then both routes, tagged 0 and
 * 1, until the table picks one. */
export function questRoute(
  rules: PackQuest,
  random: Random = Math.random,
): (QuestStage & { route?: 0 | 1 })[] {
  return rules.finale.flatMap((slot) => {
    if ("oneOf" in slot)
      return slot.oneOf[Math.floor(random() * slot.oneOf.length)];
    if (!("choose" in slot)) return [slot];
    const { card, routes } = slot.choose;
    const out = Math.floor(random() * routes.length);
    const kept = routes.filter((_, i) => i !== out);
    return [
      card[out],
      ...kept[0].map((st) => ({ ...st, route: 0 as const })),
      ...kept[1].map((st) => ({ ...st, route: 1 as const })),
    ];
  });
}
/** The road chosen on the choice card at stage `stage` (The Quest 2.0
 * Phase 5): the other road (the run of tagged stages straight after it
 * with the other tag) leaves the run, with its picks, into `dropped`. */
export function chooseRoad(
  quest: QuestState,
  stage: number,
  route: 0 | 1,
): QuestState {
  const other = (i: number) => {
    if (i <= stage) return false;
    for (let j = stage + 1; j <= i; j++)
      if (quest.stages[j]?.route === undefined) return false;
    return quest.stages[i].route !== route;
  };
  return dropInto(quest, other);
}
/** Take stages out of a run into `dropped`, with their picks. */
export function dropInto(
  quest: QuestState,
  drop: (index: number) => boolean,
): QuestState {
  const { stages, finale, gone } = dropStages(quest, drop);
  if (!gone.length) return quest;
  return {
    ...quest,
    stages,
    finale,
    dropped: [...(quest.dropped ?? []), ...gone],
  };
}
/** Take stages out of a run, with their picks: the stages and the picks
 * left, and the stages taken out (for `quest.dropped`). */
export function dropStages(
  quest: QuestState,
  drop: (index: number) => boolean,
) {
  const stages: QuestState["stages"] = [];
  const gone: QuestState["stages"] = [];
  const finale: string[] = [];
  let first = 0;
  for (const [i, stage] of quest.stages.entries()) {
    const picks = quest.finale.slice(first, first + stage.pick);
    first += stage.pick;
    if (drop(i)) gone.push(stage);
    else {
      stages.push(stage);
      finale.push(...picks);
    }
  }
  return { stages, finale, gone };
}
/** Every card a quest's finale stages can deal, elites included, each
 * once (sibling routes may share cards: every lair has the same door). */
export function finaleCardIds(rules: PackQuest): string[] {
  return [
    ...new Set(
      questStages(rules).flatMap((stage) => [
        ...stage.cardIds,
        ...(stage.elite ?? []),
        ...(stage.inserts ?? []).flatMap((i) => i.cardIds),
      ]),
    ),
  ];
}
/** Draw each stage's cards at random, in stage order. A fork is never the
 * last room of its floor, so its loud door always has a room to swap. A
 * stage with inserts (a landmark) picks the rest and puts one card of each
 * insert's pool at its place (`placeInserts`). */
export function pickFinale(
  stages: QuestState["stages"],
  random: Random = Math.random,
): string[] {
  return stages.flatMap(({ pick, cards, inserts }) => {
    if (inserts?.length) return placeInserts(pick, cards, inserts, random);
    const picks = shuffle(
      cards.map((c) => c.id),
      random,
    ).slice(0, pick);
    const fork = (id: string) =>
      cards.find((c) => c.id === id)?.encounter === "fork";
    const last = picks.length - 1;
    if (last > 0 && fork(picks[last])) {
      const rooms = picks
        .slice(0, last)
        .flatMap((id, i) => (fork(id) ? [] : [i]));
      if (rooms.length) {
        const j = rooms[Math.floor(random() * rooms.length)];
        [picks[j], picks[last]] = [picks[last], picks[j]];
      }
    }
    return picks;
  });
}
/** A stage with inserts (The Quest 2.0 Phase 3, 2026-11-14): the rooms
 * drawn as for any stage, then one card of each insert's pool spliced in at
 * its place. A fork is never last and never directly before an insert, so
 * its loud door (which swaps the next room) never swaps the landmark. */
function placeInserts(
  pick: number,
  cards: CardDefinition[],
  inserts: NonNullable<QuestState["stages"][number]["inserts"]>,
  random: Random,
): string[] {
  const picks = shuffle(
    cards.map((c) => c.id),
    random,
  ).slice(0, pick - inserts.length);
  const sorted = [...inserts].sort((a, b) => a.at - b.at);
  for (const { at, cards: pool } of sorted)
    picks.splice(at, 0, pool[Math.floor(random() * pool.length)].id);
  const places = new Set(sorted.map((i) => i.at));
  const fork = (i: number) =>
    !places.has(i) &&
    cards.find((c) => c.id === picks[i])?.encounter === "fork";
  const blocked = (i: number) => i === picks.length - 1 || places.has(i + 1);
  for (let i = 0; i < picks.length; i++) {
    if (!fork(i) || !blocked(i)) continue;
    const rooms = picks.flatMap((_, j) =>
      places.has(j) || fork(j) || blocked(j) ? [] : [j],
    );
    if (!rooms.length) continue;
    const j = rooms[Math.floor(random() * rooms.length)];
    [picks[i], picks[j]] = [picks[j], picks[i]];
  }
  return picks;
}
/** The stage a finale card belongs to (`stage` counts from 0), and its place
 * within that stage. */
export function finaleStage(quest: QuestState, step = quest.step) {
  let first = 0;
  for (const [number, stage] of quest.stages.entries()) {
    if (step < first + stage.pick)
      return {
        label: stage.label,
        stage: number,
        index: step - first,
        size: stage.pick,
      };
    first += stage.pick;
  }
  throw new Error("Invalid finale step");
}
/** A quest run so far, for the badge case and the Hall of Fame: the meter's
 * count, the quest cards behind it that are still in this cycle's order (an
 * endless game reshuffles, so earlier ones can be gone), and each finale
 * stage with the cards already put aside. Picks not yet dealt stay hidden. */
export function questRecord(s: SessionState) {
  const q = s.quest;
  if (!q) return null;
  const earned = s.order
    .slice(0, s.position)
    .map((id) => s.cards.find((c) => c.id === id)!)
    .filter((c) => c.quest === q.packId)
    .slice(0, q.count);
  const won = q.due && s.phase === "complete" && !q.party?.wiped;
  const beaten = won ? q.finale.length : q.due ? q.step : 0;
  let first = 0;
  const stages = q.stages.map((stage) => {
    const cards = q.finale
      .slice(first, Math.min(first + stage.pick, beaten))
      .map((id) => finaleCard(q, id)!);
    first += stage.pick;
    // A crawl's boss stages close its floors; its omen stage opens the run.
    const boss = stage.cards.some(isBossCard);
    const omen = stage.cards.every((c) => c.encounter === "omen");
    const kind = stageKind(stage);
    // A fight dealt again until it falls (a boss, closing time's rival):
    // a trophy on Pub Crawl's end screen (2026-10-25).
    const trophy = stage.pick === 1 && stage.cards.some((c) => !!c.hits);
    // Whether the stage can deal a fight at all, read from its whole pool
    // (a lone card with none, such as a summons or a dragon sign, is not a
    // floor on the end screen, reached or not).
    const fight = stage.cards.some((c) => !!c.battle || !!c.hits);
    return {
      label: stage.label,
      size: stage.pick,
      cards,
      boss,
      omen,
      kind,
      trophy,
      fight,
    };
  });
  return {
    label: q.label,
    goal: q.goal,
    count: q.count,
    earned,
    stages,
    won,
    party: q.party,
    /** Tonight's omen card, once put aside, and the satchel's size. */
    omen: q.party?.omen ? finaleCard(q, q.party.omen) : undefined,
    /** The omen as it stands now: a starter's current form and its line. */
    form: omenForm(q),
    /** Pokémon League badges: the quest-tagged bosses put aside, of how
     * many stages deal one. */
    badges: {
      earned: stages
        .flatMap((st) => st.cards)
        .filter((c) => c.quest === q.packId).length,
      of: q.stages.filter((st) => st.cards.some((c) => c.quest === q.packId))
        .length,
    },
    satchel: satchelSize(q),
    /** Pub Crawl: tonight's omen and the trinkets, in the order they came. */
    boons: partyBoons(q),
    /** The jinx holding now, with the card that laid it. */
    jinx: q.party?.jinx ? finaleCard(q, q.party.jinx) : undefined,
  };
}
/** The boss waiting at the bottom of the floor in play (picked when the
 * game started), for the wanted poster; none past the last boss or in a
 * floor that ends on no boss. */
export function wantedBoss(quest: QuestState): CardDefinition | undefined {
  const { stage } = finaleStage(quest);
  let first = 0;
  for (const [i, st] of quest.stages.entries()) {
    if (i === stage || i === stage + 1) {
      const card = finaleCard(quest, quest.finale[first]);
      if (st.pick === 1 && card && isBossCard(card)) return card;
    }
    first += st.pick;
  }
  return undefined;
}
/** What a stage is, from its cards: the run's own omen (a starter, an
 * adventurer), tonight's omen, a landing, a boss, a lone set piece (the
 * queue, closing time, the League's rival), or a floor of rooms. */
export type StageKind =
  "adventurer" | "omen" | "rest" | "boss" | "set-piece" | "floor";
export function stageKind(stage: QuestState["stages"][number]): StageKind {
  const { cards, pick } = stage;
  if (cards.every((c) => c.encounter === "omen"))
    return cards.some((c) => c.omen) ? "adventurer" : "omen";
  if (cards.every((c) => c.encounter === "rest")) return "rest";
  if (cards.some(isBossCard)) return "boss";
  return pick === 1 ? "set-piece" : "floor";
}
/** Every card a stage snapshot holds: its pool, its elites and its
 * inserts (later also its rares and variants). Guarded, because `validateQuest` runs it
 * on a save before the save is known to be well formed. */
export const stageCards = (
  stage: QuestState["stages"][number],
): CardDefinition[] => [
  ...(Array.isArray(stage?.cards) ? stage.cards : []),
  ...(Array.isArray(stage?.elite) ? stage.elite : []),
  ...(Array.isArray(stage?.inserts)
    ? stage.inserts.flatMap((i) => (Array.isArray(i?.cards) ? i.cards : []))
    : []),
];
/** A finale card by ID, from any stage's pool, elites or inserts. A plain
 * search, no copy: it runs on every read of the card in play. */
export function finaleCard(
  quest: QuestState,
  id: string,
): CardDefinition | undefined {
  const find = (cards: unknown) =>
    Array.isArray(cards)
      ? (cards as CardDefinition[]).find((c) => c?.id === id)
      : undefined;
  for (const stage of quest.stages) {
    const card =
      find(stage?.cards) ??
      find(stage?.elite) ??
      (Array.isArray(stage?.inserts)
        ? stage.inserts.reduce<CardDefinition | undefined>(
            (got, i) => got ?? find(i?.cards),
            undefined,
          )
        : undefined);
    if (card) return card;
  }
  return undefined;
}
