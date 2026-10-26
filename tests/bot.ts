import {
  canUsePower,
  currentCard,
  isBossCard,
  partyPower,
  powerSpoils,
  replaces,
  usePower,
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
      return moment === "lost" ? usePower(s, random) : s;
    case "spare":
      // A lost roll or strike, or a plaque fight that could hurt.
      return moment === "lost" ||
        (moment === "before" && (card.strike || (!card.dice && big)))
        ? usePower(s, random)
        : s;
    case "edge":
    case "double":
      return moment === "before" && big ? usePower(s, random) : s;
    case "win":
      if (moment !== "before" || !big) return s;
      if (party.hearts <= (power.cost ?? 1) + (boss ? 1 : 3)) return s;
      return usePower(s, random, powerSpoils(s) ? spoil() : undefined);
    case "heal":
      return party.max - party.hearts >= (power.amount ?? 1)
        ? usePower(s, random)
        : s;
    case "flee":
      return moment === "before" && low && !lostRoll ? usePower(s, random) : s;
  }
}
