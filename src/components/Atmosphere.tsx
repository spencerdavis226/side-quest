import { useEffect, useState } from "react";

/** After this long without a tap the table goes still (owner, 2026-10-18). */
export const IDLE_MS = 60_000;

export function Atmosphere({ hidden }: { hidden: boolean }) {
  const idle = useIdle(IDLE_MS);
  return (
    <div
      className={`atmosphere${hidden ? " suspended" : ""}${idle ? " idle" : ""}`}
      aria-hidden="true"
    >
      <div className="firelight" />
      <div className="candle" />
      <div className="embers">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <i className={`ember ember-${i}`} key={i} />
        ))}
      </div>
      <div className="dust">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <i className={`dust-${i}`} key={i} />
        ))}
      </div>
    </div>
  );
}

/** True once `ms` pass without a tap or a key; the next one clears it. A
 * game left on the table for hours keeps the screen awake, so its backdrop
 * should not keep redrawing it. */
function useIdle(ms: number) {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    let id = window.setTimeout(() => setIdle(true), ms);
    const wake = () => {
      setIdle(false);
      window.clearTimeout(id);
      id = window.setTimeout(() => setIdle(true), ms);
    };
    window.addEventListener("pointerdown", wake, true);
    window.addEventListener("keydown", wake, true);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("pointerdown", wake, true);
      window.removeEventListener("keydown", wake, true);
    };
  }, [ms]);
  return idle;
}
