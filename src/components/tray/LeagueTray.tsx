import type { CSSProperties } from "react";
import type { Loot, SessionState } from "../../game/types";
import {
  type BagDrop,
  TEAM_SIZE,
  assistBonus,
  cardMatchup,
  currentCard,
  partyTeam,
  questRecord,
} from "../../game/engine";
import { CrawlIcon, crawlPlace } from "../Crawl";
import { crawlTheme } from "../crawlTheme";
import {
  MatchupPanel,
  TypeEdges,
  TypeMark,
  badgeName,
  badgesLocked,
  earnedBadges,
} from "../LeagueMarks";
import {
  badgeType,
  pokemonTypes,
  typeStyle,
} from "../../presentation/pokemon-types";
import type { TrayPage, TrayTab } from "../trayTabs";
import { ConfirmDrop, ItemGrid, Section } from "./Inventory";

// The League's tray (2026-11-16): Trainer Gear, a red handheld with a lit
// screen. The header is the device's top (a lens and three lamps, the page
// on a small display, the team's HP as a bar); every page sits on the
// screen. Styles: `presentation/tray-league.css`.

/** The team's HP as the games draw it: green, amber, red, in segments. */
function HpBar({ hearts, max }: { hearts: number; max: number }) {
  const share = Math.max(0, Math.min(1, max ? hearts / max : 0));
  const tone = share > 0.5 ? "high" : share > 0.2 ? "mid" : "low";
  return (
    <div
      className={`lg-hp hp-${tone}`}
      role="img"
      aria-label={`Team HP: ${hearts} of ${max}`}
      style={{ "--hp": share } as CSSProperties}
    >
      <span className="lg-hp-tag" aria-hidden="true">
        HP
      </span>
      <span className="lg-hp-bar" aria-hidden="true">
        <i />
      </span>
      <span className="lg-hp-num" aria-hidden="true">
        {hearts}
        <small>/{max}</small>
      </span>
    </div>
  );
}

export function LeagueHead({
  session,
  page,
  titleId,
}: {
  session: SessionState;
  page: TrayPage;
  titleId: string;
}) {
  const quest = session.quest!;
  const party = quest.party!;
  const place = crawlPlace(quest);
  return (
    <div className="lg-head">
      <span className="lg-lens" aria-hidden="true">
        <i />
      </span>
      <span className="lg-lamps" aria-hidden="true">
        <i className="lamp-r" />
        <i className="lamp-y" />
        <i className="lamp-g" />
      </span>
      <div className="lg-display">
        <small className="lg-kicker" aria-hidden="true">
          Trainer Gear · {place.name}
        </small>
        <h2 id={titleId} className="lg-title" key={page.id}>
          {page.title}
        </h2>
        <HpBar hearts={party.hearts} max={party.max} />
      </div>
    </div>
  );
}

export function LeaguePage({
  id,
  session,
  onSpend,
  onDrop,
}: {
  id: TrayTab;
  session: SessionState;
  onSpend: (item: Loot) => void;
  onDrop: (drop: BagDrop) => void;
}) {
  switch (id) {
    case "party":
      return <TeamPage session={session} onDrop={onDrop} />;
    case "satchel":
      return <BagPage session={session} onSpend={onSpend} onDrop={onDrop} />;
    case "badges":
      return <BadgesPage session={session} />;
    case "matchup":
      return <TypesPage session={session} />;
    case "jinx":
      return <JinxPage session={session} />;
    default:
      return null;
  }
}

/** The team: the starter on top, as the lead of the party screen, then a
 * slot for each Pokémon the team can catch. */
function TeamPage({
  session,
  onDrop,
}: {
  session: SessionState;
  onDrop: (drop: BagDrop) => void;
}) {
  const quest = session.quest!;
  const party = quest.party!;
  const record = questRecord(session)!;
  const form = record.form;
  const team = partyTeam(quest);
  const type = form?.type;
  return (
    <div className="lg-screen">
      {form && (
        <article
          className={`lg-lead crawl-omen${type ? ` type-${type}` : ""}`}
          style={type ? (typeStyle(type) as CSSProperties) : undefined}
        >
          <div className="lg-lead-art" aria-hidden="true">
            <span className="lg-lead-ring" />
            {type ? (
              <TypeMark type={type} className="lg-lead-mark" />
            ) : (
              <CrawlIcon name="adventurer" theme={crawlTheme("pokemon")} />
            )}
          </div>
          <div className="lg-lead-words">
            <small className="lg-lead-kicker">Lead</small>
            <strong>{form.title}</strong>
            {type && (
              <small className="type-chips">
                <span
                  className="type-chip lg-type-pill"
                  style={typeStyle(type) as CSSProperties}
                >
                  {pokemonTypes[type].name}
                </span>
              </small>
            )}
            <ol className="lg-line" aria-label="Evolution line">
              {form.line.map((name, i) => (
                <li
                  key={name}
                  className={
                    i === form.form ? "now" : i < form.form ? "past" : "next"
                  }
                  aria-current={i === form.form ? "step" : undefined}
                >
                  {name}
                </li>
              ))}
            </ol>
          </div>
          <p className="omen-rules">{form.rules}</p>
          {type && <TypeEdges type={type} />}
        </article>
      )}
      <Section
        title="Party"
        aside={`${team.length} of ${TEAM_SIZE}`}
        className="lg-party"
      >
        <ul className="lg-slots crawl-team" aria-label="Caught Pokémon">
          {Array.from({ length: TEAM_SIZE }, (_, i) => {
            const m = team[i];
            if (!m)
              return (
                <li key={`open-${i}`} className="lg-slot open">
                  <span className="lg-slot-ball" aria-hidden="true" />
                  <span className="lg-slot-words">
                    <strong>Open slot</strong>
                    <small>Beat a wild Pokémon, then throw a ball.</small>
                  </span>
                </li>
              );
            const bonus = assistBonus(m, quest);
            const sent = party.assist === m.id && session.phase === "revealed";
            return (
              <li
                key={m.id}
                className={`lg-slot${sent ? " sent" : ""}`}
                style={
                  m.type ? (typeStyle(m.type) as CSSProperties) : undefined
                }
              >
                {m.type ? (
                  <TypeMark type={m.type} />
                ) : (
                  <CrawlIcon name="ally" theme={crawlTheme("pokemon")} />
                )}
                <span className="lg-slot-words">
                  <strong>{m.title}</strong>
                  <small>
                    {m.type && (
                      <span className="lg-type-pill">
                        {pokemonTypes[m.type].name}
                      </span>
                    )}
                    <span
                      className="lg-bonus"
                      aria-label={`+${bonus} to the roll`}
                    >
                      +{bonus}
                    </span>
                    {sent && <span className="lg-sent">In battle</span>}
                  </small>
                </span>
                <ConfirmDrop
                  verb="Release"
                  name={m.title}
                  onConfirm={() => onDrop({ caught: m.id })}
                />
              </li>
            );
          })}
        </ul>
        <p className="tray-hint">
          Send one into a d20 battle its type beats for its bonus. Win and it
          stays; lose and it faints for good.
        </p>
      </Section>
    </div>
  );
}

/** The bag: one pocket of items, in slots, with the inspector. */
function BagPage({
  session,
  onSpend,
  onDrop,
}: {
  session: SessionState;
  onSpend: (item: Loot) => void;
  onDrop: (drop: BagDrop) => void;
}) {
  const record = questRecord(session)!;
  const theme = crawlTheme("pokemon");
  const party = session.quest!.party!;
  return (
    <div className="lg-screen">
      <Section
        title="Items"
        aside={`${party.loot.length} of ${record.satchel}`}
        className="lg-pocket"
      >
        <ItemGrid
          session={session}
          theme={theme}
          size={record.satchel}
          onSpend={onSpend}
          onDrop={onDrop}
          note="The bag is empty. Wins and the Poké Mart fill it."
        />
      </Section>
    </div>
  );
}

/** The badge case: eight sockets in a velvet-lined case, each badge struck
 * in its gym's type colours. Shut while a card asks for them from memory. */
function BadgesPage({ session }: { session: SessionState }) {
  const record = questRecord(session)!;
  const theme = crawlTheme("pokemon");
  if (badgesLocked(session, theme))
    return (
      <div className="lg-screen">
        <div className="lg-locked">
          <span className="lg-lock" aria-hidden="true" />
          <strong>Case locked</strong>
          <p>{theme.badgeLock!.why.replace(/^locked, /, "")}.</p>
        </div>
      </div>
    );
  const earned = earnedBadges(record, "pokemon");
  return (
    <div className="lg-screen">
      <ol
        className="lg-case crawl-badges"
        aria-label={`Badges: ${record.badges.earned} of ${record.badges.of}`}
      >
        {Array.from({ length: record.badges.of }, (_, i) => {
          const card = earned[i];
          if (!card)
            return (
              <li key={`slot-${i}`} className="lg-socket spent">
                <span className="lg-socket-well" aria-hidden="true" />
                <small aria-hidden="true">Gym {i + 1}</small>
                <span className="sr-only">Not yet earned</span>
              </li>
            );
          const type = badgeType(card);
          return (
            <li
              key={card.id}
              className="lg-socket full"
              style={{ ...typeStyle(type), "--i": i } as CSSProperties}
            >
              <span className="lg-badge" aria-hidden="true">
                <TypeMark type={type} />
                <i className="lg-badge-shine" />
              </span>
              <strong>{badgeName(card)}</strong>
              <small>{card.title}</small>
              <span className="sr-only">{pokemonTypes[type].name}</span>
            </li>
          );
        })}
      </ol>
      {theme.words.badgesNote && (
        <p className="tray-hint">{theme.words.badgesNote}</p>
      )}
    </div>
  );
}

/** Types: the battle face up, when the matchup gives an edge; and always
 * the lead's chart, so the table can see what is coming. */
function TypesPage({ session }: { session: SessionState }) {
  const record = questRecord(session)!;
  const form = record.form;
  const card = session.phase === "revealed" ? currentCard(session) : null;
  const matchup = card ? cardMatchup(session.quest, card) : null;
  return (
    <div className="lg-screen">
      {matchup?.edge && card && form ? (
        <Section title="This battle" className="lg-battle">
          <MatchupPanel matchup={matchup} card={card} starter={form.title} />
        </Section>
      ) : (
        <p className="lg-standby">
          No type edge on the card in play. Even battles roll as written.
        </p>
      )}
      {form?.type && (
        <Section
          title={`${form.title}'s chart`}
          className="lg-chart"
          aside={pokemonTypes[form.type].name}
        >
          <div
            className="lg-chart-card"
            style={typeStyle(form.type) as CSSProperties}
          >
            <TypeMark type={form.type} />
            <TypeEdges type={form.type} />
          </div>
          <p className="tray-hint">
            Strong against: roll with the edge (two dice, keep the better). Weak
            against: two dice, keep the worse. A strike reads the line the
            matchup picks.
          </p>
        </Section>
      )}
    </div>
  );
}

function JinxPage({ session }: { session: SessionState }) {
  const record = questRecord(session)!;
  const theme = crawlTheme("pokemon");
  const jinx = record.jinx?.jinx;
  const words = theme.words.jinx;
  return (
    <div className="lg-screen">
      {jinx && words && session.phase !== "complete" ? (
        <article className="lg-jinx crawl-curse crawl-jinx">
          <span className="lg-jinx-mark" aria-hidden="true">
            <CrawlIcon name="jinx" theme={theme} />
          </span>
          <small className="lg-jinx-from">From {record.jinx!.title}</small>
          <strong>
            {words.name}: {jinx.name}
          </strong>
          <span>
            {jinx.rule} Lasts {words.lasts}.
          </span>
        </article>
      ) : (
        <div className="lg-clear">
          <span className="lg-clear-mark" aria-hidden="true" />
          <strong>No jinx</strong>
          <p>
            Some trainers and Legendaries lay one on a lost battle: a table rule
            until the next boss falls.
          </p>
        </div>
      )}
    </div>
  );
}
