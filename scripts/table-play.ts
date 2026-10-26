// A table that plays any game through the real engine, one tap or plaque at
// a time, at random but sensibly: the save fixtures are captured from it
// (`save-fixtures.ts`) and `tests/save-fixtures.test.ts` plays each loaded
// fixture on with it. Deterministic for a given seed.
import {
  advance,
  awaitingCatch,
  awaitingChoice,
  awaitingOffer,
  awaitingPress,
  awaitingSpoils,
  awaitingVerdict,
  canQuaff,
  canTakeOffer,
  canUseLoot,
  canSendIn,
  canUsePower,
  catchIt,
  letGo,
  partyTeam,
  sendIn,
  cashOut,
  currentCard,
  omenForm,
  powerSpoils,
  pressOn,
  quaff,
  settleBattle,
  spoilsOnWin,
  skipRoll,
  spendLoot,
  takeOffer,
  takeSpoils,
  spendPower,
  type Random,
} from "../src/game/engine";
import { returnToCard, rollDice } from "../src/game/dice";
import type { Loot, SessionState } from "../src/game/types";

export const seeded =
  (seed: number): Random =>
  () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

/** The table's next move: the state the app would save after it. */
export function nextMove(s: SessionState, random: Random): SessionState {
  const card = currentCard(s);
  const can = (item: Loot) => canUseLoot(s, item);
  const party = s.quest?.party;
  let next: SessionState;
  if (s.phase === "hidden") next = advance(s, random);
  else if (party && party.hearts <= 3 && can("draught"))
    next = spendLoot(s, "draught", random);
  else if (can("candy")) next = spendLoot(s, "candy", random);
  else if (can("tera") && random() < 0.5) next = spendLoot(s, "tera", random);
  else if (can("smoke") && random() < 0.3) next = spendLoot(s, "smoke", random);
  else if (awaitingChoice(s))
    next = random() < 0.5 ? skipRoll(s, random) : rollDice(s, random);
  else if (card.dice && !s.roll) next = rollDice(s, random);
  else if (card.dice && !s.roll!.returned) next = returnToCard(s);
  else if (canQuaff(s) && random() < 0.6) next = quaff(s);
  // The class's or starter's power (2026-10-25), now and then; a win that
  // fells a boss with spoils picks one.
  else if (canUsePower(s) && random() < 0.35)
    next = spendPower(
      s,
      random,
      powerSpoils(s) ? Math.floor(random() * card.spoils!.length) : undefined,
    );
  // The League's team (2026-10-25): send a teammate in now and then, and
  // catch a beaten wild Pokémon more often than not.
  else if (partyTeam(s.quest).some((m) => canSendIn(s, m.id)) && random() < 0.5)
    next = sendIn(s, partyTeam(s.quest).find((m) => canSendIn(s, m.id))!.id);
  else if (awaitingCatch(s))
    next = random() < 0.7 ? catchIt(s, random) : letGo(s, random);
  else if (can("die")) next = spendLoot(s, "die", random);
  else if (can("round")) next = spendLoot(s, "round", random);
  else if (awaitingVerdict(s)) {
    const won = random() < 0.55;
    next = settleBattle(
      s,
      won,
      random,
      won && spoilsOnWin(s)
        ? Math.floor(random() * card.spoils!.length)
        : undefined,
    );
  } else if (awaitingOffer(s)) {
    const open = card.offers!.flatMap((_, i) =>
      canTakeOffer(s, i) ? [i] : [],
    );
    const branches = omenForm(s.quest)?.branches?.length ?? 1;
    next = takeOffer(
      s,
      open[Math.floor(random() * open.length)],
      random,
      Math.floor(random() * branches),
    );
  } else if (awaitingSpoils(s))
    next = takeSpoils(s, Math.floor(random() * card.spoils!.length), random);
  else if (awaitingPress(s))
    next = random() < 0.5 ? pressOn(s) : cashOut(s, random);
  else next = advance(s, random);
  if (next === s) throw Error(`The table is stuck on ${card.id}`);
  return next;
}
