import {
  awaitingCatch,
  canSendIn,
  ballsReady,
  throwWith,
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
  // The bag's balls (2026-11-01) go on a catch the team wants: the least
  // ball that does the job, a Master Ball only on a hard one.
  const balls = ballsReady(s);
  if (balls.length) {
    const card = currentCard(s);
    const team = partyTeam(s.quest);
    const wanted =
      team.length < TEAM_SIZE || !team.some((m) => m.type === card.type);
    const rate = card.catchRate ?? 0;
    const pick = !wanted
      ? undefined
      : rate >= 8 && balls.includes("great") && rate < 13
        ? "great"
        : rate >= 11 && balls.includes("ultra")
          ? "ultra"
          : rate >= 13 && balls.includes("master")
            ? "master"
            : rate >= 8 && balls.includes("great")
              ? "great"
              : undefined;
    if (pick) return throwWith(s, pick, random);
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
