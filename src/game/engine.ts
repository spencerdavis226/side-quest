import type {
  CardDefinition,
  GameConfig,
  PackDefinition,
  PackQuest,
  QuestState,
  SessionState,
} from "./types";
import { rollWins } from "./dice";
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
/** The rest of a run, re-paced so the badges still missing keep the run's
 * pace from `from` (the next draw) on. */
function repace(
  order: string[],
  s: SessionState,
  quest: QuestState,
  from: number,
  random: Random,
) {
  const need = quest.goal - quest.count;
  const pace = (quest.length - 1) / quest.goal;
  return paceQuest(
    order,
    s.cards,
    quest,
    random,
    from,
    need,
    Math.ceil(pace * need),
  );
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
        c.limit === null))
  );
}
export function createSession(
  config: GameConfig,
  catalog: CardDefinition[],
  packs: PackDefinition[],
  random: Random = Math.random,
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
    const stages = rules.finale.map(({ label, pick, cardIds }) => {
      const pool = cardIds.map((id) => catalog.find((c) => c.id === id));
      if (pool.some((c) => !c)) throw new Error("A finale card is missing.");
      return {
        label,
        pick,
        cards: (pool as CardDefinition[]).map((c) => structuredClone(c)),
      };
    });
    const { label, goal, length } = rules;
    quest = {
      packId: config.quest,
      label,
      goal,
      length,
      count: 0,
      due: false,
      stages,
      finale: pickFinale(stages, random),
      step: 0,
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
/** Every card a pack can deal: its deck, its quest-only cards and its
 * quest's finale. */
export function packCardIds(pack: PackDefinition): string[] {
  return [
    ...pack.cardIds,
    ...(pack.quest
      ? [...pack.quest.cardIds, ...finaleCardIds(pack.quest)]
      : []),
  ];
}
/** Every card a quest's finale stages can deal. */
export function finaleCardIds(rules: PackQuest): string[] {
  return rules.finale.flatMap((stage) => stage.cardIds);
}
/** Draw each stage's cards at random, in stage order. */
export function pickFinale(
  stages: QuestState["stages"],
  random: Random = Math.random,
): string[] {
  return stages.flatMap(({ pick, cards }) =>
    shuffle(
      cards.map((c) => c.id),
      random,
    ).slice(0, pick),
  );
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
  const won = q.due && s.phase === "complete";
  const beaten = won ? q.finale.length : q.due ? q.step : 0;
  let first = 0;
  const stages = q.stages.map((stage) => {
    const cards = q.finale
      .slice(first, Math.min(first + stage.pick, beaten))
      .map((id) => finaleCard(q, id)!);
    first += stage.pick;
    return { label: stage.label, size: stage.pick, cards };
  });
  return { label: q.label, goal: q.goal, count: q.count, earned, stages, won };
}
const finaleCard = (quest: QuestState, id: string) =>
  quest.stages.flatMap((stage) => stage.cards).find((c) => c.id === id);
/** Finale cards are dealt between deck cards and take no deck position. */
export function currentCard(s: SessionState) {
  return s.quest?.due
    ? finaleCard(s.quest, s.quest.finale[s.quest.step])!
    : s.cards.find((c) => c.id === s.order[s.position])!;
}
/** A deck card or a finale card, for history such as the previous card. */
export function findCard(s: SessionState, id: string | null) {
  return (
    s.cards.find((c) => c.id === id) ??
    (s.quest && id !== null ? finaleCard(s.quest, id) : undefined)
  );
}
/** A revealed choice card whose option has not been picked yet. */
export function awaitingChoice(s: SessionState) {
  return s.phase === "revealed" && !s.roll && !!currentCard(s).dice?.choice;
}
/** A revealed quest battle without dice: the table says whether it won. */
export function awaitingVerdict(s: SessionState) {
  const card = currentCard(s);
  return !!s.quest && s.phase === "revealed" && !!card.battle && !card.dice;
}
export function advance(
  s: SessionState,
  random: Random = Math.random,
): SessionState {
  if (s.phase === "complete") return s;
  if (s.phase === "hidden") return { ...s, phase: "revealed" };
  if (currentCard(s).dice && !s.roll?.returned) return s;
  if (awaitingVerdict(s)) return s;
  return discard(s, random);
}
/** Take the no-roll option of a choice card: it is put aside unrolled. */
export function skipRoll(
  s: SessionState,
  random: Random = Math.random,
): SessionState {
  return awaitingChoice(s) ? discard(s, random) : s;
}
/** Put a battle without dice aside, won or lost. */
export function settleBattle(
  s: SessionState,
  won: boolean,
  random: Random = Math.random,
): SessionState {
  return awaitingVerdict(s) ? discard(s, random, won) : s;
}
function discard(
  s: SessionState,
  random: Random,
  verdict?: boolean,
): SessionState {
  const history = { previousRoll: s.roll, roll: null };
  const card = currentCard(s);
  const discarded = s.discarded + 1,
    previousId = card.id;
  // Hardcore: in a quest only a won battle counts.
  const lost =
    !!s.quest &&
    !!card.battle &&
    !(card.dice ? !!s.roll && rollWins(card.dice, s.roll.values) : verdict);
  const lostCount = (s.quest?.lost ?? 0) + 1;
  // A lost finale card is replaced by another from its stage, dealt next,
  // until one is beaten: the Champion must fall before the game ends.
  if (s.quest?.due && lost) {
    const q = s.quest;
    const { stage } = finaleStage(q);
    const pool = q.stages[stage].cards.map((c) => c.id);
    const taken = new Set(q.finale);
    const fresh = pool.filter((id) => !taken.has(id));
    const others = pool.filter((id) => id !== card.id && !taken.has(id));
    const choices = fresh.length ? fresh : others.length ? others : [card.id];
    const finale = [...q.finale];
    finale[q.step] = choices[Math.floor(random() * choices.length)];
    return {
      ...s,
      ...history,
      discarded,
      previousId,
      phase: "hidden",
      quest: { ...q, finale, lost: lostCount },
    };
  }
  const lastFinale =
    !!s.quest?.due && s.quest.step === s.quest.finale.length - 1;
  // A quest mode ends when its last finale card is put aside; a finite game
  // at its limit.
  if (lastFinale || (s.config.limit !== null && discarded === s.config.limit))
    return {
      ...s,
      previousRoll: s.roll,
      phase: "complete",
      discarded,
      previousId,
    };
  // The next finale card is dealt; the deck waits where it is.
  if (s.quest?.due)
    return {
      ...s,
      ...history,
      discarded,
      previousId,
      phase: "hidden",
      quest: { ...s.quest, step: s.quest.step + 1 },
    };
  // A lost gym leader goes back into the rest of the deck, at least one card
  // away; the next card slides into its place, so the deck does not move.
  if (s.quest && lost && s.position + 1 < s.order.length) {
    const quest = { ...s.quest, lost: lostCount };
    const rest = s.order.filter((_, i) => i !== s.position);
    const at =
      s.position + 1 + Math.floor(random() * (rest.length - s.position));
    rest.splice(at, 0, card.id);
    return {
      ...s,
      ...history,
      discarded,
      previousId,
      phase: "hidden",
      order: repace(rest, s, quest, s.position + 1, random),
      quest,
    };
  }
  if (s.quest && card.quest === s.quest.packId && !lost) {
    const count = s.quest.count + 1;
    s = { ...s, quest: { ...s.quest, count, due: count >= s.quest.goal } };
  }
  if (s.position + 1 === s.order.length) {
    // A lost leader on the deck's last card is shuffled back in with it.
    const order = shuffle(s.order, random, previousId);
    return {
      ...s,
      ...history,
      discarded,
      previousId,
      phase: "hidden",
      cycle: s.cycle + 1,
      position: 0,
      order:
        s.quest && !s.quest.due ? repace(order, s, s.quest, 0, random) : order,
    };
  }
  return {
    ...s,
    ...history,
    discarded,
    previousId,
    phase: "hidden",
    position: s.position + 1,
  };
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
            ...s.quest,
            stages: structuredClone(s.quest.stages),
            finale: pickFinale(s.quest.stages, random),
            count: 0,
            due: false,
            step: 0,
            lost: 0,
          },
        }
      : {}),
  };
}
