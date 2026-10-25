import type { CSSProperties } from "react";
import type { CardDefinition, SessionState } from "../game/types";
import { currentCard, questRecord } from "../game/engine";
import { typeEdges } from "../game/matchup";
import { asset } from "../presentation/theme";
import {
  badgeType,
  pokemonTypes,
  typeStyle,
  type PokemonType,
} from "../presentation/pokemon-types";
import type { CrawlTheme } from "./crawlTheme";

// The League's badge case and type marks (2026-10-24): every gym's badge is
// a medallion in its type's colours with its type's mark, and the starter's
// panel in the team dialog wears its own.

type RunRecord = NonNullable<ReturnType<typeof questRecord>>;

/** What a starter's type beats and what beats it (2026-10-25): a fight
 * against the first is rolled with advantage, the second with
 * disadvantage. Normal is strong against nothing, so its row says so. */
export function TypeEdges({ type }: { type: PokemonType }) {
  const { strong, weak } = typeEdges(type);
  const row = (label: string, types: PokemonType[]) => (
    <div>
      <dt>{label}</dt>
      <dd>
        {types.length
          ? types.map((t) => (
              <span
                key={t}
                className="type-chip"
                style={typeStyle(t) as CSSProperties}
              >
                {pokemonTypes[t].name}
              </span>
            ))
          : "Nothing"}
      </dd>
    </div>
  );
  return (
    <dl className="type-edges">
      {row("Strong against", strong)}
      {row("Weak against", weak)}
    </dl>
  );
}

/** A type's medallion: its colours behind its single-colour mark. */
export function TypeMark({
  type,
  className = "",
  label,
}: {
  type: PokemonType;
  className?: string;
  /** Read aloud, when the mark is the only place its type is named. */
  label?: string;
}) {
  const src = `url("${asset(`art/league/types/${type}.svg`)}")`;
  return (
    <span
      className={`type-mark type-${type} ${className}`}
      style={typeStyle(type) as CSSProperties}
      {...(label
        ? { role: "img", "aria-label": label }
        : { "aria-hidden": true })}
    >
      <span
        className="type-glyph"
        style={{ maskImage: src, WebkitMaskImage: src } as CSSProperties}
      />
    </span>
  );
}

/** The badge a gym pays, from its ribbon: "Gym Leader · Boulder Badge" is
 * the Boulder Badge, "Kahuna · Fightinium Z" the Fightinium Z. */
const badgeName = (card: CardDefinition) =>
  (card.ribbon?.split(" · ").pop() ?? card.title).replace(/ Badge$/, "");

/** The badges earned so far, in the order they were won. */
export function earnedBadges(record: RunRecord, packId: string) {
  return record.stages
    .flatMap((st) => st.cards)
    .filter((c) => c.quest === packId);
}

/** Whether the card in play shuts the badge case: a card that asks the
 * table to name the badges from memory (Veteran Ada). */
export function badgesLocked(session: SessionState, theme: CrawlTheme) {
  const lock = theme.badgeLock;
  return (
    !!lock &&
    session.phase === "revealed" &&
    lock.cards.includes(currentCard(session).id)
  );
}

/** The badge case: one socket per gym, each badge earned in its type's
 * colours with its name and who paid it. Sockets still to come stay empty,
 * so nothing ahead is spoiled. */
export function BadgeCase({
  record,
  packId,
  label,
}: {
  record: RunRecord;
  packId: string;
  label: string;
}) {
  const earned = earnedBadges(record, packId);
  return (
    <ol
      className="crawl-badges badge-case"
      aria-label={`${label}: ${record.badges.earned} of ${record.badges.of}`}
    >
      {Array.from({ length: record.badges.of }, (_, i) => {
        const card = earned[i];
        if (!card)
          return (
            <li key={`slot-${i}`} className="badge-socket spent">
              <span className="type-mark empty" aria-hidden="true" />
              <span className="sr-only">Not yet earned</span>
            </li>
          );
        const type = badgeType(card);
        return (
          <li key={card.id} className="badge-socket full">
            <TypeMark type={type} />
            <strong>{badgeName(card)}</strong>
            <small>{card.title}</small>
            <span className="sr-only">{pokemonTypes[type].name}</span>
          </li>
        );
      })}
    </ol>
  );
}
