import type {
  CardDefinition,
  GameConfig,
  PackDefinition,
  QuestState,
  SessionState,
} from "./types";
import { finaleCard, pickFinale, questRoute } from "./crawl/stages";
import { newParty, omenEffect } from "./crawl/party";
import { atBeat, awaitingSpoils, bossBeat } from "./crawl/bosses";
import { awaitingOffer, awaitingPress } from "./crawl/offers";
import { awaitingCatch } from "./crawl/team";
import { awaitingVerdict, discard } from "./crawl/discard";
import { withNames, withSecret } from "./crawl/names";
import { atRound, roundOf } from "./crawl/lair";
// The engine's public entry (Quest 2.0 Phase 0, 2026-11-13): the crawl's
// pieces live in `./crawl/` and are re-exported here, so every import of
// `engine` keeps working. Modules outside `src/game` import from here only.
export {
  chooseRoad,
  finaleCard,
  finaleCardIds,
  finaleStage,
  packCardIds,
  pickFinale,
  questRecord,
  questRoute,
  questStages,
  stageCards,
  stageKind,
  wantedBoss,
  type StageKind,
} from "./crawl/stages";
export {
  formEffect,
  isLasting,
  omenEffect,
  omenForm,
  partyBoons,
  replaces,
  satchelSize,
  stackEffects,
} from "./crawl/party";
export {
  atBeat,
  awaitingSpoils,
  bossBeat,
  fellingSwing,
  fellingVerdict,
  hitsNeeded,
  isBossCard,
  skipSpoils,
  spoilsOnWin,
  takeSpoils,
} from "./crawl/bosses";
export {
  PRESS_STEP,
  awaitingOffer,
  awaitingPress,
  canTakeOffer,
  cashOut,
  pressOn,
  takeOffer,
} from "./crawl/offers";
export {
  BALL_BONUS,
  SPECIAL_BALLS,
  TEAM_SIZE,
  assistBonus,
  awaitingCatch,
  ballNeed,
  ballsReady,
  canSendIn,
  canThrowMaster,
  canThrowWith,
  cardEdge,
  cardMatchup,
  catchIt,
  catchReplaces,
  caughtBy,
  dropFromBag,
  letGo,
  partyTeam,
  partyType,
  sendIn,
  strikeOutcome,
  strikeText,
  teamMember,
  throwBall,
  throwMaster,
  throwWith,
  thrownBall,
  type BagDrop,
  type SpecialBall,
} from "./crawl/team";
export {
  DRAUGHT_DRINKS,
  DRAUGHT_HEAL,
  canUseLoot,
  spendLoot,
} from "./crawl/loot";
export {
  awaitingChoice,
  awaitingVerdict,
  natural,
  settleBattle,
  skipRoll,
} from "./crawl/discard";
export { DRAGON, LAIR, fillNames, runNames } from "./crawl/names";
export {
  atRound,
  isLairFight,
  killingRound,
  lairMove,
  type Round,
} from "./crawl/lair";
export { BALLAD_WIDTH, ballad, singleBlow } from "./ballad";
export {
  CLASS_COUNT,
  DRAGON_KING,
  ECHO_COUNT,
  FEATS,
  LANDMARK_COUNT,
  RARE_COUNT,
  SECRET_COUNT,
  secretKind,
  NINE,
  UNLOCKS,
  chronicleNews,
  emptyChronicle,
  readChronicle,
  recordRun,
  unlocks,
  type Chronicle,
  type ChronicleNews,
} from "./chronicle";
export type Random = () => number;
export function shuffle(
  ids: string[],
  random: Random = Math.random,
  previous: string | null = null,
): string[] {
  const next = [...ids];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  if (next.length > 1 && next[0] === previous) {
    const j = 1 + Math.floor(random() * (next.length - 1));
    [next[0], next[j]] = [next[j], next[0]];
  }
  return next;
}
/**
 * Spread a quest's cards through its run: move enough of them into the draws
 * before the run's last one that the goal is met and the finale still lands
 * in time. The rest of the shuffle is untouched. `from`, `need` and `window`
 * re-pace the rest of a run after a lost battle: `need` tagged cards within
 * `window` draws of `from`.
 */
export function paceQuest(
  order: string[],
  cards: CardDefinition[],
  quest: QuestState | undefined,
  random: Random = Math.random,
  from = 0,
  need = quest?.goal ?? 0,
  window = (quest?.length ?? 1) - 1,
): string[] {
  if (!quest) return order;
  const next = [...order];
  const end = Math.min(from + window, next.length);
  const tagged = new Set(
    cards.filter((c) => c.quest === quest.packId).map((c) => c.id),
  );
  const spots = (from: number, to: number, want: boolean) => {
    const found = [];
    for (let i = from; i < to; i++)
      if (tagged.has(next[i]) === want) found.push(i);
    return found;
  };
  let short = need - spots(from, end, true).length;
  while (short-- > 0) {
    const out = spots(end, next.length, true);
    const into = spots(from, end, false);
    if (!out.length || !into.length) break;
    const a = out[Math.floor(random() * out.length)],
      b = into[Math.floor(random() * into.length)];
    [next[a], next[b]] = [next[b], next[a]];
  }
  return next;
}

export function validConfig(c: GameConfig): boolean {
  return (
    !!c &&
    c.version === 1 &&
    Array.isArray(c.packIds) &&
    c.packIds.every((id) => typeof id === "string") &&
    new Set(c.packIds).size === c.packIds.length &&
    (c.limit === null ||
      (Number.isInteger(c.limit) && c.limit >= 1 && c.limit <= 500)) &&
    (c.quest === undefined ||
      (typeof c.quest === "string" &&
        c.packIds.includes(c.quest) &&
        c.limit === null)) &&
    // Heroic mode (The Quest 2.0 Phase 7), on a quest only.
    (c.heroic === undefined || (c.heroic === true && c.quest !== undefined))
  );
}
export function createSession(
  config: GameConfig,
  catalog: CardDefinition[],
  packs: PackDefinition[],
  random: Random = Math.random,
  /** What the Chronicle has earned (The Quest 2.0 Phase 7): a card with an
   * `unlock` not in it is never dealt. */
  unlocked: ReadonlySet<string> = new Set(),
): SessionState {
  if (
    !validConfig(config) ||
    !config.packIds.length ||
    config.packIds.some((id) => !packs.some((p) => p.id === id))
  )
    throw new Error("Choose a valid deck and at least one pack.");
  // A quest mode also deals its own pack's quest-only cards.
  const selected = new Set(
    packs
      .filter((p) => config.packIds.includes(p.id))
      .flatMap((p) => [
        ...p.cardIds,
        ...(p.id === config.quest ? (p.quest?.cardIds ?? []) : []),
      ]),
  );
  const cards = catalog
    .filter((c) => selected.has(c.id))
    .map((c) => structuredClone(c));
  if (!cards.length) throw new Error("This deck has no cards.");
  let quest: QuestState | undefined;
  if (config.quest) {
    const rules = packs.find((p) => p.id === config.quest)?.quest;
    if (!rules) throw new Error("This pack has no quest.");
    // Cards the Chronicle has not unlocked are left out of every pool.
    const open = (ids: string[]) =>
      ids.filter((id) => {
        const lock = catalog.find((c) => c.id === id)?.unlock;
        return !lock || unlocked.has(lock);
      });
    const snapshot = (ids: string[]) =>
      open(ids).map((id) => {
        const card = catalog.find((c) => c.id === id);
        if (!card) throw new Error("A finale card is missing.");
        return structuredClone(card);
      });
    // A quest with road choices (The Quest 2.0 Phase 5) records each
    // stage's place and road, so a replay can put dropped stages back.
    const roads = rules.finale.some((slot) => "choose" in slot);
    const stages = questRoute(rules, random).map(
      (
        {
          label,
          pick,
          cardIds,
          elite,
          inserts,
          route,
          rare,
          variants,
          optional,
        },
        at,
      ) => ({
        label,
        pick,
        ...(roads ? { at } : {}),
        ...(route !== undefined ? { route } : {}),
        cards: snapshot(cardIds),
        ...(elite?.length ? { elite: snapshot(elite) } : {}),
        ...(inserts?.length
          ? {
              inserts: inserts.map(({ at, cardIds }) => ({
                at,
                cards: snapshot(cardIds),
              })),
            }
          : {}),
        // The Quest 2.0 Phase 6: rares, variants, and an optional stage.
        ...(rare && open(rare.cardIds).length
          ? {
              rare: {
                odds:
                  config.heroic && rare.heroic !== undefined
                    ? rare.heroic
                    : rare.odds,
                cards: snapshot(rare.cardIds),
              },
            }
          : {}),
        ...(variants?.length
          ? {
              variants: variants.map(({ deeds, cardIds, harder }) => ({
                deeds: [...deeds],
                cards: snapshot(cardIds),
                ...(harder ? { harder } : {}),
              })),
            }
          : {}),
        ...(optional ? { optional } : {}),
      }),
    );
    const { label, goal, length } = rules;
    quest = {
      packId: config.quest,
      label,
      goal,
      length,
      count: 0,
      // A crawl has no goal to reach: its stages are the whole run.
      due: goal === 0,
      stages,
      finale: pickFinale(stages, random),
      step: 0,
      ...(rules.party
        ? {
            party: newParty(rules.party.hearts - (config.heroic ? 2 : 0)),
          }
        : {}),
      ...(config.heroic && rules.party ? { heroic: true as const } : {}),
    };
  }
  return {
    version: 2,
    config: { ...config, packIds: [...config.packIds] },
    cards,
    order: paceQuest(
      shuffle(
        cards.map((c) => c.id),
        random,
      ),
      cards,
      quest,
      random,
    ),
    position: 0,
    cycle: 0,
    discarded: 0,
    phase: "hidden",
    previousId: null,
    roll: null,
    previousRoll: null,
    ...(quest ? { quest } : {}),
  };
}
export function advance(
  s: SessionState,
  random: Random = Math.random,
): SessionState {
  if (s.phase === "complete") return s;
  if (s.phase === "hidden") return { ...s, phase: "revealed" };
  if (currentCard(s).dice && !s.roll?.returned) return s;
  if (awaitingVerdict(s)) return s;
  if (awaitingOffer(s)) return s;
  if (awaitingSpoils(s)) return s;
  if (awaitingPress(s)) return s;
  if (awaitingCatch(s)) return s;
  return discard(s, random);
}
/** Finale cards are dealt between deck cards and take no deck position. */
export function currentCard(s: SessionState) {
  if (!s.quest?.due)
    return withSecret(
      s,
      s.cards.find((c) => c.id === s.order[s.position])!,
    );
  const card = finaleCard(s.quest, s.quest.finale[s.quest.step])!;
  // The dragon battle reads this round's move (or the enrage contest).
  const duel = s.quest.party?.duel;
  if (card.lairFight && duel)
    return withNames(s, withSecret(s, atRound(card, roundOf(duel))));
  // A boss with phases reads the beat its hits have reached.
  return withNames(
    s,
    withSecret(s, card.phases ? atBeat(card, bossBeat(s.quest, card)) : card),
  );
}
/** The card put aside last, as it read then: a boss's beat (`party.beat`). */
export function previousCard(s: SessionState) {
  const card = findCard(s, s.previousId);
  // The dragon's round just put aside, while the battle goes on.
  const prev = s.quest?.party?.duel?.prev;
  if (card?.lairFight && prev) return withNames(s, atRound(card, prev));
  const beat = s.quest?.party?.beat;
  return card?.phases && beat ? withNames(s, atBeat(card, beat)) : card;
}
/** A deck card or a finale card, for history such as the previous card. */
export function findCard(s: SessionState, id: string | null) {
  const card =
    s.cards.find((c) => c.id === id) ??
    (s.quest && id !== null ? finaleCard(s.quest, id) : undefined);
  return card && withNames(s, card);
}
/** A quest without its dropped stages (they come back into `stages`). */
function withoutDropped(q: QuestState): QuestState {
  const { dropped: _dropped, ...rest } = q;
  return rest;
}
/** A run's stages as dealt at game start: the ones left and the ones a
 * choice removed, back in order (by `at`). A quest without them is its
 * stages as they are. */
function restoreStages(q: QuestState): QuestState["stages"] {
  const all = structuredClone([...q.stages, ...(q.dropped ?? [])]);
  if (!q.dropped?.length || all.some((st) => st.at === undefined)) return all;
  return all.sort((a, b) => a.at! - b.at!);
}
export function replaySession(
  s: SessionState,
  random: Random = Math.random,
): SessionState {
  return {
    ...s,
    config: { ...s.config, packIds: [...s.config.packIds] },
    cards: s.cards.map((c) => structuredClone(c)),
    order: paceQuest(
      shuffle(
        s.cards.map((c) => c.id),
        random,
      ),
      s.cards,
      s.quest,
      random,
    ),
    position: 0,
    cycle: 0,
    discarded: 0,
    phase: "hidden",
    previousId: null,
    roll: null,
    previousRoll: null,
    ...(s.quest
      ? {
          quest: {
            ...withoutDropped(s.quest),
            // Stages a road choice or a Walk on removed come back, in
            // their places (The Quest 2.0 Phase 5).
            stages: restoreStages(s.quest),
            finale: pickFinale(restoreStages(s.quest), random),
            count: 0,
            due: s.quest.goal === 0,
            step: 0,
            lost: 0,
            ...(s.quest.party
              ? {
                  party: newParty(
                    s.quest.party.max - (omenEffect(s.quest)?.hearts ?? 0),
                  ),
                }
              : {}),
          },
        }
      : {}),
  };
}
