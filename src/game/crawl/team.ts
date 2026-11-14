import type {
  CardDefinition,
  Edge,
  Loot,
  PartyState,
  QuestState,
  SessionState,
} from "../types";
import { rollWins } from "../dice";
import { matchup, type Matchup } from "../matchup";
import { currentCard, type Random } from "../engine";
import { finaleCard } from "./stages";
import { omenEffect } from "./party";
import { awaitingOffer, canTakeOffer } from "./offers";
import { discard } from "./discard";
// The League: types and matchups, the team, catching and sending in.
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
/** The caught Pokémon in the bag (or the Quest's allies), as cards,
 * oldest first. */
export function partyTeam(quest: QuestState | undefined) {
  return (quest?.party?.team ?? []).flatMap((id) => {
    const card = quest ? teamMember(quest, id) : undefined;
    return card?.type || card?.ally ? [card] : [];
  });
}
/** Team member `id` as the team sees it: its card, or for a card that
 * `joins` (an egg, a Legendary; 2026-11-01) the Pokémon it brings, named,
 * typed and with its catch number. */
export function teamMember(
  quest: QuestState,
  id: string,
): CardDefinition | undefined {
  const card = finaleCard(quest, id);
  // An ally (The Quest 2.0 Phase 4) goes by its own name.
  if (card?.ally) return { ...card, title: card.ally.name };
  if (!card?.joins) return card;
  const { name, type, rate } = card.joins;
  return {
    ...card,
    title: name ?? card.title,
    type: type ?? card.type,
    catchRate: rate,
  };
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
export const joinTeam = (party: PartyState, id: string): PartyState => ({
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
/** The balls a bag can hold (2026-11-01): a Great Ball adds 3 to the throw
 * and an Ultra Ball 6 (on a hard catch, needing 15, that is 30% to 45% and
 * 60%: the games' 1.5x and 2x); a Master Ball always lands a 20. */
export type SpecialBall = "great" | "ultra" | "master";
export const SPECIAL_BALLS: readonly SpecialBall[] = [
  "great",
  "ultra",
  "master",
];
export const BALL_BONUS = { great: 3, ultra: 6 } as const;
/** The number a throw with `ball` must reach to catch a Pokémon that needs
 * `need`: lowered by the ball's bonus, never below 2 (a natural 1 never
 * catches). */
export const ballNeed = (need: number, ball?: "great" | "ultra") =>
  Math.max(2, need - (ball ? BALL_BONUS[ball] : 0));
/** Whether a ball can be thrown at the Pokémon face up now: at a beaten
 * wild Pokémon or a catch card's offer. */
function canThrowAt(s: SessionState): boolean {
  const party = s.quest?.party;
  if (!party || party.throw) return false;
  const card = currentCard(s);
  if (!card.catchRate) return false;
  if (awaitingCatch(s)) return true;
  return (
    awaitingOffer(s) &&
    !!card.offers?.some((o, i) => o.catch && canTakeOffer(s, i))
  );
}
/** Whether the bag's `ball` can be thrown now. */
export const canThrowWith = (s: SessionState, ball: SpecialBall) =>
  !!s.quest?.party?.loot.includes(ball) && canThrowAt(s);
/** The bag's balls that can be thrown now, best last. */
export const ballsReady = (s: SessionState) =>
  canThrowAt(s)
    ? SPECIAL_BALLS.filter((b) => s.quest!.party!.loot.includes(b))
    : [];
/** Throw one of the bag's balls (2026-11-01): it is spent. A Great or Ultra
 * Ball rolls the d20 with its bonus; a Master Ball lands a 20. A catch
 * card's offer (its heal) comes with a catch, as with a Poké Ball. */
export function throwWith(
  s: SessionState,
  ball: SpecialBall,
  random: Random = Math.random,
): SessionState {
  if (!canThrowWith(s, ball)) return s;
  const q = s.quest!;
  const loot = [...q.party!.loot];
  loot.splice(loot.indexOf(ball), 1);
  const id = currentCard(s).id;
  if (ball === "master")
    return {
      ...s,
      quest: {
        ...q,
        party: { ...q.party!, loot, throw: { id, face: 20, master: true } },
      },
    };
  const thrown = throwAt(
    { ...s, quest: { ...q, party: { ...q.party!, loot } } },
    random,
  );
  const p = thrown.quest!.party!;
  return {
    ...thrown,
    quest: { ...thrown.quest!, party: { ...p, throw: { ...p.throw!, ball } } },
  };
}
/** Whether a Master Ball can be thrown now. */
export const canThrowMaster = (s: SessionState) => canThrowWith(s, "master");
/** Throw the bag's Master Ball: it lands a 20. */
export const throwMaster = (s: SessionState) => throwWith(s, "master");
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
  const need = ballNeed(card.catchRate, thrown.ball);
  const caught = caughtBy(thrown.face, need);
  return {
    face: thrown.face,
    need,
    caught,
    master: !!thrown.master,
    ball: thrown.master ? ("master" as const) : thrown.ball,
    line: caught ? card.catchLines.caught : card.catchLines.fled,
  };
}
/** Throw the ball at the Pokémon face up (2026-10-27): a d20 is committed
 * and kept with the party until the card is put aside. */
export function throwAt(s: SessionState, random: Random): SessionState {
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
export function settleThrow(s: SessionState): SessionState {
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
  // An ally's own bonus (The Quest 2.0 Phase 4).
  if (member?.ally) return member.ally.bonus;
  if (!member?.catchRate) return 1;
  const bonus = Math.max(1, Math.min(5, Math.round(member.catchRate / 4)));
  // Normal has no super-effective type, so it is sent into any fight that is
  // not a disadvantage (see `canSendIn`); one less in return, down to +1.
  return member.type === "normal" ? Math.max(1, bonus - 1) : bonus;
}
/** Whether caught Pokémon (or an ally) `id` can be sent into the battle face up: a
 * single-d20 battle not yet rolled, with its type super effective on the
 * foe's. A Normal Pokémon beats nothing, so it goes in on any matchup that
 * is not a disadvantage (2026-10-31, owner), for one less (`assistBonus`).
 * The starter's own type edge is separate and stacks. */
export function canSendIn(s: SessionState, id: string): boolean {
  const party = s.quest?.party;
  if (!party || !s.quest?.due || s.phase !== "revealed") return false;
  if (!party.team?.includes(id) || party.throw || party.assist) return false;
  const card = currentCard(s);
  const member = teamMember(s.quest, id);
  // An ally (The Quest 2.0 Phase 4) goes into a single-d20 battle of its
  // calling, not yet rolled (a gamble's kind is a relic, the dragon's a
  // boss).
  if (member?.ally) {
    const kind = card.encounter;
    return (
      !!card.battle &&
      card.dice?.count === 1 &&
      card.dice.sides === 20 &&
      !s.roll &&
      !card.dice.choice &&
      !party.press &&
      !!kind &&
      (member.ally.calling.includes("any") ||
        member.ally.calling.includes(kind))
    );
  }
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
  // Dragon lore (The Quest 2.0 Phase 4): the dragon's first swings, one a
  // lore held, are rolled twice and the better kept. Never on the contest.
  const party = quest?.party;
  const duel = party?.duel;
  if (
    card.lairFight &&
    duel &&
    !duel.contest &&
    duel.swings < (party.lore ?? 0)
  )
    return "advantage";
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
