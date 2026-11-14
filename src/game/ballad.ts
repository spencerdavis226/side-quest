import type { SessionState } from "./types";
import { previousCard } from "./engine";
import { omenForm } from "./crawl/party";
import { questRecord } from "./crawl/stages";
import { natural } from "./crawl/discard";
import { runNames } from "./crawl/names";

// The ballad (The Quest 2.0 Phase 3, 2026-11-14): the end screen writes the
// run as a short verse. Pure, so the Chronicle (Phase 7) can keep a copy.
// Allies and deeds join the third line in Phases 4 and 6.

/** At most this many characters a line, so the verse reads at table
 * distance on a phone. Every line has a shorter form for long names. */
export const BALLAD_WIDTH = 44;

/** The joke classes (`JOKE_CLASSES` in `content/dungeon/classes.ts`; the
 * engine never imports content, and `tests/ballad.test.ts` keeps the two
 * lists equal). */
export const BALLAD_FOOLS = [
  "dungeon.class-plus-one",
  "dungeon.class-intern",
  "dungeon.class-mimic",
];

/** A name mid-line: "The Bridge Troll" reads "the Bridge Troll". */
const mid = (name: string) => name.replace(/^The /, "the ");
/** The first line that fits. */
const fit = (...lines: string[]) =>
  lines.find((l) => l.length <= BALLAD_WIDTH) ?? lines[lines.length - 1];

/** The run as four or five lines; none for a game that is not a finished
 * Quest (a Realms crawl). */
export function ballad(s: SessionState): string[] {
  const q = s.quest;
  const record = questRecord(s);
  if (!q?.party || q.packId !== "dungeon" || s.phase !== "complete" || !record)
    return [];
  const party = q.party;
  const form = omenForm(q);
  const { dragon = "the dragon", lair = "the lair" } = runNames(q);
  const stages = record.stages;
  const region = stages.find((st) => st.kind === "floor" && st.size >= 4);
  const where = mid(region?.label ?? "the road");

  // 1. Who set out, and where to.
  const hero = form?.title ?? "hero";
  const who = /^The /.test(hero)
    ? hero
    : `${/^[AEIOU]/.test(hero) ? "An" : "A"} ${hero}`;
  const lines = [fit(`${who} left by ${where},`, `${who} took ${where},`)];

  // 2. The region bosses that fell (a boss put aside fell; the dragon is
  // the last line's).
  const bosses = stages
    .filter(
      (st, i) =>
        st.kind === "boss" &&
        // A region (eight cards), not a side quest's two guards.
        stages[i - 1]?.kind === "floor" &&
        stages[i - 1].size >= 4 &&
        st.cards.length > 0 &&
        !st.cards[0].lairFight,
    )
    .map((st) => mid(st.cards[0].title));
  if (bosses.length === 1) lines.push(`felled ${bosses[0]},`);
  if (bosses.length >= 2) {
    const both = `felled ${bosses[0]} and ${bosses[1]},`;
    if (both.length <= BALLAD_WIDTH) lines.push(both);
    else lines.push(`felled ${bosses[0]},`, `and ${bosses[1]},`);
  }

  // 3. Who went with them. Allies and deeds come later; until then the
  // Company of one.
  lines.push("alone, as heroes go,");

  // 4. The end.
  if (record.won) {
    const last = previousCard(s);
    const blow = last ? natural(last, s.previousRoll) === 20 : false;
    const fool = BALLAD_FOOLS.includes(party.omen ?? "");
    const n = party.hearts;
    lines.push(
      blow
        ? fit(
            `and slew ${dragon} with a single blow.`,
            `and slew ${dragon} in one blow.`,
          )
        : fool
          ? fit(
              `and the fool slew ${dragon}, as foretold.`,
              `and the fool slew ${dragon}.`,
            )
          : n === 1
            ? `and slew ${dragon} by a thread.`
            : fit(
                `and slew ${dragon} with ${n} hearts to spare.`,
                `and slew ${dragon}, ${n} hearts left.`,
                `and slew ${dragon}, ${n} to spare.`,
              ),
    );
  } else if (previousCard(s)?.lairFight) {
    lines.push(
      fit(`and ${dragon} sleeps on under ${lair}.`, `and ${dragon} sleeps on.`),
    );
  } else {
    lines.push(fit(`and never saw ${lair}.`, "and never saw the lair."));
  }
  return lines;
}

/** Whether the run's last swing was a natural 20 that slew the dragon:
 * the ending's "With a single blow". */
export function singleBlow(s: SessionState): boolean {
  if (s.phase !== "complete" || s.quest?.party?.wiped) return false;
  const last = previousCard(s);
  return !!last?.lairFight && natural(last, s.previousRoll) === 20;
}
