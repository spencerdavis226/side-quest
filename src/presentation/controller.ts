import { rollDice, returnToCard } from "../game/dice";
import {
  advance,
  awaitingChoice,
  awaitingVerdict,
  currentCard,
  settleBattle,
  skipRoll,
  quaff,
  spendLoot,
  awaitingOffer,
  awaitingSpoils,
  takeOffer,
  takeSpoils,
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
    };
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
    });
  }
  start(session: SessionState) {
    if (this.state.motion) return;
    this.persist(session);
    this.transition(session, "deal");
    this.effect("deal");
  }
  clear() {
    if (this.state.motion) return;
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
    this.persist(next);
    const revealing = session.phase === "hidden";
    this.transition(
      next,
      revealing ? "flip" : "discard",
      revealing ? null : session,
    );
    this.effect(revealing ? "reveal" : "discard");
  }
  private roll(session: SessionState) {
    const next = rollDice(session, this.diceRandom);
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
    this.persist(next);
    this.transition(next, "discard", session);
    this.effect("discard");
  }
  /** Settle a battle without dice: the table won it or lost it. */
  settle(won: boolean) {
    const { session, motion } = this.state;
    if (!session || motion || !awaitingVerdict(session)) return;
    const next = settleBattle(session, won, this.random);
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
    this.persist(next);
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
    this.persist(next);
    if (item === "smoke") {
      this.transition(next, "discard", session);
      this.effect("discard");
    } else {
      this.transition(next, null);
      this.effect("press");
    }
  }
  /** Take one of a won fight's spoils; the card goes aside. */
  spoils(index: number) {
    const { session, motion } = this.state;
    if (!session || motion || !awaitingSpoils(session)) return;
    const next = takeSpoils(session, index, this.random);
    if (next === session) return;
    this.persist(next);
    this.transition(next, "discard", session);
    this.effect("discard");
  }
  /** Quaff: the drawer drinks for another go at a lost roll, which clears
   * it so the card can be rolled again. */
  quaff() {
    const { session, motion } = this.state;
    if (!session || motion) return;
    const next = quaff(session);
    if (next === session) return;
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
