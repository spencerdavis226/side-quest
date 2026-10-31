import {
  awaitingCatch,
  canSendIn,
  cardMatchup,
  catchIt,
  throwBall,
  letGo,
  partyTeam,
  sendIn,
  TEAM_SIZE,
  currentCard,
  type Random,
} from "../src/game/engine";
import type { SessionState } from "../src/game/types";

/** The League's team (2026-10-25): the table catches a beaten wild
 * Pokémon while the team has room, or when its type is new to the team;
 * and uses one on a gym or a boss, or a battle the starter is weak in. */
export function botTeam(s: SessionState, random: Random): SessionState {
  if (awaitingCatch(s)) {
    const card = currentCard(s);
    const team = partyTeam(s.quest);
    const fresh = !team.some((m) => m.type === card.type);
    return team.length < TEAM_SIZE || fresh
      ? card.catchRate
        ? throwBall(s, random)
        : catchIt(s, random)
      : letGo(s, random);
  }
  const card = currentCard(s);
  const big =
    !!card.hits || cardMatchup(s.quest, card)?.edge === "disadvantage";
  if (!big) return s;
  const member = partyTeam(s.quest).find((m) => canSendIn(s, m.id));
  return member ? sendIn(s, member.id, random) : s;
}
