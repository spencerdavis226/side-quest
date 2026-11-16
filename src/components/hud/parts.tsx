import type { ReactNode } from "react";
import type { HudTrack } from "./model";

// Pieces both HUDs share: a status button, the floating damage number, and
// the place's track. Each skin styles them (`hud-league.css`,
// `hud-quest.css`).

/** A button on the status line: a mark and a number, nothing else. It
 * keeps a `data-fly` target so items, badges and runes fly into it, and a
 * full spoken label. A 44px target round a small mark. */
export function StatusButton({
  className,
  label,
  fly,
  disabled,
  onOpen,
  children,
}: {
  className: string;
  label: string;
  fly?: string;
  disabled: boolean;
  onOpen: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`hud-stat ${className}`}
      data-fly={fly}
      aria-label={label}
      aria-haspopup="dialog"
      disabled={disabled}
      onClick={(event) => {
        // Safari does not focus a tapped button; the tray gives focus back.
        event.currentTarget.focus();
        onOpen();
      }}
    >
      {children}
    </button>
  );
}

/** The change in hearts (`useHeartPulse`), floating off the gauge it sits
 * in. */
export function HeartSplat({
  hearts,
  pulse,
  delta,
}: {
  hearts: number;
  pulse: "" | "hurt" | "heal";
  delta: number;
}) {
  if (!pulse) return null;
  return (
    <span
      className={`heart-splat splat-${pulse}`}
      key={`splat-${hearts}`}
      aria-hidden="true"
    >
      {delta > 0 ? `+${delta}` : `−${-delta}`}
    </span>
  );
}

/** The place's track: pips for the region's encounters, pips for a boss's
 * swings, or nothing for a mark (the skin draws the mark). */
export function Track({ track }: { track: HudTrack }) {
  if (track.kind === "rooms")
    return (
      <span className="hud-pips room-pips" aria-hidden="true">
        {Array.from({ length: track.rooms }, (_, i) => (
          <i
            key={i}
            className={
              i < track.room - 1 ? "done" : i === track.room - 1 ? "here" : ""
            }
          />
        ))}
      </span>
    );
  if (track.kind === "hits")
    return (
      <span className="hud-pips boss-pips" aria-hidden="true">
        {Array.from({ length: track.need }, (_, i) => (
          <i
            key={i < track.hits ? `hit-${i}` : `left-${i}`}
            className={i < track.hits ? "hit" : undefined}
          />
        ))}
      </span>
    );
  return null;
}
