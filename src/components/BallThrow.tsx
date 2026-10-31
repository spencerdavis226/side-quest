import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// The ball throw, played big (2026-10-31, owner: "much more exciting to
// watch"): the table dims, the ball spins while a reel of numbers runs like
// a slot machine, both slow and stop together on the face the engine already
// threw, then confetti for a catch or a burst for one that got away. The
// result was committed before this plays (`party.throw`), so it is display
// only: a reload shows the card's result and never plays it again, a tap
// skips it, and Reduced Motion or a hidden tab skips it outright.

/** How long the ball spins and the reel runs before it lands. */
const SPIN_MS = 2300;
/** How long the result shows before the table comes back. */
const RESULT_MS = 1700;
/** The reel's ticks: quick at first, then each slower, ending on the face. */
const reelTicks = () => {
  const ticks: number[] = [];
  let at = 0;
  let gap = 45;
  while (at + gap < SPIN_MS - gap * 0.6) {
    at += gap;
    ticks.push(at);
    gap *= 1.11;
  }
  return ticks;
};

export interface ThrownBall {
  face: number;
  need: number;
  caught: boolean;
}

const quiet = () =>
  document.hidden ||
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Confetti, scattered once per catch. */
const CONFETTI = Array.from({ length: 30 }, (_, i) => {
  const angle = (i / 30) * Math.PI * 2 + (i % 3) * 0.3;
  const reach = 34 + ((i * 37) % 26);
  return {
    x: `${Math.cos(angle) * reach}vmin`,
    y: `${Math.sin(angle) * reach - 8}vmin`,
    r: `${((i * 97) % 720) - 360}deg`,
    c: ["#f2c94c", "#e2574c", "#5aa9e6", "#7bd389", "#f5f0e6"][i % 5],
    d: `${650 + (i % 6) * 25}ms`,
  };
});

export function BallThrowStage({
  ball,
  throwKey,
  name,
}: {
  ball: ThrownBall | null;
  /** One key per throw (the card and its place in the game); a new key while
   * mounted is a live throw. */
  throwKey: string | null;
  /** The Pokémon's name, for the verdict. */
  name: string;
}) {
  const seen = useRef(throwKey);
  const [live, setLive] = useState<string | null>(null);
  const [phase, setPhase] = useState<"spin" | "result">("spin");
  const [shown, setShown] = useState(1);
  useEffect(() => {
    const was = seen.current;
    seen.current = throwKey;
    if (throwKey && throwKey !== was && ball && !quiet()) {
      setLive(throwKey);
      setPhase("spin");
    }
  }, [throwKey, ball]);
  useEffect(() => {
    if (!live || !ball) return;
    const timers = reelTicks().map((at) =>
      setTimeout(
        () =>
          setShown((was) => {
            // Never repeat the last number or hint at the real face early.
            let n = 1 + Math.floor(Math.random() * 20);
            while (n === was || n === ball.face)
              n = 1 + Math.floor(Math.random() * 20);
            return n;
          }),
        at,
      ),
    );
    timers.push(
      setTimeout(() => {
        setShown(ball.face);
        setPhase("result");
      }, SPIN_MS),
      setTimeout(() => setLive(null), SPIN_MS + RESULT_MS),
    );
    const away = () => document.hidden && setLive(null);
    document.addEventListener("visibilitychange", away);
    return () => {
      timers.forEach(clearTimeout);
      document.removeEventListener("visibilitychange", away);
    };
  }, [live, ball]);
  if (!live || !ball) return null;
  const result = phase === "result";
  const verdict = ball.caught ? "caught" : "fled";
  return createPortal(
    <div
      className={`ball-stage ${result ? `landed ${verdict}` : "spinning"}`}
      aria-hidden="true"
      onPointerDown={(event) => {
        event.stopPropagation();
        setLive(null);
      }}
    >
      <div className="ball-stage-ball">
        <span className="ball-stage-top" />
        <span className="ball-stage-bottom" />
        <span className="ball-stage-button" />
      </div>
      <div className="ball-stage-reel">
        <b key={shown}>{result ? ball.face : shown}</b>
        <small>needs {ball.need}+</small>
      </div>
      {result && (
        <p className="ball-stage-verdict">
          {ball.caught
            ? `Gotcha! ${name} was caught!`
            : `Oh no! ${name} broke free!`}
        </p>
      )}
      {result && ball.caught && (
        <div className="ball-stage-confetti">
          {CONFETTI.map((p, i) => (
            <i
              key={i}
              style={
                {
                  "--x": p.x,
                  "--y": p.y,
                  "--r": p.r,
                  "--c": p.c,
                  animationDelay: p.d,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
