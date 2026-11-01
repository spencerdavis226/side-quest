import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

// The ball throw, played big (2026-10-31, owner: "much more exciting to
// watch"), as a hollow donut ball with one number in its hole. One eased value
// turns the ring (a whole number of turns, ending upright) while the number
// counts through a shuffled strip, slowing with it and settling on the
// engine's committed face while the ball is still turning, so the face is
// steady on screen before the ball rests; nothing is swapped at the landing. The strip's order is random every throw,
// never sequential. The throw is snapshotted when it starts, so a parent
// re-render (the ball object is new every render) can never restart it.
// Display only: a reload shows the card's result and never plays it again, a
// tap skips it, and Reduced Motion or a hidden tab skips it outright. Catch: a
// shake, a gold glow and confetti. Break free: the top half flies off and the
// room flashes red. The Master Ball (2026-11-01) is the same throw in purple,
// and its face is always 20.

/** How long the ball spins and counts, in ms. */
const SPIN_MS = 2600;
/** How long the result shows before the table comes back. */
const RESULT_MS = 1700;
/** Full laps of 1 to 20 shown before the face. */
const LAPS = 4;
/** Turns the ball makes while its number counts to the face. */
const TURNS = 5;

/** The ball's turn: fast, then slower to a stop at exactly 1 over the whole
 * spin. */
const easeTurn = (t: number) => 1 - Math.pow(1 - t, 2.2);
/** The count reaches the face at this share of the spin, so the final number
 * is on screen, steady, while the ball is still visibly turning. Earlier it
 * changed at the very last instant, when the ball had all but stopped, so the
 * ball seemed to stop on one number and then show another (owner, 2026-10-31). */
const COUNT_DONE = 0.82;
/** The count: fast, then slower, reaching exactly 1 at `COUNT_DONE`. */
const easeCount = (t: number) =>
  1 - Math.pow(1 - Math.min(1, t / COUNT_DONE), 2.4);

export interface ThrownBall {
  face: number;
  need: number;
  caught: boolean;
  /** The Master Ball (2026-11-01): purple, and always a 20. */
  master?: boolean;
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

/** The numbers shown, in order: `LAPS` shuffled laps of 1 to 20, then a last
 * lap with the face at a random spot. Order is display only; `stop` is the
 * face's index and the last number shown. */
function buildCount(face: number) {
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
  return { rows: rows.slice(0, at + 1), stop: at };
}

/** The ball: a hollow ring (red over white, a black band, a hole) turned by
 * two eased values that share one clock: the count slows as the ball does, and
 * settles on the face a little before the ball comes to rest. It turns a whole number of times, ending upright
 * for the landing animations. Per-frame work touches the DOM directly, not
 * React. */
function DonutBall({
  count,
  landed,
  onLanded,
}: {
  count: { rows: number[]; stop: number };
  landed: boolean;
  onLanded: () => void;
}) {
  const ring = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLElement>(null);
  const done = useRef(onLanded);
  done.current = onLanded;
  useEffect(() => {
    if (landed) return;
    const t0 = performance.now();
    let shownAt = -1;
    let frame = 0;
    const draw = (t: number) => {
      if (ring.current)
        ring.current.style.transform = `rotate(${easeTurn(t) * TURNS * 360}deg)`;
      const at = Math.min(count.stop, Math.floor(easeCount(t) * count.stop));
      if (at !== shownAt && num.current) {
        shownAt = at;
        num.current.textContent = String(count.rows[at]);
        // The last number is the face: a bigger pulse says "this one".
        const last = at === count.stop;
        num.current.animate?.(
          [
            { transform: `scale(${last ? 1.35 : 1.14})` },
            { transform: "scale(1)" },
          ],
          { duration: last ? 260 : 80, easing: "ease-out" },
        );
      }
    };
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / SPIN_MS);
      draw(t);
      if (t < 1) frame = requestAnimationFrame(step);
      else done.current();
    };
    draw(0);
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [count, landed]);
  // However it ended (the backstop included), rest upright on the face.
  useEffect(() => {
    if (!landed) return;
    if (ring.current) ring.current.style.transform = "rotate(0deg)";
    if (num.current) num.current.textContent = String(count.rows[count.stop]);
  }, [landed, count]);
  return (
    <div className="ball-donut">
      <div className="ball-donut-ring" ref={ring}>
        <span className="ball-donut-half top" />
        <span className="ball-donut-half bottom" />
      </div>
      <b className="ball-donut-number" ref={num}>
        {count.rows[0]}
      </b>
    </div>
  );
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
      // Backstop if the animation frames stop (a hidden tab).
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
  const count = useMemo(
    () => (live ? buildCount(live.ball.face) : null),
    [live],
  );
  if (!live || !count) return null;
  const thrown = live.ball;
  const verdict = thrown.caught ? "caught" : "fled";
  return createPortal(
    <div
      className={`ball-stage ${landed ? `landed ${verdict}` : "spinning"}${thrown.master ? " master" : ""}`}
      aria-hidden="true"
      onPointerDown={(event) => {
        event.stopPropagation();
        setLive(null);
      }}
    >
      <div className="ball-stage-reel">
        <DonutBall
          count={count}
          landed={landed}
          onLanded={() => setLanded(true)}
        />
        <small>{thrown.master ? "Master Ball" : `needs ${thrown.need}+`}</small>
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
