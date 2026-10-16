import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type {
  CardDefinition,
  Curse,
  Loot,
  PartyState,
  QuestState,
  SessionState,
} from "../game/types";
import { canUseLoot, finaleStage, questRecord } from "../game/engine";
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

type IconName = Loot | Curse | "heart" | "boss" | "satchel" | "wiped";

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

/** Where the run is: the floor (counting from 0), its name, whether the
 * card in play is the floor's boss, and the room within the floor. */
export function crawlPlace(quest: QuestState) {
  const at = finaleStage(quest);
  const isBoss = (stage: number) =>
    quest.stages[stage]?.cards.some((c) => c.hits);
  let floor = 0;
  for (let i = 0; i < at.stage; i++) if (isBoss(i)) floor++;
  let rooms = at.stage;
  while (rooms > 0 && isBoss(rooms)) rooms--;
  return {
    floor,
    name: quest.stages[rooms].label,
    boss: !!isBoss(at.stage),
    room: at.index + 1,
    rooms: at.size,
  };
}

/** The meter's crawl face: the hearts left, the curse, the satchel. */
export function CrawlMeterFace({ quest }: { quest: QuestState }) {
  const party = quest.party!;
  const pulse = useHeartPulse(party.hearts);
  const place = crawlPlace(quest);
  return (
    <>
      <span className={`meter-heart ${pulse}`} key={`${party.hearts}-${pulse}`}>
        <CrawlIcon name="heart" />
        {party.curse && (
          <CrawlIcon name={party.curse} className="meter-curse" />
        )}
      </span>
      <span>
        <small>{place.name.replace(/^The /, "")}</small>
        <strong
          className={party.hearts <= 3 ? "low" : undefined}
        >{`${party.hearts}/${party.max}`}</strong>
      </span>
      {party.loot.length > 0 && (
        <span className="meter-satchel" aria-hidden="true">
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

/** "hurt" or "heal" for a moment after the hearts change. */
function useHeartPulse(hearts: number) {
  const last = useRef(hearts);
  const [pulse, setPulse] = useState<"" | "hurt" | "heal">("");
  useEffect(() => {
    if (hearts === last.current) return;
    setPulse(hearts < last.current ? "hurt" : "heal");
    last.current = hearts;
    const id = setTimeout(() => setPulse(""), 900);
    return () => clearTimeout(id);
  }, [hearts]);
  return pulse;
}

/** The brass medallion during a crawl: the room on this floor, or the boss
 * with a pip for each swing it has to take. */
export function CrawlProgress({ quest }: { quest: QuestState }) {
  const place = crawlPlace(quest);
  const party = quest.party!;
  const need = quest.stages
    .flatMap((s) => s.cards)
    .find((c) => c.id === quest.finale[quest.step])?.hits;
  if (place.boss && need)
    return (
      <div
        className="progress crawl-progress boss"
        role="img"
        aria-label={`Boss: ${party.hits} of ${need} hits`}
      >
        <CrawlIcon name="boss" />
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

/** What a card in a crawl puts on the line, as wax seals in the card's foot:
 * hearts lost on a loss (left), the reward and the curse (right). */
export function CardStakes({
  card,
  party,
}: {
  card: CardDefinition;
  party: PartyState;
}) {
  const damage = card.battle && card.damage;
  const gain = card.reward?.loot ?? (card.reward?.heal ? "heal" : null);
  if (!damage && !gain && !card.curse) return null;
  const bleed = party.curse === "bleed" ? 1 : 0;
  return (
    <span className="card-stakes">
      {damage ? (
        <span
          className="stake stake-loss"
          title="Hearts lost on a loss"
          aria-label={`Losing costs ${damage + bleed} ${damage + bleed === 1 ? "heart" : "hearts"}`}
        >
          <CrawlIcon name="heart" />
          <b>−{damage + bleed}</b>
        </span>
      ) : (
        <span />
      )}
      <span className="stake-gains">
        {gain === "heal" ? (
          <span
            className="stake stake-heal"
            aria-label={`Heals ${card.reward!.heal} hearts`}
          >
            <CrawlIcon name="heart" />
            <b>+{card.reward!.heal}</b>
          </span>
        ) : gain ? (
          <span
            className="stake stake-loot"
            aria-label={`${card.battle ? "Winning finds" : "Finds"} a ${LOOT_INFO[gain].name}`}
          >
            <CrawlIcon name={gain} />
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
      </span>
    </span>
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
      >
        {Array.from({ length: party.max }, (_, i) => (
          <CrawlIcon
            key={i}
            name="heart"
            className={i < party.hearts ? "full" : "spent"}
          />
        ))}
      </div>
      {party.curse && (
        <p className={`crawl-curse curse-${party.curse}`}>
          <CrawlIcon name={party.curse} />
          <strong>{CURSE_INFO[party.curse].name}</strong>
          <span>{CURSE_INFO[party.curse].does}, to the end of the floor</span>
        </p>
      )}
      {!party.wiped && !record.won && (
        <ul className="satchel" aria-label="Satchel">
          {[0, 1, 2].map((i) => {
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
