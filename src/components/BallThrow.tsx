import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

// The ball throw, played big (2026-10-31, owner: "much more exciting to
// watch"), rebuilt as a real slot reel the same day after the first version
// seemed to stop on one number and then show another. The reel is ONE strip
// of the faces 1 to 20 repeated, scrolled by ONE CSS animation to an offset
// computed from the engine's committed face, so the number under the payline
// when it stops is that face by construction: nothing is swapped, re-rolled
// or re-keyed at the landing. The ball spins for the same time; the result
// shows when the reel's animation ends (a timer is only the backstop). The
// throw is snapshotted when it starts, so a parent re-render (the ball object
// is new every render) can never restart it. Display only: a reload shows the
// card's result and never plays it again, a tap skips it, and Reduced Motion
// or a hidden tab skips it outright.

/** How long the reel runs, in ms. Mirrors `--reel-ms` in crawl.css. */
const SPIN_MS = 2600;
/** How long the result shows before the table comes back. */
const RESULT_MS = 1700;
/** Full laps of 1 to 20 before the reel reaches its face. */
const LAPS = 4;

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

/** A shuffled lap of the faces 1 to 20. */
const lap = () => {
  const faces = Array.from({ length: 20 }, (_, i) => i + 1);
  for (let i = faces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [faces[i], faces[j]] = [faces[j], faces[i]];
  }
  return faces;
};

/** The strip: `LAPS` shuffled laps of 1 to 20, then a last lap with the face
 * at a random spot in its middle (so it has a neighbour either side, none of
 * them the face). Order is display only; `stop` is the face's index. */
function buildReel(face: number) {
  const rows: number[] = [];
  for (let i = 0; i < LAPS + 1; i++) {
    const next = lap();
    // No number twice in a row where two laps meet.
    while (next[0] === rows[rows.length - 1]) next.push(next.shift()!);
    rows.push(...next);
  }
  const last = rows.length - 20;
  const at = last + 2 + Math.floor(Math.random() * 16);
  const was = rows.indexOf(face, last);
  [rows[at], rows[was]] = [rows[was], rows[at]];
  return { rows: rows.slice(0, at + 2), stop: at };
}

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
  const [live, setLive] = useState<{ key: string; ball: ThrownBall } | null>(
    null,
  );
  const [landed, setLanded] = useState(false);
  useEffect(() => {
    const was = seen.current;
    seen.current = throwKey;
    if (throwKey && throwKey !== was && ball && !quiet()) {
      // Snapshot: the throw plays from these values whatever re-renders follow.
      setLive({ key: throwKey, ball: { ...ball } });
      setLanded(false);
    }
    // `ball` is a new object every render; only a new throw key starts a throw.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [throwKey]);
  const key = live?.key;
  useEffect(() => {
    if (!key) return;
    const timers = [
      // Backstop if the reel's animationend never arrives.
      setTimeout(() => setLanded(true), SPIN_MS + 400),
    ];
    const away = () => document.hidden && setLive(null);
    document.addEventListener("visibilitychange", away);
    return () => {
      timers.forEach(clearTimeout);
      document.removeEventListener("visibilitychange", away);
    };
  }, [key]);
  // The table comes back a beat after the result lands.
  useEffect(() => {
    if (!landed) return;
    const t = setTimeout(() => setLive(null), RESULT_MS);
    return () => clearTimeout(t);
  }, [landed]);
  const reel = useMemo(() => (live ? buildReel(live.ball.face) : null), [live]);
  if (!live || !reel) return null;
  const thrown = live.ball;
  const verdict = thrown.caught ? "caught" : "fled";
  return createPortal(
    <div
      className={`ball-stage ${landed ? `landed ${verdict}` : "spinning"}`}
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
        <div className="ball-reel-window">
          <ol
            className="ball-reel-strip"
            style={{ "--stop": reel.stop } as React.CSSProperties}
            onAnimationEnd={(event) => {
              if (event.target === event.currentTarget) setLanded(true);
            }}
          >
            {reel.rows.map((n, i) => (
              <li key={i} className={i === reel.stop ? "ball-reel-face" : ""}>
                {n}
              </li>
            ))}
          </ol>
          <span className="ball-reel-line" />
        </div>
        <small>needs {thrown.need}+</small>
      </div>
      {landed && (
        <p className="ball-stage-verdict">
          {thrown.caught
            ? `Gotcha! ${name} was caught!`
            : `Oh no! ${name} broke free!`}
        </p>
      )}
      {landed && thrown.caught && (
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
