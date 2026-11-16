import type { CSSProperties } from "react";
import type { Loot, SessionState } from "../../game/types";
import {
  type BagDrop,
  TEAM_SIZE,
  assistBonus,
  partyTeam,
  questRecord,
  rivalCut,
  rivalProfile,
  wantedBoss,
} from "../../game/engine";
import {
  CrawlIcon,
  allyLine,
  crawlPlace,
  gearIcon,
  isOmenBoon,
  loreFound,
  wornRules,
} from "../Crawl";
import { crawlTheme } from "../crawlTheme";
import { classMark } from "../classMark";
import { QuestMap } from "../QuestMap";
import RivalMedal from "../RivalMedal";
import TrophyMark from "../TrophyMark";
import { dragonStyle } from "../../presentation/dragon-colors";
import { runNames } from "../../game/engine";
import type { TrayPage, TrayTab } from "../trayTabs";
import { ConfirmDrop, ItemGrid, Section } from "./Inventory";
import { Emblem, allyArt } from "./marks";

// The Quest's tray (2026-11-16): the adventurer's journal. Tooled leather
// round the edge, parchment pages, brass and wax. The header is the
// journal's cover band (the page in gilt, the region, the hearts); each page
// is a leaf: the party's sheet, the pack with the gear worn, the map, the
// dragon lore, the rival's file and the curse. Styles:
// `presentation/tray-quest.css`.

const ROMAN = ["I", "II", "III", "IV", "V"];

export function QuestHead({
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
  const theme = crawlTheme(quest.packId);
  const low = party.hearts <= 3;
  return (
    <div className="qt-head">
      <span className="qt-seal" aria-hidden="true">
        <Emblem art="quill" />
      </span>
      <div className="qt-titles">
        <small className="qt-kicker" aria-hidden="true">
          {place.name}
        </small>
        <h2 id={titleId} className="qt-title" key={page.id}>
          {page.title}
        </h2>
      </div>
      <div
        className={`qt-vitals${low ? " low" : ""}`}
        role="img"
        aria-label={`${theme.words.Hearts}: ${party.hearts} of ${party.max}`}
      >
        <CrawlIcon name="heart" theme={theme} />
        <b aria-hidden="true">{party.hearts}</b>
        <small aria-hidden="true">/{party.max}</small>
      </div>
    </div>
  );
}

export function QuestPage({
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
      return <PartyPage session={session} onDrop={onDrop} />;
    case "satchel":
      return <PackPage session={session} onSpend={onSpend} onDrop={onDrop} />;
    case "map":
      return <MapPage session={session} />;
    case "lore":
      return <LorePage session={session} />;
    case "rival":
      return <RivalPage session={session} />;
    case "jinx":
      return <CursePage session={session} />;
    default:
      return null;
  }
}

/** The party's sheet: the adventurer as a character sheet (class emblem,
 * rank, perks), the hearts as containers, tonight's omen as a tarot plate,
 * and the allies who travel with them. */
function PartyPage({
  session,
  onDrop,
}: {
  session: SessionState;
  onDrop: (drop: BagDrop) => void;
}) {
  const quest = session.quest!;
  const party = quest.party!;
  const record = questRecord(session)!;
  const theme = crawlTheme(quest.packId);
  const form = record.form;
  const omens = record.boons.filter((b) => isOmenBoon(b));
  const allies = partyTeam(quest);
  return (
    <div className="qt-leaf">
      {form && (
        <article className="qt-hero crawl-omen">
          <span className="qt-hero-medal" aria-hidden="true">
            <Emblem art={classMark(form.card.id)} />
          </span>
          <div className="qt-hero-words">
            <small className="qt-hero-kicker">
              {theme.words.adventurer} ·{" "}
              {form.forms
                ? `Rank ${ROMAN[form.form] ?? form.form + 1}`
                : "Unranked"}
            </small>
            <strong>{form.title}</strong>
            {form.line.length > 1 && (
              <ol className="qt-ranks" aria-label="Ranks">
                {form.line.map((name, i) => (
                  <li
                    key={name}
                    className={
                      i === form.form ? "now" : i < form.form ? "past" : "next"
                    }
                    aria-current={i === form.form ? "step" : undefined}
                  >
                    <i aria-hidden="true">{ROMAN[i]}</i>
                    {name}
                  </li>
                ))}
              </ol>
            )}
          </div>
          <p className="omen-rules">{form.rules}</p>
        </article>
      )}
      <Section
        title={theme.words.Hearts}
        aside={`${party.hearts} of ${party.max}`}
        className="qt-hearts-section"
      >
        <div
          className="qt-hearts"
          role="img"
          aria-label={`${theme.words.Hearts}: ${party.hearts} of ${party.max}`}
          style={
            {
              "--per-row":
                party.max > 10 ? Math.ceil(party.max / 2) : party.max,
            } as CSSProperties
          }
        >
          {Array.from({ length: party.max }, (_, i) => (
            <span
              key={i}
              className={`qt-heart ${i < party.hearts ? "full" : "spent"}`}
              style={{ "--i": i } as CSSProperties}
            >
              <CrawlIcon name="heart" theme={theme} />
            </span>
          ))}
        </div>
      </Section>
      {omens.length > 0 && (
        <Section title="Tonight's omen" className="qt-omens">
          <ul
            className="crawl-boons qt-tarot-row"
            aria-label={theme.words.trinkets}
          >
            {omens.map((b) => (
              <li key={b.key} className="qt-tarot boon-omen">
                <span className="qt-tarot-art" aria-hidden="true">
                  <CrawlIcon name="omen" theme={theme} />
                </span>
                <strong>{b.boon.name}</strong>
                <span>{b.boon.rules}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Section
        title="Allies"
        aside={`${allies.length} of ${TEAM_SIZE}`}
        className="qt-allies"
      >
        {allies.length ? (
          <ul className="qt-ally-list crawl-team" aria-label="Allies">
            {allies.map((m) => (
              <li key={m.id} className="qt-ally">
                <span className="qt-ally-medal" aria-hidden="true">
                  <Emblem art={allyArt(m.title)} />
                </span>
                <span className="qt-ally-words">
                  <strong>{m.title}</strong>
                  <small>
                    {m.ally ? allyLine(m.ally) : "Travels with you."}
                  </small>
                </span>
                <span
                  className="qt-bonus"
                  aria-label={`+${assistBonus(m, quest)} to the roll`}
                >
                  +{assistBonus(m, quest)}
                </span>
                <ConfirmDrop
                  verb="Dismiss"
                  name={m.title}
                  onConfirm={() => onDrop({ caught: m.id })}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="tray-hint">
            No one rides with you yet. Inns and keepers have swords for hire.
          </p>
        )}
        {allies.length > 0 && (
          <p className="tray-hint">
            Send one into a d20 fight of its calling. Lose and it dies. At zero
            hearts, one dies in your place.
          </p>
        )}
      </Section>
    </div>
  );
}

/** The pack: what the party wears (weapon, armour, trinkets, in sockets
 * like a character screen's) over the satchel's slots. */
function PackPage({
  session,
  onSpend,
  onDrop,
}: {
  session: SessionState;
  onSpend: (item: Loot) => void;
  onDrop: (drop: BagDrop) => void;
}) {
  const quest = session.quest!;
  const record = questRecord(session)!;
  const theme = crawlTheme(quest.packId);
  const party = quest.party!;
  const gear = record.boons.filter((b) => !isOmenBoon(b));
  const slots = theme.equipment?.slots ?? {
    weapon: "Weapon",
    armor: "Armor",
    trinket: "Trinket",
  };
  const worn = (slot: "weapon" | "armor") =>
    gear.find((b) => b.boon.slot === slot);
  const others = gear.filter(
    (b) => b.boon.slot !== "weapon" && b.boon.slot !== "armor",
  );
  const socket = (
    key: string,
    label: string,
    piece: (typeof gear)[number] | undefined,
    icon: "weapon" | "armor" | "trinket" | "satchel",
  ) => (
    <li key={key} className={`qt-socket${piece ? " worn" : " bare"}`}>
      <span className="qt-socket-well" aria-hidden="true">
        <CrawlIcon name={piece ? gearIcon(piece.boon) : icon} theme={theme} />
      </span>
      <span className="qt-socket-words">
        <small className="qt-socket-slot">{label}</small>
        <strong className="bag-name">
          {piece ? piece.boon.name : "Nothing"}
        </strong>
        {piece && (
          <span className="qt-socket-does">{wornRules(piece.boon)}</span>
        )}
      </span>
    </li>
  );
  return (
    <div className="qt-leaf">
      <Section
        title={theme.words.Satchel}
        aside={`${party.loot.length} of ${record.satchel}`}
        className="qt-pack"
      >
        <ItemGrid
          session={session}
          theme={theme}
          size={record.satchel}
          onSpend={onSpend}
          onDrop={onDrop}
          note="The satchel is empty. Wins, merchants and inns fill it."
        />
      </Section>
      <Section
        title="Worn"
        aside={gear.length || undefined}
        className="qt-worn"
      >
        <ul className="qt-sockets crawl-gear" aria-label="Gear">
          {socket("weapon", slots.weapon, worn("weapon"), "weapon")}
          {socket("armor", slots.armor, worn("armor"), "armor")}
          {others.length
            ? others.map((b) =>
                socket(
                  b.key,
                  b.boon.slot
                    ? slots[b.boon.slot]
                    : (theme.words.trinkets ?? "Kept"),
                  b,
                  "trinket",
                ),
              )
            : socket("trinket", slots.trinket, undefined, "trinket")}
        </ul>
      </Section>
    </div>
  );
}

/** The map, with the wanted poster for the boss at the end of the region
 * and how far into it the party is. */
function MapPage({ session }: { session: SessionState }) {
  const quest = session.quest!;
  const place = crawlPlace(quest);
  const wanted = session.phase !== "complete" ? wantedBoss(quest) : undefined;
  return (
    <div className="qt-leaf">
      <div className="qt-map-frame crawl-map-section">
        <QuestMap quest={quest} />
      </div>
      <div className="qt-where">
        <div className="qt-where-place">
          <small>You are in</small>
          <strong>{place.name}</strong>
          {!place.omen && place.rooms > 1 && (
            <span
              className="qt-steps"
              role="img"
              aria-label={`Encounter ${place.room} of ${place.rooms}`}
            >
              {Array.from({ length: place.rooms }, (_, i) => (
                <i
                  key={i}
                  className={
                    i < place.room - 1
                      ? "done"
                      : i === place.room - 1
                        ? "here"
                        : ""
                  }
                />
              ))}
            </span>
          )}
        </div>
        {wanted && (
          <figure className="qt-wanted">
            <figcaption>Wanted</figcaption>
            <span className="qt-wanted-mark" aria-hidden="true">
              <TrophyMark
                card={wanted}
                fallback={
                  <CrawlIcon name="boss" theme={crawlTheme("dungeon")} />
                }
              />
            </span>
            <strong>{wanted.title}</strong>
            <small>Waits at the end of the region</small>
          </figure>
        )}
      </div>
    </div>
  );
}

/** Dragon lore: three rune sockets round the dragon's emblem, lit as lore
 * is found, and the lines read so far. */
function LorePage({ session }: { session: SessionState }) {
  const quest = session.quest!;
  const theme = crawlTheme(quest.packId);
  const lore = loreFound(quest);
  const n = quest.party?.lore ?? 0;
  const { id } = runNames(quest);
  return (
    <div className="qt-leaf">
      <div
        className={`qt-lore-seal lore-${n}`}
        style={dragonStyle(id) as CSSProperties}
        role="img"
        aria-label={`Dragon lore: ${n} of 3`}
      >
        <span className="qt-lore-dragon" aria-hidden="true">
          <Emblem art="dragon" />
        </span>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`qt-rune r${i}${i < n ? " lit" : ""}`}
            aria-hidden="true"
          >
            <CrawlIcon name="lore" theme={theme} />
          </span>
        ))}
      </div>
      {lore ? (
        <section className="crawl-lore">
          <p className="tray-hint">
            Each lore is an edge on one swing at <b>{lore.dragon}</b>: the first
            swings are rolled twice and the better kept.
          </p>
          <ol className="lore-lines qt-lore-lines">
            {[0, 1, 2].map((i) => (
              <li key={i} className={i < lore.lines.length ? "found" : ""}>
                <span className="qt-lore-num" aria-hidden="true">
                  {ROMAN[i]}
                </span>
                <span>{lore.lines[i] ?? "Not yet found."}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <p className="tray-hint">The dragon has not shown itself yet.</p>
      )}
    </div>
  );
}

/** The rival's file: their medallion, the rule the table keeps when they
 * show up, how they are cutting in now, what they hold and the record. */
function RivalPage({ session }: { session: SessionState }) {
  const quest = session.quest!;
  const theme = crawlTheme(quest.packId);
  const rival = quest.party?.rival;
  const profile = rivalProfile(quest)?.profile;
  if (!rival || !profile) return null;
  const cut = session.phase !== "complete" ? rivalCut(quest) : null;
  return (
    <div className="qt-leaf crawl-rival">
      <article className="qt-rival-file">
        <RivalMedal who={rival.who} className="qt-rival-medal" />
        <div className="qt-rival-words">
          <small>Your rival</small>
          <strong>{profile.name}</strong>
          <p>
            <b>Whenever they show up:</b> {profile.ritual}
          </p>
        </div>
      </article>
      {cut && (
        <p className="rival-cut qt-rival-cut">
          <strong>{cut.word}:</strong> {cut.line}
          {!cut.line.includes(cut.rule) && <small> {cut.rule}</small>}
        </p>
      )}
      <div
        className="qt-tally"
        role="img"
        aria-label={`Beaten ${rival.won}, lost to ${rival.lost}`}
      >
        <span className="won">
          <b>{rival.won}</b>
          <small>Beaten</small>
        </span>
        <span className="lost">
          <b>{rival.lost}</b>
          <small>Lost to</small>
        </span>
        <span className="held">
          <b>{rival.took.length}</b>
          <small>Holding</small>
        </span>
      </div>
      <Section title="What they hold" aside={rival.took.length}>
        {rival.took.length ? (
          <ul
            className="qt-ledger rival-ledger"
            aria-label="What your rival holds"
          >
            {rival.took.map((item, i) => (
              <li key={i}>
                <CrawlIcon name={item} theme={theme} />
                <strong>{theme.loot[item].name}</strong>
                <small>Yours. Beat them to take one back.</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="tray-hint">Nothing of yours. Yet.</p>
        )}
      </Section>
      <p className="tray-hint">
        A lost meeting hands them what its card shows; a won one takes an item
        back.
      </p>
    </div>
  );
}

/** The curse: a black-sealed scroll with the rule the table keeps. */
function CursePage({ session }: { session: SessionState }) {
  const quest = session.quest!;
  const record = questRecord(session)!;
  const theme = crawlTheme(quest.packId);
  const jinx = record.jinx?.jinx;
  const words = theme.words.jinx;
  if (jinx && words && session.phase !== "complete")
    return (
      <div className="qt-leaf">
        <article className="qt-curse crawl-curse crawl-jinx">
          <span className="qt-curse-seal" aria-hidden="true">
            <CrawlIcon name="jinx" theme={theme} />
          </span>
          <small className="qt-curse-from">Laid by {record.jinx!.title}</small>
          <strong>
            {words.name}: {jinx.name}
          </strong>
          <span className="qt-curse-rule">{jinx.rule}</span>
          <small className="qt-curse-lasts">Lasts {words.lasts}.</small>
        </article>
      </div>
    );
  return (
    <div className="qt-leaf">
      <div className="qt-clear">
        <span className="qt-clear-mark" aria-hidden="true">
          <Emblem art="shield" />
        </span>
        <strong>No curse lies on the party</strong>
        <p>
          A lost fight can lay one: a rule the cursed player keeps until the
          region&rsquo;s boss falls.
        </p>
      </div>
    </div>
  );
}
