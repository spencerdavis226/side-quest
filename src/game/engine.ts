import type {
  Boon,
  CardDefinition,
  DiceRoll,
  Edge,
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
import { matchup, type Matchup } from "./matchup";
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
      ...(rules.party ? { party: newParty(rules.party.hearts) } : {}),
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
const newParty = (hearts: number): PartyState => ({
  hearts,
  max: hearts,
  loot: [],
  hits: 0,
  rounds: 0,
  wiped: false,
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
    // A fight dealt again until it falls (a boss, closing time's rival):
    // a trophy on Pub Crawl's end screen (2026-10-25).
    const trophy = stage.pick === 1 && stage.cards.some((c) => !!c.hits);
    return {
      label: stage.label,
      size: stage.pick,
      cards,
      boss,
      omen,
      kind,
      trophy,
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
    const boon =
      pick === undefined
        ? card?.boon
        : pick === "k"
          ? card?.kit
          : card?.spoils?.[Number(pick)];
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
/** The beat of a boss fight a card is on (`phases`): the hits landed walk
 * through the phases in order, and the felling swing plays the last. 0 for
 * a card without phases, or outside a crawl. */
export function bossBeat(quest: QuestState | undefined, card: CardDefinition) {
  const beats = 1 + (card.phases?.length ?? 0);
  const party = quest?.party;
  if (beats === 1 || !party) return 0;
  const need = hitsNeeded(quest, card);
  if (party.hits >= need - 1) return beats - 1;
  return Math.min(party.hits, beats - 2);
}
/** A card as it reads on beat `beat`: a later phase's rules and dice (none
 * means Won/Lost plaques) in place of the card's own. */
export function atBeat(card: CardDefinition, beat: number): CardDefinition {
  const phase = beat > 0 ? card.phases?.[beat - 1] : undefined;
  if (!phase) return card;
  const { dice: _dice, ...rest } = card;
  return {
    ...rest,
    rules: phase.rules,
    ...(phase.dice ? { dice: phase.dice } : {}),
  };
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
    /** The forms the table picks from, while a branching starter can still
     * evolve. */
    branches: branching && canEvolve ? forms.map((e) => e.title) : null,
    /** How many later forms the card has. */
    forms: forms.length,
    /** The League type of the form it is now (none before 2026-10-25). */
    type: now?.type ?? card.type,
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
/** The starter's type as it stands (an Eevee's form changes it). Games
 * saved before types (2026-10-25) have none. */
export function partyType(quest: QuestState | undefined) {
  const id = quest?.party?.omen;
  const card = id ? finaleCard(quest, id) : undefined;
  const form = quest?.party?.form ?? 0;
  return (form ? card?.evolves?.[form - 1]?.type : undefined) ?? card?.type;
}
/** A League fight's type matchup against the starter, once the starter has
 * a type: a dice battle (rolled with the edge) or a strike (settled by it).
 * A battle settled with Won and Lost has nothing for a type to bend. */
export function cardMatchup(
  quest: QuestState | undefined,
  card: CardDefinition,
): Matchup | null {
  const mine = partyType(quest);
  if (!quest?.party || !(card.dice ? card.battle : card.strike)) return null;
  if (!card.type || !mine) return null;
  return matchup(mine, card.type);
}

/** Pokémon League (2026-10-25): the Pokémon the table has caught, held in
 * the bag (2026-10-26) until one is used on a battle it beats. */
export const TEAM_SIZE = 2;
/** The caught Pokémon in the bag, as cards, oldest first. */
export function partyTeam(quest: QuestState | undefined) {
  return (quest?.party?.team ?? []).flatMap((id) => {
    const card = quest ? finaleCard(quest, id) : undefined;
    return card?.type ? [card] : [];
  });
}
/** A wild Pokémon just beaten that the table can catch: a won roll on the
 * card, or a strike the matchup wins, and not one already on the team. */
export function awaitingCatch(s: SessionState): boolean {
  const party = s.quest?.party;
  if (!party || !s.quest?.due || s.phase !== "revealed") return false;
  const card = currentCard(s);
  if (
    !card.catchable ||
    !card.type ||
    party.team?.includes(card.id) ||
    party.throw
  )
    return false;
  if (card.strike) return strikeOutcome(s.quest, card) === "won";
  return (
    !!card.dice &&
    !!s.roll?.returned &&
    rollWins(card.dice, s.roll.values, s.roll)
  );
}
/** The teammate a catch would let go to make room, if the team is full. */
export function catchReplaces(quest: QuestState | undefined) {
  const team = quest?.party?.team ?? [];
  return team.length >= TEAM_SIZE ? partyTeam(quest)[0] : undefined;
}
const joinTeam = (party: PartyState, id: string): PartyState => ({
  ...party,
  team: [...(party.team ?? []).filter((m) => m !== id), id].slice(-TEAM_SIZE),
});
/** Catch the wild Pokémon just beaten (a drink, spoken), and put it aside;
 * a full team lets its oldest go. */
export function catchIt(
  s: SessionState,
  random: Random = Math.random,
): SessionState {
  if (!awaitingCatch(s) || currentCard(s).catchRate) return s;
  const q = s.quest!;
  const party = joinTeam(q.party!, currentCard(s).id);
  return discard({ ...s, quest: { ...q, party } }, random);
}
/** Whether a d20 `face` catches a Pokémon that needs `need` (2026-10-27):
 * a natural 20 always does and a natural 1 never. */
export const caughtBy = (face: number, need: number) =>
  face === 20 || (face !== 1 && face >= need);
/** The ball thrown at the Pokémon face up, once it is thrown: the face, the
 * number it needed, and the line that was read. */
export function thrownBall(s: SessionState) {
  const thrown = s.quest?.party?.throw;
  if (!thrown || s.phase === "complete") return null;
  const card = currentCard(s);
  if (card.id !== thrown.id || !card.catchRate || !card.catchLines) return null;
  const caught = caughtBy(thrown.face, card.catchRate);
  return {
    face: thrown.face,
    need: card.catchRate,
    caught,
    line: caught ? card.catchLines.caught : card.catchLines.fled,
  };
}
/** Throw the ball at the Pokémon face up (2026-10-27): a d20 is committed
 * and kept with the party until the card is put aside. */
function throwAt(s: SessionState, random: Random): SessionState {
  const q = s.quest!;
  const n = random();
  if (!Number.isFinite(n) || n < 0 || n >= 1)
    throw Error("Invalid throw randomness");
  const face = 1 + Math.floor(n * 20);
  return {
    ...s,
    quest: {
      ...q,
      party: { ...q.party!, throw: { id: currentCard(s).id, face } },
    },
  };
}
/** Throw a ball at a beaten wild Pokémon that has a throw. */
export function throwBall(
  s: SessionState,
  random: Random = Math.random,
): SessionState {
  return awaitingCatch(s) && currentCard(s).catchRate ? throwAt(s, random) : s;
}
/** The thrown ball's result when the card is put aside: a caught Pokémon
 * joins the team (a catch card's heal with it), a fled one is gone. */
function settleThrow(s: SessionState): SessionState {
  const party = s.quest?.party;
  const thrown = party?.throw;
  if (!party || !thrown) return s;
  const result = thrownBall(s);
  let next: PartyState = { ...party };
  delete next.throw;
  if (result?.caught) {
    const card = currentCard(s);
    next = joinTeam(next, card.id);
    const heal = card.offers?.find((o) => o.catch)?.heal;
    if (heal)
      next.hearts = Math.min(
        next.max,
        next.hearts +
          Math.max(
            0,
            heal + (omenEffect({ ...s.quest!, party: next })?.heal ?? 0),
          ),
      );
  }
  return { ...s, quest: { ...s.quest!, party: next } };
}
/** Let the beaten Pokémon go: the card is put aside. */
export function letGo(
  s: SessionState,
  random: Random = Math.random,
): SessionState {
  return awaitingCatch(s) ? discard(s, random) : s;
}
/** What a caught Pokémon adds to a roll it is sent into (2026-10-31,
 * owner: "power groups"): the harder it was to catch, the more, from +1 (a
 * Caterpie, caught on a 5) to +4 (a Gyarados, on a 15). One caught before
 * catch numbers (2026-10-27) adds 1. */
export function assistBonus(member: CardDefinition | undefined): number {
  if (!member?.catchRate) return 1;
  const bonus = Math.max(1, Math.min(5, Math.round(member.catchRate / 4)));
  // Normal has no super-effective type, so it is sent into any fight that is
  // not a disadvantage (see `canSendIn`); one less in return, down to +1.
  return member.type === "normal" ? Math.max(1, bonus - 1) : bonus;
}
/** Whether caught Pokémon `id` can be sent into the battle face up: a
 * single-d20 battle not yet rolled, with its type super effective on the
 * foe's. A Normal Pokémon beats nothing, so it goes in on any matchup that
 * is not a disadvantage (2026-10-31, owner), for one less (`assistBonus`).
 * The starter's own type edge is separate and stacks. */
export function canSendIn(s: SessionState, id: string): boolean {
  const party = s.quest?.party;
  if (!party || !s.quest?.due || s.phase !== "revealed") return false;
  if (!party.team?.includes(id) || party.throw || party.assist) return false;
  const card = currentCard(s);
  const member = finaleCard(s.quest, id);
  if (!card.type || !member?.type || !card.battle) return false;
  if (card.dice?.count !== 1 || card.dice.sides !== 20) return false;
  if (s.roll || card.dice.choice || party.press) return false;
  const edge = matchup(member.type, card.type).edge;
  return member.type === "normal"
    ? edge !== "disadvantage"
    : edge === "advantage";
}
/** Send caught Pokémon `id` into the battle face up (2026-10-31, a
 * Nuzlocke): its bonus joins the roll (`party.assist`). It stays on the team
 * if the battle is won; lost, it faints for good (`party.fainted`). */
export function sendIn(
  s: SessionState,
  id: string,
  _random: Random = Math.random,
): SessionState {
  if (!canSendIn(s, id)) return s;
  const q = s.quest!;
  return { ...s, quest: { ...q, party: { ...q.party!, assist: id } } };
}
/** What the table can throw out of the bag: an item, or a caught Pokémon. */
export type BagDrop = { item: Loot } | { caught: string };
/** Throw an item out of the bag, or let a caught Pokémon go (2026-10-27,
 * owner: a manual discard, behind a second tap in the dialog). It works
 * any time the run is on; the card in play is untouched. */
export function dropFromBag(s: SessionState, drop: BagDrop): SessionState {
  const q = s.quest;
  const party = q?.party;
  if (!q || !party || party.wiped || s.phase === "complete") return s;
  if ("item" in drop) {
    const at = party.loot.indexOf(drop.item);
    if (at < 0) return s;
    const loot = party.loot.filter((_, i) => i !== at);
    return { ...s, quest: { ...q, party: { ...party, loot } } };
  }
  if (!party.team?.includes(drop.caught)) return s;
  const team = party.team.filter((m) => m !== drop.caught);
  const next: PartyState = { ...party, team };
  if (!team.length) delete next.team;
  return { ...s, quest: { ...q, party: next } };
}
/** The edge a League fight is fought with: its type matchup. */
export function cardEdge(
  quest: QuestState | undefined,
  card: CardDefinition,
): Edge | null {
  return cardMatchup(quest, card)?.edge ?? null;
}
/** What a strike comes to: the starter's edge wins it, a disadvantage loses
 * it, and an even matchup (or no type) is neither. */
export function strikeOutcome(
  quest: QuestState | undefined,
  card: CardDefinition,
): "won" | "lost" | null {
  if (!card.strike) return null;
  const edge = cardMatchup(quest, card)?.edge;
  return edge === "advantage" ? "won" : edge === "disadvantage" ? "lost" : null;
}
/** The line a strike reads for the current matchup. */
export function strikeText(
  quest: QuestState | undefined,
  card: CardDefinition,
): string | null {
  if (!card.strike) return null;
  const outcome = strikeOutcome(quest, card);
  return outcome === "won"
    ? card.strike.advantage
    : outcome === "lost"
      ? card.strike.disadvantage
      : card.strike.even;
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
  // A boss always takes at least one hit: a starter that takes a hit off
  // every boss (Marowak) speeds up the big ones, never skips a gym.
  return Math.max(
    1,
    card.hits + (isBossCard(card) ? (omenEffect(quest)?.bossHits ?? 0) : 0),
  );
}
/** Finale cards are dealt between deck cards and take no deck position. */
export function currentCard(s: SessionState) {
  if (!s.quest?.due)
    return withSecret(
      s,
      s.cards.find((c) => c.id === s.order[s.position])!,
    );
  const card = finaleCard(s.quest, s.quest.finale[s.quest.step])!;
  // A boss with phases reads the beat its hits have reached.
  return withSecret(
    s,
    card.phases ? atBeat(card, bossBeat(s.quest, card)) : card,
  );
}
/** A card with a `secretPool` holds one of them for the whole game: picked by
 * hashing the game's shuffle and the card's id, so it is stable across
 * reloads, differs between games, and needs nothing saved. */
function withSecret(s: SessionState, card: CardDefinition): CardDefinition {
  const pool = card.secretPool;
  if (!pool?.length) return card;
  const key = `${s.order.join(",")}|${s.quest?.finale.join(",") ?? ""}|${card.id}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++)
    h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return { ...card, secret: pool[(h >>> 0) % pool.length] };
}
/** The card put aside last, as it read then: a boss's beat (`party.beat`). */
export function previousCard(s: SessionState) {
  const card = findCard(s, s.previousId);
  const beat = s.quest?.party?.beat;
  return card?.phases && beat ? atBeat(card, beat) : card;
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
  return fells(s, natural(card, s.roll));
}
/** Whether a win on the card in play fells it: any win on a fight without
 * hits, or the swing that lands its last hit (a natural 20 or a doubled
 * win lands two). */
function fells(s: SessionState, nat: 20 | 1 | null): boolean {
  const card = currentCard(s);
  const need = hitsNeeded(s.quest, card);
  const swing = nat === 20 ? 2 : 1;
  return !need || s.quest!.party!.hits + swing >= need;
}
/** A crawl boss's felling swing face up: a won roll that lands its last
 * hit. Display only (the card's Felled stamp); nothing is saved. */
export function fellingSwing(s: SessionState): boolean {
  if (!s.quest?.party || !s.quest.due || s.phase !== "revealed") return false;
  const card = currentCard(s);
  if (!isBossCard(card) || !card.dice || !s.roll?.returned) return false;
  if (!rollWins(card.dice, s.roll.values, s.roll)) return false;
  return fells(s, natural(card, s.roll));
}
/** A boss's felling beat face up as Won and Lost plaques: a Won would
 * land its last hit. Display only (the stamp `Play.tsx` slams before the
 * win is settled, 2026-11-01); nothing is saved. */
export function fellingVerdict(s: SessionState): boolean {
  if (!s.quest?.party || !awaitingVerdict(s)) return false;
  return isBossCard(currentCard(s)) && fells(s, null);
}
/** A plaque fight face up whose win would bring its spoils (a boss's
 * felling beat, 2026-10-25): Won asks which trinket first. */
export function spoilsOnWin(s: SessionState): boolean {
  if (!s.quest?.party || !awaitingVerdict(s)) return false;
  return !!currentCard(s).spoils?.length && fells(s, null);
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
/** Keep the gear the party wears: a won fight's card goes aside and none
 * of its spoils are taken (2026-10-25). */
export function skipSpoils(
  s: SessionState,
  random: Random = Math.random,
): SessionState {
  return awaitingSpoils(s) ? discard(s, random) : s;
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
  if (awaitingCatch(s)) return s;
  return discard(s, random);
}
/** A revealed merchant or fork in a crawl: one of its offers puts it aside. */
export function awaitingOffer(s: SessionState) {
  return (
    !!s.quest?.party &&
    s.phase === "revealed" &&
    !s.quest.party.throw &&
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
  // A catch card with a throw (2026-10-27): the offer throws the ball, and
  // the card waits to be put aside with the result.
  if (offer.catch && currentCard(s).catchRate) return throwAt(s, random);
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
      // A worse heal (a joke class's) never turns a heal into harm.
      party.hearts + Math.max(0, offer.heal + (omenEffect(now)?.heal ?? 0)),
    );
  if (offer.loot && party.loot.length < satchelSize(now))
    party.loot = [...party.loot, offer.loot];
  // A catch card's Pokémon joins the team (2026-10-25).
  if (offer.catch) party = joinTeam(party, currentCard(s).id);
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
  /** A felling win's trinket (`spoilsOnWin`); none keeps the gear worn. */
  spoil?: number,
): SessionState {
  if (!awaitingVerdict(s)) return s;
  const pick =
    won &&
    spoil !== undefined &&
    spoilsOnWin(s) &&
    Number.isSafeInteger(spoil) &&
    spoil >= 0 &&
    spoil < currentCard(s).spoils!.length
      ? spoil
      : undefined;
  return discard(s, random, won ? "won" : "lost", pick);
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
/** What a draught (Potion) heals, and what it costs the drawer. */
export const DRAUGHT_HEAL = 2;
export const DRAUGHT_DRINKS = 4;
/** Whether the party can use the satchel's item `item` now. */
export function canUseLoot(s: SessionState, item: Loot): boolean {
  const party = s.quest?.party;
  if (!party || s.phase === "complete") return false;
  if (!party.loot.includes(item) || party.throw) return false;
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
      // A branching starter picks its form on an evolution card.
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
      // Drink 4, heal 2 (owner, 2026-10-25), never past the maximum.
      used.quest.party.hearts = Math.min(
        party.max,
        party.hearts + DRAUGHT_HEAL,
      );
      return used;
    case "die":
      return { ...used, roll: null };
    case "smoke":
      return discard(used, random, "fled");
    case "candy":
      return {
        ...used,
        quest: {
          ...used.quest,
          party: evolve(used.quest.party!, used.quest),
        },
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
/** A boon joins the party: its hearts move the maximum and the hearts left
 * (never below one), its items go into the satchel, and a smaller satchel
 * drops its newest. */
function gainBoon(
  party: PartyState,
  card: CardDefinition,
  quest: QuestState,
  spoil?: number | "kit",
): PartyState {
  const boon =
    spoil === undefined
      ? card.boon
      : spoil === "kit"
        ? card.kit
        : card.spoils?.[spoil];
  const key =
    spoil === undefined
      ? card.id
      : `${card.id}#${spoil === "kit" ? "k" : spoil}`;
  if (!boon || party.boons?.some((k) => k.split("#")[0] === card.id))
    return party;
  // Equipment (2026-10-25): the slot's old piece comes off first, and its
  // hearts go with it (the party keeps at least one).
  let base = party;
  for (const old of boon.slot ? replaces({ ...quest, party }, boon) : []) {
    const max = Math.max(1, base.max - (old.boon.effect.hearts ?? 0));
    base = {
      ...base,
      max,
      hearts: Math.min(max, base.hearts),
      boons: (base.boons ?? []).filter((k) => k !== old.key),
    };
  }
  const { hearts = 0, loot = [] } = boon.effect;
  const max = Math.max(1, base.max + hearts);
  // A trinket that only brings items puts them in the satchel and is not
  // worn.
  // Tonight's omen is kept even when it is only a table rule, so the party
  // dialog can show it.
  const next =
    isLasting(boon) || card.encounter === "omen"
      ? { ...base, max, boons: [...(base.boons ?? []), key] }
      : { ...base, max };
  const size = satchelSize({ ...quest, party: next });
  return {
    ...next,
    hearts: Math.min(max, Math.max(1, base.hearts + hearts)),
    loot: [...base.loot, ...loot].slice(0, size),
  };
}
/** A boon with an effect that lasts: anything but items alone. */
export const isLasting = (boon: Boon) =>
  Object.keys(boon.effect).some((k) => k !== "loot");
/** The pieces of equipment a boon would replace: whatever the party wears
 * in its slot (one, or more in a save from before slots). */
export function replaces(quest: QuestState | undefined, boon: Boon) {
  return boon.slot
    ? partyBoons(quest).filter((b) => b.boon.slot === boon.slot)
    : [];
}
/** A heart loss: the shield takes it whole. */
function hurt(party: PartyState, damage: number): PartyState {
  if (damage <= 0) return party;
  const shield = party.loot.indexOf("shield");
  if (shield >= 0)
    return { ...party, loot: party.loot.filter((_, i) => i !== shield) };
  return { ...party, hearts: Math.max(0, party.hearts - damage) };
}
/** What a card brings: its reward (a battle's only on a win) and its jinx
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
          next.hearts + Math.max(0, heal + (omen?.heal ?? 0)) * times,
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
    // An adventurer's starting gear goes on with it (2026-10-25).
    if (card.kit) next = gainBoon(next, card, quest, "kit");
  }
  if (card.jinx && (outcome === null || outcome === "lost"))
    next = { ...next, jinx: card.id };
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
/** Put the card aside. A caught Pokémon sent into it goes back to the
 * team on a win and faints on a loss; the last one that fainted is news
 * for this put-aside only. */
function discard(
  s: SessionState,
  random: Random,
  verdict?: Outcome,
  spoil?: number,
): SessionState {
  const party = s.quest?.party;
  if (!party || (!party.assist && !party.fainted))
    return discardCard(s, random, verdict, spoil);
  const sent = party.assist;
  const card = currentCard(s);
  const lost =
    !!sent &&
    (verdict ??
      (card.dice && s.roll && rollWins(card.dice, s.roll.values, s.roll)
        ? "won"
        : "lost")) === "lost";
  const clean: PartyState = { ...party };
  delete clean.assist;
  delete clean.fainted;
  const next = discardCard(
    { ...s, quest: { ...s.quest!, party: clean } },
    random,
    verdict,
    spoil,
  );
  const after = next.quest?.party;
  if (!lost || !after || !sent) return next;
  const team = (after.team ?? []).filter((m) => m !== sent);
  const fallen: PartyState = { ...after, team, fainted: sent };
  if (!team.length) delete fallen.team;
  return { ...next, quest: { ...next.quest!, party: fallen } };
}
function discardCard(
  s: SessionState,
  random: Random,
  verdict?: Outcome,
  spoil?: number,
): SessionState {
  s = settleThrow(s);
  const history = { previousRoll: s.roll, roll: null };
  const card = currentCard(s);
  const discarded = s.discarded + 1,
    previousId = card.id;
  // In a quest only a won battle counts. A strike reads its matchup unless
  // it was won another way (a caught Pokémon).
  const outcome: Outcome | null =
    !s.quest || !(card.battle || card.strike)
      ? null
      : card.strike
        ? (verdict ?? strikeOutcome(s.quest, card))
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
    // Previous Card shows the beat of a phased boss as it was played.
    const raw = finaleCard(q, card.id);
    const beat = raw?.phases ? bossBeat(q, raw) : 0;
    if (beat) next = { ...next, beat };
    else if (next.beat !== undefined) {
      next = { ...next };
      delete next.beat;
    }
    // A Revive in the satchel saves the run once: back at half the maximum.
    const revive = next.loot.indexOf("revive");
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
      // The floor's boss falls, and the jinx lifts with it.
      next = { ...next, hits: 0 };
      if (isBossCard(card)) delete next.jinx;
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
                  ),
                }
              : {}),
          },
        }
      : {}),
  };
}
