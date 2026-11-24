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
import { rollWins } from "./dice";
import { withNames, withSecret } from "./crawl/names";
import { atRound, roundOf } from "./crawl/lair";
import {
  awaitingInvoice,
  awaitingRedo,
  rememberRivals,
  withRival,
} from "./crawl/rival";
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
  healAmount,
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
  offerHeal,
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
  draughtHeal,
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
  RIVAL_CAP,
  RIVAL_DRINKS,
  RIVAL_GAP,
  RIVAL_MERCY,
  RIVAL_RATE,
  RIVAL_TOTAL,
  RIVAL_VERBS,
  awaitingInvoice,
  awaitingRedo,
  canHush,
  canKickOut,
  canPayInvoice,
  hush,
  kickOut,
  payInvoice,
  payOff,
  payOffItem,
  redoRoll,
  rememberRivals,
  rivalArsenal,
  settleDrinks,
  rivalCut,
  rivalLine,
  rivalProfile,
} from "./crawl/rival";
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
  CHAMPION_COUNT,
  emptyChronicle,
  emptyLeague,
  STARTER_COUNT,
  readChronicle,
  recordRun,
  rivalMemory,
  unlocks,
  type Chronicle,
  type RivalRecord,
  type ChronicleNews,
  type LeagueRecord,
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
 * Callbacks (2026-11-24): put each sequel `after` draws behind the card
 * that plants it. Sequels already in `order` are taken out first, so a
 * reshuffle places them again. Randomness is drawn only for a planting
 * card, so a deck without one deals exactly as before.
 */
export function plantSequels(
  order: string[],
  cards: CardDefinition[],
  random: Random = Math.random,
): string[] {
  const byId = new Map(cards.map((c) => [c.id, c]));
  if (!cards.some((c) => c.sequel && byId.has(c.sequel.cardId))) return order;
  const base = order.filter((id) => !byId.get(id)?.planted);
  const out: string[] = [];
  // Sequels waiting for their place: the index each should land on.
  const due: { id: string; at: number }[] = [];
  const settle = () => {
    for (;;) {
      const i = due.findIndex((d) => d.at <= out.length);
      if (i < 0) return;
      out.push(due.splice(i, 1)[0].id);
    }
  };
  for (const id of base) {
    settle();
    out.push(id);
    const sequel = byId.get(id)?.sequel;
    if (!sequel || !byId.has(sequel.cardId)) continue;
    const [min, max] = sequel.after;
    const k = min + Math.floor(random() * (max - min + 1));
    due.push({ id: sequel.cardId, at: out.length - 1 + k });
  }
  // Sequels planted near the end of the deck close it, in order.
  due.sort((a, b) => a.at - b.at);
  return [...out, ...due.map((d) => d.id)];
}
/** A fresh deal of a deck: shuffled, never opening on `previous`, with
 * every sequel planted behind its card. */
export function dealOrder(
  ids: string[],
  cards: CardDefinition[],
  random: Random = Math.random,
  previous: string | null = null,
): string[] {
  const planted = new Set(cards.filter((c) => c.planted).map((c) => c.id));
  if (!planted.size) return shuffle(ids, random, previous);
  return plantSequels(
    shuffle(
      ids.filter((id) => !planted.has(id)),
      random,
      previous,
    ),
    cards,
    random,
  );
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

/**
 * Last Call (2026-11-23): a finite plain game ends on its Last Call card.
 * The card sits in the order as the game's last draw, `limit`, so the deck
 * before it plays exactly as it would have. Without one (a quest, Infinite,
 * or packs with no pool) the order is returned as it is.
 */
export function placeLastCall(
  order: string[],
  cards: CardDefinition[],
  limit: number | null,
): string[] {
  const last = cards.find((c) => c.lastCall);
  if (!last || limit === null || limit > order.length) return order;
  const rest = order.filter((id) => id !== last.id);
  rest.splice(limit - 1, 0, last.id);
  return rest;
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
  /** What the Chronicle remembers of the rivals (Rivals Phase 6): the one
   * who got the better of the table last run (twice as likely), and every
   * rival it has met (who come back for more). */
  rivals: { nemesis?: string; met?: readonly string[] } = {},
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
        // Callbacks: sequels come with the deck that plants them.
        ...(p.planted ?? []),
        ...(p.id === config.quest ? (p.quest?.cardIds ?? []) : []),
      ]),
  );
  // A Last Call card is never a deck card, even if a pack lists it.
  const cards = catalog
    .filter((c) => selected.has(c.id) && !c.lastCall)
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
          ambush,
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
        ...(ambush?.length ? { ambush: snapshot(ambush) } : {}),
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
              variants: variants.map(
                ({ deeds, cardIds, harder, fallback }) => ({
                  deeds: [...deeds],
                  cards: snapshot(cardIds),
                  ...(harder ? { harder } : {}),
                  ...(fallback ? { fallback } : {}),
                }),
              ),
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
      ...(rules.party?.coin ? { coin: true as const } : {}),
    };
    quest = rememberRivals(quest, rivals, random);
  }
  let order = paceQuest(
    dealOrder(
      cards.map((c) => c.id),
      cards,
      random,
    ),
    cards,
    quest,
    random,
  );
  // Last Call: a finite plain game whose deck reaches its limit closes on
  // one card from the chosen packs' pools, drawn after the shuffle so the
  // deck deals as it always has.
  const pool =
    config.quest || config.limit === null
      ? []
      : packs
          .filter((p) => config.packIds.includes(p.id))
          .flatMap((p) => p.lastCall ?? [])
          .filter((id) => catalog.some((c) => c.id === id && c.lastCall));
  if (pool.length && cards.length + 1 >= config.limit!) {
    const id = pool[Math.floor(random() * pool.length)];
    cards.push(structuredClone(catalog.find((c) => c.id === id)!));
    order = placeLastCall([...order, id], cards, config.limit);
  }
  return {
    version: 2,
    config: { ...config, packIds: [...config.packIds] },
    cards,
    order,
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
  // Rivals Phase 2: a Do-Over or an invoice waits for the table.
  if (awaitingRedo(s) || awaitingInvoice(s)) return s;
  return discard(s, random);
}
/** Finale cards are dealt between deck cards and take no deck position. */
export function currentCard(s: SessionState) {
  if (!s.quest?.due)
    return withPot(
      s,
      withSecret(
        s,
        s.cards.find((c) => c.id === s.order[s.position])!,
      ),
    );
  const card = finaleCard(s.quest, s.quest.finale[s.quest.step])!;
  // The dragon battle reads this round's move (or the enrage contest).
  const duel = s.quest.party?.duel;
  if (card.lairFight && duel)
    return withNames(s, withSecret(s, atRound(card, roundOf(duel))));
  // A boss with phases reads the beat its hits have reached. A card the
  // rival cuts in on wears their name (2026-11-15).
  return withRival(
    s.quest,
    withNames(
      s,
      withSecret(s, card.phases ? atBeat(card, bossBeat(s.quest, card)) : card),
    ),
  );
}
const potted = new WeakMap<CardDefinition, Map<string, CardDefinition>>();
/** Dealer's Choice (2026-11-24): a pot card wears what is on the line as
 * its ribbon: the pot before the roll, then banked, given or busted.
 * Memoised per card so the object is stable between reads. */
function withPot(s: SessionState, card: CardDefinition): CardDefinition {
  if (!card.pot || s.quest) return card;
  const pull = Math.min(s.press ?? 0, card.pot.length - 1);
  const pot = card.pot[pull];
  const roll = s.roll?.returned ? s.roll : null;
  const won = !!roll && !!card.dice && rollWins(card.dice, roll.values, roll);
  const ribbon = !roll
    ? pull
      ? `Riding on ${pot}`
      : `Pot: ${pot}`
    : !won
      ? `Bust: drink ${pot}`
      : pull + 1 < card.pot.length
        ? `Banked ${pot}`
        : `Jackpot: give ${pot}`;
  let byRibbon = potted.get(card);
  if (!byRibbon) potted.set(card, (byRibbon = new Map()));
  let out = byRibbon.get(ribbon);
  if (!out) byRibbon.set(ribbon, (out = { ...card, ribbon }));
  return out;
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
  // A pot ridden on is not part of a fresh deal.
  const { press: _press, ...rest } = s;
  s = rest;
  return {
    ...s,
    config: { ...s.config, packIds: [...s.config.packIds] },
    cards: s.cards.map((c) => structuredClone(c)),
    order: placeLastCall(
      paceQuest(
        dealOrder(
          s.cards.map((c) => c.id),
          s.cards,
          random,
        ),
        s.cards,
        s.quest,
        random,
      ),
      s.cards,
      s.config.limit,
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
