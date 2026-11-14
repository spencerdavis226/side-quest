import { useId } from "react";

// The dragon's eye (The Quest 2.1): one eye in the dark, in the dragon's
// colours (`--dragon`, `--dragon-deep` on an ancestor). Its lids open (or
// close), its slit pupil narrows on the table, and the iris is veined with
// a still turbulence. `mode` picks the motion: `open` for the lair's
// entrance, `rage` for the enrage contest (wide, then a hard narrow, a hotter
// glow), `close` for the end of the fight. Animated in CSS
// (`moments.css`, `.dragon-eye`), scaled by the moment's `--len`. Display
// only.
export function DragonEye({
  mode,
  className = "",
}: {
  mode: "open" | "rage" | "close";
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className={`dragon-eye eye-${mode} ${className}`}
      viewBox="-160 -80 320 160"
      aria-hidden="true"
    >
      <defs>
        <radialGradient
          id={`iris-${id}`}
          cx="0"
          cy="0"
          r="62"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#fff6d0" />
          <stop offset="0.28" stopColor="var(--dragon)" />
          <stop offset="0.78" stopColor="var(--dragon-deep)" />
          <stop offset="1" stopColor="#100402" />
        </radialGradient>
        <radialGradient
          id={`glow-${id}`}
          cx="0"
          cy="0"
          r="150"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="var(--dragon)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--dragon)" stopOpacity="0" />
        </radialGradient>
        <filter id={`veins-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.035 0.22"
            numOctaves="3"
            seed="7"
          />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.6 -0.75" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        {/* Hide: rows of overlapping scales, lit from above. */}
        <pattern
          id={`hide-${id}`}
          width="22"
          height="14"
          patternUnits="userSpaceOnUse"
        >
          <rect width="22" height="14" fill="#1a0805" />
          <path
            d="M0 14 A11 11 0 0 1 22 14 M-11 7 A11 11 0 0 1 11 7 M11 7 A11 11 0 0 1 33 7"
            fill="none"
            stroke="var(--dragon-deep)"
            strokeOpacity="0.55"
            strokeWidth="1.6"
          />
        </pattern>
        <clipPath id={`lids-${id}`}>
          {/* The opening between the lids: an almond. */}
          <path d="M-156 6 C-96 -82 92 -74 154 -6 C96 70 -90 84 -156 6 Z" />
        </clipPath>
      </defs>
      <ellipse
        className="eye-glow"
        cx="0"
        cy="0"
        rx="160"
        ry="80"
        fill={`url(#glow-${id})`}
      />
      <g clipPath={`url(#lids-${id})`}>
        <rect x="-160" y="-80" width="320" height="160" fill="#140503" />
        <circle
          className="eye-iris"
          cx="0"
          cy="0"
          r="62"
          fill={`url(#iris-${id})`}
        />
        <circle
          cx="0"
          cy="0"
          r="62"
          fill="#000"
          opacity="0.55"
          filter={`url(#veins-${id})`}
        />
        <ellipse
          className="eye-pupil"
          cx="0"
          cy="0"
          rx="13"
          ry="58"
          fill="#050100"
        />
        <ellipse cx="-20" cy="-26" rx="12" ry="7" fill="#fff" opacity="0.55" />
        {/* The lids: scaled, ridged hide that slides apart (or shut). */}
        <g className="eye-lid lid-top">
          <rect
            x="-160"
            y="-82"
            width="320"
            height="84"
            fill={`url(#hide-${id})`}
          />
          <path
            d="M-160 2 Q0 -14 160 2"
            fill="none"
            stroke="var(--dragon-deep)"
            strokeWidth="4"
          />
        </g>
        <g className="eye-lid lid-bottom">
          <rect
            x="-160"
            y="-2"
            width="320"
            height="84"
            fill={`url(#hide-${id})`}
          />
          <path
            d="M-160 -2 Q0 14 160 -2"
            fill="none"
            stroke="var(--dragon-deep)"
            strokeWidth="4"
          />
        </g>
      </g>
      {/* The lids' rims. */}
      <path
        className="eye-rim"
        d="M-156 6 C-96 -82 92 -74 154 -6 C96 70 -90 84 -156 6 Z"
        fill="none"
        stroke="var(--dragon-deep)"
        strokeWidth="5"
      />
    </svg>
  );
}
