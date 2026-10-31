import { describe, expect, it } from "vitest";
import { dungeonCards, dungeonPack } from "../src/content/dungeon";
import { pokemonCards, pokemonPack } from "../src/content/pokemon";
import type { CardDefinition, QuestStage } from "../src/game/types";

// The variety pass (2026-10-31, owner: "double down on ... variety and
// interesting fun cards ... especially variety within cards"). A crawl's
// floor or route should not deal the same kind of card over and over: this
// measures each pool and holds it. The measures are rough on purpose (they
// read the card's fields and a few words of its text), so they guide; a
// human still reads the cards. Every pool must hold the floor below; a pool
// listed in REWORKED has had its variety pass and holds the higher bar.
// Add a pool to REWORKED when its pass is done.
const REWORKED = ["The Cellar", "Route 2"];

/** What the table does with a card, by its fields. */
export function kind(c: CardDefinition): string {
  if (c.press) return "push your luck";
  if (c.offers) return "choice";
  if (c.secret) return "secret";
  if (c.timer) return "timer";
  if (c.strike) return "strike";
  if (c.dice)
    return c.dice.count === 1 && c.dice.sides === 20
      ? "d20"
      : `${c.dice.count}d${c.dice.sides}`;
  if (c.battle) return "table fight";
  if (c.reward?.loot) return "item";
  if (c.encounter === "shrine") return "moment";
  return "line";
}

const others =
  /neighbor|everyone|the table|someone|anyone|pick |vote|point|whoever|player/i;
/** Only the drawer acts, and every way it can go is a bare drink or give:
 * a one-sentence setup and "Roll d20", or a line that only pours. */
function flat(c: CardDefinition): boolean {
  const said = (s: string) =>
    s
      .split(/(?<=[.!?])\s+/)
      .every(
        (x) =>
          /^(Natural (1|20)! )?([A-Z][^.]*?\. )?(Drink|Give) \d+\.?$/.test(
            x.trim(),
          ) || !/\b(drink|give|finish)/i.test(x),
      );
  if (c.dice) {
    const setup = /^[^.?!]*[.?!]\s*(Roll [^.]*\.)?$/.test(c.rules);
    return (
      setup &&
      !others.test(c.rules) &&
      (c.dice.outcomes ?? []).every((o) => said(o.instruction))
    );
  }
  if (c.battle || c.offers || c.secret || c.timer || c.strike || c.reward)
    return false;
  return !others.test(c.rules) && said(c.rules.replace(/^[^.]*\.\s*/, ""));
}
const involves = (c: CardDefinition) =>
  others.test(
    [
      c.rules,
      c.secret ?? "",
      c.timer?.end ?? "",
      ...(c.dice?.outcomes ?? []).map((o) => o.instruction),
      ...(c.strike ? Object.values(c.strike) : []),
    ].join(" "),
  );

const stages = (finale: (QuestStage | { oneOf: QuestStage[][] })[]) =>
  finale.flatMap((s) => ("oneOf" in s ? s.oneOf.flat() : [s]));
const pools = [
  ...stages(dungeonPack.quest!.finale)
    .filter((s) => s.pick === 8)
    .map((s) => ({ label: s.label, ids: s.cardIds, cards: dungeonCards })),
  ...stages(pokemonPack.quest!.finale)
    .filter((s) => /^(Route \d|Victory Road)$/.test(s.label))
    .map((s) => ({ label: s.label, ids: s.cardIds, cards: pokemonCards })),
].map(({ label, ids, cards }) => {
  const pool = ids.map((id) => cards.find((c) => c.id === id)!);
  const share = (f: (c: CardDefinition) => boolean) =>
    pool.filter(f).length / pool.length;
  return {
    label,
    kinds: new Set(pool.map(kind)).size,
    d20: share((c) => kind(c) === "d20"),
    flat: share(flat),
    involves: share(involves),
  };
});

describe("variety in each floor and route", () => {
  it("finds every crawl pool, and every reworked one", () => {
    expect(pools.length).toBeGreaterThanOrEqual(17);
    for (const label of REWORKED)
      expect(pools.map((p) => p.label)).toContain(label);
  });
  it.each(pools)("$label mixes its cards", (p) => {
    expect(p.d20, "single-d20 share").toBeLessThanOrEqual(0.4);
    // Today's worst, so no pool slides back: the Walk-in Freezer's flat
    // rooms (32%) and Victory Road's five kinds.
    expect(p.kinds, "kinds of card").toBeGreaterThanOrEqual(5);
    expect(p.flat, "drawer-only bare pours").toBeLessThanOrEqual(0.35);
    if (!REWORKED.includes(p.label)) return;
    expect(p.d20, "single-d20 share").toBeLessThanOrEqual(0.35);
    expect(p.kinds, "kinds of card").toBeGreaterThanOrEqual(10);
    expect(p.flat, "drawer-only bare pours").toBeLessThanOrEqual(0.05);
    expect(p.involves, "cards where someone else acts").toBeGreaterThanOrEqual(
      0.4,
    );
  });
});
