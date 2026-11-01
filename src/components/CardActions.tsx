import { useEffect, useRef, useState, type Ref } from "react";
import { createPortal } from "react-dom";
import type { CardDefinition } from "../game/types";
import { timerSeconds } from "../game/timer";
import { stillMotion } from "../presentation/motion";
import { burst, clearParticles } from "./moments/particles";

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
  const countdown = card.timer?.kind === "countdown";
  useEffect(() => {
    if (timer.phase !== "running") return;
    const { endsAt } = timer;
    // Wake only when something shows: a countdown as each second turns over,
    // a fuse (which shows no count) when it goes off. Wall-clock time, so a
    // fuse that ran out while the app was in the background goes off as soon
    // as it is back.
    const wait = (t: number) =>
      (countdown ? (endsAt - t) % 1000 || 1000 : endsAt - t) + 5;
    let id = 0;
    const tick = () => {
      window.clearTimeout(id);
      const t = Date.now();
      setNow(t);
      if (t >= endsAt) setTimer({ phase: "done", at: t });
      else id = window.setTimeout(tick, wait(t));
    };
    id = window.setTimeout(tick, wait(Date.now()));
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [timer, countdown]);
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
          {/* A wax seal that breaks while the secret is read (2026-11-01). */}
          <span
            className={`wax-seal${holding ? " broken" : ""}`}
            aria-hidden="true"
          >
            <i />
            <i />
          </span>
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
                {remaining <= 3 &&
                  remaining > 0 &&
                  createPortal(
                    <span
                      key={remaining}
                      className="countdown-tick"
                      aria-hidden="true"
                    >
                      {remaining}
                    </span>,
                    document.body,
                  )}
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
  return <Blast key={at} fuse={fuse} />;
}

/** BOOM: one white flash, a shock ring, debris and a hard shake. TIME: a
 * buzzer's slam and a short shudder. Reduced Motion keeps the flash. */
function Blast({ fuse }: { fuse: boolean }) {
  useEffect(() => {
    if (stillMotion()) return;
    const main = document.querySelector("main.app");
    if (fuse) {
      burst("sparks", {
        count: 120,
        power: 1.4,
        colors: ["#fff3c4", "#ffb347", "#ff6a1a"],
      });
      burst("shards", {
        count: 34,
        power: 1.1,
        colors: ["#2a1a10", "#4a2a18", "#7a3a1a"],
      });
      burst("embers", { count: 40, colors: ["#ff9a3a", "#ff5a1a"] });
      main?.animate?.(
        [
          { transform: "none" },
          { transform: "translate(-9px, 6px) rotate(-0.6deg)" },
          { transform: "translate(8px, -6px) rotate(0.5deg)" },
          { transform: "translate(-6px, 3px)" },
          { transform: "translate(4px, -2px)" },
          { transform: "none" },
        ],
        { duration: 420, easing: "ease-out" },
      );
    } else {
      burst("sparks", { count: 50, colors: ["#f5e5bd", "#7fd0d0"] });
      main?.animate?.(
        [
          { transform: "none" },
          { transform: "translateX(-6px)" },
          { transform: "translateX(6px)" },
          { transform: "translateX(-3px)" },
          { transform: "none" },
        ],
        { duration: 260, easing: "linear" },
      );
    }
    return () => clearParticles();
  }, [fuse]);
  return createPortal(
    <div className={`timer-blast ${fuse ? "boom" : "time"}`} aria-hidden="true">
      {fuse && <i className="blast-ring" />}
      <span>{fuse ? "Boom" : "Time"}</span>
    </div>,
    document.body,
  );
}

/** Most Likely To (2026-11-01): 3, 2, 1, POINT! over the table, so everyone
 * points at once. Display only; a tap skips it; the card underneath still
 * puts aside as ever. */
export function PointCountdown({ onDone }: { onDone: () => void }) {
  const done = useRef(onDone);
  done.current = onDone;
  const word = useRef<HTMLElement>(null);
  useEffect(() => {
    const ids = [
      setTimeout(() => {
        const r = word.current?.getBoundingClientRect();
        burst("sparks", {
          ...(r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : {}),
          count: 90,
          power: 1.3,
        });
        burst("confetti", { count: 50, power: 1 });
      }, 2150),
      setTimeout(() => done.current(), 3200),
    ];
    return () => ids.forEach(clearTimeout);
  }, []);
  return createPortal(
    <div
      className="moment point-countdown"
      aria-hidden="true"
      onPointerDown={(event) => {
        event.stopPropagation();
        event.preventDefault();
        const swallow = (e: Event) => {
          e.stopPropagation();
          e.preventDefault();
        };
        window.addEventListener("click", swallow, {
          capture: true,
          once: true,
        });
        setTimeout(
          () => window.removeEventListener("click", swallow, { capture: true }),
          700,
        );
        done.current();
      }}
    >
      {[3, 2, 1].map((n, i) => (
        <b
          key={n}
          className="point-num"
          style={{ animationDelay: `${i * 700}ms` }}
        >
          {n}
        </b>
      ))}
      <strong className="point-word" ref={word}>
        Point!
      </strong>
    </div>,
    document.body,
  );
}
