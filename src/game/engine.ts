import type {
  CardDefinition,
  DiceRoll,
  GameConfig,
  Loot,
  OmenEffect,
  PackDefinition,
  PackQuest,
  PartyState,
  QuestStage,
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
    const snapshot = (ids: string[]) =>
      ids.map((id) => {
        const card = catalog.find((c) => c.id === id);
        if (!card) throw new Error("A finale card is missing.");
        return structuredClone(card);
      });
    const stages = questRoute(rules, random).map(
      ({ label, pick, cardIds, elite }) => ({
        label,
        pick,
        cards: snapshot(cardIds),
        ...(elite?.length ? { elite: snapshot(elite) } : {}),
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
            party: newParty(rules.party.hearts, {
              quaff: rules.party.quaff,
              cup: rules.party.cup ? 0 : undefined,
            }),
          }
        : {}),
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
const newParty = (
  hearts: number,
  { quaff, cup }: { quaff?: number; cup?: number } = {},
): PartyState => ({
  hearts,
  max: hearts,
  loot: [],
  curse: null,
  hits: 0,
  rounds: 0,
  wiped: false,
  ...(quaff !== undefined ? { quaff } : {}),
  ...(cup !== undefined ? { cup } : {}),
});
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
    "oneOf" in slot ? slot.oneOf.flat() : [slot],
  );
}
/** One game's stages: each `oneOf` slot's route is picked at random. */
export function questRoute(
  rules: PackQuest,
  random: Random = Math.random,
): QuestStage[] {
  return rules.finale.flatMap((slot) =>
    "oneOf" in slot
      ? slot.oneOf[Math.floor(random() * slot.oneOf.length)]
      : [slot],
  );
}
/** Every card a quest's finale stages can deal, elites included. */
export function finaleCardIds(rules: PackQuest): string[] {
  return questStages(rules).flatMap((stage) => [
    ...stage.cardIds,
    ...(stage.elite ?? []),
  ]);
}
/** Draw each stage's cards at random, in stage order. A fork is never the
 * last room of its floor, so its loud door always has a room to swap. */
export function pickFinale(
  stages: QuestState["stages"],
  random: Random = Math.random,
): string[] {
  return stages.flatMap(({ pick, cards }) => {
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
    return { label: stage.label, size: stage.pick, cards, boss, omen, kind };
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
export const finaleCard = (quest: QuestState, id: string) =>
  quest.stages
    .flatMap((stage) => [...stage.cards, ...(stage.elite ?? [])])
    .find((c) => c.id === id);
/** A crawl boss. An ambush also has `hits`; cards saved before encounters
 * existed had hits only on bosses. */
export const isBossCard = (c: CardDefinition) =>
  c.encounter ? c.encounter === "boss" : !!c.hits;
/** The run's omen alone (the League's starter, Pub Crawl's adventurer),
 * once its card is put aside: its current form's effect when it has
 * evolved. */
export function formEffect(
  quest: QuestState | undefined,
): OmenEffect | undefined {
  const id = quest?.party?.omen;
  const card = id ? finaleCard(quest, id) : undefined;
  const form = quest?.party?.form ?? 0;
  return form ? card?.evolves?.[form - 1]?.omen : card?.omen;
}
/** The boons the party keeps (tonight's omen, trinkets), in the order they
 * came, with the card that brought each. */
export function partyBoons(quest: QuestState | undefined) {
  return (quest?.party?.boons ?? []).flatMap((key) => {
    const [id, pick] = key.split("#");
    const card = quest ? finaleCard(quest, id) : undefined;
    const boon = pick === undefined ? card?.boon : card?.spoils?.[Number(pick)];
    return card && boon ? [{ card, boon, key }] : [];
  });
}
const add = (a = 0, b = 0) => a + b || undefined;
/** Effects stacked: numbers add up, a natural widens to the widest, and a
 * boon's `satchel` moves the size by its difference from three. The
 * starting items are not carried (each arrived once, when it was gained). */
export function stackEffects(
  base: OmenEffect,
  boons: OmenEffect[],
): OmenEffect {
  if (!boons.length) return base;
  const out: OmenEffect = { ...base };
  const bump = <K extends string>(
    into: Partial<Record<K, number>> | undefined,
    from: Partial<Record<K, number>> | undefined,
  ) => {
    const next: Partial<Record<K, number>> = { ...into };
    for (const [kind, n] of Object.entries(from ?? {}) as [K, number][])
      next[kind] = (next[kind] ?? 0) + n;
    return Object.keys(next).length ? next : undefined;
  };
  let satchel = base.satchel ?? 3;
  for (const b of boons) {
    out.hearts = add(out.hearts, b.hearts);
    out.heal = add(out.heal, b.heal);
    out.bossHits = add(out.bossHits, b.bossHits);
    out.hurt = bump(out.hurt, b.hurt);
    out.roll = bump(out.roll, b.roll);
    if (b.crit !== undefined) out.crit = Math.min(out.crit ?? 20, b.crit);
    if (b.fumble !== undefined)
      out.fumble = Math.max(out.fumble ?? 1, b.fumble);
    if (b.reroll20) out.reroll20 = true;
    out.restock ??= b.restock;
    satchel += (b.satchel ?? 3) - 3;
  }
  out.satchel = Math.max(1, satchel);
  for (const key of Object.keys(out) as (keyof OmenEffect)[])
    if (out[key] === undefined) delete out[key];
  return out;
}
/** Everything that holds for the run: the omen's current form and every
 * boon kept, stacked. */
export function omenEffect(
  quest: QuestState | undefined,
): OmenEffect | undefined {
  const form = formEffect(quest);
  const boons = partyBoons(quest).map((b) => b.boon.effect);
  if (!boons.length) return form;
  return stackEffects(form ?? {}, boons);
}
/** Tonight's omen as it stands: its card, the current form's name and
 * rules, and the forms still to come. */
export function omenForm(quest: QuestState | undefined) {
  const id = quest?.party?.omen;
  const card = id ? finaleCard(quest, id) : undefined;
  if (!card) return undefined;
  const form = quest?.party?.form ?? 0;
  const forms = card.evolves ?? [];
  const now = form ? forms[form - 1] : undefined;
  // A branching starter evolves once, into the form the table picks.
  const branching = !!card.branches;
  const canEvolve = branching
    ? form === 0 && forms.length > 0
    : form < forms.length;
  return {
    card,
    form,
    title: now?.title ?? card.title,
    rules: now?.rules ?? card.rules,
    line: branching
      ? [card.title, now ? now.title : forms.map((e) => e.title).join(" / ")]
      : [card.title, ...forms.map((e) => e.title)],
    canEvolve,
    /** The forms the table picks from, while a branching starter can
     * still evolve. */
    branches: branching && canEvolve ? forms.map((e) => e.title) : null,
    /** How many later forms the card has. */
    forms: forms.length,
    /** The dice colours of the form it is now. */
    palette: now ? (now.palette ?? card.palette) : card.palette,
    /** The form an evolution brings next, while one evolves in a line. */
    next: !branching && canEvolve ? forms[form].title : null,
    /** The effect of the form before this one (for what an evolution
     * changed); the card's own for its first form. */
    before: form > 1 && !branching ? forms[form - 2].omen : card.omen,
  };
}
/** The starter's next form: its effect replaces the current one. The change
 * in hearts moves the maximum and the hearts left (never below one), the new
 * form's items join the satchel, and a smaller satchel drops its newest. */
function evolve(party: PartyState, quest: QuestState, branch = 0): PartyState {
  const now = omenForm(quest);
  if (!now?.canEvolve) return party;
  const target = now.branches ? branch : now.form;
  const before = formEffect(quest) ?? {};
  const after = now.card.evolves![target].omen;
  const delta = (after.hearts ?? 0) - (before.hearts ?? 0);
  const max = Math.max(1, party.max + delta);
  const next = { ...party, max, form: target + 1 };
  // The satchel follows the new form, with every boon still on it.
  const size = satchelSize({ ...quest, party: next });
  return {
    ...next,
    hearts: Math.min(max, Math.max(1, party.hearts + delta)),
    loot: [...party.loot, ...(after.loot ?? [])].slice(0, size),
  };
}
/** How many items the satchel holds. */
export const satchelSize = (quest: QuestState | undefined) =>
  omenEffect(quest)?.satchel ?? 3;
/** Swings a boss or an ambush needs; 0 for any other card. */
export function hitsNeeded(
  quest: QuestState | undefined,
  card: CardDefinition,
): number {
  if (!card.hits) return 0;
  return (
    card.hits + (isBossCard(card) ? (omenEffect(quest)?.bossHits ?? 0) : 0)
  );
}
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
/** A crawl fight just won whose spoils wait to be picked: an elite's win,
 * or a boss's felling swing. Picking one puts the card aside. */
export function awaitingSpoils(s: SessionState): boolean {
  const party = s.quest?.party;
  if (!party || !s.quest?.due || s.phase !== "revealed") return false;
  const card = currentCard(s);
  if (!card.spoils?.length || !card.dice || !s.roll?.returned) return false;
  if (!rollWins(card.dice, s.roll.values, s.roll)) return false;
  const need = hitsNeeded(s.quest, card);
  const swing = natural(card, s.roll) === 20 ? 2 : 1;
  return !need || party.hits + swing >= need;
}
/** Each pull on a push-your-luck card rolls this much lower. */
export const PRESS_STEP = 2;
/** A push-your-luck roll just won with prizes still to win: the table
 * cashes out or goes again. */
export function awaitingPress(s: SessionState): boolean {
  const party = s.quest?.party;
  if (!party || !s.quest?.due || s.phase !== "revealed") return false;
  const card = currentCard(s);
  if (!card.press || !card.dice || !s.roll?.returned) return false;
  return (
    rollWins(card.dice, s.roll.values, s.roll) &&
    (party.press ?? 0) + 1 < card.press.prizes.length
  );
}
/** Bank the pull just won and roll again, harder. */
export function pressOn(s: SessionState): SessionState {
  if (!awaitingPress(s)) return s;
  const party = s.quest!.party!;
  return {
    ...s,
    roll: null,
    quest: {
      ...s.quest!,
      party: { ...party, press: (party.press ?? 0) + 1 },
    },
  };
}
/** Stop pushing: take every prize won and put the card aside. */
export function cashOut(
  s: SessionState,
  random: Random = Math.random,
): SessionState {
  return awaitingPress(s) ? discard(s, random) : s;
}
/** Take spoil `index` of the fight just won, and put the card aside. */
export function takeSpoils(
  s: SessionState,
  index: number,
  random: Random = Math.random,
): SessionState {
  const card = currentCard(s);
  if (
    !awaitingSpoils(s) ||
    !Number.isSafeInteger(index) ||
    index < 0 ||
    index >= card.spoils!.length
  )
    return s;
  return discard(s, random, undefined, index);
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
  if (awaitingOffer(s)) return s;
  if (awaitingSpoils(s)) return s;
  if (awaitingPress(s)) return s;
  return discard(s, random);
}
/** A revealed merchant or fork in a crawl: one of its offers puts it aside. */
export function awaitingOffer(s: SessionState) {
  return (
    !!s.quest?.party &&
    s.phase === "revealed" &&
    !!currentCard(s).offers?.length
  );
}
/** Whether offer `index` can be taken now: a price in hearts is never paid
 * with the last heart. */
export function canTakeOffer(s: SessionState, index: number): boolean {
  if (!awaitingOffer(s)) return false;
  const offer = currentCard(s).offers![index];
  return (
    !!offer &&
    (!offer.cost || s.quest!.party!.hearts > offer.cost) &&
    (!offer.evolve || !!omenForm(s.quest)?.canEvolve)
  );
}
/** Take a merchant's ware or a fork's door, and put the card aside. An
 * evolution of a branching starter takes `branch`, the form picked. */
export function takeOffer(
  s: SessionState,
  index: number,
  random: Random = Math.random,
  branch = 0,
): SessionState {
  if (!canTakeOffer(s, index)) return s;
  const q = s.quest!;
  const offer = currentCard(s).offers![index];
  const branches = omenForm(q)?.branches;
  if (
    offer.evolve &&
    branches &&
    !(Number.isSafeInteger(branch) && branch >= 0 && branch < branches.length)
  )
    return s;
  let party = { ...q.party! };
  if (offer.cost) party.hearts -= offer.cost;
  if (offer.evolve) party = evolve(party, q, branch);
  // Healing and the satchel follow the form the starter is now.
  const now = { ...q, party };
  if (offer.heal)
    party.hearts = Math.min(
      party.max,
      party.hearts + offer.heal + (omenEffect(now)?.heal ?? 0),
    );
  if (offer.loot && party.loot.length < satchelSize(now))
    party.loot = [...party.loot, offer.loot];
  let finale = q.finale;
  // The loud door: the next room on this floor becomes one of its elites.
  if (offer.elite) {
    const { stage, index: room, size } = finaleStage(q);
    const taken = new Set(finale);
    const fresh = (q.stages[stage].elite ?? []).filter((c) => !taken.has(c.id));
    if (room + 1 < size && fresh.length) {
      finale = [...finale];
      finale[q.step + 1] = fresh[Math.floor(random() * fresh.length)].id;
    }
  }
  return discard({ ...s, quest: { ...q, finale, party } }, random);
}
/** Take the no-roll option of a choice card: it is put aside unrolled (a
 * battle walked away from is neither won nor lost). */
export function skipRoll(
  s: SessionState,
  random: Random = Math.random,
): SessionState {
  return awaitingChoice(s) ? discard(s, random, "fled") : s;
}
/** Put a battle without dice aside, won or lost. */
export function settleBattle(
  s: SessionState,
  won: boolean,
  random: Random = Math.random,
): SessionState {
  return awaitingVerdict(s) ? discard(s, random, won ? "won" : "lost") : s;
}
type Outcome = "won" | "lost" | "fled";
/** A crawl's standing rule (owner, 2026-10-17): a single d20 that lands on
 * 20 doubles what a won fight brings (its heal and its item, and a boss
 * takes two swings), and one that lands on 1 doubles the hearts a lost fight
 * costs. The cards' own text doubles the drinks (`content/naturals.ts`). */
export function natural(
  card: CardDefinition,
  roll: DiceRoll | null,
): 20 | 1 | null {
  if (card.dice?.count !== 1 || card.dice.sides !== 20 || !roll) return null;
  // A roll made under an omen carries its own natural (a widened range);
  // older rolls read the face.
  if (roll.bonus !== undefined) return roll.natural ?? null;
  return roll.values[0] === 20 ? 20 : roll.values[0] === 1 ? 1 : null;
}
/** A lost fight's roll is on the card. */
const lostRoll = (s: SessionState, card: CardDefinition) =>
  s.phase === "revealed" &&
  !!card.battle &&
  !!card.dice &&
  !!s.roll?.returned &&
  !rollWins(card.dice, s.roll.values, s.roll);
/** Whether the party can use the satchel's item `item` now. */
export function canUseLoot(s: SessionState, item: Loot): boolean {
  const party = s.quest?.party;
  if (!party || s.phase === "complete" || party.curse === "hex") return false;
  if (!party.loot.includes(item)) return false;
  const card = currentCard(s);
  switch (item) {
    case "draught":
      return party.hearts < party.max;
    case "die":
      // A lost fight's result is on the card: roll it again.
      return lostRoll(s, card);
    case "round":
      // Its drinks go to someone else, once.
      return lostRoll(s, card) && party.passed !== s.discarded;
    case "smoke":
      // Slip past a room fight before it starts; a boss blocks the stairs,
      // and a push already under way is seen through.
      return (
        s.phase === "revealed" &&
        !!card.battle &&
        !card.hits &&
        !s.roll &&
        !card.dice?.choice &&
        !party.press
      );
    case "shield":
    case "revive":
      return false; // Each works on its own, when it is needed.
    case "candy": {
      const form = omenForm(s.quest);
      return !!form?.canEvolve && !form.branches;
    }
  }
}
/** Use one of the satchel's items. Returns the session unchanged when the
 * item cannot be used now. */
export function spendLoot(
  s: SessionState,
  item: Loot,
  random: Random = Math.random,
): SessionState {
  if (!canUseLoot(s, item)) return s;
  const party = s.quest!.party!;
  const loot = [...party.loot];
  loot.splice(loot.indexOf(item), 1);
  const used = { ...s, quest: { ...s.quest!, party: { ...party, loot } } };
  switch (item) {
    case "draught":
      used.quest.party.hearts += 1;
      return used;
    case "die":
      return { ...used, roll: null };
    case "smoke":
      return discard(used, random, "fled");
    case "candy":
      return {
        ...used,
        quest: { ...used.quest, party: evolve(used.quest.party!, used.quest) },
      };
    case "round":
      return {
        ...used,
        quest: {
          ...used.quest,
          party: { ...used.quest.party!, passed: s.discarded },
        },
      };
    default:
      return s;
  }
}
/** Whether the drawer can Quaff now: the crawl has one, it hasn't been
 * drunk since the last boss fell, and a lost fight's roll is on the card.
 * A hex seals the satchel, not the drawer's throat. */
export function canQuaff(s: SessionState): boolean {
  const party = s.quest?.party;
  const card = s.quest?.due ? currentCard(s) : undefined;
  return (
    !!party &&
    !!card &&
    party.quaff !== undefined &&
    !party.quaffed &&
    s.phase === "revealed" &&
    !!card.battle &&
    !!card.dice &&
    !!s.roll?.returned &&
    !rollWins(card.dice, s.roll.values, s.roll)
  );
}
/** Down the Quaff's drinks and roll the lost fight again. It comes back
 * when the next boss falls. */
export function quaff(s: SessionState): SessionState {
  if (!canQuaff(s)) return s;
  const party = s.quest!.party!;
  return {
    ...s,
    roll: null,
    quest: { ...s.quest!, party: { ...party, quaffed: true } },
  };
}
/** A boon joins the party: its hearts move the maximum and the hearts left
 * (never below one), its items go into the satchel, and a smaller satchel
 * drops its newest. */
function gainBoon(
  party: PartyState,
  card: CardDefinition,
  quest: QuestState,
  spoil?: number,
): PartyState {
  const boon = spoil === undefined ? card.boon : card.spoils?.[spoil];
  const key = spoil === undefined ? card.id : `${card.id}#${spoil}`;
  if (!boon || party.boons?.some((k) => k.split("#")[0] === card.id))
    return party;
  const { hearts = 0, loot = [] } = boon.effect;
  const max = Math.max(1, party.max + hearts);
  const next = { ...party, max, boons: [...(party.boons ?? []), key] };
  const size = satchelSize({ ...quest, party: next });
  return {
    ...next,
    hearts: Math.min(max, Math.max(1, party.hearts + hearts)),
    loot: [...party.loot, ...loot].slice(0, size),
  };
}
/** A heart loss: the shield takes it whole unless the satchel is hexed, and
 * bleeding costs one more. */
function hurt(party: PartyState, damage: number): PartyState {
  if (damage <= 0) return party;
  const shield = party.curse === "hex" ? -1 : party.loot.indexOf("shield");
  if (shield >= 0)
    return { ...party, loot: party.loot.filter((_, i) => i !== shield) };
  const loss = damage + (party.curse === "bleed" ? 1 : 0);
  return { ...party, hearts: Math.max(0, party.hearts - loss) };
}
/** What a card brings: its reward (a battle's only on a win) and its curse
 * (a battle's only on a loss), bent by tonight's omen. The omen card itself
 * sets the omen and its hearts and items. */
function settleParty(
  party: PartyState,
  card: CardDefinition,
  outcome: Outcome | null,
  quest: QuestState,
  nat: 20 | 1 | null = null,
  spoil?: number,
): PartyState {
  const omen = omenEffect(quest);
  const size = satchelSize(quest);
  let next = party;
  if (outcome === "lost" && card.damage)
    next = hurt(
      next,
      (card.damage +
        (card.encounter ? (omen?.hurt?.[card.encounter] ?? 0) : 0)) *
        (nat === 1 ? 2 : 1),
    );
  if (outcome === null || outcome === "won") {
    const { loot, heal } = card.reward ?? {};
    const times = outcome === "won" && nat === 20 ? 2 : 1;
    for (let i = 0; i < times; i++)
      if (loot && next.loot.length < size)
        next = { ...next, loot: [...next.loot, loot] };
    if (heal)
      next = {
        ...next,
        hearts: Math.min(
          next.max,
          next.hearts + (heal + (omen?.heal ?? 0)) * times,
        ),
      };
  }
  if (card.omen && outcome === null) {
    const { hearts = 0, loot = [], satchel = 3 } = card.omen;
    const max = Math.max(1, next.max + hearts);
    next = {
      ...next,
      max,
      hearts: Math.min(max, Math.max(1, next.hearts + hearts)),
      loot: [...next.loot, ...loot].slice(0, satchel),
      omen: card.id,
    };
  }
  if (card.curse && (outcome === null || outcome === "lost"))
    next = { ...next, curse: card.curse };
  if (card.jinx && (outcome === null || outcome === "lost"))
    next = { ...next, jinx: card.id };
  // Every lost fight pours a splash into the Cup.
  if (outcome === "lost" && next.cup !== undefined)
    next = { ...next, cup: next.cup + 1 };
  // Push your luck: a win takes every prize banked and this one; a loss
  // forfeits them. The count clears either way.
  if (card.press && outcome !== null) {
    if (outcome === "won") {
      const won = card.press.prizes.slice(0, (next.press ?? 0) + 1);
      next = {
        ...next,
        loot: [...next.loot, ...won].slice(0, satchelSize(quest)),
      };
    }
    next = { ...next };
    delete next.press;
  }
  // A boss's or an ambush's boon comes when it falls (`discard`).
  if (!card.hits && (outcome === null || outcome === "won"))
    next = gainBoon(next, card, quest, spoil);
  return next;
}
function discard(
  s: SessionState,
  random: Random,
  verdict?: Outcome,
  spoil?: number,
): SessionState {
  const history = { previousRoll: s.roll, roll: null };
  const card = currentCard(s);
  const discarded = s.discarded + 1,
    previousId = card.id;
  // In a quest only a won battle counts.
  const outcome: Outcome | null =
    !s.quest || !card.battle
      ? null
      : (verdict ??
        (card.dice && s.roll && rollWins(card.dice, s.roll.values, s.roll)
          ? "won"
          : "lost"));
  const lost = outcome === "lost";
  const lostCount = (s.quest?.lost ?? 0) + 1;
  const party = s.quest?.party;
  if (s.quest?.due && party) {
    const q = s.quest;
    const nat = natural(card, s.roll);
    let next = settleParty(party, card, outcome, q, nat, spoil);
    // A Revive in the satchel saves the run once: back at half the maximum.
    const revive = next.curse === "hex" ? -1 : next.loot.indexOf("revive");
    if (next.hearts === 0 && revive >= 0)
      next = {
        ...next,
        hearts: Math.ceil(next.max / 2),
        loot: next.loot.filter((_, i) => i !== revive),
      };
    // The hearts ran out: the party wipes and the game ends on this card.
    if (next.hearts === 0)
      return {
        ...s,
        previousRoll: s.roll,
        phase: "complete",
        discarded,
        previousId,
        quest: { ...q, party: { ...next, wiped: true } },
      };
    // A boss (or an ambush) is dealt again, to the next drawer, until it
    // falls.
    const need = hitsNeeded(q, card);
    if (need && outcome !== "fled") {
      const hits = Math.min(
        need,
        next.hits + (outcome === "won" ? (nat === 20 ? 2 : 1) : 0),
      );
      if (hits < need)
        return {
          ...s,
          ...history,
          discarded,
          previousId,
          phase: "hidden",
          quest: {
            ...q,
            ...(lost ? { lost: lostCount } : {}),
            party: {
              ...next,
              hits,
              rounds: next.rounds + (outcome === "won" ? 1 : 0),
            },
          },
        };
      // The floor's boss falls: its curse and the jinx lift with it, and
      // the Quaff comes back.
      next = { ...next, hits: 0 };
      if (isBossCard(card)) {
        next = { ...next, curse: null };
        delete next.jinx;
        delete next.quaffed;
      }
      next = gainBoon(next, card, q, spoil);
      // A badge restocks the starter's item, room permitting; in a crawl
      // without badges (Pub Crawl), any boss does.
      const restock = omenEffect(q)?.restock;
      const badges = q.stages.some((st) =>
        st.cards.some((c) => c.quest === q.packId),
      );
      if (
        restock &&
        (badges ? card.quest === q.packId : isBossCard(card)) &&
        next.loot.length < satchelSize({ ...q, party: next })
      )
        next = { ...next, loot: [...next.loot, restock] };
    }
    s = { ...s, quest: { ...q, party: next } };
  }
  // A lost finale card is replaced by another from its stage, dealt next,
  // until one is beaten: the Champion must fall before the game ends.
  if (s.quest?.due && lost && !party) {
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
            due: s.quest.goal === 0,
            step: 0,
            lost: 0,
            ...(s.quest.party
              ? {
                  party: newParty(
                    s.quest.party.max - (omenEffect(s.quest)?.hearts ?? 0),
                    {
                      quaff: s.quest.party.quaff,
                      cup: s.quest.party.cup === undefined ? undefined : 0,
                    },
                  ),
                }
              : {}),
          },
        }
      : {}),
  };
}
