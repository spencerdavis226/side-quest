import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type {
  CardDefinition,
  Curse,
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

// Pub Crawl furniture: the party's hearts, the satchel, the floor's rooms and
// the boss's wounds. Everything a crawl shows lives here; the engine decides.

export const LOOT_INFO: Record<Loot, { name: string; does: string }> = {
  draught: {
    name: "Healing Draught",
    does: "Down a fresh, full drink: +1 heart",
  },
  shield: { name: "Coaster Shield", does: "Blocks the next heart loss" },
  die: { name: "Loaded Die", does: "Roll a lost fight again" },
  smoke: { name: "Smoke Bomb", does: "Escape a room fight" },
};
export const CURSE_INFO: Record<Curse, { name: string; does: string }> = {
  bleed: { name: "Bleeding", does: "Every heart loss costs one more" },
  hex: { name: "Hexed", does: "The satchel is sealed" },
};

type IconName =
  | Loot
  | Curse
  | "heart"
  | "boss"
  | "satchel"
  | "wiped"
  | "omen"
  | "ambush"
  | "elite"
  | "door";

/** One of the crawl's single-colour marks, painted as a mask so it takes the
 * finish of wherever it sits. */
export function CrawlIcon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  const src = `url("${asset(`art/crawl/${name}.svg`)}")`;
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
        <CrawlIcon name="heart" />
        <strong className={party.hearts <= 3 ? "low" : undefined}>
          {party.hearts}
        </strong>
      </span>
      {party.curse && (
        <span
          className={`meter-tag tag-curse curse-${party.curse}`}
          aria-hidden="true"
        >
          <CrawlIcon name={party.curse} />
        </span>
      )}
      {party.loot.length > 0 && (
        <span className="meter-tag tag-satchel" aria-hidden="true">
          <CrawlIcon name="satchel" />
          {party.loot.length}
        </span>
      )}
    </>
  );
}
export function crawlMeterLabel(quest: QuestState) {
  const party = quest.party!;
  const place = crawlPlace(quest);
  return [
    `Hearts: ${party.hearts} of ${party.max}`,
    place.name,
    party.curse && CURSE_INFO[party.curse].name,
    party.loot.length &&
      `Satchel: ${party.loot.map((l) => LOOT_INFO[l].name).join(", ")}`,
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
  if (place.omen)
    return (
      <div
        className="progress crawl-progress omen"
        role="img"
        aria-label="Tonight's omen"
      >
        <CrawlIcon name="omen" />
      </div>
    );
  if (need)
    return (
      <div
        className={`progress crawl-progress boss ${place.boss ? "" : "ambush"}`}
        role="img"
        aria-label={`${place.boss ? "Boss" : `Ambush in room ${place.room} of ${place.rooms}`}: ${party.hits} of ${need} hits`}
      >
        <CrawlIcon name={place.boss ? "boss" : "ambush"} />
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
      aria-label={`Room ${place.room} of ${place.rooms}, ${place.name}`}
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
}: {
  card: CardDefinition;
  party: PartyState;
  hits?: number;
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
            aria-label={`Losing costs ${damage + bleed} ${damage + bleed === 1 ? "heart" : "hearts"}`}
          >
            <b>−{damage + bleed}</b>
            <CrawlIcon name="heart" />
          </span>
        ) : null}
        {card.curse && (
          <span
            className={`stake stake-curse curse-${card.curse}`}
            aria-label={`${card.battle ? "Losing brings" : "Brings"} a curse: ${CURSE_INFO[card.curse].name}`}
          >
            <CrawlIcon name={card.curse} />
          </span>
        )}
        {hits > 1 && (
          <span
            className="stake stake-hits"
            aria-label={`${boss ? "A boss" : "An ambush"}: ${party.hits} of ${hits} hits landed`}
          >
            <CrawlIcon name={boss ? "boss" : "ambush"} />
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
            aria-label={`Heals ${card.reward!.heal} hearts`}
          >
            <b>+{card.reward!.heal}</b>
            <CrawlIcon name="heart" />
          </span>
        ) : gain ? (
          <span
            className="stake stake-loot"
            aria-label={`${card.battle ? "Winning finds" : "Finds"} a ${LOOT_INFO[gain].name}`}
          >
            <b>+</b>
            <CrawlIcon name={gain} />
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
}: {
  offer: Offer;
  index: number;
  can: boolean;
  onTake: (index: number) => void;
}) {
  const icon: IconName | null = offer.loot
    ? offer.loot
    : offer.elite
      ? "elite"
      : offer.heal
        ? "heart"
        : null;
  const brings = offer.loot
    ? `a ${LOOT_INFO[offer.loot].name}`
    : offer.elite
      ? "the next room is an elite: harder, and it pays"
      : offer.heal
        ? `${offer.heal} hearts back`
        : "nothing";
  return (
    <button
      className={`card-choice-option offer-plaque ${offer.elite ? "offer-loud" : icon ? "offer-buy" : "offer-pass"}`}
      style={{ animationDelay: `${index * 70}ms` }}
      disabled={!can}
      aria-label={`${offer.label}${offer.cost ? `, ${offer.cost} ${offer.cost === 1 ? "heart" : "hearts"}` : ""}: ${brings}`}
      onClick={() => onTake(index)}
    >
      <span className="offer-goods" aria-hidden="true">
        {icon ? (
          <CrawlIcon name={icon} />
        ) : (
          <CrawlIcon name="door" className="offer-plain" />
        )}
        {offer.cost ? (
          <span className="offer-cost">
            <CrawlIcon name="heart" />−{offer.cost}
          </span>
        ) : null}
      </span>
      <span className="offer-label">{offer.label}</span>
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
}: {
  item: Loot;
  onUse: (item: Loot) => void;
}) {
  return (
    <button
      className={`card-choice-option loot-plaque loot-${item}`}
      aria-label={`Use the ${LOOT_INFO[item].name}: ${LOOT_INFO[item].does}`}
      onClick={() => onUse(item)}
    >
      <CrawlIcon name={item} />
      <span>{item === "smoke" ? "Flee" : "Reroll"}</span>
    </button>
  );
}

type RunRecord = NonNullable<ReturnType<typeof questRecord>>;

/** The run so far, for the satchel dialog and the end screens: the hearts,
 * the satchel (a draught can be drunk from here), the curse, and each floor
 * with its rooms faced and its boss. */
export function CrawlRecord({
  record,
  session,
  onUse,
}: {
  record: RunRecord;
  session?: SessionState | null;
  onUse?: (item: Loot) => void;
}) {
  const party = record.party!;
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
        aria-label={`Hearts: ${party.hearts} of ${party.max}`}
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
            className={i < party.hearts ? "full" : "spent"}
          />
        ))}
      </div>
      {record.omen && (
        <p className="crawl-omen">
          <CrawlIcon name="omen" />
          <strong>{record.omen.title}</strong>
          <span>{record.omen.rules}</span>
        </p>
      )}
      {party.curse && (
        <p className={`crawl-curse curse-${party.curse}`}>
          <CrawlIcon name={party.curse} />
          <strong>{CURSE_INFO[party.curse].name}</strong>
          <span>{CURSE_INFO[party.curse].does}, to the end of the floor</span>
        </p>
      )}
      {!party.wiped && !record.won && (
        <ul className="satchel" aria-label="Satchel">
          {Array.from({ length: record.satchel }, (_, i) => {
            const item = party.loot[i];
            if (!item)
              return (
                <li key={i} className="satchel-slot empty">
                  <CrawlIcon name="satchel" />
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
                <CrawlIcon name={item} />
                <span>
                  <strong>{LOOT_INFO[item].name}</strong>
                  <small>{LOOT_INFO[item].does}</small>
                </span>
                {usable && (
                  <button className="satchel-use" onClick={() => onUse!(item)}>
                    Drink
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
                ? `${floor.rooms} of ${floor.of} rooms`
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
              <CrawlIcon name="heart" />
            </dt>
            <dd>Hearts the party loses if the fight is lost</dd>
          </div>
          <div>
            <dt className="stake stake-curse curse-bleed">
              <CrawlIcon name="bleed" />
            </dt>
            <dd>A curse on a loss, until the floor's boss falls</dd>
          </div>
          <div>
            <dt className="stake stake-hits">
              <CrawlIcon name="boss" />
              <span className="stake-pips">
                <i className="hit" />
                <i />
              </span>
            </dt>
            <dd>Wins it takes: the next drawer swings again</dd>
          </div>
          <div>
            <dt className="stake stake-loot">
              <b>+</b>
              <CrawlIcon name="die" />
            </dt>
            <dd>An item for the satchel, on a win</dd>
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
