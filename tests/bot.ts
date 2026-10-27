import {
  awaitingCatch,
  canSendIn,
  cardMatchup,
  catchIt,
  letGo,
  partyTeam,
  sendIn,
  TEAM_SIZE,
  canUsePower,
  currentCard,
  isBossCard,
  partyPower,
  powerSpoils,
  replaces,
  spendPower,
  type Random,
} from "../src/game/engine";
import { rollWins } from "../src/game/dice";
import type { SessionState } from "../src/game/types";

// How the balance harnesses' sensible table uses its signature power
// (2026-10-25). `moment` is when it looks: as a card is face up, before
// anything is decided ("before"), or with a lost roll on the card ("lost").
// It saves the power for bosses unless the hearts are low, takes a free
// equipment slot when a win fells a boss with spoils, and heals once the
// whole heal fits.
export function botPower(
  s: SessionState,
  random: Random,
  moment: "before" | "lost",
): SessionState {
  if (!canUsePower(s)) return s;
  const power = partyPower(s.quest)!;
  const party = s.quest!.party!;
  const card = currentCard(s);
  const boss = !!card.hits && isBossCard(card);
  const low = party.hearts <= 5;
  const big = boss || !!card.hits || low;
  const lostRoll =
    !!card.dice && !!s.roll && !rollWins(card.dice, s.roll.values, s.roll);
  const spoil = () => {
    const spoils = card.spoils ?? [];
    const free = spoils.findIndex((b) => !replaces(s.quest, b).length);
    return free >= 0 ? free : random() < 0.5 ? 0 : 1;
  };
  switch (power.kind) {
    case "reroll":
      return moment === "lost" ? spendPower(s, random) : s;
    case "spare":
      // A lost roll or strike, or a plaque fight that could hurt.
      return moment === "lost" ||
        (moment === "before" && (card.strike || (!card.dice && big)))
        ? spendPower(s, random)
        : s;
    case "edge":
    case "double":
      return moment === "before" && big ? spendPower(s, random) : s;
    case "win":
      if (moment !== "before" || !big) return s;
      if (party.hearts <= (power.cost ?? 1) + (boss ? 1 : 3)) return s;
      return spendPower(s, random, powerSpoils(s) ? spoil() : undefined);
    case "heal":
      return party.max - party.hearts >= (power.amount ?? 1)
        ? spendPower(s, random)
        : s;
    case "flee":
      return moment === "before" && low && !lostRoll
        ? spendPower(s, random)
        : s;
  }
}

/** The League's team (2026-10-25): the table catches a beaten wild
 * Pokémon while the team has room, or when its type is new to the team;
 * and uses one on a gym or a boss, or a battle the starter is weak in. */
export function botTeam(s: SessionState, random: Random): SessionState {
  if (awaitingCatch(s)) {
    const card = currentCard(s);
    const team = partyTeam(s.quest);
    const fresh = !team.some((m) => m.type === card.type);
    return team.length < TEAM_SIZE || fresh
      ? catchIt(s, random)
      : letGo(s, random);
  }
  const card = currentCard(s);
  const big =
    !!card.hits || cardMatchup(s.quest, card)?.edge === "disadvantage";
  if (!big) return s;
  const member = partyTeam(s.quest).find((m) => canSendIn(s, m.id));
  return member ? sendIn(s, member.id, random) : s;
}
