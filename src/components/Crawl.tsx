import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type {
  CardDefinition,
  Loot,
  Offer,
  PartyState,
  QuestState,
  SessionState,
} from "../game/types";
import {
  canUseLoot,
  finaleCard,
  finaleStage,
  hitsNeeded,
  isBossCard,
  questRecord,
} from "../game/engine";
import { asset } from "../presentation/theme";
import {
  crawlIconPath,
  crawlTheme,
  heartCount,
  type CrawlIconName,
  type CrawlTheme,
} from "./crawlTheme";

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
  const cards = (stage: number) => quest.stages[stage]?.cards ?? [];
  const isBoss = (stage: number) => cards(stage).some(isBossCard);
  const omen = cards(at.stage).every((c) => c.encounter === "omen");
  let rooms = at.stage;
  while (rooms > 0 && isBoss(rooms)) rooms--;
  return {
    name: quest.stages[rooms].label,
    omen,
    boss: isBoss(at.stage),
    room: at.index + 1,
    rooms: at.size,
  };
}

/** The meter's crawl face, a brass medallion like the room's: the heart with
 * the hearts left inside it (the full count is in the party dialog), sized
 * like the menu button so the top row is symmetric, and studs on the
 * rim for the curse and the satchel's count. The floor's name is on every
 * card's ribbon and in the party dialog. */
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
      <span className={`meter-heart ${pulse}`} key={`${party.hearts}-${pulse}`}>
        <CrawlIcon name="heart" theme={theme} />
        <strong className={party.hearts <= 3 ? "low" : undefined}>
          {party.hearts}
        </strong>
      </span>
      {party.curse && (
        <span
          className={`meter-tag tag-curse curse-${party.curse}`}
          aria-hidden="true"
        >
          <CrawlIcon name={party.curse} theme={theme} />
        </span>
      )}
      {party.loot.length > 0 && (
        <span className="meter-tag tag-satchel" aria-hidden="true">
          <CrawlIcon name="satchel" theme={theme} />
          {party.loot.length}
        </span>
      )}
    </>
  );
}
export function crawlMeterLabel(quest: QuestState) {
  const party = quest.party!;
  const place = crawlPlace(quest);
  const theme = crawlTheme(quest.packId);
  return [
    `${theme.words.Hearts}: ${party.hearts} of ${party.max}`,
    place.name,
    party.curse && theme.curses[party.curse].name,
    party.loot.length &&
      `${theme.words.Satchel}: ${party.loot.map((l) => theme.loot[l].name).join(", ")}`,
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

/** The brass medallion during a crawl: tonight's omen, the room on this
 * floor, or a boss (or an ambush) with a pip for each swing it has to take. */
export function CrawlProgress({ quest }: { quest: QuestState }) {
  const place = crawlPlace(quest);
  const party = quest.party!;
  const card = finaleCard(quest, quest.finale[quest.step]);
  const need = card ? hitsNeeded(quest, card) : 0;
  const theme = crawlTheme(quest.packId);
  const { words } = theme;
  if (place.omen)
    return (
      <div
        className="progress crawl-progress omen"
        role="img"
        aria-label={words.omen}
      >
        <CrawlIcon name="omen" theme={theme} />
      </div>
    );
  if (need)
    return (
      <div
        className={`progress crawl-progress boss ${place.boss ? "" : "ambush"}`}
        role="img"
        aria-label={`${place.boss ? words.Boss : `${words.Ambush} in ${words.Room.toLowerCase()} ${place.room} of ${place.rooms}`}: ${party.hits} of ${need} hits`}
      >
        <CrawlIcon name={place.boss ? "boss" : "ambush"} theme={theme} />
        <span className="boss-pips">
          {Array.from({ length: need }, (_, i) => (
            <i key={i} className={i < party.hits ? "hit" : undefined} />
          ))}
        </span>
      </div>
    );
  return (
    <div
      className="progress crawl-progress"
      role="img"
      aria-label={`${words.Room} ${place.room} of ${place.rooms}, ${place.name}`}
    >
      <strong>{place.room}</strong>
      <span className="muted"> / {place.rooms}</span>
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
}: {
  card: CardDefinition;
  party: PartyState;
  hits?: number;
  theme: CrawlTheme;
}) {
  const damage = card.battle && card.damage;
  const gain = card.reward?.loot ?? (card.reward?.heal ? "heal" : null);
  if (!damage && !gain && !card.curse && !hits) return null;
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
  // A branch plaque names its form; its price stays under the name.
  const price = branch ? offer.label.split(" · ")[1] : undefined;
  const icon: CrawlIconName | null = offer.loot
    ? offer.loot
    : offer.elite
      ? "elite"
      : offer.evolve
        ? "omen"
        : offer.heal
          ? "heart"
          : null;
  const brings = offer.loot
    ? `a ${theme.loot[offer.loot].name}`
    : offer.elite
      ? theme.words.elite
      : offer.evolve
        ? !can
          ? "your starter is fully evolved"
          : branch
            ? `your starter evolves into ${branch.name}`
            : "your starter evolves"
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
        {branch ? branch.name : offer.label}
        {price && <small className="offer-price">{price}</small>}
      </span>
    </button>
  );
}

/** Items the party can use on the card in play, offered as plaques at the
 * card's foot: a smoke bomb before a room fight, a loaded die after a lost
 * roll. The draught waits in the satchel (the meter). */
export function usableItems(s: SessionState): Loot[] {
  return (["smoke", "die"] as const).filter((item) => canUseLoot(s, item));
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
      <span>{item === "smoke" ? theme.flee : theme.reroll}</span>
    </button>
  );
}

type RunRecord = NonNullable<ReturnType<typeof questRecord>>;

/** The run so far, for the satchel dialog and the end screens: the hearts,
 * the satchel (a draught can be drunk from here), the curse, and each floor
 * with its rooms faced and its boss. */
export function CrawlRecord({
  record,
  theme,
  session,
  onUse,
}: {
  record: RunRecord;
  theme: CrawlTheme;
  session?: SessionState | null;
  onUse?: (item: Loot) => void;
}) {
  const party = record.party!;
  const { words } = theme;
  const floors: { name: string; rooms: number; of: number; boss?: string }[] =
    [];
  for (const stage of record.stages) {
    if (stage.omen) continue;
    if (stage.boss && floors.length)
      floors[floors.length - 1].boss = stage.cards[0]?.title;
    else
      floors.push({
        name: stage.label,
        rooms: stage.cards.length,
        of: stage.size,
      });
  }
  return (
    <div className="crawl-record">
      <div
        className="crawl-hearts"
        role="img"
        aria-label={`${words.Hearts}: ${party.hearts} of ${party.max}`}
        // One row up to twelve; an omen's extra hearts split into two even
        // rows.
        style={
          {
            "--per-row": party.max > 12 ? Math.ceil(party.max / 2) : party.max,
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
      {record.form && (
        <p className="crawl-omen">
          <CrawlIcon name="omen" theme={theme} />
          <strong>{record.form.title}</strong>
          <span>{record.form.rules}</span>
          {record.form.line.length > 1 && (
            // A starter's line, its current form marked.
            <span className="crawl-evolution" aria-label="Evolution line">
              {record.form.line.map((name, i) => (
                <span key={name}>
                  {i > 0 && " › "}
                  {i === record.form!.form ? <b>{name}</b> : name}
                </span>
              ))}
            </span>
          )}
        </p>
      )}
      {words.badges && record.badges.of > 0 && (
        <p
          className="crawl-badges"
          role="img"
          aria-label={`${words.badges}: ${record.badges.earned} of ${record.badges.of}`}
        >
          {Array.from({ length: record.badges.of }, (_, i) => (
            <CrawlIcon
              key={i}
              name="boss"
              theme={theme}
              className={i < record.badges.earned ? "full" : "spent"}
            />
          ))}
        </p>
      )}
      {party.curse && (
        <p className={`crawl-curse curse-${party.curse}`}>
          <CrawlIcon name={party.curse} theme={theme} />
          <strong>{theme.curses[party.curse].name}</strong>
          <span>
            {theme.curses[party.curse].does}, {words.curseLasts}
          </span>
        </p>
      )}
      {!party.wiped && !record.won && (
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
            const usable =
              !!session &&
              !!onUse &&
              item === "draught" &&
              canUseLoot(session, item);
            return (
              <li key={i} className="satchel-slot">
                <CrawlIcon name={item} theme={theme} />
                <span>
                  <strong>{theme.loot[item].name}</strong>
                  <small>{theme.loot[item].does}</small>
                </span>
                {usable && (
                  <button className="satchel-use" onClick={() => onUse!(item)}>
                    {theme.drink}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
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
              {floor.rooms
                ? `${floor.rooms} of ${floor.of} ${words.rooms}`
                : "Not yet reached"}
              {floor.boss && (
                <>
                  {" · "}
                  <em>{floor.boss}</em>
                </>
              )}
            </span>
          </li>
        ))}
      </ol>
      {session && (
        // Touch has no hover: the seals on a card are explained here.
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
        </dl>
      )}
    </div>
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
