import { useEffect, useState, type Ref } from "react";
import { createPortal } from "react-dom";
import type { CardDefinition } from "../game/types";
import { timerSeconds } from "../game/timer";

// Secret and timed cards. Both are table activities, not game state: nothing
// here is saved, so a reload shows the card's rules again with the timer
// unlit. The card can't be put aside while its timer has yet to run out.

export type TimerPhase =
  | { phase: "idle" }
  | { phase: "running"; endsAt: number }
  | { phase: "done"; at: number };

/** One card's hold and timer state; `key` names the card in play, and a new
 * key starts over (unheld, unlit). */
export function useCardActions(card: CardDefinition, key: string) {
  const [owner, setOwner] = useState(key);
  const [timer, setTimer] = useState<TimerPhase>({ phase: "idle" });
  const [holding, setHolding] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  if (owner !== key) {
    setOwner(key);
    setTimer({ phase: "idle" });
    setHolding(false);
  }
  useEffect(() => {
    if (timer.phase !== "running") return;
    const { endsAt } = timer;
    // Wall-clock time, so a fuse that ran out while the app was in the
    // background goes off as soon as it is back.
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t >= endsAt) setTimer({ phase: "done", at: t });
    };
    const id = setInterval(tick, 200);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [timer]);
  useEffect(() => {
    // Never leave a secret on screen when the app loses the finger's focus.
    const hide = () => setHolding(false);
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("blur", hide);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("blur", hide);
    };
  }, []);
  const start = () => {
    if (!card.timer || timer.phase !== "idle") return;
    const t = Date.now();
    setNow(t);
    setTimer({
      phase: "running",
      endsAt: t + timerSeconds(card.timer, Math.random) * 1000,
    });
  };
  const remaining =
    timer.phase === "running"
      ? Math.max(0, Math.ceil((timer.endsAt - now) / 1000))
      : 0;
  return {
    timer,
    start,
    remaining,
    holding,
    setHolding,
    /** True while a timed card must not be put aside. */
    blocking: !!card.timer && timer.phase !== "done",
    shown:
      holding && card.secret
        ? ("secret" as const)
        : card.timer && timer.phase === "done"
          ? ("end" as const)
          : null,
  };
}

type Actions = ReturnType<typeof useCardActions>;

export function hasActions(card: CardDefinition, actions: Actions) {
  return !!card.secret || (!!card.timer && actions.timer.phase !== "done");
}

/** The plaques over the foot of a secret or timed card. */
export function CardActions({
  card,
  actions,
  groupRef,
  onSkip,
}: {
  card: CardDefinition;
  actions: Actions;
  groupRef?: Ref<HTMLDivElement>;
  /** Puts a timed card aside before its time is up. */
  onSkip: () => void;
}) {
  const { timer, holding, setHolding, start, remaining } = actions;
  const showTimer = !!card.timer && timer.phase !== "done";
  const fuse = card.timer?.kind === "fuse";
  const plaques = (card.secret ? 1 : 0) + (showTimer ? 2 : 0);
  return (
    <div
      ref={groupRef}
      className={`card-choice card-actions plaques-${plaques}`}
      role="group"
      aria-label="Card actions"
    >
      {card.secret && (
        <button
          className={`card-choice-option skip card-hold${holding ? " held" : ""}`}
          aria-pressed={holding}
          onPointerDown={(event) => {
            // Keep the hold through a wobble off the plaque; a pointer the
            // browser won't capture still reads until it lifts.
            try {
              event.currentTarget.setPointerCapture(event.pointerId);
            } catch {
              /* not capturable */
            }
            setHolding(true);
          }}
          onPointerUp={() => setHolding(false)}
          onPointerCancel={() => setHolding(false)}
          onLostPointerCapture={() => setHolding(false)}
          onContextMenu={(event) => event.preventDefault()}
          // A pointer reads by holding. Keyboard and VoiceOver activation
          // (no pointer, `detail` 0) toggles instead.
          onClick={(event) => {
            if (event.detail === 0) setHolding(!holding);
          }}
          onBlur={() => setHolding(false)}
        >
          {holding ? "Reading" : "Hold to read"}
          <small>{holding ? "release to hide" : "no peeking"}</small>
        </button>
      )}
      {showTimer &&
        (timer.phase === "idle" ? (
          <button className="card-choice-option roll" onClick={start}>
            {fuse ? "Light the fuse" : "Start the clock"}
            <small>
              {fuse
                ? "phone stays put"
                : `${(card.timer as { seconds: number }).seconds} seconds`}
            </small>
          </button>
        ) : (
          <div
            className={`card-choice-option roll timer-live${fuse ? " fuse" : remaining <= 3 ? " final" : ""}`}
            role="timer"
            aria-label={fuse ? "The fuse is lit" : `${remaining} seconds left`}
          >
            {fuse ? (
              <>
                <span className="fuse-spark" aria-hidden="true" />
                Fuse lit
                <small>keep it moving</small>
              </>
            ) : (
              <>
                <strong>{remaining}</strong>
                <small>seconds</small>
              </>
            )}
          </div>
        ))}
      {/* A table that doesn't want a timed card can put it aside, lit or not. */}
      {showTimer && (
        <button
          className="card-choice-option card-skip"
          aria-label="Skip this card"
          onClick={onSkip}
        >
          Skip
        </button>
      )}
    </div>
  );
}

/** The full-screen flash when a timer runs out: BOOM for a fuse, TIME for a
 * countdown. It never takes a tap; the card underneath shows what happens. */
export function TimerBlast({
  card,
  actions,
}: {
  card: CardDefinition;
  actions: Actions;
}) {
  const { timer } = actions;
  const at = timer.phase === "done" ? timer.at : 0;
  const [gone, setGone] = useState(0);
  useEffect(() => {
    if (!at) return;
    const id = setTimeout(() => setGone(at), 1600);
    return () => clearTimeout(id);
  }, [at]);
  if (!at || gone === at || !card.timer) return null;
  const fuse = card.timer.kind === "fuse";
  return createPortal(
    <div
      className={`timer-blast ${fuse ? "boom" : "time"}`}
      key={at}
      aria-hidden="true"
    >
      <span>{fuse ? "Boom" : "Time"}</span>
    </div>,
    document.body,
  );
}
