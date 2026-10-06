import { writeFile } from "node:fs/promises";
import { cards, packs } from "../src/content/catalog";
import { finaleCardIds } from "../src/game/engine";
import { diceNotation } from "../src/game/dice";
import type { CardDefinition } from "../src/game/types";

/**
 * Generate a human review sheet from the live catalog so it can never drift
 * from what ships. Writes docs/CARD_REVIEW.md (readable) and
 * docs/card-review.csv (spreadsheet). Run `npm run cards:review` after any
 * content edit.
 */

const CATEGORY_ORDER = [
  "sip",
  "group",
  "category",
  "challenge",
  "rule",
] as const;

const diceCell = (card: CardDefinition) => {
  const d = card.dice;
  if (!d) return "";
  return d.instruction
    ? `${diceNotation(d)} — ${d.instruction}`
    : `${diceNotation(d)} — ${d
        .outcomes!.map((o) => `${o.min}-${o.max}: ${o.instruction}`)
        .join(" ")}`;
};

// Secrets and timers ride in the same column as dice: one mechanic per card.
const mechanicCell = (card: CardDefinition) => {
  const t = card.timer;
  return [
    diceCell(card),
    card.secret ? `Secret: ${card.secret}` : "",
    t?.kind === "fuse" ? `Fuse ${t.min}–${t.max} s: ${t.end}` : "",
    t?.kind === "countdown" ? `Clock ${t.seconds} s: ${t.end}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
};

const csvValue = (value: string) => `"${value.replaceAll('"', '""')}"`;

const byCategory = (list: CardDefinition[]) =>
  CATEGORY_ORDER.flatMap((category) =>
    list.filter((card) => card.category === category),
  );

const now = new Date().toISOString().slice(0, 10);

const md: string[] = [
  "# Card review sheet",
  "",
  `Generated ${now} by \`npm run cards:review\`. Do not edit by hand — edit the`,
  "source modules under `src/content` and regenerate. Each row is one card;",
  "the Review column is intentionally blank so you can mark it up.",
  "",
];

for (const pack of packs) {
  const packCards = byCategory(
    cards.filter(
      (card) =>
        pack.cardIds.includes(card.id) ||
        (!!pack.quest && finaleCardIds(pack.quest).includes(card.id)),
    ),
  );
  const counts = CATEGORY_ORDER.map(
    (c) => `${packCards.filter((card) => card.category === c).length} ${c}`,
  ).join(" · ");
  md.push(
    `## ${pack.title} (\`${pack.id}\`)`,
    "",
    `${packCards.length} cards · ${counts} · ${packCards.filter((c) => c.dice).length} dice`,
    "",
    "| Review | Title | ID | Cat | Rules | Dice, secret or timer |",
    "| --- | --- | --- | --- | --- | --- |",
  );
  for (const card of packCards)
    md.push(
      `| ☐ | ${card.title} | \`${card.id}\` | ${card.category} | ${card.rules} | ${mechanicCell(card)} |`,
    );
  md.push("");
}

md.push(
  "## Notes for review",
  "",
  "- Dice cards are ordinary cards with a `dice` definition (which dice plus how",
  "  to read the total); the engine pauses the deck until the roll is resolved.",
  "- Secret cards show the secret only while a player holds the card's plaque;",
  "  a fuse burns for a hidden time in its range, a clock counts down in view,",
  "  and the card can't be put aside until time is up.",
  "- Rules target 90 characters / 18 words; the build warns above that and",
  "  rejects over 120 characters / 24 words.",
  "- Rank cards for 9 / 10 / Jack / Queen are intentionally covered by the",
  "  existing Rhyme Time, Categories, Rulemaster and Questions Only cards.",
  "",
);

const csv: string[] = ["pack,id,title,category,rules,dice,review"];
for (const pack of packs)
  for (const card of byCategory(
    cards.filter(
      (c) =>
        pack.cardIds.includes(c.id) ||
        (!!pack.quest && finaleCardIds(pack.quest).includes(c.id)),
    ),
  ))
    csv.push(
      [
        csvValue(pack.id),
        csvValue(card.id),
        csvValue(card.title),
        csvValue(card.category),
        csvValue(card.rules),
        csvValue(mechanicCell(card)),
        csvValue(""),
      ].join(","),
    );

await Promise.all([
  writeFile("docs/CARD_REVIEW.md", `${md.join("\n")}\n`),
  writeFile("docs/card-review.csv", `${csv.join("\n")}\n`),
]);
console.log(
  `Wrote docs/CARD_REVIEW.md and docs/card-review.csv (${cards.length} cards, ${packs.length} packs).`,
);
