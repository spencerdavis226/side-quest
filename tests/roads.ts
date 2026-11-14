import { chooseRoad } from "../src/game/engine";
import type { SessionState } from "../src/game/types";

// The road (The Quest 2.0 Phase 5) for tests: a run holds both regions the
// table may choose until it chooses. `roadDraw(r)` is the random draw that
// leaves region `r` (0 to 2 at its depth) on the road (it leaves out the
// next one), and `takeRoads` makes both choices at once, keeping the
// regions named (or each choice's first road), so a test can read the run
// as it will be dealt. Both choices are made without dealing anything.
export const roadDraw = (region: number) => (((region + 1) % 3) + 0.5) / 3;

/** The run with each road chosen: `labels` names the region kept at each
 * choice (default: the first road offered). */
export function takeRoads(s: SessionState, labels: string[] = []) {
  if (!s.quest) return s;
  let q = s.quest;
  let n = 0;
  for (let i = 0; i < q.stages.length; i++) {
    const choice = q.stages[i].cards.some((c) =>
      c.offers?.some((o) => o.route !== undefined),
    );
    if (!choice || q.stages[i + 1]?.route === undefined) continue;
    const want = labels[n++];
    const tagged = q.stages.slice(i + 1).find((st) => st.label === want);
    q = chooseRoad(q, i, tagged?.route ?? 0);
  }
  return { ...s, quest: q };
}
