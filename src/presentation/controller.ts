import { rollDice, returnToCard } from "../game/dice";
import {
  advance,
  awaitingChoice,
  awaitingVerdict,
  currentCard,
  settleBattle,
  skipRoll,
  catchIt,
  throwBall,
  letGo,
  sendIn,
  dropFromBag,
  type BagDrop,
  spendLoot,
  awaitingOffer,
  awaitingPress,
  awaitingSpoils,
  cashOut,
  pressOn,
  takeOffer,
  takeSpoils,
  skipSpoils,
  type Random,
} from "../game/engine";
import type { Loot, SessionState } from "../game/types";
import { theme } from "./theme";
// Card motion phases. The dialog enter/exit tokens share the manifest but are
// not card animations, so they are excluded from the controller's Motion.
export type Motion = Exclude<
  keyof typeof theme.motion,
  "dialog" | "dialogExit"
>;
export type Effect =
  | "deal"
  | "reveal"
  | "discard"
  | "complete"
  | "press"
  | "roll"
  | "dice-impact"
  | "dice-settle"
  | "roll-cancel";
export interface Presentation {
  session: SessionState | null;
  outgoing: SessionState | null;
  motion: Motion | null;
  transition: number;
  finishingRoll: boolean;
  /** Whether `undo()` can take back the last decision. */
  undoable: boolean;
}
/** Durable actions happen on acceptance. Animation completion never advances a deck. */
export class PresentationController {
  private state: Presentation;
  private listeners = new Set<() => void>();
  constructor(
    initial: SessionState | null,
    private persist: (session: SessionState | null) => void,
    private effect: (event: Effect) => void = () => {},
    private random: Random = Math.random,
    private diceRandom: Random = Math.random,
  ) {
    this.state = {
      session: initial,
      outgoing: null,
      motion: null,
      transition: 0,
      finishingRoll: false,
      undoable: false,
    };
  }
  /** The game as it stood before the last decision (a card put aside, a
   * Won or Lost, an offer, an item), for one level of undo (2026-11-01,
   * owner). Memory only: never saved, so a reload forgets it. A dice roll
   * or a ball throw clears it, so undo can never buy a second roll. Turning
   * the next card over keeps it: the table can still take back the card
   * just put aside. */
  private before: SessionState | null = null;
  /** Remember `session` as the state undo returns to. */
  private mark(session: SessionState | null) {
    this.before = session;
  }
  getSnapshot = () => this.state;
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  private publish(next: Presentation) {
    this.state = next;
    this.listeners.forEach((fn) => fn());
  }
  private transition(
    session: SessionState | null,
    motion: Motion | null,
    outgoing: SessionState | null = null,
  ) {
    this.publish({
      session,
      motion,
      outgoing,
      transition: this.state.transition + 1,
      finishingRoll: false,
      undoable: !!this.before,
    });
  }
  start(session: SessionState) {
    if (this.state.motion) return;
    this.mark(null);
    this.persist(session);
    this.transition(session, "deal");
    this.effect("deal");
  }
  clear() {
    if (this.state.motion) return;
    this.mark(null);
    this.persist(null);
    this.transition(null, null);
  }
  tap() {
    const { session, motion } = this.state;
    // A second tap asks the renderer to play through the landing. It never
    // samples another result, discards the card, or restarts the transition.
    if (motion === "roll" && session?.roll && !this.state.finishingRoll) {
      this.publish({ ...this.state, finishingRoll: true });
      return;
    }
    if (!session || motion || session.phase === "complete") return;
    // A choice card only moves through choose(); a stray tap must never roll.
    if (
      awaitingChoice(session) ||
      awaitingVerdict(session) ||
      awaitingOffer(session)
    )
      return;
    if (
      session.phase === "revealed" &&
      currentCard(session).dice &&
      !session.roll?.returned
    ) {
      // Once committed, only the renderer's automatic reveal can return the
      // result to the card. Taps during the readable landing beat do nothing.
      if (session.roll) return;
      this.roll(session);
      return;
    }
    const next = advance(session, this.random);
    if (next === session) return;
    const revealing = session.phase === "hidden";
    if (!revealing) this.mark(session);
    this.persist(next);
    this.transition(
      next,
      revealing ? "flip" : "discard",
      revealing ? null : session,
    );
    this.effect(revealing ? "reveal" : "discard");
  }
  private roll(session: SessionState) {
    const next = rollDice(session, this.diceRandom);
    this.mark(null);
    this.persist(next);
    this.transition(next, "roll");
    this.effect("roll");
  }
  /** Commit one option of a choice card: roll the dice, or put it aside. */
  choose(option: "skip" | "roll") {
    const { session, motion } = this.state;
    if (!session || motion || !awaitingChoice(session)) return;
    if (option === "roll") return this.roll(session);
    const next = skipRoll(session, this.random);
    this.mark(session);
    this.persist(next);
    this.transition(next, "discard", session);
    this.effect("discard");
  }
  /** Settle a battle without dice: the table won it or lost it. */
  settle(won: boolean, spoil?: number) {
    const { session, motion } = this.state;
    if (!session || motion || !awaitingVerdict(session)) return;
    const next = settleBattle(session, won, this.random, spoil);
    this.mark(session);
    this.persist(next);
    this.transition(next, "discard", session);
    this.effect("discard");
  }
  /** Take a merchant's ware or a fork's door (or evolve the starter into
   * the `branch` picked); the card goes aside. */
  offer(index: number, branch?: number) {
    const { session, motion } = this.state;
    if (!session || motion || !awaitingOffer(session)) return;
    const next = takeOffer(session, index, this.random, branch);
    if (next === session) return;
    this.mark(session);
    this.persist(next);
    // A catch card's ball is thrown and read on the card; any other offer
    // puts it aside.
    if (next.discarded === session.discarded) {
      // A ball thrown is a roll: undo must not buy a second throw.
      this.mark(null);
      this.transition(next, "settle");
      this.effect("press");
      return;
    }
    this.transition(next, "discard", session);
    this.effect("discard");
  }
  /** Use a crawl item from the satchel. A smoke bomb puts the room aside;
   * a loaded die clears the lost roll so the card can be rolled again. */
  spend(item: Loot) {
    const { session, motion } = this.state;
    if (!session || motion) return;
    const next = spendLoot(session, item, this.random);
    if (next === session) return;
    this.mark(session);
    this.persist(next);
    if (item === "smoke") {
      this.transition(next, "discard", session);
      this.effect("discard");
    } else {
      this.transition(next, null);
      this.effect("press");
    }
  }
  /** Throw an item out of the bag, or let a caught Pokémon go. */
  drop(drop: BagDrop) {
    const { session, motion } = this.state;
    if (!session || motion) return;
    const next = dropFromBag(session, drop);
    if (next === session) return;
    this.mark(session);
    this.persist(next);
    this.transition(next, null);
  }
  /** Push your luck: bank the win and roll again, harder. */
  press() {
    const { session, motion } = this.state;
    if (!session || motion || !awaitingPress(session)) return;
    const next = pressOn(session);
    this.mark(session);
    this.persist(next);
    this.transition(next, null);
    this.effect("press");
  }
  /** Push your luck: take the prizes banked; the card goes aside. */
  cashOut() {
    const { session, motion } = this.state;
    if (!session || motion || !awaitingPress(session)) return;
    const next = cashOut(session, this.random);
    this.mark(session);
    this.persist(next);
    this.transition(next, "discard", session);
    this.effect("discard");
  }
  /** Take one of a won fight's spoils; the card goes aside. */
  spoils(index: number) {
    const { session, motion } = this.state;
    if (!session || motion || !awaitingSpoils(session)) return;
    const next = takeSpoils(session, index, this.random);
    if (next === session) return;
    this.mark(session);
    this.persist(next);
    this.transition(next, "discard", session);
    this.effect("discard");
  }
  /** Keep the party's gear: the won fight's card goes aside, no spoils
   * taken. */
  keepGear() {
    const { session, motion } = this.state;
    if (!session || motion || !awaitingSpoils(session)) return;
    const next = skipSpoils(session, this.random);
    if (next === session) return;
    this.mark(session);
    this.persist(next);
    this.transition(next, "discard", session);
    this.effect("discard");
  }
  /** Pokémon League (2026-10-25): catch the wild Pokémon just beaten, or
   * let it go; either puts the card aside. */
  catch(keep: boolean) {
    const { session, motion } = this.state;
    if (!session || motion) return;
    // A Pokémon with a throw is caught by throwing the ball.
    if (keep && currentCard(session).catchRate) return this.throw();
    const next = keep
      ? catchIt(session, this.random)
      : letGo(session, this.random);
    if (next === session) return;
    this.mark(session);
    this.persist(next);
    this.transition(next, "discard", session);
    this.effect("discard");
  }
  /** Throw a ball at the beaten wild Pokémon (2026-10-27): the result
   * settles onto the card, which is put aside by the next tap. */
  throw() {
    const { session, motion } = this.state;
    if (!session || motion) return;
    const next = throwBall(session, this.random);
    if (next === session) return;
    this.mark(null);
    this.persist(next);
    this.transition(next, "settle");
    this.effect("press");
  }
  /** Send a caught Pokémon into the battle face up: its bonus joins the
   * roll. The card stays in play (`sendIn` only sets `party.assist`), so
   * there is no discard animation, like a loaded die. */
  send(id: string) {
    const { session, motion } = this.state;
    if (!session || motion) return;
    const next = sendIn(session, id, this.random);
    if (next === session) return;
    this.mark(session);
    this.persist(next);
    this.transition(next, null);
    this.effect("press");
  }
  revealRoll() {
    const { session, motion } = this.state;
    if (
      !session ||
      motion ||
      session.phase !== "revealed" ||
      !currentCard(session).dice ||
      !session.roll ||
      session.roll.returned
    )
      return;
    const next = returnToCard(session);
    this.persist(next);
    // The short settle introduces the resolved layout and prevents the same
    // physical tap from immediately discarding the card.
    this.transition(next, "settle");
    this.effect("press");
  }
  /** Take back the last decision (2026-11-01, owner): the game returns to
   * the state saved just before it, one level deep. */
  undo() {
    const { motion } = this.state;
    const before = this.before;
    if (motion || !before) return;
    this.mark(null);
    this.persist(before);
    this.transition(before, null);
    this.effect("press");
  }
  finish(id: number) {
    if (id !== this.state.transition || !this.state.motion) return;
    const { session, motion } = this.state;
    if (motion === "roll") this.effect("dice-settle");
    if (motion === "discard" && session?.phase === "complete") {
      this.transition(session, "complete");
      this.effect("complete");
    } else this.transition(session, null);
  }
  settleAll() {
    if (this.state.motion === "roll") this.effect("roll-cancel");
    if (this.state.motion) this.transition(this.state.session, null);
  }
}
