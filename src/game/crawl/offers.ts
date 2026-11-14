import type { QuestState, SessionState } from "../types";
import { rollWins } from "../dice";
import { currentCard, type Random } from "../engine";
import { chooseRoad, dropInto, finaleStage } from "./stages";
import {
  addDeed,
  addLore,
  evolve,
  gainBoon,
  omenEffect,
  omenForm,
  satchelSize,
} from "./party";
import { joinTeam, throwAt } from "./team";
import { discard } from "./discard";
// Plaques (merchants, forks, inns, pleas) and push-your-luck pulls.
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
  // The Quest 2.0 Phase 3 (2026-11-14): a plaque's gear, and a curse that
  // lands only from its own plaque.
  if (offer.boon) party = gainBoon(party, currentCard(s), now, `o${index}`);
  if (offer.jinx && currentCard(s).jinx)
    party = { ...party, jinx: currentCard(s).id };
  // The Quest 2.0 Phase 4: dragon lore, and an ally hired or freed.
  if (offer.lore) party = addLore(party);
  if (offer.recruit && currentCard(s).ally)
    party = joinTeam(party, currentCard(s).id);
  // The Quest 2.0 Phase 6: a choice the road remembers.
  if (offer.deed) party = addDeed(party, offer.deed);
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
  // Declining a side quest (2026-11-03): its later stages leave the run,
  // with their picks, so every count still adds up. A road chosen (The
  // Quest 2.0 Phase 5) drops the other road: the stages right after the
  // choice tagged with it. Either way the stages taken out are kept in
  // `dropped` (since Phase 5) so a replay can deal them again.
  let next: QuestState = { ...q, finale, party };
  const { stage } = finaleStage(q);
  if (offer.skip)
    next = dropInto(next, (i) => i > stage && i <= stage + offer.skip!);
  else if (offer.route !== undefined)
    next = chooseRoad(next, stage, offer.route);
  return discard({ ...s, quest: next }, random);
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
