import { useId } from "react";
import type { QuestState } from "../game/types";
import { finaleStage, runNames } from "../game/engine";
import { questArt, type QuestArt } from "../presentation/quest-art.generated";
import { LAIR_WORDS, QUEST_MAP } from "./crawlTheme";

// The Quest's map (The Quest 2.0 Phase 5; redrawn as an inked parchment in
// The Quest 2.1): deckled paper with grain and old stains, the City Gate at
// the foot, two rows of three regions each drawn as its own terrain mark in
// a medallion, an inn between them, the last inn, and the lair at the head
// under the dragon's mark. Roads curve between them in faint dashes; the
// road taken is inked over them, its last leg drawn in as the map opens. A
// region offered and not yet chosen glows gold with its three words; one
// passed by is faded; the one closed by the road card is struck through.
// The party's token stands where the run is. Inline SVG, no image assets.
// Display only.

type Spot = { x: number; y: number };
const ROWS = [282, 152];
const COLS = [58, 150, 242];
const GATE: Spot = { x: 150, y: 352 };
const INNS: Spot[] = [
  { x: 150, y: 218 },
  { x: 150, y: 92 },
];
const LAIR: Spot = { x: 150, y: 38 };

/** Each region's mark (`scripts/quest-art.ts`). */
const TERRAIN: Record<string, QuestArt> = {
  "The King's Road": "road",
  "The Old Forest": "forest",
  "The Marsh": "marsh",
  "The Haunted Crypt": "crypt",
  "The Goblin Mines": "mines",
  "The Wizard's Tower": "tower",
};

/** Where the run stands on the map: each region lit, taken or closed, and
 * how far along the party is. */
export function mapState(quest: QuestState) {
  const here = finaleStage(quest).stage;
  const index = (label: string) =>
    quest.stages.findIndex((st) => st.label === label);
  const dropped = new Set((quest.dropped ?? []).map((st) => st.label));
  const regions = QUEST_MAP.map((row, depth) =>
    row.map((r, col) => {
      const at = index(r.label);
      const inRun = at >= 0;
      // Offered and not yet chosen: tagged with a road.
      const open = inRun && quest.stages[at].route !== undefined && at > here;
      return {
        ...r,
        depth,
        col,
        inRun,
        open,
        // The road not taken (Phase 5 keeps it for a replay): passed by,
        // not closed.
        bypassed: !inRun && dropped.has(r.label),
        passed: inRun && at < here,
        current: at === here,
      };
    }),
  );
  const { lair } = runNames(quest);
  const lairLabel = lair?.replace(/^the /, "The ");
  const lairAt = lairLabel ? index(lairLabel) : -1;
  return {
    regions,
    lair: lairLabel,
    lairWords: lairLabel ? LAIR_WORDS[lairLabel] : undefined,
    atLair: lairAt >= 0 && here >= lairAt,
  };
}

/** A gentle curve from `a` to `b`, bowed to one side. */
const curve = (a: Spot, b: Spot, bow = 0.18) => {
  const mx = (a.x + b.x) / 2 + (b.y - a.y) * bow;
  const my = (a.y + b.y) / 2 - (b.x - a.x) * bow;
  return `M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}`;
};

/** An emblem from the sprite, centred on `at`, `size` across. */
function Emblem({
  name,
  at,
  size,
  className,
}: {
  name: QuestArt;
  at: Spot;
  size: number;
  className?: string;
}) {
  const k = size / 512;
  return (
    <path
      className={className}
      d={questArt[name]}
      transform={`translate(${at.x - size / 2} ${at.y - size / 2}) scale(${k})`}
    />
  );
}

export function QuestMap({
  quest,
  className = "",
  words = true,
  draw = false,
}: {
  quest: QuestState;
  className?: string;
  /** Show each lit region's three words. */
  words?: boolean;
  /** Ink the last leg of the road in as the map appears (the moments). */
  draw?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const state = mapState(quest);
  const spot = (depth: number, col: number): Spot => ({
    x: COLS[col],
    y: ROWS[depth],
  });
  // The road drawn so far: the gate, each region taken and passed, the
  // inns between, and the lair once reached.
  const path: Spot[] = [GATE];
  let token: Spot = GATE;
  for (const [depth, row] of state.regions.entries()) {
    const taken = row.find((r) => r.passed || r.current);
    if (!taken) break;
    path.push(spot(depth, taken.col));
    token = spot(depth, taken.col);
    if (taken.passed) {
      path.push(INNS[depth]);
      token = INNS[depth];
    }
  }
  if (state.atLair) {
    path.push(LAIR);
    token = LAIR;
  }
  const legs = path.slice(1).map((p, i) => curve(path[i], p));
  const summary = state.regions
    .flat()
    .filter((r) => r.inRun)
    .map((r) => (r.open ? `${r.label} (open)` : r.label))
    .join(", ");
  return (
    <svg
      className={`quest-map ${draw ? "drawing" : ""} ${className}`}
      viewBox="0 0 300 380"
      role="img"
      aria-label={`The map: ${summary}${state.lair ? `; the lair, ${state.lair}` : ""}`}
    >
      <defs>
        <radialGradient id={`paper-${id}`} cx="50%" cy="45%" r="70%">
          <stop offset="0" stopColor="#f3e3bd" />
          <stop offset="0.7" stopColor="#e6cf9c" />
          <stop offset="1" stopColor="#c8a66a" />
        </radialGradient>
        <filter id={`grain-${id}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            seed="3"
          />
          <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.24  0 0 0 0 0.1  0 0 0 0.22 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <filter id={`stain-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02"
            numOctaves="3"
            seed="11"
          />
          <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.3  0 0 0 0 0.12  0 0 0 0.9 -0.35" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <radialGradient id={`glow-${id}`}>
          <stop offset="0" stopColor="#ffd86a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffd86a" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* The paper: a deckled sheet, its grain and its stains. */}
      <path
        className="map-paper"
        fill={`url(#paper-${id})`}
        d="M10 14 Q40 6 80 11 T160 9 T236 12 T290 10 Q296 60 292 120 T294 240 T290 372 Q240 376 180 371 T80 374 T12 370 Q6 300 10 220 T8 100 Z"
      />
      <path
        filter={`url(#grain-${id})`}
        d="M10 14 Q40 6 80 11 T160 9 T236 12 T290 10 Q296 60 292 120 T294 240 T290 372 Q240 376 180 371 T80 374 T12 370 Q6 300 10 220 T8 100 Z"
      />
      <rect
        x="10"
        y="10"
        width="282"
        height="362"
        filter={`url(#stain-${id})`}
        opacity="0.35"
      />
      <rect className="map-rule" x="20" y="20" width="262" height="342" />
      <rect className="map-rule thin" x="25" y="25" width="252" height="332" />
      <Emblem
        name="compass"
        at={{ x: 254, y: 334 }}
        size={30}
        className="map-compass"
      />
      {/* The roads every run can take, faint. */}
      {state.regions.map((row, depth) =>
        row.map((r) => {
          const from = depth === 0 ? GATE : INNS[0];
          const to = spot(depth, r.col);
          const next = depth === 0 ? INNS[0] : INNS[1];
          return (
            <g key={`road-${r.label}`} className="map-road">
              <path d={curve(from, to, 0.12)} />
              <path d={curve(to, next, -0.12)} />
            </g>
          );
        }),
      )}
      <path className="map-road" d={curve(INNS[1], LAIR)} />
      {/* The road taken, inked; its last leg drawn in. */}
      {legs.map((d, i) => (
        <path
          key={i}
          className={`map-inked${i === legs.length - 1 ? " last" : ""}`}
          d={d}
          pathLength={1}
        />
      ))}
      <g className="map-stop gate">
        <Emblem name="gate" at={GATE} size={26} />
        <text className="map-name" x={GATE.x} y={GATE.y + 22}>
          City Gate
        </text>
      </g>
      {INNS.map((inn, i) => (
        <g key={i} className="map-stop inn">
          <circle cx={inn.x} cy={inn.y} r="9" />
          <Emblem name="inn" at={inn} size={13} />
        </g>
      ))}
      {state.regions.flat().map((r) => {
        const p = spot(r.depth, r.col);
        const cls = [
          "map-region",
          r.inRun ? "lit" : r.bypassed ? "bypassed" : "closed",
          r.open ? "open" : "",
          r.passed ? "passed" : "",
          r.current ? "current" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <g key={r.label} className={cls}>
            {r.open && (
              <circle
                className="map-halo"
                cx={p.x}
                cy={p.y}
                r="30"
                fill={`url(#glow-${id})`}
              />
            )}
            <circle className="map-medal" cx={p.x} cy={p.y} r="17" />
            <Emblem
              name={TERRAIN[r.label] ?? "road"}
              at={p}
              size={22}
              className="map-terrain"
            />
            <text className="map-name" x={p.x} y={p.y + 30}>
              {r.label.replace(/^The /, "")}
            </text>
            {words && r.open && (
              <text className="map-words" x={p.x} y={p.y + 42}>
                {r.words}
              </text>
            )}
            {!r.inRun && !r.bypassed && (
              <path
                className="map-cross"
                d={`M${p.x - 20} ${p.y + 12}L${p.x + 20} ${p.y - 12}`}
              />
            )}
          </g>
        );
      })}
      <g className={`map-lair${state.atLair ? " reached" : ""}`}>
        <circle className="map-lair-ring" cx={LAIR.x} cy={LAIR.y} r="19" />
        <Emblem name="dragon" at={LAIR} size={28} className="map-dragon" />
        {state.lair && (
          <text className="map-name lair-name" x={LAIR.x} y={LAIR.y + 32}>
            {state.lair.replace(/^The /, "")}
          </text>
        )}
      </g>
      {/* The party, where the run stands. */}
      <g
        className="map-token"
        transform={`translate(${token.x + 15} ${token.y - 16})`}
      >
        <path d="M0 -9 L7 -6 L7 2 Q7 8 0 11 Q-7 8 -7 2 L-7 -6 Z" />
        <path className="map-token-mark" d="M0 -5 L2 0 L0 5 L-2 0 Z" />
      </g>
    </svg>
  );
}
