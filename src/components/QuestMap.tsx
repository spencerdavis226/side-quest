import type { QuestState } from "../game/types";
import { finaleStage, runNames } from "../game/engine";
import { LAIR_WORDS, QUEST_MAP } from "./crawlTheme";

// The Quest's map (The Quest 2.0 Phase 5, 2026-11-14): a parchment with the
// City Gate at the bottom, a row of three regions, the inn, a row of three,
// the last inn and the lair at the top under the dragon's mark. A region in
// the run is lit (both roads offered, until the table picks one); one left
// out or passed over is greyed; stops already passed are inked, and the
// road drawn through them. Inline SVG, no image assets. Display only.

type Spot = { x: number; y: number };
const ROWS = [280, 150];
const COLS = [55, 150, 245];
const GATE: Spot = { x: 150, y: 352 };
const INNS: Spot[] = [
  { x: 150, y: 215 },
  { x: 150, y: 88 },
];
const LAIR: Spot = { x: 150, y: 34 };

/** Where the run stands on the map: each region lit, taken or closed, and
 * how far along the party is. */
export function mapState(quest: QuestState) {
  const here = finaleStage(quest).stage;
  const index = (label: string) =>
    quest.stages.findIndex((st) => st.label === label);
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

export function QuestMap({
  quest,
  className = "",
  words = true,
}: {
  quest: QuestState;
  className?: string;
  /** Show each lit region's three words. */
  words?: boolean;
}) {
  const state = mapState(quest);
  const spot = (depth: number, col: number): Spot => ({
    x: COLS[col],
    y: ROWS[depth],
  });
  // The road drawn so far: the gate, each region taken and passed, the
  // inns between, and the lair once reached.
  const path: Spot[] = [GATE];
  for (const [depth, row] of state.regions.entries()) {
    const taken = row.find((r) => r.passed || r.current);
    if (!taken) break;
    path.push(spot(depth, taken.col));
    if (taken.passed) path.push(INNS[depth]);
  }
  if (state.atLair) path.push(LAIR);
  const summary = state.regions
    .flat()
    .filter((r) => r.inRun)
    .map((r) => (r.open ? `${r.label} (open)` : r.label))
    .join(", ");
  return (
    <svg
      className={`quest-map ${className}`}
      viewBox="0 0 300 380"
      role="img"
      aria-label={`The map: ${summary}${state.lair ? `; the lair, ${state.lair}` : ""}`}
    >
      <rect
        className="map-paper"
        x="4"
        y="4"
        width="292"
        height="372"
        rx="14"
      />
      {/* The roads every run can take, faint. */}
      {state.regions.map((row, depth) =>
        row.map((r) => {
          const from = depth === 0 ? GATE : INNS[0];
          const to = spot(depth, r.col);
          const next = depth === 0 ? INNS[0] : INNS[1];
          return (
            <g key={`road-${r.label}`} className="map-road">
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
              <line x1={to.x} y1={to.y} x2={next.x} y2={next.y} />
            </g>
          );
        }),
      )}
      <line
        className="map-road"
        x1={INNS[1].x}
        y1={INNS[1].y}
        x2={LAIR.x}
        y2={LAIR.y}
      />
      {/* The road taken, inked. */}
      {path.length > 1 && (
        <polyline
          className="map-inked"
          points={path.map((p) => `${p.x},${p.y}`).join(" ")}
        />
      )}
      <g className="map-stop gate">
        <circle cx={GATE.x} cy={GATE.y} r="7" />
        <text x={GATE.x} y={GATE.y + 20}>
          City Gate
        </text>
      </g>
      {INNS.map((inn, i) => (
        <g key={i} className="map-stop inn">
          <rect x={inn.x - 6} y={inn.y - 6} width="12" height="12" rx="2" />
        </g>
      ))}
      {state.regions.flat().map((r) => {
        const p = spot(r.depth, r.col);
        const cls = [
          "map-region",
          r.inRun ? "lit" : "closed",
          r.open ? "open" : "",
          r.passed ? "passed" : "",
          r.current ? "current" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <g key={r.label} className={cls}>
            <circle cx={p.x} cy={p.y} r="11" />
            <text className="map-name" x={p.x} y={p.y + 25}>
              {r.label.replace(/^The /, "")}
            </text>
            {words && r.open && (
              <text className="map-words" x={p.x} y={p.y + 38}>
                {r.words}
              </text>
            )}
            {!r.inRun && (
              <path
                className="map-cross"
                d={`M${p.x - 6} ${p.y - 6}l12 12M${p.x + 6} ${p.y - 6}l-12 12`}
              />
            )}
          </g>
        );
      })}
      <g className={`map-lair${state.atLair ? " reached" : ""}`}>
        <path
          d={`M${LAIR.x} ${LAIR.y - 14}l10 8-4 12h-12l-4-12z`}
          className="map-dragon"
        />
        {state.lair && (
          <text className="map-name" x={LAIR.x + 20} y={LAIR.y + 4}>
            {state.lair.replace(/^The /, "")}
          </text>
        )}
      </g>
    </svg>
  );
}
