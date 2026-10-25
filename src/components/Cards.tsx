import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CardDefinition, DiceRoll, PartyState } from "../game/types";
import { CardStakes } from "./Crawl";
import type { CrawlTheme } from "./crawlTheme";
import { diceResultText } from "../presentation/dice/result-text";
import { readTotal, rollWins } from "../game/dice";
import { CardPackMarks } from "./PackMarks";
import { badgeArt } from "../presentation/league-art";
import type { Matchup } from "../game/matchup";
import { TypeMark } from "./LeagueMarks";
import { pokemonTypes, trioBrother } from "../presentation/pokemon-types";
type Overflow = "none" | "top" | "bottom" | "both";
/** The smallest a rule's text shrinks to fit the card: 26px becomes 20px. */
const RULES_FIT_MIN = 0.77;

export function CardFace({
  card,
  packIds,
  roll = null,
  shown = null,
  party,
  hits = 0,
  crawl,
  matchup = null,
}: {
  card: CardDefinition;
  packIds?: readonly string[];
  roll?: DiceRoll | null;
  /** What replaces the rules: the held secret, or a finished timer's end. */
  shown?: "secret" | "end" | null;
  /** A crawl's party: the card shows what it puts on the line. */
  party?: PartyState;
  /** Swings a crawl boss or ambush needs (`hitsNeeded`); 0 for others. */
  hits?: number;
  /** The crawl's words and marks, with `party`. */
  crawl?: CrawlTheme;
  /** A League fight's type matchup against the starter (`cardMatchup`). */
  matchup?: Matchup | null;
}) {
  const gesture = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startScrollTop: number;
    cancelClick: boolean;
  } | null>(null);
  const rulesRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState<Overflow>("none");
  const markGesture = (pointerId: number) => {
    if (gesture.current?.pointerId === pointerId)
      gesture.current.cancelClick = true;
  };
  const cancelGestureByScroll = () => {
    if (gesture.current) gesture.current.cancelClick = true;
  };
  const updateOverflow = () => {
    const el = rulesRef.current;
    if (!el) return;
    const atTop = el.scrollTop <= 2;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
    setOverflow(
      atTop && atBottom ? "none" : atTop ? "bottom" : atBottom ? "top" : "both",
    );
  };
  // Keep the original rule until the dice have been dismissed.
  const resolved = !!roll?.returned;
  // A typed card wears its type in the ribbon (the trio as the brother it
  // sends out, once the starter is known); others keep their badge art.
  const type = matchup?.theirs ?? card.type;
  const badge = type ? null : badgeArt(card.id);
  // A lost battle's badge greys out once the result is on the card.
  const lost =
    resolved &&
    !!card.battle &&
    !!card.dice &&
    !rollWins(card.dice, roll!.values, roll!);
  useLayoutEffect(() => {
    const title = titleRef.current;
    const heading = title?.querySelector<HTMLElement>("h2");
    if (!title || !heading) return;
    let live = true;
    const fits = (size: number) => {
      heading.style.fontSize = `${size}px`;
      const lineHeight = parseFloat(getComputedStyle(heading).lineHeight);
      // Fractional height: a rounded offsetHeight lets the search settle on a
      // size that still spills a sub-pixel past the band. The rect is drawn
      // in screen space, though, and a fit can run mid-flip (a resize or a
      // font load), when the 3D turn stretches it and the title would stay
      // stuck small. Divide by the band's own on-screen stretch: both sit in
      // the same plane, so this recovers the flat height at any angle.
      // The computed height is the band's exact, untransformed layout height;
      // offsetHeight is rounded and skews the ratio by up to a pixel.
      const band = title.getBoundingClientRect().height;
      const flat = parseFloat(getComputedStyle(title).height);
      const stretch = band > 0 && flat > 0 ? band / flat : 1;
      const height = heading.getBoundingClientRect().height / stretch;
      return (
        height <= title.clientHeight + 1 &&
        heading.scrollWidth <= title.clientWidth + 1 &&
        height / lineHeight <= 2.1
      );
    };
    const measure = () => {
      if (!live) return;
      heading.style.removeProperty("font-size");
      const base = parseFloat(getComputedStyle(heading).fontSize);
      if (fits(base)) {
        heading.style.removeProperty("font-size");
        return;
      }
      const minimum = Math.min(base, 18);
      if (!fits(minimum)) return; // Keep the full title scrollable for old saves.
      let low = minimum;
      let high = base;
      for (let i = 0; i < 8; i++) {
        const middle = (low + high) / 2;
        if (fits(middle)) low = middle;
        else high = middle;
      }
      heading.style.fontSize = `${Math.floor(low * 10) / 10}px`;
    };
    measure();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    observer?.observe(title);
    document.fonts
      ?.load('700 30px "Source Serif 4 Title"')
      .then(measure)
      .catch(() => undefined);
    return () => {
      live = false;
      observer?.disconnect();
    };
  }, [card.title]);
  useEffect(() => {
    // A rule too long for a small card (Safari's toolbar, an SE) shrinks
    // its text, down to RULES_FIT_MIN of the size, before it has to scroll.
    // Larger Text (an enlarged root size) is the reader's choice: it scrolls.
    const fitRules = () => {
      const el = rulesRef.current;
      if (!el) return;
      const spills = () => el.scrollHeight > el.clientHeight + 1;
      el.style.removeProperty("--rules-fit");
      const root = parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      if (root > 16 || !spills()) return;
      let low = RULES_FIT_MIN;
      let high = 1;
      el.style.setProperty("--rules-fit", String(low));
      if (!spills())
        for (let i = 0; i < 6; i++) {
          const middle = (low + high) / 2;
          el.style.setProperty("--rules-fit", String(middle));
          if (spills()) high = middle;
          else low = middle;
        }
      el.style.setProperty("--rules-fit", String(low));
    };
    const refit = () => {
      fitRules();
      updateOverflow();
    };
    refit();
    const el = rulesRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(refit);
    observer.observe(el);
    // Web fonts change the wrapped line count without resizing the scroller
    // box, so observe the content and re-measure once fonts settle.
    for (const child of el.children) observer.observe(child);
    document.fonts?.ready.then(refit).catch(() => undefined);
    return () => observer.disconnect();
  }, [resolved, card.id, shown]);
  return (
    <div
      className={`study-face${card.ribbon ? ` has-ribbon tone-${card.ribbonTone ?? "gold"}` : ""}${lost ? " battle-lost" : ""}`}
      // A drag anywhere on the face (rules or an enlarged title) must scroll or
      // scrub, never activate the card action. A stationary tap still passes.
      onPointerDown={(event) => {
        gesture.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          startScrollTop: rulesRef.current?.scrollTop ?? 0,
          cancelClick: false,
        };
      }}
      onPointerMove={(event) => {
        const active = gesture.current;
        if (
          active?.pointerId === event.pointerId &&
          Math.hypot(
            event.clientX - active.startX,
            event.clientY - active.startY,
          ) > 8
        )
          active.cancelClick = true;
      }}
      onPointerCancel={(event) => markGesture(event.pointerId)}
      onClick={(event) => {
        const cancelClick = gesture.current?.cancelClick;
        gesture.current = null;
        if (cancelClick) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <div
        ref={titleRef}
        className="study-title"
        onScroll={cancelGestureByScroll}
      >
        <h2>{card.title}</h2>
      </div>
      <div className="study-body">
        {card.ribbon && (
          <p className="card-ribbon">
            {badge && <img className="ribbon-badge" src={badge} alt="" />}
            {type && (
              <TypeMark
                type={type}
                className="ribbon-type"
                label={`${pokemonTypes[type].name} type`}
              />
            )}
            <span>{card.ribbon}</span>
          </p>
        )}
        {matchup?.edge && <MatchupLine card={card} matchup={matchup} />}
        <div
          ref={rulesRef}
          className={`study-rules ${resolved || shown === "end" ? "rules-resolved" : ""}`}
          data-overflow={overflow}
          onScroll={(event) => {
            const active = gesture.current;
            if (
              active &&
              event.currentTarget.scrollTop !== active.startScrollTop
            )
              active.cancelClick = true;
            updateOverflow();
          }}
        >
          {resolved ? (
            <div className="dice-result">
              <div
                className="dice-result-equation"
                aria-label={`${roll!.edge ? `Rolled with ${roll!.edge}: kept ` : "Rolled "}${roll!.values.join(" plus ")}${
                  roll!.values.length > 1 ? `, total ${roll!.total}` : ""
                }${
                  roll!.bonus
                    ? `, ${roll!.bonus < 0 ? "minus" : "plus"} ${Math.abs(roll!.bonus)}, reads ${readTotal(card.dice!, roll!.values, roll!)}`
                    : ""
                }${roll!.dropped ? `; dropped ${roll!.dropped.join(" plus ")}` : ""}`}
              >
                {/* A type edge rolled twice: the kept faces lead, the
                    dropped attempt follows, struck through. */}
                {roll!.edge && (
                  <span
                    className={`dice-result-edge edge-${roll!.edge}`}
                    aria-hidden="true"
                  >
                    {roll!.edge === "advantage" ? "Advantage" : "Disadvantage"}
                  </span>
                )}
                <span className="dice-result-faces" aria-hidden="true">
                  {roll!.values.map((value, index) => (
                    <span className="dice-result-face" key={index}>
                      {value}
                    </span>
                  ))}
                </span>
                {/* A starter's bonus on a crawl d20: the face, the bonus, and
                    the total the card reads. */}
                {!!roll!.bonus && (
                  <span className="dice-result-total" aria-hidden="true">
                    <span className="dice-result-bonus">
                      {roll!.bonus < 0 ? "−" : "+"}
                      {Math.abs(roll!.bonus)}
                    </span>
                    <span>=</span>
                    <strong>
                      {readTotal(card.dice!, roll!.values, roll!)}
                    </strong>
                  </span>
                )}
                {roll!.values.length > 1 && (
                  <span className="dice-result-total" aria-hidden="true">
                    <span>=</span>
                    <strong>{roll!.total}</strong>
                  </span>
                )}
                {roll!.dropped && (
                  <span className="dice-result-dropped" aria-hidden="true">
                    {roll!.dropped.map((value, index) => (
                      <span className="dice-result-face" key={index}>
                        {value}
                      </span>
                    ))}
                  </span>
                )}
              </div>
              {roll!.flinched && (
                <p className="dice-result-flinch">A 20 was rerolled.</p>
              )}
              <p className="resolved-instruction">
                {diceResultText(card, roll!)
                  .split(/(\d+)/)
                  .map((part, index) =>
                    /^\d+$/.test(part) ? (
                      <strong key={index}>{part}</strong>
                    ) : (
                      part
                    ),
                  )}
              </p>
            </div>
          ) : shown === "secret" && card.secret ? (
            // A word for the table to read across the room prints large.
            <div
              className={`card-secret${card.secret.length <= 24 ? " word" : ""}`}
            >
              <span className="card-secret-label">Secret</span>
              <p>{card.secret}</p>
            </div>
          ) : shown === "end" && card.timer ? (
            <p className="resolved-instruction timer-end">{card.timer.end}</p>
          ) : (
            <p>{card.rules}</p>
          )}
        </div>
        <div className="card-footer">
          {party && crawl && (
            <CardStakes
              card={card}
              party={party}
              hits={hits}
              theme={crawl}
              shift={matchupShift(card, matchup)}
            />
          )}
          {/* A crawl plays one pack: its seals take the foot instead. */}
          {!party && <CardPackMarks cardId={card.id} packIds={packIds} />}
        </div>
      </div>
    </div>
  );
}
/** A plaque-settled fight's loss moves by one HP with a type edge (the
 * engine's `verdictShift`). */
const matchupShift = (card: CardDefinition, matchup: Matchup | null) =>
  card.dice || !matchup?.edge ? 0 : matchup.edge === "advantage" ? -1 : 1;

/** The type matchup, shown before the roll so the table can plan: the
 * starter's mark, the foe's, and what the edge does. */
function MatchupLine({
  card,
  matchup,
}: {
  card: CardDefinition;
  matchup: Matchup;
}) {
  const good = matchup.edge === "advantage";
  const effect = card.dice
    ? good
      ? "Roll with advantage"
      : "Roll with disadvantage"
    : good
      ? "A loss costs 1 HP less"
      : "A loss costs 1 HP more";
  const brother =
    card.type === "trio" ? trioBrother[matchup.theirs] : undefined;
  const label = `${good ? "Super effective" : "Not very effective"}: your ${pokemonTypes[matchup.mine].name} type against ${brother ? `${brother}'s ` : ""}${pokemonTypes[matchup.theirs].name}. ${effect}.`;
  return (
    <p
      className={`type-matchup matchup-${matchup.edge}`}
      role="note"
      aria-label={label}
    >
      <TypeMark type={matchup.mine} className="matchup-mark" />
      <span className="matchup-words" aria-hidden="true">
        <strong>{good ? "Super effective!" : "Not very effective…"}</strong>
        <span>
          {brother ? `${brother} steps up. ` : ""}
          {effect}
        </span>
      </span>
      <TypeMark type={matchup.theirs} className="matchup-mark" />
    </p>
  );
}
export function CardFrame({
  card,
  packIds,
  roll,
}: {
  card: CardDefinition;
  packIds?: readonly string[];
  roll?: DiceRoll | null;
}) {
  return (
    <article className="previous-card">
      <CardFace card={card} packIds={packIds} roll={roll} />
    </article>
  );
}
