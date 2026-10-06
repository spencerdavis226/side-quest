import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";
import type { SessionState, CardDefinition } from "../game/types";
import { diceResultText } from "../presentation/dice/result-text";
import { diceNotation } from "../game/dice";
import { awaitingChoice, currentCard } from "../game/engine";
import type { Motion } from "../presentation/controller";
import { cardPacks } from "../presentation/packs";
import { CardFace } from "../components/Cards";
import {
  CardActions,
  TimerBlast,
  hasActions,
  useCardActions,
} from "../components/CardActions";
const FullScreenDice = lazy(() => import("../components/FullScreenDice"));
export function Play({
  session,
  motion,
  transition,
  finishingRoll = false,
  onTap,
  onChoose,
  onRevealRoll,
  onFinish,
  renderFace,
  overlay = true,
}: {
  session: SessionState;
  motion: Motion | null;
  transition: number;
  finishingRoll?: boolean;
  onTap: () => void;
  onChoose: (option: "skip" | "roll") => void;
  onRevealRoll: () => void;
  onFinish: (id: number) => void;
  renderFace?: (card: CardDefinition) => ReactNode;
  overlay?: boolean;
}) {
  const card = currentCard(session),
    ref = useRef<HTMLButtonElement>(null),
    choiceRef = useRef<HTMLDivElement>(null);
  // The plaques arrive once the card has landed face up and leave with the
  // decision; the card itself takes no action while they are up.
  const choice = !motion && awaitingChoice(session) ? card.dice!.choice! : null;
  // Secret and timed cards: plaques once the card has landed face up; a timed
  // card stays on the table until its time is up.
  const actions = useCardActions(
    card,
    `${session.cycle}-${session.position}-${session.quest?.due ? session.quest.step : ""}-${card.id}`,
  );
  const acting =
    !motion && session.phase === "revealed" && hasActions(card, actions);
  const blocked = acting && actions.blocking;
  // WebKit can paint the reverse of a nested, clipped 3D face despite
  // backface-visibility. Cull by the actual rendered angle, not a timer, so
  // interrupted/reduced-motion turns cannot expose mirrored card text.
  useLayoutEffect(() => {
    const el = ref.current;
    const rotator = el?.querySelector<HTMLElement>(".card-rotator");
    const front = el?.querySelector<HTMLElement>(".card-front");
    const back = el?.querySelector<HTMLElement>(".card-back");
    if (!rotator || !front || !back) return;
    let frame = 0;
    let live = true;
    const paint = () => {
      frame = 0;
      if (!live) return;
      const transform = getComputedStyle(rotator).transform;
      const frontFacing =
        motion === "flip"
          ? transform !== "none" && new DOMMatrixReadOnly(transform).m11 < 0
          : session.phase === "revealed";
      front.style.visibility = frontFacing ? "visible" : "hidden";
      back.style.visibility = frontFacing ? "hidden" : "visible";
      // Don't keep a per-frame loop alive on a hidden tab; resync on return.
      if (motion === "flip" && !document.hidden)
        frame = requestAnimationFrame(paint);
    };
    const onVisibility = () => {
      if (!document.hidden) paint();
    };
    paint();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      live = false;
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [session.phase, transition, motion]);
  useEffect(() => {
    const el = ref.current;
    if (!el || !motion) return;
    const finish = (event: AnimationEvent) => {
      if (
        event.target === el &&
        event.animationName ===
          (
            {
              deal: "deal-in",
              flip: "lift-turn",
              discard: "discard",
              settle: "card-settle",
              complete: "celebration",
              // Roll completion is owned by the dice overlay, not a keyframe.
              roll: "dice-roll",
            } as const
          )[motion]
      )
        onFinish(transition);
    };
    el.addEventListener("animationend", finish);
    el.addEventListener("animationcancel", finish);
    return () => {
      el.removeEventListener("animationend", finish);
      el.removeEventListener("animationcancel", finish);
    };
  }, [transition, motion, onFinish]);
  return (
    <>
      <section className="table">
        <span className="sr-only" role="status" aria-live="polite">
          {session.phase === "revealed" &&
          session.roll?.returned &&
          motion === "settle"
            ? `Rolled ${session.roll.values.join(" plus ")}${
                session.roll.values.length > 1
                  ? `, total ${session.roll.total}`
                  : ""
              }. ${diceResultText(card, session.roll)}`
            : ""}
        </span>
        <div
          className={`card-stage ${motion ?? ""} ${choice || acting ? "choosing" : ""}`}
        >
          <div className="deck-under" aria-hidden="true" />
          <button
            ref={ref}
            className={`game-card ${session.phase === "revealed" ? "face" : "back"}`}
            onClick={() => {
              const awaitingReveal =
                !!card.dice &&
                !!session.roll &&
                !session.roll.returned &&
                motion !== "roll";
              if (choice || blocked) {
                // Point at the plaques instead of acting on a stray tap.
                if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
                  choiceRef.current?.animate(
                    [
                      { transform: "scale(1)" },
                      { transform: "scale(1.05)" },
                      { transform: "scale(1)" },
                    ],
                    { duration: 240, easing: "ease-out" },
                  );
              } else if (!awaitingReveal) onTap();
            }}
            aria-disabled={
              !!choice ||
              blocked ||
              (!!motion && motion !== "roll") ||
              (!!card.dice &&
                !!session.roll &&
                !session.roll.returned &&
                motion !== "roll")
            }
            aria-label={
              session.phase === "hidden"
                ? "Reveal card"
                : choice
                  ? `${card.title}. ${card.rules} Choose ${choice.skip} or ${choice.roll}.`
                  : blocked
                    ? `${card.title}. ${card.rules} ${card.timer!.kind === "fuse" ? "Light the fuse" : "Start the clock"}, or skip it.`
                    : actions.shown === "end"
                      ? `${card.title}. ${card.timer!.end} Tap to put this card aside.`
                      : card.dice && !session.roll?.returned
                        ? session.roll
                          ? motion === "roll"
                            ? "Finish dice roll"
                            : "Revealing dice result"
                          : `Roll ${diceNotation(card.dice)}. ${card.rules}`
                        : `${card.title}. ${session.roll?.returned ? `Rolled ${session.roll.total}. ${diceResultText(card, session.roll)}` : card.rules} ${cardPacks(
                            card.id,
                            session.config.packIds,
                          )
                            .map((pack) => pack.title)
                            .join(", ")}. Tap to put this card aside.`
            }
          >
            <span
              className="card-rotator"
              // One rotator per dealt card. A quest finale deals its cards
              // without moving the deck, so cycle and position repeat; reusing
              // the face-up rotator would visibly turn it back over.
              key={session.discarded}
            >
              <span className="card-surface card-back" aria-hidden="true" />
              <span
                className="card-surface card-front"
                aria-hidden={session.phase !== "revealed"}
              >
                {renderFace ? (
                  renderFace(card)
                ) : (
                  <CardFace
                    card={card}
                    packIds={session.config.packIds}
                    roll={session.roll}
                    shown={session.phase === "revealed" ? actions.shown : null}
                  />
                )}
              </span>
            </span>
          </button>
          {acting && (
            <CardActions
              card={card}
              actions={actions}
              groupRef={choiceRef}
              onSkip={onTap}
            />
          )}
          {choice && (
            <div
              ref={choiceRef}
              className="card-choice"
              role="group"
              aria-label="Your choice"
            >
              <button
                className="card-choice-option skip"
                onClick={() => onChoose("skip")}
              >
                {choice.skip}
              </button>
              <button
                className="card-choice-option roll"
                aria-label={`${choice.roll}: roll ${diceNotation(card.dice!)}`}
                onClick={() => onChoose("roll")}
              >
                {choice.roll}
                <small>{diceNotation(card.dice!)}</small>
              </button>
            </div>
          )}
        </div>
      </section>
      <span className="sr-only" role="status" aria-live="assertive">
        {actions.shown === "secret"
          ? `Secret: ${card.secret}`
          : actions.shown === "end"
            ? `${card.timer!.kind === "fuse" ? "Boom" : "Time"}. ${card.timer!.end}`
            : ""}
      </span>
      {session.phase === "revealed" && (
        <TimerBlast card={card} actions={actions} />
      )}
      {overlay &&
        session.phase === "revealed" &&
        card.dice &&
        !session.roll?.returned &&
        (!motion || motion === "roll") && (
          <Suspense fallback={null}>
            <FullScreenDice
              card={card}
              roll={session.roll}
              rolling={motion === "roll"}
              finishing={finishingRoll}
              onTap={onTap}
              onReveal={onRevealRoll}
              onFinish={() => onFinish(transition)}
            />
          </Suspense>
        )}
    </>
  );
}
