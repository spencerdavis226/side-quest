import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type {
  Boon,
  CardDefinition,
  Loot,
  Offer,
  PartyState,
  QuestState,
  SessionState,
  PokemonType,
} from "../game/types";
import {
  type BagDrop,
  currentCard as currentCardOf,
  PRESS_STEP,
  TEAM_SIZE,
  canUseLoot,
  assistBonus,
  cardMatchup,
  finaleCard,
  finaleStage,
  hitsNeeded,
  isBossCard,
  isLasting,
  catchReplaces,
  partyTeam,
  questRecord,
  replaces,
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
import { Modal } from "./UI";
import type { ExtraShape } from "./extras";

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
    party.loot.length &&
      `${theme.words.Satchel}: ${party.loot.map((l) => theme.loot[l].name).join(", ")}`,
    jinx && theme.words.jinx && `${theme.words.jinx.name}: ${jinx.name}`,
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
    <>{place.name}</>,
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
export type StripDialog = "satchel" | "badges" | "jinx" | "matchup";

/** The strip under the top row in a crawl (2026-10-17): what the table acts
 * on, each a chip that opens its own dialog. The League's type edge on the
 * battle face up; the satchel's items; the League's badges; a jinx names
 * itself. */
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
  const locked = badgesLocked(session, theme);
  const caught = partyTeam(quest);
  const bagEmpty = !party.loot.length && !caught.length;
  // The League's type edge on the battle face up (2026-10-25): a mark
  // only; the dialog says what it does.
  const matchup =
    session.phase === "revealed"
      ? cardMatchup(quest, currentCardOf(session))
      : null;
  // A caught Pokémon sent into this battle (2026-10-31): its bonus.
  const helper =
    session.phase === "revealed" && party.assist
      ? finaleCard(quest, party.assist)
      : undefined;
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
    <div className="hud-strip" role="group" aria-label={words.party}>
      {matchup?.edge &&
        chip(
          `tag-edge edge-${matchup.edge}`,
          matchup.edge === "advantage" ? "Type advantage" : "Type disadvantage",
          "matchup",
          <>
            <EdgeMark edge={matchup.edge} />
            <span className="chip-name">
              {matchup.edge === "advantage" ? "Strong" : "Weak"}
            </span>
          </>,
        )}
      {helper &&
        chip(
          "tag-assist",
          `${helper.title} sent in: +${assistBonus(helper)} to the roll`,
          "satchel",
          <>
            {helper.type && <TypeMark type={helper.type} />}
            <span className="chip-name">+{assistBonus(helper)}</span>
          </>,
        )}
      {chip(
        `tag-satchel${bagEmpty ? " empty" : ""}`,
        `${words.Satchel}: ${[...party.loot.map((l) => theme.loot[l].name), ...caught.map((m) => m.title)].join(", ") || "empty"}`,
        "satchel",
        // The items show for themselves; an empty bag is one dim bag, so the
        // chip keeps its place (2026-10-27, owner).
        bagEmpty ? (
          <CrawlIcon name="satchel" theme={theme} />
        ) : (
          <>
            {party.loot.map((item, i) => (
              <CrawlIcon key={i} name={item} theme={theme} />
            ))}
            {caught.map((m) => m.type && <TypeMark key={m.id} type={m.type} />)}
          </>
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
 * lost, a jinx, and a boss's or ambush's swings), what it brings on the
 * right (an item or hearts back), each marked − or +. */
export function CardStakes({
  card,
  party,
  hits = 0,
  theme,
  strike,
  target,
}: {
  card: CardDefinition;
  party: PartyState;
  hits?: number;
  theme: CrawlTheme;
  /** The roll to beat (`rollTarget`): a gem in the foot's right corner
   * (2026-10-31, owner: like Hearthstone's attack and health gems). */
  target?: { target: number; count: number; sides: number } | null;
  /** A strike's matchup: it costs hearts only when it is lost (against the
   * starter's type). */
  strike?: "advantage" | "disadvantage" | "even";
}) {
  const damage = card.strike
    ? strike === "disadvantage" && card.damage
    : card.battle && card.damage;
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
  if (!damage && !gain && !hits && !trinket && !jinx && !prizes && !target)
    return null;
  const d20 = target?.count === 1 && target.sides === 20;
  const boss = isBossCard(card);
  return (
    <span className="card-stakes">
      <span className="stake-group">
        {damage ? (
          <span
            className="stake stake-loss stake-gem"
            aria-label={`${card.strike ? "Costs" : "Losing costs"} ${heartCount(theme, damage)}`}
          >
            <b>−{damage}</b>
            <CrawlIcon name="heart" theme={theme} />
          </span>
        ) : null}
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
        {target && (
          <span
            className="stake stake-target stake-gem"
            aria-label={`Roll ${target.target} or more${d20 ? "" : ` on ${target.count}d${target.sides}`} to win`}
          >
            <b>{target.target}+</b>
            {!d20 && (
              <small>
                {target.count}d{target.sides}
              </small>
            )}
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
  /** One of a branching starter's forms, on its own evolve plaque. */
  branch?: { name: string; index: number };
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
      aria-label={`${branch ? `${branch.name}${price ? ` · ${price}` : ""}` : offer.label}${offer.cost ? `, ${heartCount(theme, offer.cost)}` : ""}: ${brings}`}
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
        {under && <small className="offer-price">{under}</small>}
      </span>
    </button>
  );
}

/** Items the party can use on the card in play, offered as plaques at the
 * card's foot: a smoke bomb before a fight, a loaded die after a lost roll.
 * The draught waits in the satchel (the meter). */
export function usableItems(s: SessionState): Loot[] {
  return (["smoke", "die", "round"] as const).filter((item) =>
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
            : theme.reroll}
      </span>
    </button>
  );
}

/** Pokémon League (2026-10-25): a beaten wild Pokémon, caught for a drink
 * or let go. A full team names the teammate a catch lets go. */
export function CatchPlaques({
  session,
  onCatch,
  onRelease,
  theme,
}: {
  session: SessionState;
  onCatch: () => void;
  onRelease: () => void;
  theme: CrawlTheme;
}) {
  const card = currentCardOf(session);
  const old = catchReplaces(session.quest);
  // A throw (2026-10-27) names the number to beat; a card from a save before
  // it is caught for a drink.
  const need = card.catchRate;
  return (
    <>
      <button
        className="card-choice-option offer-plaque offer-buy catch-plaque"
        aria-label={
          need
            ? `Throw a ball at ${card.title}: roll d20, ${need} or more catches it${old ? `, and ${old.title} goes` : ""}`
            : `Catch ${card.title}: drink 1${old ? `, and ${old.title} goes` : ""}`
        }
        onClick={onCatch}
      >
        <span className="offer-goods" aria-hidden="true">
          <CrawlIcon name="heart" theme={theme} />
        </span>
        <span className="offer-label">
          <span className="offer-name">
            {need ? "Throw a ball" : "Catch it"}
          </span>
          <small className="offer-price">
            {need ? `d20 · ${need}+` : "drink 1"}
            {old ? ` · ${old.title} goes` : ""}
          </small>
        </span>
      </button>
      <button
        className="card-choice-option offer-plaque offer-pass"
        aria-label={`Let ${card.title} go`}
        onClick={onRelease}
      >
        <span className="offer-goods" aria-hidden="true">
          <CrawlIcon name="door" theme={theme} className="offer-plain" />
        </span>
        <span className="offer-label">
          <span className="offer-name">Let it go</span>
        </span>
      </button>
    </>
  );
}

/** A caught Pokémon that can be sent into the battle face up: its type
 * beats the foe's, so its bonus joins the roll (2026-10-31; it won outright
 * before). */
export function SendInPlaque({
  member,
  onSend,
}: {
  member: CardDefinition;
  onSend: (id: string) => void;
}) {
  return (
    <button
      className="card-choice-option loot-plaque send-plaque"
      aria-label={`Go, ${member.title}! ${sendInDoes(member)}`}
      onClick={() => onSend(member.id)}
    >
      {member.type && <TypeMark type={member.type} />}
      <span className="offer-label">
        <span className="offer-name">Go, {member.title}!</span>
        <small className="offer-price">
          +{assistBonus(member)} to the roll
        </small>
      </span>
    </button>
  );
}

/** What sending caught Pokémon `member` in does (2026-10-31): its bonus
 * joins the roll; it stays after a win and faints for good after a loss. */
export const sendInDoes = (member: CardDefinition) =>
  `+${assistBonus(member)} to this roll. Win and it stays; lose and it faints.`;

/** One optional action on a card (an item, a send-in), described
 * once so it can sit on the card's foot or in the "Use" sheet. */
export interface Extra extends ExtraShape {
  key: string;
  name: string;
  /** What it does here, for the sheet's row. */
  does: string;
  mark: ReactNode;
  run: () => void;
  /** The plaque already written for the card's foot. */
  plaque: ReactNode;
}

export function buildExtras(
  theme: CrawlTheme,
  {
    items,
    senders,
    onSpend,
    onSend,
  }: {
    items: readonly Loot[];
    senders: readonly CardDefinition[];
    onSpend?: (item: Loot) => void;
    onSend?: (id: string) => void;
  },
): Extra[] {
  const out: Extra[] = items.map((item) => ({
    key: `item-${item}`,
    long: false,
    name: theme.loot[item].name,
    does: theme.loot[item].does,
    mark: <CrawlIcon name={item} theme={theme} />,
    run: () => onSpend?.(item),
    plaque: (
      <LootPlaque
        key={`item-${item}`}
        item={item}
        onUse={(i) => onSpend?.(i)}
        theme={theme}
      />
    ),
  }));
  for (const member of senders)
    out.push({
      key: `send-${member.id}`,
      long: true,
      name: `Go, ${member.title}!`,
      does: sendInDoes(member),
      mark: member.type ? <TypeMark type={member.type} /> : null,
      run: () => onSend?.(member.id),
      plaque: (
        <SendInPlaque
          key={`send-${member.id}`}
          member={member}
          onSend={(id) => onSend?.(id)}
        />
      ),
    });
  return out;
}

/** A branching evolution folded into one plaque (2026-10-31, owner: never
 * more than three across): it names the price and opens a sheet of forms. */
export function FanPlaque({
  name,
  under,
  icon,
  count,
  onOpen,
  theme,
}: {
  name: string;
  under: string;
  icon: CrawlIconName;
  count: number;
  onOpen: () => void;
  theme: CrawlTheme;
}) {
  return (
    <button
      className="card-choice-option offer-plaque offer-buy fan-plaque"
      aria-haspopup="dialog"
      aria-label={`${name}, ${under}: pick one of ${count}`}
      onClick={onOpen}
    >
      <span className="offer-goods" aria-hidden="true">
        <CrawlIcon name={icon} theme={theme} />
      </span>
      <span className="offer-label">
        <span className="offer-name">{name}</span>
        <small className="offer-price">{under}</small>
      </span>
    </button>
  );
}

/** The one plaque for a card's optional actions when they don't all fit on
 * its foot: it opens the sheet below. */
export function UsePlaque({
  count,
  onOpen,
  theme,
}: {
  count: number;
  onOpen: () => void;
  theme: CrawlTheme;
}) {
  return (
    <button
      className="card-choice-option loot-plaque use-plaque"
      aria-haspopup="dialog"
      aria-label={`Use something: ${count} ready`}
      onClick={onOpen}
    >
      <CrawlIcon name="satchel" theme={theme} />
      <span className="offer-label">
        <span className="offer-name">Use</span>
        <small className="offer-price">{count} ready</small>
      </span>
    </button>
  );
}

/** The sheet behind "Use": a full-width row each, whatever the count, with
 * what it does. Taking one closes the sheet and plays it. */
export function ExtrasSheet({
  extras,
  onTake,
  onClose,
  title = "Use one",
}: {
  extras: readonly Extra[];
  onTake: (extra: Extra) => void;
  onClose: () => void;
  /** The sheet's heading: "Use one", or a group's ("Evolve into"). */
  title?: string;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="extras-sheet" role="group" aria-label={title}>
        {extras.map((extra) => (
          <button
            key={extra.key}
            className="extras-row"
            aria-label={`${extra.name}: ${extra.does}`}
            onClick={() => onTake(extra)}
          >
            <span className="extras-mark" aria-hidden="true">
              {extra.mark}
            </span>
            <strong>{extra.name}</strong>
            <span>{extra.does}</span>
          </button>
        ))}
      </div>
    </Modal>
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

/** The spoils sheet's words; the League deals no spoils, so Pub Crawl's. */
const EQUIPMENT = {
  slots: { weapon: "Weapon", armor: "Armor", trinket: "Trinket" },
  spoils: "Spoils",
  replaces: "Replaces",
  keep: "Keep my gear",
  satchel: "Into the satchel",
} as const;

/** Tonight's omen, kept in the boons: an omen card's boon with no slot. */
const isOmenBoon = (b: { card: CardDefinition; boon: Boon }) =>
  b.card.encounter === "omen" && !b.boon.slot;
/** What a worn piece does now: its power without the items it came with,
 * which were handed out when it was taken. */
const wornRules = (boon: Boon) =>
  boon.rules.replace(/\s*Comes with [^.]*\./g, "").trim() || boon.rules;

/** A piece of gear's mark: its slot's, a trinket's for a legacy piece, or
 * the satchel's for one that only brings items. */
const gearIcon = (boon: Boon): CrawlIconName =>
  boon.slot === "weapon"
    ? "weapon"
    : boon.slot === "armor"
      ? "armor"
      : isLasting(boon)
        ? "trinket"
        : "satchel";

/** A won fight's spoils (2026-10-25): one plaque on the card opens the
 * sheet, which also opens by itself when the fight is won. */
export function SpoilsButton({
  onOpen,
  theme,
}: {
  onOpen: () => void;
  theme: CrawlTheme;
}) {
  const words = theme.equipment ?? EQUIPMENT;
  return (
    <button
      className="card-choice-option spoils-plaque"
      aria-haspopup="dialog"
      onClick={onOpen}
    >
      <span className="offer-goods" aria-hidden="true">
        <CrawlIcon name="trinket" theme={theme} />
      </span>
      <span className="offer-label">
        <span className="offer-name">{words.spoils}</span>
        <small className="offer-price">Pick one</small>
      </span>
    </button>
  );
}

/** The spoils sheet (2026-10-25): one row a piece, with its slot, power and
 * what it would replace, and "Keep my gear" when any would replace one.
 * Taking a row puts the card aside; closing the sheet leaves the choice
 * waiting on the card's plaque. */
export function SpoilsSheet({
  session,
  spoils,
  theme,
  onTake,
  onKeep,
  onClose,
}: {
  session: SessionState;
  spoils: readonly Boon[];
  theme: CrawlTheme;
  onTake: (index: number) => void;
  onKeep: () => void;
  onClose: () => void;
}) {
  const words = theme.equipment ?? EQUIPMENT;
  const olds = spoils.map((boon) => replaces(session.quest, boon));
  return (
    <Modal title={words.spoils} onClose={onClose}>
      <div className="spoils-sheet" role="group" aria-label={words.spoils}>
        {spoils.map((boon, i) => {
          const slot = boon.slot
            ? words.slots[boon.slot]
            : isLasting(boon)
              ? theme.words.trinkets
              : words.satchel;
          const old = olds[i]
            .map((o) => `${o.boon.name}: ${wornRules(o.boon)}`)
            .join(" And ");
          return (
            <button
              key={boon.name}
              className={`spoils-row gear-${boon.slot ?? (isLasting(boon) ? "trinket" : "satchel")}`}
              onClick={() => onTake(i)}
              aria-label={`Take the ${boon.name}, ${slot}: ${boon.rules}${old ? ` ${words.replaces} ${old}` : ""}`}
            >
              <CrawlIcon name={gearIcon(boon)} theme={theme} />
              <small className="spoils-slot">{slot}</small>
              <strong>{boon.name}</strong>
              <span>{boon.rules}</span>
              {olds[i].map((o) => (
                // The piece it would replace, as its own small card, so the
                // table sees what it gives up.
                <span key={o.key} className="spoils-worn">
                  <small className="spoils-worn-label">{words.replaces}</small>
                  <CrawlIcon name={gearIcon(o.boon)} theme={theme} />
                  <b>{o.boon.name}</b>
                  <span>{wornRules(o.boon)}</span>
                </span>
              ))}
            </button>
          );
        })}
        {olds.some((o) => o.length > 0) && (
          <button className="spoils-keep" onClick={onKeep}>
            {words.keep}
          </button>
        )}
      </div>
    </Modal>
  );
}

type RunRecord = NonNullable<ReturnType<typeof questRecord>>;
/** One dialog's share of the run (`CrawlRecord`'s `part`). */
export type RecordPart = "party" | StripDialog;

/** One row of the bag (2026-10-31 rebuild): a mark, a name over one short
 * line, and at most a Use button and a quiet x (Drop or Release). The x
 * only asks: the row turns into the question with Keep and the verb, and
 * settles back after four seconds. */
function BagRow({
  mark,
  name,
  badge,
  detail,
  use,
  drop,
  className,
}: {
  mark: ReactNode;
  name: string;
  badge?: ReactNode;
  detail: ReactNode;
  use?: { label: string; onUse: () => void };
  drop?: { verb: string; onConfirm: () => void };
  className?: string;
}) {
  const [sure, setSure] = useState(false);
  useEffect(() => {
    if (!sure) return;
    const timer = setTimeout(() => setSure(false), 4000);
    return () => clearTimeout(timer);
  }, [sure]);
  const verb = drop?.verb.toLowerCase();
  return (
    <li
      className={`bag-row satchel-slot${sure ? " asking" : ""}${className ? ` ${className}` : ""}`}
    >
      <span className="bag-mark">{mark}</span>
      {sure ? (
        <span className="bag-question">
          {drop!.verb} {name}?
        </span>
      ) : (
        <span className="bag-text">
          <span className="bag-name">
            <strong>{name}</strong>
            {badge}
          </span>
          <span className="bag-detail">{detail}</span>
        </span>
      )}
      <span className="bag-actions">
        {sure && drop ? (
          <>
            <button className="bag-action quiet" onClick={() => setSure(false)}>
              Keep
            </button>
            <button
              className="bag-action danger"
              aria-label={`Yes, ${verb} ${name}`}
              onClick={drop.onConfirm}
            >
              {drop.verb}
            </button>
          </>
        ) : (
          <>
            {use && (
              <button
                className="bag-action primary satchel-use"
                onClick={use.onUse}
              >
                {use.label}
              </button>
            )}
            {drop && (
              <button
                className="bag-action bag-x"
                aria-label={`${drop.verb} ${name}`}
                onClick={(event) => {
                  event.currentTarget.focus();
                  setSure(true);
                }}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            )}
          </>
        )}
      </span>
    </li>
  );
}

/** The run so far, for the satchel dialog and the end screens: the hearts,
 * the satchel (a draught can be drunk from here), a jinx, and on the end
 * screens each floor with its rooms faced and its boss. */
export function CrawlRecord({
  record,
  theme,
  session,
  onUse,
  onDrop,
  part,
}: {
  record: RunRecord;
  theme: CrawlTheme;
  session?: SessionState | null;
  onUse?: (item: Loot) => void;
  /** Throw an item out, or let a caught Pokémon go (2026-10-27). */
  onDrop?: (drop: BagDrop) => void;
  /** In play, each dialog shows its own part: the party (hearts, the
   * adventurer or starter, boons), the satchel, the League's badges, or one
   * thing on the party (a jinx, a type matchup). The end
   * screens show everything. */
  part?: RecordPart;
}) {
  const show = (p: RecordPart) => !part || part === p;
  const party = record.party!;
  const { words } = theme;
  const quest = session?.quest;
  const team = partyTeam(quest);
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
  // Pub Crawl's end screens (2026-10-25): the trophy wall and the tab stand
  // in for the adventurer's and trinkets' panels.
  const ending = !session && !!words.trophies && !!words.tab;
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
      {ending && (
        <TrophyWall record={record} theme={theme} label={words.trophies!} />
      )}
      {ending && (
        <RunTab
          record={record}
          theme={theme}
          label={words.tab!}
          rooms={floors
            .filter((f) => !f.piece)
            .reduce((n, f) => n + f.rooms, 0)}
        />
      )}
      {show("party") && !ending && record.form && (
        <FormPanel form={record.form} theme={theme} />
      )}
      {show("party") && !ending && record.boons.length > 0 && (
        <ul className="crawl-boons" aria-label={words.trinkets}>
          {record.boons.map((b) => (
            <li
              key={b.key}
              className={`crawl-omen ${isOmenBoon(b) ? "boon-omen" : "boon-trinket"}`}
            >
              <CrawlIcon
                name={isOmenBoon(b) ? "omen" : gearIcon(b.boon)}
                theme={theme}
              />
              <strong>
                {b.boon.slot && (
                  <small className="gear-slot">
                    {(theme.equipment ?? EQUIPMENT).slots[b.boon.slot]}
                  </small>
                )}
                {b.boon.name}
              </strong>
              <span>{b.boon.rules}</span>
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
      {show("satchel") && !party.wiped && !record.won && (
        <div className="bag">
          {team.length > 0 && (
            <section className="bag-section">
              <h3 className="bag-heading">
                Team{" "}
                <small>
                  {team.length} of {TEAM_SIZE}
                </small>
              </h3>
              <p className="bag-hint">
                Send one into a d20 battle its type beats (Normal: any it
                doesn’t lose to, one less). Lose and it faints.
              </p>
              <ul className="bag-list crawl-team" aria-label="Caught Pokémon">
                {team.map((m) => (
                  <BagRow
                    key={m.id}
                    mark={m.type && <TypeMark type={m.type} />}
                    name={m.title}
                    badge={
                      <span
                        className="bag-bonus"
                        aria-label={`+${assistBonus(m)} to the roll`}
                      >
                        +{assistBonus(m)}
                      </span>
                    }
                    detail={
                      m.type ? (
                        <span
                          className="bag-type"
                          style={typeStyle(m.type) as CSSProperties}
                        >
                          {pokemonTypes[m.type].name}
                        </span>
                      ) : (
                        "Caught"
                      )
                    }
                    drop={
                      onDrop && {
                        verb: "Release",
                        onConfirm: () => onDrop({ caught: m.id }),
                      }
                    }
                  />
                ))}
              </ul>
            </section>
          )}
          <section className="bag-section">
            {team.length > 0 && (
              <h3 className="bag-heading">
                Items{" "}
                <small>
                  {party.loot.length} of {record.satchel}
                </small>
              </h3>
            )}
            <ul className="bag-list satchel" aria-label={words.Satchel}>
              {Array.from({ length: record.satchel }, (_, i) => {
                const item = party.loot[i];
                if (!item)
                  return (
                    <li key={i} className="bag-row satchel-slot empty">
                      <span className="bag-mark" aria-hidden="true" />
                      <span className="bag-detail">Empty</span>
                    </li>
                  );
                // The draught and the candy are used from here; the others
                // work on the card in play, or on their own.
                const usable =
                  !!session &&
                  !!onUse &&
                  (item === "draught" || item === "candy") &&
                  canUseLoot(session, item);
                return (
                  <BagRow
                    key={i}
                    mark={<CrawlIcon name={item} theme={theme} />}
                    name={theme.loot[item].name}
                    detail={theme.loot[item].does}
                    use={
                      usable
                        ? {
                            label: item === "candy" ? theme.eat : theme.drink,
                            onUse: () => onUse!(item),
                          }
                        : undefined
                    }
                    drop={
                      onDrop && {
                        verb: "Drop",
                        onConfirm: () => onDrop({ item }),
                      }
                    }
                  />
                );
              })}
            </ul>
          </section>
        </div>
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

/** Pub Crawl's trophy wall (2026-10-25): one medallion for each fight
 * dealt until it fell, in run order. A fallen one is gold and named; one
 * not yet beaten is an empty socket, so nothing ahead is spoiled. */
function TrophyWall({
  record,
  theme,
  label,
}: {
  record: RunRecord;
  theme: CrawlTheme;
  label: string;
}) {
  const trophies = record.stages.filter((st) => st.trophy);
  const won = trophies.filter((st) => st.cards.length).length;
  return (
    <section
      className="trophy-wall"
      aria-label={`${label}: ${won} of ${trophies.length}`}
      style={{ "--trophies": trophies.length } as CSSProperties}
    >
      <h2>
        {label}{" "}
        <small>
          {won} of {trophies.length}
        </small>
      </h2>
      <ol>
        {trophies.map((st) => {
          const fell = st.cards[0];
          return (
            <li key={st.label} className={fell ? "won" : "empty"}>
              <span className="trophy-medal" aria-hidden="true">
                {fell ? (
                  <CrawlIcon name={st.boss ? "boss" : "ambush"} theme={theme} />
                ) : (
                  "?"
                )}
              </span>
              <span className="trophy-name">{fell ? fell.title : "?"}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Pub Crawl's tab (2026-10-25): the run on one receipt, for the table's
 * screenshot. Everything comes from the save; nothing new is kept. */
function RunTab({
  record,
  theme,
  label,
  rooms,
}: {
  record: RunRecord;
  theme: CrawlTheme;
  label: string;
  rooms: number;
}) {
  const party = record.party!;
  const form = record.form;
  // The adventurer's line as far as it levelled.
  const taken = form
    ? [
        form.card.title,
        ...(form.card.evolves ?? [])
          .slice(0, party.form ?? 0)
          .map((e) => e.title),
      ]
    : [];
  // Tonight's omen is the one boon that is neither gear nor a trinket; a
  // class's starting gear (2026-10-25) comes from an omen card too.
  const omen = record.boons.find((b) => isOmenBoon(b));
  const trinkets = record.boons.filter((b) => !isOmenBoon(b));
  const rows: [string, string][] = [
    ...(taken.length
      ? [["Adventurer", taken.join(" → ")] as [string, string]]
      : []),
    ...(omen ? [["Tonight's omen", omen.boon.name] as [string, string]] : []),
    ["Rooms", String(rooms)],
    [
      "Trinkets",
      trinkets.length ? trinkets.map((t) => t.boon.name).join(", ") : "None",
    ],
    [theme.words.Hearts, `${party.hearts} of ${party.max}`],
  ];
  return (
    <section className="run-tab" aria-label={label}>
      <h2>{label}</h2>
      <dl>
        {rows.map(([name, value]) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** The starter or adventurer it is now (owner, 2026-10-17), with its
 * perk. A League starter wears its type (2026-10-25: one for the run): the
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
        <dt className="stake stake-loss stake-gem">
          <b>−2</b>
          <CrawlIcon name="heart" theme={theme} />
        </dt>
        <dd>{theme.legend[0]}</dd>
      </div>
      {/* The roll to beat (2026-10-31), bottom right on a fight. */}
      <div>
        <dt className="stake stake-target stake-gem">
          <b>11+</b>
        </dt>
        <dd>Roll this or more to win, bonuses counted.</dd>
      </div>
      <div>
        <dt className="stake stake-hits">
          <CrawlIcon name="boss" theme={theme} />
          <span className="stake-pips">
            <i className="hit" />
            <i />
          </span>
        </dt>
        <dd>{theme.legend[1]}</dd>
      </div>
      <div>
        <dt className="stake stake-loot">
          <b>+</b>
          <CrawlIcon name="die" theme={theme} />
        </dt>
        <dd>{theme.legend[2]}</dd>
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
