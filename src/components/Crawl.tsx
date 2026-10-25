import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type {
  CardDefinition,
  Loot,
  Offer,
  PartyState,
  QuestState,
  SessionState,
  PokemonType,
} from "../game/types";
import {
  currentCard as currentCardOf,
  PRESS_STEP,
  canQuaff,
  canUseLoot,
  cardMatchup,
  finaleCard,
  finaleStage,
  hitsNeeded,
  isBossCard,
  omenForm,
  questRecord,
  stageKind,
  wantedBoss,
} from "../game/engine";
import { asset } from "../presentation/theme";
import {
  crawlIconPath,
  crawlTheme,
  heartCount,
  type CrawlIconName,
  type CrawlTheme,
} from "./crawlTheme";
import {
  BadgeCase,
  EdgeMark,
  MatchupPanel,
  TypeEdges,
  TypeMark,
  badgesLocked,
} from "./LeagueMarks";
import { pokemonTypes, typeStyle } from "../presentation/pokemon-types";

// Pub Crawl furniture: the party's hearts, the satchel, the floor's rooms and
// the boss's wounds. Everything a crawl shows lives here; the engine decides.
// The words and marks are the pack's (`crawlTheme`).

/** One of the crawl's single-colour marks, painted as a mask so it takes the
 * finish of wherever it sits. */
export function CrawlIcon({
  name,
  theme,
  className = "",
}: {
  name: CrawlIconName;
  theme: CrawlTheme;
  className?: string;
}) {
  const src = `url("${asset(crawlIconPath(theme, name))}")`;
  return (
    <span
      className={`crawl-icon icon-${name} ${className}`}
      aria-hidden="true"
      style={{ maskImage: src, WebkitMaskImage: src } as CSSProperties}
    />
  );
}

/** Where the run is: the floor's name (or tonight's omen), whether the
 * card in play is the floor's boss, and the room within the floor. */
export function crawlPlace(quest: QuestState) {
  const at = finaleStage(quest);
  const kind = stageKind(quest.stages[at.stage]);
  let rooms = at.stage;
  while (rooms > 0 && stageKind(quest.stages[rooms]) === "boss") rooms--;
  return {
    name: quest.stages[rooms].label,
    kind,
    omen: kind === "omen" || kind === "adventurer",
    boss: kind === "boss",
    room: at.index + 1,
    rooms: at.size,
  };
}

/** The meter's crawl face, a brass medallion: the heart with the hearts
 * left inside it, sized like the menu stud so the top row is symmetric.
 * Everything else the party carries is on the strip under the top row. */
export function CrawlMeterFace({ quest }: { quest: QuestState }) {
  const party = quest.party!;
  const theme = crawlTheme(quest.packId);
  const { pulse, delta } = useHeartPulse(party.hearts);
  return (
    <>
      {/* The change floats off the heart, like a damage number. */}
      {pulse && (
        <span
          className={`heart-splat splat-${pulse}`}
          key={`splat-${party.hearts}`}
          aria-hidden="true"
        >
          {delta > 0 ? `+${delta}` : `−${-delta}`}
        </span>
      )}
      <span
        className={`meter-heart ${pulse}${theme.icons.files.heart ? "" : " heart-shape"}`}
        key={`${party.hearts}-${pulse}`}
      >
        <CrawlIcon name="heart" theme={theme} />
        <strong className={party.hearts <= 3 ? "low" : undefined}>
          {party.hearts}
        </strong>
      </span>
    </>
  );
}
export function crawlMeterLabel(quest: QuestState) {
  const party = quest.party!;
  const place = crawlPlace(quest);
  const theme = crawlTheme(quest.packId);
  const jinx = party.jinx ? finaleCard(quest, party.jinx)?.jinx : undefined;
  return [
    `${theme.words.Hearts}: ${party.hearts} of ${party.max}`,
    place.name,
    party.curse && theme.curses[party.curse].name,
    party.loot.length &&
      `${theme.words.Satchel}: ${party.loot.map((l) => theme.loot[l].name).join(", ")}`,
    jinx && theme.words.jinx && `${theme.words.jinx.name}: ${jinx.name}`,
    !!party.cup &&
      theme.words.cup &&
      `${theme.words.cup.name}: ${party.cup} ${party.cup === 1 ? "splash" : "splashes"}`,
  ]
    .filter(Boolean)
    .join(". ");
}

/** "hurt" or "heal" for a moment after the hearts change, and by how
 * many. */
function useHeartPulse(hearts: number) {
  const last = useRef(hearts);
  const [change, setChange] = useState<{
    pulse: "" | "hurt" | "heal";
    delta: number;
  }>({ pulse: "", delta: 0 });
  useEffect(() => {
    if (hearts === last.current) return;
    const delta = hearts - last.current;
    setChange({ pulse: delta < 0 ? "hurt" : "heal", delta });
    last.current = hearts;
    // Long enough for the number to float off the heart.
    const id = setTimeout(() => setChange({ pulse: "", delta: 0 }), 1300);
    return () => clearTimeout(id);
  }, [hearts]);
  return change;
}

/** The top row's centre plaque during a crawl (2026-10-17): where the
 * party is, in words, over a track that reads from across the table: the
 * floor's rooms as pips, a boss's or an ambush's swings, or the mark of
 * tonight's omen or a landing. */
export function CrawlProgress({ quest }: { quest: QuestState }) {
  const place = crawlPlace(quest);
  const party = quest.party!;
  const card = finaleCard(quest, quest.finale[quest.step]);
  const need = card ? hitsNeeded(quest, card) : 0;
  const theme = crawlTheme(quest.packId);
  const { words } = theme;
  const plaque = (
    kind: string,
    label: React.ReactNode,
    spoken: string,
    track: React.ReactNode,
  ) => (
    <div
      className={`progress crawl-progress hud-plaque ${kind}`}
      role="img"
      aria-label={spoken}
    >
      <small className="plaque-label">{label}</small>
      <span className="plaque-track">{track}</span>
    </div>
  );
  if (place.omen) {
    const label = place.kind === "adventurer" ? words.adventurer : words.omen;
    return plaque(
      "omen",
      label,
      label,
      <CrawlIcon
        name={place.kind === "adventurer" ? "adventurer" : "omen"}
        theme={theme}
      />,
    );
  }
  // A landing, or a lone set piece without swings (the queue).
  if (place.kind === "rest" || (place.kind === "set-piece" && !need))
    return plaque(
      `omen ${place.kind}`,
      place.name,
      place.name,
      <CrawlIcon
        name={place.kind === "rest" ? "rest" : "ambush"}
        theme={theme}
      />,
    );
  if (need) {
    // A boss is named by its own stage (Gym 6, Brewery boss, Elite Four
    // 2/4); an ambush by the room it waits in.
    const at = finaleStage(quest);
    const stage = quest.stages[at.stage].label;
    return plaque(
      `boss ${place.boss ? "" : "ambush"}`,
      place.boss
        ? at.size > 1
          ? `${stage} · ${at.index + 1}/${at.size}`
          : stage
        : place.kind === "set-piece"
          ? place.name
          : `${words.Ambush} · ${place.room}/${place.rooms}`,
      `${place.boss ? words.Boss : place.kind === "set-piece" ? `${words.Ambush}, ${place.name}` : `${words.Ambush} in ${words.Room.toLowerCase()} ${place.room} of ${place.rooms}`}: ${party.hits} of ${need} hits`,
      <>
        <CrawlIcon name={place.boss ? "boss" : "ambush"} theme={theme} />
        <span className="boss-pips">
          {Array.from({ length: need }, (_, i) => (
            <i key={i} className={i < party.hits ? "hit" : undefined} />
          ))}
        </span>
      </>,
    );
  }
  return plaque(
    "rooms",
    <>
      {place.name}
      <span className="label-count">
        {" "}
        · {place.room}/{place.rooms}
      </span>
    </>,
    `${words.Room} ${place.room} of ${place.rooms}, ${place.name}`,
    <span className="room-pips">
      {Array.from({ length: place.rooms }, (_, i) => (
        <i
          key={i}
          className={
            i < place.room - 1 ? "done" : i === place.room - 1 ? "here" : ""
          }
        />
      ))}
    </span>,
  );
}

/** What the strip opens: the satchel, the League's badge case, or one thing
 * on the party, on its own. */
export type StripDialog =
  "satchel" | "badges" | "quaff" | "cup" | "curse" | "jinx" | "matchup";

/** The strip under the top row in a crawl (2026-10-17): everything the party
 * carries, each a chip that reads at a glance and opens its own dialog. The
 * satchel's slots show their items; the League's badges fill a row; the
 * Quaff lights while it can be drunk; the Cup counts its splashes; a curse
 * or a jinx names itself. */
export function CrawlStrip({
  session,
  disabled,
  onOpen,
}: {
  session: SessionState;
  disabled: boolean;
  onOpen: (dialog: StripDialog) => void;
}) {
  const quest = session.quest!;
  const party = quest.party!;
  const record = questRecord(session)!;
  const theme = crawlTheme(quest.packId);
  const { words } = theme;
  const jinx = party.jinx ? finaleCard(quest, party.jinx)?.jinx : undefined;
  const quaffReady = party.quaff !== undefined && !party.quaffed;
  const locked = badgesLocked(session, theme);
  // The League's type edge on the battle face up (2026-10-25): a mark
  // only; the dialog says what it does.
  const matchup =
    session.phase === "revealed"
      ? cardMatchup(quest, currentCardOf(session))
      : null;
  const chip = (
    className: string,
    label: string,
    dialog: StripDialog,
    children: React.ReactNode,
    shut = false,
  ) => (
    <button
      type="button"
      className={`hud-chip ${className}`}
      aria-label={label}
      aria-haspopup="dialog"
      disabled={disabled || shut}
      onClick={(event) => {
        // Safari does not focus a tapped button; the dialog gives focus back.
        event.currentTarget.focus();
        onOpen(dialog);
      }}
    >
      {children}
    </button>
  );
  return (
    // A curse and a jinx together leave no room for their names: they keep
    // their marks, and the effects dialog names them.
    <div
      className={`hud-strip${party.curse && jinx ? " tight" : ""}`}
      role="group"
      aria-label={words.party}
    >
      {matchup?.edge &&
        chip(
          `tag-edge edge-${matchup.edge}`,
          `${matchup.tera ? "Terastallized" : matchup.edge === "advantage" ? "Super effective" : "Not very effective"}: ${matchup.edge}`,
          "matchup",
          <EdgeMark edge={matchup.edge} />,
        )}
      {chip(
        "tag-satchel",
        `${words.Satchel}: ${party.loot.length ? party.loot.map((l) => theme.loot[l].name).join(", ") : "empty"}`,
        "satchel",
        Array.from({ length: record.satchel }, (_, i) =>
          party.loot[i] ? (
            <CrawlIcon key={i} name={party.loot[i]} theme={theme} />
          ) : (
            <i key={i} className="slot-empty" />
          ),
        ),
      )}
      {words.badges &&
        record.badges.of > 0 &&
        chip(
          `tag-badges${locked ? " locked" : ""}`,
          `${words.badges}: ${record.badges.earned} of ${record.badges.of}${locked ? `, ${theme.badgeLock!.why}` : ""}`,
          "badges",
          <>
            <CrawlIcon name="boss" theme={theme} />
            <b>
              {record.badges.earned}/{record.badges.of}
            </b>
            {/* A card asking for the badges from memory shuts the case. */}
            {locked && <i className="chip-lock" aria-hidden="true" />}
          </>,
          locked,
        )}
      {words.quaff &&
        party.quaff !== undefined &&
        chip(
          `tag-quaff${quaffReady ? " ready" : " spent"}`,
          `${words.quaff}: ${quaffReady ? `ready, drink ${party.quaff} to reroll a lost d20` : "drunk, back when the boss falls"}`,
          "quaff",
          <CrawlIcon name="quaff" theme={theme} />,
        )}
      {words.cup &&
        party.cup !== undefined &&
        chip(
          `tag-cup${party.cup ? "" : " empty"}`,
          `${words.cup.name}: ${party.cup} ${party.cup === 1 ? "splash" : "splashes"}`,
          "cup",
          <>
            <CrawlIcon name="cup" theme={theme} />
            {/* Keyed by the count so each splash replays the tip. */}
            <b key={party.cup}>{party.cup}</b>
          </>,
        )}
      {party.curse &&
        chip(
          `tag-curse curse-${party.curse}`,
          `${theme.curses[party.curse].name}: ${theme.curses[party.curse].does}`,
          "curse",
          <>
            <CrawlIcon name={party.curse} theme={theme} />
            <span className="chip-name">{theme.curses[party.curse].name}</span>
          </>,
        )}
      {jinx &&
        words.jinx &&
        chip(
          "tag-jinx",
          `${words.jinx.name}: ${jinx.name}`,
          "jinx",
          <>
            <CrawlIcon name="jinx" theme={theme} />
            <span className="chip-name">{jinx.name}</span>
          </>,
        )}
    </div>
  );
}

/** What a card in a crawl puts on the line, as wax seals in the card's
 * foot. Every seal is the same pill: what can go wrong on the left (hearts
 * lost, a curse, and a boss's or ambush's swings), what it brings on the
 * right (an item or hearts back), each marked − or +. */
export function CardStakes({
  card,
  party,
  hits = 0,
  theme,
  shift = 0,
}: {
  card: CardDefinition;
  party: PartyState;
  hits?: number;
  theme: CrawlTheme;
  /** A League type edge on a plaque-settled fight: the loss moves by one. */
  shift?: number;
}) {
  const damage = card.battle && card.damage && card.damage + shift;
  const gain = card.reward?.loot ?? (card.reward?.heal ? "heal" : null);
  // Tonight's omen is a boon too, but its card says so in words; a boss or
  // an elite offers its spoils.
  const trinket = card.spoils?.length
    ? card.spoils.map((b) => b.name).join(" or ")
    : card.encounter !== "omen"
      ? card.boon?.name
      : undefined;
  const jinx = card.jinx;
  const prizes = card.press?.prizes;
  if (!damage && !gain && !card.curse && !hits && !trinket && !jinx && !prizes)
    return null;
  const bleed = party.curse === "bleed" ? 1 : 0;
  const boss = isBossCard(card);
  return (
    <span className="card-stakes">
      <span className="stake-group">
        {damage ? (
          <span
            className="stake stake-loss"
            aria-label={`Losing costs ${heartCount(theme, damage + bleed)}`}
          >
            <b>−{damage + bleed}</b>
            <CrawlIcon name="heart" theme={theme} />
          </span>
        ) : null}
        {card.curse && (
          <span
            className={`stake stake-curse curse-${card.curse}`}
            aria-label={`${card.battle ? "Losing brings" : "Brings"} a ${theme.words.curse}: ${theme.curses[card.curse].name}`}
          >
            <CrawlIcon name={card.curse} theme={theme} />
          </span>
        )}
        {jinx && (
          <span
            className="stake stake-jinx"
            aria-label={`${card.battle ? "Losing lays" : "Lays"} a jinx: ${jinx.name}`}
          >
            <CrawlIcon name="jinx" theme={theme} />
          </span>
        )}
        {hits > 1 && (
          <span
            className="stake stake-hits"
            aria-label={`${boss ? theme.words.aBoss : theme.words.anAmbush}: ${party.hits} of ${hits} hits landed`}
          >
            <CrawlIcon name={boss ? "boss" : "ambush"} theme={theme} />
            <span className="stake-pips">
              {Array.from({ length: hits }, (_, i) => (
                <i key={i} className={i < party.hits ? "hit" : undefined} />
              ))}
            </span>
          </span>
        )}
      </span>
      <span className="stake-group">
        {gain === "heal" ? (
          <span
            className="stake stake-heal"
            aria-label={`Heals ${card.reward!.heal} ${theme.words.hearts}`}
          >
            <b>+{card.reward!.heal}</b>
            <CrawlIcon name="heart" theme={theme} />
          </span>
        ) : gain ? (
          <span
            className="stake stake-loot"
            aria-label={`${card.battle ? "Winning finds" : "Finds"} a ${theme.loot[gain].name}`}
          >
            <b>+</b>
            <CrawlIcon name={gain} theme={theme} />
          </span>
        ) : null}
        {prizes && (
          // Push your luck: every prize, the ones banked lit.
          <span
            className="stake stake-loot stake-prizes"
            aria-label={`Prizes, one a win: ${prizes.map((p) => theme.loot[p].name).join(", then ")}; ${party.press ?? 0} banked`}
          >
            <b>+</b>
            {prizes.map((p, i) => (
              <CrawlIcon
                key={i}
                name={p}
                theme={theme}
                className={i < (party.press ?? 0) ? "banked" : undefined}
              />
            ))}
          </span>
        )}
        {trinket && (
          <span
            className="stake stake-trinket"
            aria-label={`${hits > 1 ? "Felling it offers" : card.battle ? "Winning offers" : "Brings"} a trinket: ${trinket}`}
          >
            <b>+</b>
            <CrawlIcon name="trinket" theme={theme} />
          </span>
        )}
      </span>
    </span>
  );
}

/** A merchant's ware or a fork's door, as a plaque at the card's foot: what
 * it brings (an item, or an elite behind the door), its price in hearts, and
 * its label. A price the party can't pay leaves the plaque dimmed. */
export function OfferPlaque({
  offer,
  index,
  can,
  onTake,
  theme,
  branch,
}: {
  offer: Offer;
  index: number;
  can: boolean;
  onTake: (index: number, branch?: number) => void;
  theme: CrawlTheme;
  /** One of a branching starter's forms, on its own evolve plaque, with a
   * forked adventurer's tagline. */
  branch?: { name: string; index: number; tagline?: string };
}) {
  // A branch plaque names its form, with its price ("drink 3") under the
  // name: four across leave no room for the whole label ("Evolve · drink 3"),
  // and its mark already says it evolves. A heal says how many hearts it
  // brings back.
  const price = branch ? offer.label.split(" · ")[1] : undefined;
  const under = branch
    ? (price ?? offer.label)
    : offer.heal
      ? `+${heartCount(theme, offer.heal)}`
      : undefined;
  const icon: CrawlIconName | null = offer.loot
    ? offer.loot
    : offer.elite
      ? "elite"
      : offer.evolve
        ? "adventurer"
        : offer.heal
          ? "heart"
          : null;
  const brings = offer.loot
    ? `a ${theme.loot[offer.loot].name}`
    : offer.elite
      ? theme.words.elite
      : offer.evolve
        ? !can
          ? `${theme.words.grows.who} is ${theme.words.grows.done}`
          : branch
            ? `${theme.words.grows.who} ${theme.words.grows.verb} into ${branch.name}`
            : `${theme.words.grows.who} ${theme.words.grows.verb}`
        : offer.heal
          ? `${offer.heal} ${theme.words.hearts} back`
          : "nothing";
  return (
    <button
      className={`card-choice-option offer-plaque ${offer.elite ? "offer-loud" : icon ? "offer-buy" : "offer-pass"}`}
      style={{ animationDelay: `${index * 70}ms` }}
      disabled={!can}
      aria-label={`${branch ? `${branch.name}${branch.tagline ? `, ${branch.tagline}` : ""}${price ? ` · ${price}` : ""}` : offer.label}${offer.cost ? `, ${heartCount(theme, offer.cost)}` : ""}: ${brings}`}
      onClick={() => onTake(index, branch?.index)}
    >
      <span className="offer-goods" aria-hidden="true">
        {icon ? (
          <CrawlIcon name={icon} theme={theme} />
        ) : (
          <CrawlIcon name="door" theme={theme} className="offer-plain" />
        )}
        {offer.cost ? (
          <span className="offer-cost">
            <CrawlIcon name="heart" theme={theme} />−{offer.cost}
          </span>
        ) : null}
      </span>
      <span className="offer-label">
        <span className="offer-name">{branch ? branch.name : offer.label}</span>
        {/* A path's tagline sits between its name and its price. */}
        {branch?.tagline && (
          <small className="offer-price offer-tagline">{branch.tagline}</small>
        )}
        {under && <small className="offer-price">{under}</small>}
      </span>
    </button>
  );
}

/** Items the party can use on the card in play, offered as plaques at the
 * card's foot: a Tera Orb or a smoke bomb before a fight, a loaded die after
 * a lost roll. The draught waits in the satchel (the meter). */
export function usableItems(s: SessionState): Loot[] {
  return (["tera", "smoke", "die", "round"] as const).filter((item) =>
    canUseLoot(s, item),
  );
}
export function LootPlaque({
  item,
  onUse,
  theme,
}: {
  item: Loot;
  onUse: (item: Loot) => void;
  theme: CrawlTheme;
}) {
  return (
    <button
      className={`card-choice-option loot-plaque loot-${item}`}
      aria-label={`Use the ${theme.loot[item].name}: ${theme.loot[item].does}`}
      onClick={() => onUse(item)}
    >
      <CrawlIcon name={item} theme={theme} />
      <span>
        {item === "smoke"
          ? theme.flee
          : item === "round"
            ? theme.pass
            : item === "tera"
              ? theme.tera
              : theme.reroll}
      </span>
    </button>
  );
}

/** The Quaff, beside Reroll on a lost roll: drinks for another go, once
 * until the next boss falls. */
export function QuaffPlaque({
  session,
  onQuaff,
  theme,
}: {
  session: SessionState;
  onQuaff: () => void;
  theme: CrawlTheme;
}) {
  const drinks = session.quest?.party?.quaff;
  if (!theme.words.quaff || drinks === undefined || !canQuaff(session))
    return null;
  return (
    <button
      className="card-choice-option loot-plaque quaff-plaque"
      aria-label={`${theme.words.quaff}: drink ${drinks} and roll again, once until the next boss falls`}
      onClick={onQuaff}
    >
      <CrawlIcon name="quaff" theme={theme} />
      <span className="offer-label">
        <span className="offer-name">{theme.words.quaff}</span>
        <small className="offer-price">drink {drinks} · reroll</small>
      </span>
    </button>
  );
}

/** A push-your-luck win: cash out with every prize banked, or go again,
 * harder. */
export function PressPlaques({
  session,
  onCashOut,
  onPress,
  theme,
}: {
  session: SessionState;
  onCashOut: () => void;
  onPress: () => void;
  theme: CrawlTheme;
}) {
  const card = currentCardOf(session);
  const banked = (session.quest?.party?.press ?? 0) + 1;
  const prizes = card.press!.prizes.slice(0, banked);
  const names = prizes.map((p) => theme.loot[p].name).join(", ");
  return (
    <>
      <button
        className="card-choice-option offer-plaque offer-buy press-cash"
        aria-label={`Cash out: ${names}`}
        onClick={onCashOut}
      >
        <span className="offer-goods" aria-hidden="true">
          {prizes.map((p, i) => (
            <CrawlIcon key={i} name={p} theme={theme} />
          ))}
        </span>
        <span className="offer-label">
          <span className="offer-name">Cash out</span>
        </span>
      </button>
      <button
        className="card-choice-option offer-plaque offer-loud press-again"
        aria-label={`Again: roll for the next prize, ${PRESS_STEP} lower. Lose and it all goes.`}
        onClick={onPress}
      >
        <span className="offer-goods" aria-hidden="true">
          <CrawlIcon name={card.press!.prizes[banked]} theme={theme} />
        </span>
        <span className="offer-label">
          <span className="offer-name">Again</span>
          <small className="offer-price">−{PRESS_STEP} to the roll</small>
        </span>
      </button>
    </>
  );
}

/** A won fight's spoils, one plaque each: the trinket's mark, its name and
 * its power. Taking one puts the card aside. */
export function SpoilsPlaque({
  name,
  rules,
  index,
  onTake,
  theme,
}: {
  name: string;
  rules: string;
  index: number;
  onTake: (index: number) => void;
  theme: CrawlTheme;
}) {
  return (
    <button
      className="card-choice-option spoils-plaque"
      style={{ animationDelay: `${index * 70}ms` }}
      aria-label={`Take the ${name}: ${rules}`}
      onClick={() => onTake(index)}
    >
      <span className="offer-goods" aria-hidden="true">
        <CrawlIcon name="trinket" theme={theme} />
      </span>
      <span className="offer-label">
        <span className="offer-name">{name}</span>
        <small className="offer-price">{rules}</small>
      </span>
    </button>
  );
}

type RunRecord = NonNullable<ReturnType<typeof questRecord>>;
/** One dialog's share of the run (`CrawlRecord`'s `part`). */
export type RecordPart = "party" | StripDialog;

/** The run so far, for the satchel dialog and the end screens: the hearts,
 * the satchel (a draught can be drunk from here), the curse, and on the end
 * screens each floor with its rooms faced and its boss. */
export function CrawlRecord({
  record,
  theme,
  session,
  onUse,
  part,
}: {
  record: RunRecord;
  theme: CrawlTheme;
  session?: SessionState | null;
  onUse?: (item: Loot, branch?: number) => void;
  /** In play, each dialog shows its own part: the party (hearts, the
   * adventurer or starter, boons), the satchel, the League's badges, or one
   * thing on the party (the Quaff, the Cup, a curse, a jinx). The end
   * screens show everything. */
  part?: RecordPart;
}) {
  const show = (p: RecordPart) => !part || part === p;
  const party = record.party!;
  // A forked adventurer still to pick a path (a Tome's two buttons).
  const paths =
    session && omenForm(session.quest)?.card.fork
      ? omenForm(session.quest)?.branches
      : null;
  const { words } = theme;
  const quest = session?.quest;
  // The boss waiting at the bottom of this floor, while the run is on.
  const wanted =
    quest && !party.wiped && !record.won && words.wanted
      ? wantedBoss(quest)
      : undefined;
  const floors: {
    name: string;
    rooms: number;
    of: number;
    boss?: string;
    wanted?: string;
    piece?: string;
  }[] = [];
  for (const [i, stage] of record.stages.entries()) {
    const kind = stage.kind;
    // A run's omens open it and a landing is a pause: neither is a floor.
    if (stage.omen || kind === "rest") continue;
    const last = floors[floors.length - 1];
    // A boss closes the floor before it; one that follows a set piece or
    // another boss (Last Call, the League's gauntlet) stands on its own.
    if (stage.boss && last && !last.piece && !last.boss && !last.wanted) {
      last.boss = stage.cards[0]?.title;
      if (!last.boss && wanted && quest!.stages[i].cards.includes(wanted))
        last.wanted = wanted.title;
    } else if (stage.size === 1 && (stage.boss || kind === "set-piece"))
      floors.push({
        name: stage.label,
        rooms: stage.cards.length,
        of: 1,
        piece: stage.cards[0]?.title ?? "Not yet reached",
      });
    else
      floors.push({
        name: stage.label,
        rooms: stage.cards.length,
        of: stage.size,
      });
  }
  const jinx = record.jinx?.jinx;
  return (
    <div className="crawl-record">
      {show("party") && (
        <div
          className="crawl-hearts"
          role="img"
          aria-label={`${words.Hearts}: ${party.hearts} of ${party.max}`}
          // One row up to twelve; an omen's extra hearts split into two even
          // rows.
          style={
            {
              "--per-row":
                party.max > 12 ? Math.ceil(party.max / 2) : party.max,
            } as CSSProperties
          }
        >
          {Array.from({ length: party.max }, (_, i) => (
            <CrawlIcon
              key={i}
              name="heart"
              theme={theme}
              className={i < party.hearts ? "full" : "spent"}
            />
          ))}
        </div>
      )}
      {part === "matchup" &&
        session &&
        (() => {
          const card = currentCardOf(session);
          const m = cardMatchup(session.quest, card);
          return m?.edge && record.form ? (
            <MatchupPanel matchup={m} card={card} starter={record.form.title} />
          ) : null;
        })()}
      {show("party") && record.form && (
        <FormPanel form={record.form} theme={theme} />
      )}
      {show("party") && record.boons.length > 0 && (
        <ul className="crawl-boons" aria-label={words.trinkets}>
          {record.boons.map(({ card, boon, key }) => (
            <li
              key={key}
              className={`crawl-omen ${card.encounter === "omen" ? "boon-omen" : "boon-trinket"}`}
            >
              <CrawlIcon
                name={card.encounter === "omen" ? "omen" : "trinket"}
                theme={theme}
              />
              <strong>{boon.name}</strong>
              <span>{boon.rules}</span>
            </li>
          ))}
        </ul>
      )}
      {show("badges") && words.badges && record.badges.of > 0 && (
        <BadgeCase
          record={record}
          packId={session?.quest?.packId ?? "pokemon"}
          label={words.badges}
        />
      )}
      {show("badges") && words.badgesNote && record.badges.of > 0 && (
        <p className="crawl-note">{words.badgesNote}</p>
      )}
      {part === "quaff" && words.quaff && party.quaff !== undefined && (
        <p className={`crawl-cup crawl-quaff${party.quaffed ? " spent" : ""}`}>
          <CrawlIcon name="quaff" theme={theme} />
          <strong>
            {words.quaff}: {party.quaffed ? "drunk" : "ready"}
          </strong>
          <span>
            {party.quaffed
              ? "Back when the floor's boss falls."
              : `Lost a d20? Drink ${party.quaff} to roll it again. Once per boss.`}
          </span>
        </p>
      )}
      {show("curse") && party.curse && (
        <p className={`crawl-curse curse-${party.curse}`}>
          <CrawlIcon name={party.curse} theme={theme} />
          <strong>{theme.curses[party.curse].name}</strong>
          <span>
            {theme.curses[party.curse].does}, {words.curseLasts}
          </span>
        </p>
      )}
      {show("jinx") && jinx && words.jinx && !record.won && !party.wiped && (
        <p className="crawl-curse crawl-jinx">
          <CrawlIcon name="jinx" theme={theme} />
          <strong>
            {words.jinx.name}: {jinx.name}
          </strong>
          <span>
            {jinx.rule} Lasts {words.jinx.lasts}.
          </span>
        </p>
      )}
      {show("cup") && party.cup !== undefined && words.cup && (
        <p className="crawl-cup">
          <CrawlIcon name="cup" theme={theme} />
          <strong>
            {words.cup.name}: {party.cup}{" "}
            {party.cup === 1 ? "splash" : "splashes"}
          </strong>
          <span>
            {record.won
              ? words.cup.won
              : party.wiped
                ? words.cup.wiped
                : `${words.cup.pour}. ${words.cup.won}`}
          </span>
        </p>
      )}
      {show("satchel") && !party.wiped && !record.won && (
        <ul className="satchel" aria-label={words.Satchel}>
          {Array.from({ length: record.satchel }, (_, i) => {
            const item = party.loot[i];
            if (!item)
              return (
                <li key={i} className="satchel-slot empty">
                  <CrawlIcon name="satchel" theme={theme} />
                  <span className="sr-only">Empty</span>
                </li>
              );
            // The draught and the candy are used from here; the others work
            // on the card in play, or on their own.
            const usable =
              !!session &&
              !!onUse &&
              (item === "draught" || item === "candy") &&
              canUseLoot(session, item);
            return (
              <li key={i} className="satchel-slot">
                <CrawlIcon name={item} theme={theme} />
                <span>
                  <strong>{theme.loot[item].name}</strong>
                  <small>{theme.loot[item].does}</small>
                </span>
                {/* A Tome on a forked adventurer picks its path: one button
                    a path, named for it (2026-10-25). */}
                {usable &&
                  (item === "candy" && paths ? (
                    paths.map((name: string, b: number) => (
                      <button
                        key={name}
                        className="satchel-use"
                        aria-label={`${theme.eat}: ${name}`}
                        onClick={() => onUse!(item, b)}
                      >
                        {name}
                      </button>
                    ))
                  ) : (
                    <button
                      className="satchel-use"
                      onClick={() => onUse!(item)}
                    >
                      {item === "candy" ? theme.eat : theme.drink}
                    </button>
                  ))}
              </li>
            );
          })}
        </ul>
      )}
      {/* The run floor by floor, on the end screens only: in play, the
          stage banners already name each floor and its boss. */}
      {!session && (
        <ol className="crawl-floors">
          {floors.map((floor) => (
            <li
              key={floor.name}
              className={
                floor.boss ? "cleared" : floor.rooms ? "reached" : undefined
              }
            >
              <strong>{floor.name}</strong>
              <span>
                {floor.piece
                  ? floor.piece
                  : floor.rooms
                    ? `${floor.rooms} of ${floor.of} ${words.rooms}`
                    : "Not yet reached"}
                {floor.boss && (
                  <>
                    {" · "}
                    <em>{floor.boss}</em>
                  </>
                )}
                {floor.wanted && words.wanted && (
                  <>
                    {" · "}
                    <span className="crawl-wanted">
                      {words.wanted}: {floor.wanted}
                    </span>
                  </>
                )}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** The starter or adventurer it is now (owner, 2026-10-17), with its
 * power. A League starter wears its type (2026-10-25: one for the run): the
 * medallion, a tint, its type named under it, and the types it is strong
 * and weak against, so the table can plan ahead. */
function FormPanel({
  form,
  theme,
}: {
  form: { title: string; rules: string; type?: PokemonType };
  theme: CrawlTheme;
}) {
  const type = theme.words.badges ? form.type : undefined;
  if (!type)
    return (
      <p className="crawl-omen">
        <CrawlIcon name="adventurer" theme={theme} />
        <strong>{form.title}</strong>
        <span className="omen-rules">{form.rules}</span>
      </p>
    );
  return (
    <div
      className={`crawl-omen typed-omen type-${type}`}
      style={typeStyle(type) as CSSProperties}
    >
      <TypeMark type={type} />
      <strong>{form.title}</strong>
      <span className="omen-rules">{form.rules}</span>
      <small className="type-chips">
        <span className="type-chip" style={typeStyle(type) as CSSProperties}>
          {pokemonTypes[type].name}
        </span>
      </small>
      <TypeEdges type={type} />
    </div>
  );
}

/** The seals a crawl card wears, and the standing d20 rule, explained: touch
 * has no hover, so the guide spells them out. */
export function SealLegend({ theme }: { theme: CrawlTheme }) {
  return (
    <dl className="crawl-legend" aria-label="The seals on a card">
      <div>
        <dt className="stake stake-loss">
          <b>−2</b>
          <CrawlIcon name="heart" theme={theme} />
        </dt>
        <dd>{theme.legend[0]}</dd>
      </div>
      <div>
        <dt className="stake stake-curse curse-bleed">
          <CrawlIcon name="bleed" theme={theme} />
        </dt>
        <dd>{theme.legend[1]}</dd>
      </div>
      <div>
        <dt className="stake stake-hits">
          <CrawlIcon name="boss" theme={theme} />
          <span className="stake-pips">
            <i className="hit" />
            <i />
          </span>
        </dt>
        <dd>{theme.legend[2]}</dd>
      </div>
      <div>
        <dt className="stake stake-loot">
          <b>+</b>
          <CrawlIcon name="die" theme={theme} />
        </dt>
        <dd>{theme.legend[3]}</dd>
      </div>
      {theme.legendMore?.trinket && (
        <div>
          <dt className="stake stake-trinket">
            <b>+</b>
            <CrawlIcon name="trinket" theme={theme} />
          </dt>
          <dd>{theme.legendMore.trinket}</dd>
        </div>
      )}
      {theme.legendMore?.jinx && (
        <div>
          <dt className="stake stake-jinx">
            <CrawlIcon name="jinx" theme={theme} />
          </dt>
          <dd>{theme.legendMore.jinx}</dd>
        </div>
      )}
      {/* The standing rule on a d20, the crawl's natural 20 and 1. */}
      <div>
        <dt className="stake stake-natural">
          <b>20</b>
        </dt>
        <dd>{theme.naturals[0]}</dd>
      </div>
      <div>
        <dt className="stake stake-loss">
          <b>1</b>
        </dt>
        <dd>{theme.naturals[1]}</dd>
      </div>
    </dl>
  );
}

/** The table feels a heart change: the screen's edges flush red when the
 * party is hurt and warm gold when it heals. Never takes a tap. */
export function PartyPulse({
  party,
  hidden,
}: {
  party: PartyState;
  hidden: boolean;
}) {
  const last = useRef(party.hearts);
  const [flash, setFlash] = useState<{ kind: string; at: number } | null>(null);
  useEffect(() => {
    const before = last.current;
    last.current = party.hearts;
    if (party.hearts === before || hidden) return;
    setFlash({
      kind: party.wiped ? "wipe" : party.hearts < before ? "hurt" : "heal",
      at: Date.now(),
    });
  }, [party.hearts, party.wiped, hidden]);
  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 1400);
    return () => clearTimeout(id);
  }, [flash]);
  if (!flash) return null;
  return createPortal(
    <div
      key={flash.at}
      className={`party-pulse pulse-${flash.kind}`}
      aria-hidden="true"
    />,
    document.body,
  );
}
