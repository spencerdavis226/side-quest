import type { ReactNode } from "react";
import {
  canTakeOffer,
  currentCard,
  formEffect,
  offerHeal,
  omenForm,
  satchelSize,
  settleDrinks,
} from "../game/engine";
import { describeChange } from "../game/omenText";
import type { CardDefinition, Offer, SessionState } from "../game/types";
import { CrawlIcon, gearIcon } from "./Crawl";
import { TypeMark } from "./LeagueMarks";
import {
  type CrawlIconName,
  heartCount,
  LAIR_WORDS,
  lootDoes,
  QUEST_MAP,
  type CrawlTheme,
} from "./crawlTheme";
import { Modal } from "./UI";

// The choice sheet (2026-11-15, owner: the inn's three plaques were "SO
// close to clipping ... most people wouldn't even know what these buttons
// do"). A card whose plaques do something (a merchant, an inn, a fork, a
// sign, a landmark, an evolution) shows one Choose plaque at its foot; it
// opens a sheet with a row for each way, each saying what it costs and,
// in words, exactly what it brings. A plain pair (two doors that only lead
// on) keeps its plaques. The engine is untouched: a row calls the same
// `onOffer(index, branch)` the plaques did.

/** One way to choose, as the sheet shows it. */
export interface ChoiceRow {
  key: string;
  index: number;
  branch?: number;
  name: string;
  mark: ReactNode;
  /** The price: hearts paid, and drinks (from the label, "· drink 3"). */
  hearts?: number;
  drinks?: string;
  /** What it brings, in sentences. */
  gets: string;
  /** Said under it in a quieter voice: full hearts, a full satchel. */
  note?: string;
  can: boolean;
  /** Why it can't be taken, when it can't. */
  why?: string;
  tone: "buy" | "loud" | "pass";
}

const REGION_WORDS: Record<string, string> = {
  ...Object.fromEntries(QUEST_MAP.flat().map((r) => [r.label, r.words])),
  ...LAIR_WORDS,
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const sentence = (s: string) => (/[.!?]$/.test(s) ? s : `${s}.`);

/** Whether a card's plaques do anything beyond leading on: none costs,
 * brings or changes anything, and no label carries a price. */
export function plainOffers(offers: readonly Offer[]) {
  return (
    offers.length <= 2 &&
    offers.every(
      (o) =>
        !o.label.includes(" · ") &&
        !o.cost &&
        !o.loot &&
        !o.heal &&
        !o.elite &&
        !o.evolve &&
        !o.skip &&
        !o.catch &&
        !o.boon &&
        !o.lore &&
        !o.recruit &&
        !o.restore &&
        !o.coinJoin &&
        !o.settle &&
        o.route === undefined &&
        !o.flip &&
        !o.jinx,
    )
  );
}

/** Whether the card in play chooses through the sheet. A catch keeps its
 * own plaques (the ball throw has its own flow). */
export function choosesInSheet(card: CardDefinition) {
  const offers = card.offers;
  return !!offers && !offers.some((o) => o.catch) && !plainOffers(offers);
}

function iconOf(offer: Offer): CrawlIconName {
  return offer.settle
    ? "satchel"
    : offer.loot
      ? offer.loot
      : offer.route !== undefined
        ? "door"
        : offer.boon
          ? gearIcon(offer.boon)
          : offer.lore
            ? "lore"
            : offer.recruit || offer.coinJoin
              ? "ally"
              : offer.elite
                ? "elite"
                : offer.evolve
                  ? "adventurer"
                  : offer.heal
                    ? "heart"
                    : "door";
}

/** Every way to choose on the card in play, a row each; a branching
 * evolution gives a row per form. */
export function choiceRows(
  session: SessionState,
  theme: CrawlTheme,
): ChoiceRow[] {
  const card = currentCard(session);
  const quest = session.quest;
  const party = quest?.party;
  const form = omenForm(quest);
  const words = theme.omenWords;
  const now = formEffect(quest) ?? {};
  const base = (party?.max ?? 0) - (now.hearts ?? 0);
  const rows: ChoiceRow[] = [];
  (card.offers ?? []).forEach((offer, index) => {
    const can = canTakeOffer(session, index);
    const [said, tag] = offer.label.split(" · ", 2) as [string, string?];
    const drinks = offer.settle
      ? `drink ${settleDrinks(quest)}`
      : tag && /^drink/i.test(tag)
        ? tag
        : undefined;
    const forms = offer.evolve
      ? form?.branches
        ? form.card.evolves!.map((to, b) => ({ to, b }))
        : form?.next
          ? [{ to: form.card.evolves![form.form], b: 0 }]
          : [{ to: undefined, b: 0 }]
      : [{ to: undefined, b: undefined }];
    for (const { to, b } of forms) {
      const gets: string[] = [];
      const notes: string[] = [];
      if (offer.evolve) {
        const change =
          to && words ? describeChange(now, to.omen, words, base) : "";
        gets.push(
          to
            ? `${cap(theme.words.grows.who)} ${theme.words.grows.verb} into ${to.title}`
            : `${cap(theme.words.grows.who)} is ${theme.words.grows.done}`,
        );
        if (change) gets.push(change);
      }
      if (offer.heal) {
        const h = offerHeal(quest, offer, b ?? 0);
        gets.push(`${cap(heartCount(theme, h))} back`);
        if (party)
          notes.push(
            party.hearts >= party.max
              ? `You're already at full ${theme.words.hearts}`
              : `You have ${party.hearts} of ${party.max}`,
          );
      }
      if (offer.loot) {
        gets.push(
          `A ${theme.loot[offer.loot].name}. ${lootDoes(theme, offer.loot, quest)}`,
        );
        if (party && quest && party.loot.length >= satchelSize(quest))
          notes.push(
            `Your ${theme.words.Satchel.toLowerCase()} is full: it won't fit`,
          );
      }
      if (offer.boon) gets.push(`${offer.boon.name}: ${offer.boon.rules}`);
      if (offer.lore)
        gets.push(
          `A dragon lore rune: one swing at the dragon is rolled twice, the better counts (${Math.min(3, (party?.lore ?? 0) + 1)} of 3)`,
        );
      if ((offer.recruit || offer.coinJoin) && card.ally) {
        const ally = card.ally;
        const calling = ally.calling.includes("any")
          ? "any fight"
          : `${ally.calling.join(" or ")} fights`;
        gets.push(
          offer.coinJoin
            ? `${ally.name} joins as an ally. A coin decides how good: heads +${ally.bonus} in ${calling}, tails nothing`
            : `${ally.name} joins as an ally: +${ally.bonus} when sent into ${calling}`,
        );
      }
      if (offer.elite) gets.push(cap(theme.words.elite));
      if (offer.route !== undefined) {
        const words = REGION_WORDS[offer.label];
        gets.push(
          `The road to ${offer.label.replace(/^The /, "the ")}${words ? `: ${words.toLowerCase()}` : ""}. The other road closes`,
        );
      }
      if (offer.flip) gets.push("A coin picks the road");
      if (offer.skip) gets.push("Walk past. This side quest is gone for good");
      if (offer.restore) gets.push("Everything they took comes back");
      if (offer.settle) gets.push("Everything they took comes back");
      if (offer.jinx && card.jinx)
        gets.push(`The curse ${card.jinx.name}: ${card.jinx.rule}`);
      if (!gets.length)
        gets.push(
          tag && !drinks ? cap(tag) : "Move on: nothing gained, nothing lost",
        );
      rows.push({
        key: `${index}-${b ?? ""}`,
        index,
        branch: offer.evolve && form?.branches ? b : undefined,
        name: offer.evolve && to ? to.title : said,
        mark:
          offer.evolve && to?.type ? (
            <TypeMark type={to.type} />
          ) : (
            <CrawlIcon name={iconOf(offer)} theme={theme} />
          ),
        hearts: offer.cost,
        drinks,
        gets: gets.map(sentence).join(" "),
        note: notes.length ? notes.map(sentence).join(" ") : undefined,
        can,
        why: can
          ? undefined
          : offer.evolve
            ? `${cap(theme.words.grows.who)} is ${theme.words.grows.done}.`
            : offer.cost
              ? `Needs ${heartCount(theme, offer.cost + 1)} or more.`
              : "Not now.",
        tone: offer.elite
          ? "loud"
          : iconOf(offer) !== "door" || offer.cost
            ? "buy"
            : "pass",
      });
    }
  });
  return rows;
}

/** The card's one plaque: its ways' marks, and how many there are. */
export function ChoicePlaque({
  rows,
  onOpen,
}: {
  rows: readonly ChoiceRow[];
  onOpen: () => void;
}) {
  return (
    <button
      className="card-choice-option choice-plaque"
      aria-label={`Choose: ${rows.map((r) => r.name).join(", or ")}`}
      onClick={onOpen}
    >
      <span className="choice-marks" aria-hidden="true">
        {rows.slice(0, 4).map((r) => (
          <span key={r.key} className={`choice-mark tone-${r.tone}`}>
            {r.mark}
          </span>
        ))}
      </span>
      <span className="choice-words">
        <strong>Choose</strong>
        <small>{rows.length} ways</small>
      </span>
    </button>
  );
}

/** The sheet: a row for each way, what it costs and what it brings. */
export function ChoiceSheet({
  title,
  rows,
  theme,
  onTake,
  onClose,
}: {
  title: string;
  rows: readonly ChoiceRow[];
  theme: CrawlTheme;
  onTake: (row: ChoiceRow) => void;
  onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="choice-lead">Pick one. The card goes aside with it.</p>
      <div className="choice-sheet" role="group" aria-label="Your choice">
        {rows.map((row) => (
          <button
            key={row.key}
            className={`choice-row tone-${row.tone}`}
            disabled={!row.can}
            aria-label={`${row.name}${row.hearts ? `, costs ${heartCount(theme, row.hearts)}` : ""}${row.drinks ? `, ${row.drinks}` : ""}: ${row.can ? row.gets : row.why}`}
            onClick={() => onTake(row)}
          >
            <span className="choice-row-mark" aria-hidden="true">
              {row.mark}
            </span>
            <span className="choice-row-head">
              <strong>{row.name}</strong>
              {(row.hearts || row.drinks) && (
                <span className="choice-price" aria-hidden="true">
                  {row.hearts ? (
                    <span className="offer-cost">
                      <CrawlIcon name="heart" theme={theme} />−{row.hearts}
                    </span>
                  ) : null}
                  {row.drinks && (
                    <span className="choice-drinks">{row.drinks}</span>
                  )}
                </span>
              )}
            </span>
            <span className="choice-gets">{row.can ? row.gets : row.why}</span>
            {row.can && row.note && (
              <span className="choice-note">{row.note}</span>
            )}
          </button>
        ))}
      </div>
    </Modal>
  );
}
