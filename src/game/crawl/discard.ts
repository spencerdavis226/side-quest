import type {
  CardDefinition,
  DiceRoll,
  PartyState,
  QuestState,
  SessionState,
} from "../types";
import { rollWins } from "../dice";
import { currentCard, paceQuest, shuffle, type Random } from "../engine";
import { finaleCard, finaleStage } from "./stages";
import {
  evolve,
  gainBoon,
  omenEffect,
  satchelSize,
  settleParty,
  type Outcome,
} from "./party";
import { bossBeat, hitsNeeded, isBossCard, spoilsOnWin } from "./bosses";
import { joinTeam, settleThrow, strikeOutcome } from "./team";
// Putting a card aside: the verdict, the party settled, the next card dealt.
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
/** A revealed choice card whose option has not been picked yet. */
export function awaitingChoice(s: SessionState) {
  return s.phase === "revealed" && !s.roll && !!currentCard(s).dice?.choice;
}
/** A revealed quest battle without dice: the table says whether it won. */
export function awaitingVerdict(s: SessionState) {
  const card = currentCard(s);
  return !!s.quest && s.phase === "revealed" && !!card.battle && !card.dice;
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
/** Put the card aside. A caught Pokémon sent into it goes back to the
 * team on a win and faints on a loss; the last one that fainted is news
 * for this put-aside only. */
export function discard(
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
      // Realms (2026-11-03): a lieutenant's fall levels the adventurer up.
      if (card.levelUp) next = evolve(next, { ...q, party: next });
      // A Legendary caught on its last beat joins the team (2026-11-01).
      if (card.joins) next = joinTeam(next, card.id);
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
