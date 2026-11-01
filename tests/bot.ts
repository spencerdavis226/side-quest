import {
  awaitingCatch,
  canSendIn,
  canThrowMaster,
  throwMaster,
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
 * and sends one into every fight its type beats (2026-10-31). */
export function botTeam(s: SessionState, random: Random): SessionState {
  // The Master Ball (2026-11-01) goes on a hard catch the team wants.
  if (canThrowMaster(s)) {
    const card = currentCard(s);
    const team = partyTeam(s.quest);
    const wanted =
      team.length < TEAM_SIZE || !team.some((m) => m.type === card.type);
    if (wanted && (card.catchRate ?? 0) >= 10) return throwMaster(s);
  }
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
  // A caught Pokémon adds to the roll and stays after a win (2026-10-31),
  // so the table sends one in whenever its type beats the foe.
  const member = partyTeam(s.quest).find((m) => canSendIn(s, m.id));
  return member ? sendIn(s, member.id, random) : s;
}
