import { lazy, Suspense, useEffect, useState } from "react";
import { dragonColors } from "../presentation/dragon-colors";
import type { lairScene } from "./crawlTheme";

/** The backdrop couldn't load (offline before it was cached). */
const NoBackdrop = () => <></>;
const LairBackdrop = lazy(() =>
  import("./LairBackdrop").catch(() => ({ default: NoBackdrop })),
);

/** After this long without a tap the table goes still (owner, 2026-10-18). */
export const IDLE_MS = 60_000;

/** The table's backdrop. `scene` (The Quest, 2026-10-31) recolours the
 * same glow and motes for the place the run has reached (theme.css,
 * `[data-scene]`): snow on the Frozen Pass, bubbles in the Marsh, stars
 * over the Wizard's Tower. Its glow fades in when the scene changes. */
export function Atmosphere({
  hidden,
  scene,
  lair,
}: {
  hidden: boolean;
  scene?: string;
  /** The dragon battle in play (The Quest 2.1): its lair, living. */
  lair?: ReturnType<typeof lairScene>;
}) {
  const idle = useIdle(IDLE_MS);
  const [bright, deep] = dragonColors(lair?.id);
  return (
    <div
      className={`atmosphere${hidden ? " suspended" : ""}${idle ? " idle" : ""}`}
      data-scene={scene}
      aria-hidden="true"
    >
      <div className="scene-light" key={scene ?? "table"}>
        <div className="firelight" />
        <div className="candle" />
      </div>
      {lair && (
        <Suspense fallback={null}>
          <LairBackdrop
            scene={lair.scene}
            bright={bright}
            deep={deep}
            enraged={lair.enraged}
            paused={hidden || idle}
          />
        </Suspense>
      )}
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
export function useIdle(ms: number) {
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
