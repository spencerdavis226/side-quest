import { describe, expect, it } from "vitest";
import {
  extrasLayout,
  foldBranches,
  MAX_PLAQUES,
} from "../src/components/extras";
import { cards } from "../src/content/catalog";

const short = { long: false };
const long = { long: true };

describe("extrasLayout", () => {
  it("shows nothing without actions", () => {
    expect(extrasLayout([], true)).toBe("none");
    expect(extrasLayout([], false)).toBe("none");
  });

  it("beside Won and Lost, keeps one short action and sends the rest to the sheet", () => {
    expect(extrasLayout([short], true)).toBe("inline");
    expect(extrasLayout([long], true)).toBe("sheet");
    expect(extrasLayout([short, short], true)).toBe("sheet");
  });

  it("without a verdict, lets one action or two short ones share the foot", () => {
    expect(extrasLayout([long], false)).toBe("inline");
    expect(extrasLayout([short, short], false)).toBe("inline");
    expect(extrasLayout([short, long], false)).toBe("sheet");
  });

  it("never lays out more than three plaques, whatever the count", () => {
    for (let n = 1; n <= 10; n++) {
      const set = Array.from({ length: n }, () => short);
      for (const verdict of [true, false]) {
        const inline = extrasLayout(set, verdict) === "inline";
        const plaques = inline ? n + (verdict ? 2 : 0) : 1 + (verdict ? 2 : 0);
        expect(plaques).toBeLessThanOrEqual(3);
      }
    }
  });
});

// Never more than three across (owner, 2026-10-31). A card's offers are
// at most three (validateCatalog); a branching evolution adds a plaque per
// form, so it folds into one Evolve plaque whenever that would pass three.
describe("never more than three plaques on a card's foot", () => {
  const branching = cards.filter((c) => c.branches && c.evolves?.length);
  const evolving = cards.filter((c) => c.offers?.some((o) => o.evolve));
  it("finds the branching starters and the evolution cards", () => {
    expect(branching.length).toBeGreaterThan(0);
    expect(evolving.length).toBeGreaterThan(0);
  });
  it.each(evolving.map((c) => [c.id, c] as const))(
    "%s fits for every starter",
    (_, card) => {
      for (const starter of branching) {
        const forms = starter.evolves!.length;
        const across = card.offers!.length - 1 + forms;
        const shown = foldBranches(across, forms)
          ? card.offers!.length
          : across;
        expect(shown).toBeLessThanOrEqual(MAX_PLAQUES);
      }
      expect(card.offers!.length).toBeLessThanOrEqual(MAX_PLAQUES);
    },
  );
});
