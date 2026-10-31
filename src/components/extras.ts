// Where a card's optional actions go (2026-10-27). A card's foot holds Won and
// Lost, or nothing but these, and has room for two or three short plaques at
// most; items and send-ins can add up to four more. Rather than
// squeezing them into a column count, a few short ones stay on the card and
// the rest open from one "Use" plaque, a sheet with a full-width row each.

/** What the foot needs to know about each optional action. */
export interface ExtraShape {
  /** A send-in: a name too long for a third of the card. */
  long: boolean;
}

/**
 * `inline` puts each action on the card's foot as its own plaque, `sheet`
 * puts them all behind one "Use" plaque. `verdict` is true when Won and Lost
 * already take two of the three columns.
 *
 * With a verdict, one short action fits beside Won and Lost. Without one,
 * a lone action spans the foot, and two short ones share it. Anything else
 * (a long name beside Won and Lost, three of anything) goes to the sheet.
 */
export function extrasLayout(
  extras: readonly ExtraShape[],
  verdict: boolean,
): "none" | "inline" | "sheet" {
  if (extras.length === 0) return "none";
  const anyLong = extras.some((e) => e.long);
  if (verdict) return extras.length === 1 && !anyLong ? "inline" : "sheet";
  if (extras.length === 1) return "inline";
  return extras.length === 2 && !anyLong ? "inline" : "sheet";
}
