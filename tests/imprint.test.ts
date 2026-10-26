import { expect, test } from "vitest";
import { cards } from "../src/content/catalog";
import {
  defaultIcons,
  imprintAssignments,
  imprintIconSlugs,
  ornamentIcons,
  tintNames,
} from "../src/content/imprint";
import { fnv1a, resolveImprint } from "../src/presentation/imprint";
import {
  imprintIcons,
  imprintSpriteSlugs,
} from "../src/presentation/imprint/icons.generated";
import { normalizeIcon } from "../src/presentation/imprint/normalize";

test("unassigned cards resolve a complete fallback imprint", () => {
  for (const id of ["future.new-card", "other.expansion-card"]) {
    const imprint = resolveImprint(id);
    expect(defaultIcons).toContain(imprint.icon);
    expect(ornamentIcons).toContain(imprint.ornament);
    expect(tintNames).toContain(imprint.tint);
    expect(imprint.inkOpacity).toBeGreaterThan(0);
    expect(imprint.inkOpacity).toBeLessThanOrEqual(0.13);
  }
});

test("the resolver is deterministic and never random", () => {
  for (const card of cards) {
    expect(resolveImprint(card.id)).toEqual(resolveImprint(card.id));
  }
  // Distinct ids are allowed to collide, but must not collapse to one look.
  const signatures = new Set(
    cards.map((card) => {
      const { icon, ornament, tint, iconRotation, phaseX, phaseY } =
        resolveImprint(card.id);
      return [icon, ornament, tint, iconRotation, phaseX, phaseY].join("|");
    }),
  );
  expect(signatures.size).toBeGreaterThan(cards.length / 2);
});

test("an assignment overrides the derived fallback", () => {
  const assigned = resolveImprint("core.house-special");
  expect(assigned.icon).toBe(imprintAssignments["core.house-special"]!.icon);
  expect(assigned.tint).toBe("amber");
  expect(assigned.tintColor).toBe("#d9a355");
  expect(assigned.tintOpacity).toBeGreaterThan(0);
});

test("assigned slugs are real vendored icons", () => {
  for (const [cardId, assignment] of Object.entries(imprintAssignments)) {
    for (const slug of [assignment.icon, assignment.ornament]) {
      if (!slug) continue;
      expect(
        imprintIcons[slug],
        `${cardId} references a slug missing from the generated sprite: ${slug}`,
      ).toBeTruthy();
    }
  }
});

test("the generated sprite is complete and in sync with the pools", () => {
  expect([...imprintSpriteSlugs].sort()).toEqual(imprintIconSlugs());
  for (const slug of imprintIconSlugs()) {
    const geometry = imprintIcons[slug];
    expect(geometry, slug).toBeTruthy();
    // The lattice paints one colour, so no baked-fill artwork may slip through.
    expect(geometry).not.toMatch(/(?:fill|stroke|style|class)="/);
    expect(geometry).not.toContain("M0 0h512v512H0z");
  }
});

test("icon normalization strips the background plate and inherits colour", () => {
  const source =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">' +
    '<path d="M0 0h512v512H0z"/><path fill="#fff" d="M10 10h20v20H10z"/></svg>';
  expect(normalizeIcon("test/icon", source)).toBe(
    '<path d="M10 10h20v20H10z"/>',
  );
  expect(() =>
    normalizeIcon(
      "test/icon",
      '<svg viewBox="0 0 100 100"><path d="M0 0h1v1H0z"/></svg>',
    ),
  ).toThrow(/viewBox/);
});

test("the hash is stable for a given card id", () => {
  expect(fnv1a("core.house-special")).toBe(fnv1a("core.house-special"));
  expect(fnv1a("core.house-special")).not.toBe(fnv1a("core.house-specia1"));
});

 test("every current card has a curated assignment", () => {
 for (const card of cards) expect(imprintAssignments[card.id], card.id).toBeDefined();
 });
