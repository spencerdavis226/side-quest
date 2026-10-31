import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
} from "react";
import type { SessionState, CardDefinition, Loot, Offer } from "../game/types";
import { diceResultText } from "../presentation/dice/result-text";
import { diceNotation } from "../game/dice";
import {
  awaitingCatch,
  thrownBall,
  awaitingChoice,
  awaitingOffer,
  awaitingPress,
  awaitingSpoils,
  awaitingVerdict,
  canTakeOffer,
  canSendIn,
  partyTeam,
  spoilsOnWin,
  currentCard,
  cardMatchup,
  strikeOutcome,
  hitsNeeded,
  omenForm,
  formEffect,
} from "../game/engine";
import { describeChange } from "../game/omenText";
import type { Motion } from "../presentation/controller";
import { cardPacks } from "../presentation/packs";
import { CardFace } from "../components/Cards";
import {
  CardActions,
  TimerBlast,
  hasActions,
  useCardActions,
} from "../components/CardActions";
import {
  ExtrasSheet,
  FanPlaque,
  UsePlaque,
  buildExtras,
  OfferPlaque,
  CatchPlaques,
  PressPlaques,
  SpoilsButton,
  SpoilsSheet,
  usableItems,
} from "../components/Crawl";
import { crawlTheme } from "../components/crawlTheme";
import { extrasLayout, foldBranches } from "../components/extras";
import { TypeMark } from "../components/LeagueMarks";
import { CrawlIcon } from "../components/Crawl";
// A dice overlay that can't be fetched (offline before it was cached) must
// not strand a roll: the saved result goes straight to the card instead.
type DiceProps = ComponentProps<
  typeof import("../components/FullScreenDice").default
>;
const FullScreenDice = lazy(
  (): Promise<{ default: ComponentType<DiceProps> }> =>
    import("../components/FullScreenDice").catch(() => ({ default: NoDice })),
);
function NoDice({ roll, rolling, onReveal, onFinish }: DiceProps) {
  const callbacks = useRef({ onReveal, onFinish });
  useEffect(() => {
    callbacks.current = { onReveal, onFinish };
  });
  useEffect(() => {
    if (!roll) return;
    if (rolling) callbacks.current.onFinish();
    else callbacks.current.onReveal();
  }, [roll, rolling]);
  return null;
}
export function Play({
  session,
  motion,
  transition,
  finishingRoll = false,
  onTap,
  onChoose,
  onSettle,
  onSpend = () => {},
  onOffer = () => {},
  onCatch = () => {},
  onRelease = () => {},
  onSend = () => {},
  onSpoils = () => {},
  onKeepGear = () => {},
  onCashOut = () => {},
  onPress = () => {},
  onRevealRoll,
  onFinish,
  renderFace,
  overlay = true,
}: {
  session: SessionState;
  motion: Motion | null;
  transition: number;
  finishingRoll?: boolean;
  onTap: () => void;
  onChoose: (option: "skip" | "roll") => void;
  onSettle: (won: boolean, spoil?: number) => void;
  onSpend?: (item: Loot) => void;
  onOffer?: (index: number, branch?: number) => void;
  onCatch?: () => void;
  onRelease?: () => void;
  onSend?: (id: string) => void;
  onSpoils?: (index: number) => void;
  onKeepGear?: () => void;
  onCashOut?: () => void;
  onPress?: () => void;
  onRevealRoll: () => void;
  onFinish: (id: number) => void;
  renderFace?: (card: CardDefinition) => ReactNode;
  overlay?: boolean;
}) {
  const card = currentCard(session),
    ref = useRef<HTMLButtonElement>(null),
    choiceRef = useRef<HTMLDivElement>(null);
  // The plaques arrive once the card has landed face up and leave with the
  // decision; the card itself takes no action while they are up.
  const choice = !motion && awaitingChoice(session) ? card.dice!.choice! : null;
  // A battle without dice: the table says whether it won.
  const verdict = !motion && awaitingVerdict(session);
  // A crawl's merchant or fork: one of its offers puts it aside.
  const offers = !motion && awaitingOffer(session) ? card.offers! : null;
  // A crawl's items that work on this card: a smoke bomb before a room fight,
  // a loaded die after a lost roll. They join the card's own plaques.
  const items =
    !motion && session.phase === "revealed" ? usableItems(session) : [];
  // A won boss or elite: its spoils, in a sheet that opens by itself and
  // reopens from the card's one plaque once closed (2026-10-25).
  const spoils = !motion && awaitingSpoils(session) ? card.spoils! : null;
  const [sheetClosed, setSheetClosed] = useState<number | null>(null);
  const sheet = !!spoils && sheetClosed !== session.discarded;
  // A push-your-luck win: cash out or go again.
  const press = !motion && awaitingPress(session);
  // The League's team (2026-10-25): a beaten wild Pokémon to catch, and
  // teammates who can be sent in for this battle.
  const catching = !motion && awaitingCatch(session);
  const ball = thrownBall(session);
  const senders = motion
    ? []
    : partyTeam(session.quest).filter((m) => canSendIn(session, m.id));
  // A win that fells a boss with spoils asks for the trinket first (Won on
  // a plaque beat): the draw it was asked on.
  const [asking, setAsking] = useState<number | null>(null);
  const ask = asking === session.discarded && !motion;
  const crawl = crawlTheme(session.quest?.packId);
  // Items and send-ins: on the card's foot when a few short ones fit,
  // otherwise behind one "Use" plaque and its sheet.
  const extraList = buildExtras(crawl, {
    items,
    senders,
    card,
    onSpend,
    onSend,
  });
  const layout = extrasLayout(extraList, !!verdict);
  const [using, setUsing] = useState<number | null>(null);
  const usingSheet = layout === "sheet" && using === session.discarded;
  const extraPlaques =
    layout === "inline" ? (
      extraList.map((e) => e.plaque)
    ) : layout === "sheet" ? (
      <UsePlaque
        count={extraList.length}
        onOpen={() => setUsing(session.discarded)}
        theme={crawl}
      />
    ) : null;
  // A branching starter's evolution splits into one plaque per form; a line
  // names the form it brings next ("Ivysaur · drink 3").
  const form = omenForm(session.quest);
  const branches = form?.branches;
  const next = form?.next;
  const plaques = (offers ?? []).flatMap(
    (
      offer,
      i,
    ): {
      offer: Offer;
      i: number;
      branch?: { name: string; index: number };
    }[] =>
      offer.evolve && branches
        ? branches.map((name, index) => ({ offer, i, branch: { name, index } }))
        : offer.evolve && next
          ? [{ offer, i, branch: { name: next, index: 0 } }]
          : [{ offer, i, branch: undefined }],
  );
  // Never more than three across (2026-10-31): Eevee's three forms beside
  // Press B fold into one Evolve plaque that opens a sheet of forms.
  const evolveAt = (offers ?? []).findIndex((o) => o.evolve);
  const fold = foldBranches(plaques.length, branches?.length ?? 0);
  const [fanning, setFanning] = useState<number | null>(null);
  const fanSheet = fold && fanning === session.discarded;
  const branchRows =
    fold && form && evolveAt >= 0
      ? form.card.evolves!.map((to, index) => {
          const words = crawl.omenWords;
          const now = formEffect(session.quest) ?? {};
          const base = (session.quest?.party?.max ?? 0) - (now.hearts ?? 0);
          return {
            key: `branch-${index}`,
            long: true,
            name: to.title,
            does: words ? describeChange(now, to.omen, words, base) : "",
            mark: to.type ? (
              <TypeMark type={to.type} />
            ) : (
              <CrawlIcon name="adventurer" theme={crawl} />
            ),
            run: () => onOffer?.(evolveAt, index),
            plaque: null,
          };
        })
      : [];
  // Secret and timed cards: plaques once the card has landed face up; a timed
  // card stays on the table until its time is up.
  const actions = useCardActions(
    card,
    // One state per dealt card, like the rotator below.
    `${session.discarded}-${card.id}`,
  );
  const acting =
    !motion && session.phase === "revealed" && hasActions(card, actions);
  const blocked = acting && actions.blocking;
  // WebKit can paint the reverse of a nested, clipped 3D face despite
  // backface-visibility. Cull by the actual rendered angle, not a timer, so
  // interrupted/reduced-motion turns cannot expose mirrored card text.
  useLayoutEffect(() => {
    const el = ref.current;
    const rotator = el?.querySelector<HTMLElement>(".card-rotator");
    const front = el?.querySelector<HTMLElement>(".card-front");
    const back = el?.querySelector<HTMLElement>(".card-back");
    if (!rotator || !front || !back) return;
    let frame = 0;
    let live = true;
    const paint = () => {
      frame = 0;
      if (!live) return;
      const transform = getComputedStyle(rotator).transform;
      const frontFacing =
        motion === "flip"
          ? transform !== "none" && new DOMMatrixReadOnly(transform).m11 < 0
          : session.phase === "revealed";
      front.style.visibility = frontFacing ? "visible" : "hidden";
      back.style.visibility = frontFacing ? "hidden" : "visible";
      // Don't keep a per-frame loop alive on a hidden tab; resync on return.
      if (motion === "flip" && !document.hidden)
        frame = requestAnimationFrame(paint);
    };
    const onVisibility = () => {
      if (!document.hidden) paint();
    };
    paint();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      live = false;
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [session.phase, transition, motion]);
  useEffect(() => {
    const el = ref.current;
    if (!el || !motion) return;
    const finish = (event: AnimationEvent) => {
      if (
        event.target === el &&
        event.animationName ===
          (
            {
              deal: "deal-in",
              flip: "lift-turn",
              discard: "discard",
              settle: "card-settle",
              complete: "celebration",
              // Roll completion is owned by the dice overlay, not a keyframe.
              roll: "dice-roll",
            } as const
          )[motion]
      )
        onFinish(transition);
    };
    el.addEventListener("animationend", finish);
    el.addEventListener("animationcancel", finish);
    return () => {
      el.removeEventListener("animationend", finish);
      el.removeEventListener("animationcancel", finish);
    };
  }, [transition, motion, onFinish]);
  return (
    <>
      <section className="table">
        <span className="sr-only" role="status" aria-live="polite">
          {session.phase === "revealed" &&
          session.roll?.returned &&
          motion === "settle"
            ? `Rolled ${session.roll.values.join(" plus ")}${
                session.roll.values.length > 1
                  ? `, total ${session.roll.total}`
                  : ""
              }. ${diceResultText(card, session.roll)}`
            : ""}
        </span>
        <div
          className={`card-stage ${motion ?? ""} ${choice || verdict || offers || spoils || press || catching || acting || extraList.length > 0 ? "choosing" : ""}`}
        >
          <div className="deck-under" aria-hidden="true" />
          <button
            ref={ref}
            className={`game-card ${session.phase === "revealed" ? "face" : "back"}`}
            onClick={() => {
              const awaitingReveal =
                !!card.dice &&
                !!session.roll &&
                !session.roll.returned &&
                motion !== "roll";
              if (
                choice ||
                verdict ||
                offers ||
                spoils ||
                press ||
                catching ||
                blocked
              ) {
                // Point at the plaques instead of acting on a stray tap.
                if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
                  choiceRef.current?.animate(
                    [
                      { transform: "scale(1)" },
                      { transform: "scale(1.05)" },
                      { transform: "scale(1)" },
                    ],
                    { duration: 240, easing: "ease-out" },
                  );
              } else if (!awaitingReveal) onTap();
            }}
            aria-disabled={
              !!choice ||
              verdict ||
              !!offers ||
              !!spoils ||
              press ||
              catching ||
              blocked ||
              (!!motion && motion !== "roll") ||
              (!!card.dice &&
                !!session.roll &&
                !session.roll.returned &&
                motion !== "roll")
            }
            aria-label={
              session.phase === "hidden"
                ? "Reveal card"
                : choice
                  ? `${card.title}. ${card.rules} Choose ${choice.skip} or ${choice.roll}.`
                  : verdict
                    ? `${card.title}. ${card.rules} Choose Won or Lost.`
                    : offers
                      ? `${card.title}. ${card.rules} Choose ${offers.map((o) => o.label).join(", or ")}.`
                      : spoils
                        ? `${card.title}. ${diceResultText(card, session.roll!)} Take a trinket: ${spoils.map((b) => b.name).join(", or ")}.`
                        : press
                          ? `${card.title}. ${diceResultText(card, session.roll!)} Cash out or go again.`
                          : catching
                            ? `${card.title}. Beaten. ${card.catchRate ? "Throw a ball, or let it go." : "Catch it, or let it go."}`
                            : ball
                              ? `${card.title}. Threw a ${ball.face}, needed ${ball.need}. ${ball.caught ? "Caught." : "It got away."} ${ball.line} Tap to put this card aside.`
                              : blocked
                                ? `${card.title}. ${card.rules} ${card.timer!.kind === "fuse" ? "Light the fuse" : "Start the clock"}, or skip it.`
                                : actions.shown === "end"
                                  ? `${card.title}. ${card.timer!.end} Tap to put this card aside.`
                                  : card.dice && !session.roll?.returned
                                    ? session.roll
                                      ? motion === "roll"
                                        ? "Finish dice roll"
                                        : "Revealing dice result"
                                      : `Roll ${diceNotation(card.dice)}. ${card.rules}`
                                    : `${card.title}. ${session.roll?.returned ? `Rolled ${session.roll.total}. ${diceResultText(card, session.roll)}` : card.rules} ${cardPacks(
                                        card.id,
                                        session.config.packIds,
                                      )
                                        .map((pack) => pack.title)
                                        .join(
                                          ", ",
                                        )}. Tap to put this card aside.`
            }
          >
            <span
              className="card-rotator"
              // One rotator per dealt card. A quest finale deals its cards
              // without moving the deck, so cycle and position repeat; reusing
              // the face-up rotator would visibly turn it back over.
              key={session.discarded}
            >
              <span className="card-surface card-back" aria-hidden="true" />
              <span
                className="card-surface card-front"
                aria-hidden={session.phase !== "revealed"}
              >
                {renderFace ? (
                  renderFace(card)
                ) : (
                  <CardFace
                    card={card}
                    packIds={session.config.packIds}
                    roll={session.roll}
                    shown={session.phase === "revealed" ? actions.shown : null}
                    party={session.quest?.party}
                    hits={hitsNeeded(session.quest, card)}
                    crawl={crawl}
                    matchup={cardMatchup(session.quest, card)}
                    strike={strikeOutcome(session.quest, card)}
                    ball={ball}
                  />
                )}
              </span>
            </span>
          </button>
          {acting && (
            <CardActions
              card={card}
              actions={actions}
              groupRef={choiceRef}
              onSkip={onTap}
            />
          )}
          {verdict && (
            <div
              ref={choiceRef}
              className={`card-choice verdict plaques-${2 + (layout === "none" ? 0 : layout === "sheet" ? 1 : extraList.length)}`}
              role="group"
              aria-label="Did you win?"
            >
              <button
                className="card-choice-option won"
                onClick={() =>
                  spoilsOnWin(session)
                    ? setAsking(session.discarded)
                    : onSettle(true)
                }
              >
                Won
              </button>
              <button
                className="card-choice-option lost"
                onClick={() => onSettle(false)}
              >
                Lost
              </button>
              {extraPlaques}
            </div>
          )}
          {catching && (
            <div
              ref={choiceRef}
              className="card-choice offers catch plaques-2"
              role="group"
              aria-label="Catch it"
            >
              <CatchPlaques
                session={session}
                onCatch={onCatch}
                onRelease={onRelease}
                theme={crawl}
              />
            </div>
          )}
          {offers && fold && (
            <div
              ref={choiceRef}
              className={`card-choice offers plaques-${offers.length}`}
              role="group"
              aria-label="Your choice"
            >
              {offers.map((offer, i) =>
                offer.evolve ? (
                  <FanPlaque
                    key={i}
                    name="Evolve"
                    under={offer.label.split(" · ")[1] ?? offer.label}
                    icon="adventurer"
                    count={branchRows.length}
                    onOpen={() => setFanning(session.discarded)}
                    theme={crawl}
                  />
                ) : (
                  <OfferPlaque
                    key={i}
                    offer={offer}
                    index={i}
                    can={canTakeOffer(session, i)}
                    onTake={onOffer}
                    theme={crawl}
                  />
                ),
              )}
            </div>
          )}
          {offers && !fold && (
            <div
              ref={choiceRef}
              className={`card-choice offers plaques-${plaques.length}`}
              role="group"
              aria-label="Your choice"
            >
              {plaques.map(({ offer, i, branch }) => (
                <OfferPlaque
                  key={`${i}-${branch?.index ?? ""}`}
                  offer={offer}
                  index={i}
                  can={canTakeOffer(session, i)}
                  onTake={onOffer}
                  theme={crawl}
                  branch={branch}
                />
              ))}
            </div>
          )}
          {spoils && (
            <div
              ref={choiceRef}
              className="card-choice offers spoils plaques-1"
              role="group"
              aria-label="Take a trinket"
            >
              <SpoilsButton onOpen={() => setSheetClosed(null)} theme={crawl} />
            </div>
          )}
          {press && (
            <div
              ref={choiceRef}
              className="card-choice offers press plaques-2"
              role="group"
              aria-label="Cash out or go again"
            >
              <PressPlaques
                session={session}
                onCashOut={onCashOut}
                onPress={onPress}
                theme={crawl}
              />
            </div>
          )}
          {!verdict &&
            !choice &&
            !acting &&
            !spoils &&
            !press &&
            !catching &&
            extraList.length > 0 && (
              <div
                ref={choiceRef}
                className={`card-choice items plaques-${layout === "sheet" ? 1 : extraList.length}`}
                role="group"
                aria-label="Satchel"
              >
                {extraPlaques}
              </div>
            )}
          {choice && (
            <div
              ref={choiceRef}
              className="card-choice"
              role="group"
              aria-label="Your choice"
            >
              <button
                className="card-choice-option skip"
                onClick={() => onChoose("skip")}
              >
                {choice.skip}
              </button>
              <button
                className="card-choice-option roll"
                aria-label={`${choice.roll}: roll ${diceNotation(card.dice!)}`}
                onClick={() => onChoose("roll")}
              >
                {choice.roll}
                <small>{diceNotation(card.dice!)}</small>
              </button>
            </div>
          )}
        </div>
      </section>
      <span className="sr-only" role="status" aria-live="assertive">
        {actions.shown === "secret"
          ? `Secret: ${card.secret}`
          : actions.shown === "end"
            ? `${card.timer!.kind === "fuse" ? "Boom" : "Time"}. ${card.timer!.end}`
            : ""}
      </span>
      {session.phase === "revealed" && (
        <TimerBlast card={card} actions={actions} />
      )}
      {overlay &&
        session.phase === "revealed" &&
        card.dice &&
        !session.roll?.returned &&
        (!motion || motion === "roll") && (
          <Suspense fallback={null}>
            <FullScreenDice
              card={card}
              roll={session.roll}
              rolling={motion === "roll"}
              finishing={finishingRoll}
              onTap={onTap}
              onReveal={onRevealRoll}
              onFinish={() => onFinish(transition)}
              palette={form?.palette}
            />
          </Suspense>
        )}
      {fanSheet && (
        <ExtrasSheet
          title="Evolve into"
          extras={branchRows}
          onTake={(row) => {
            setFanning(null);
            row.run();
          }}
          onClose={() => setFanning(null)}
        />
      )}
      {usingSheet && (
        <ExtrasSheet
          extras={extraList}
          onTake={(extra) => {
            setUsing(null);
            extra.run();
          }}
          onClose={() => setUsing(null)}
        />
      )}
      {ask && card.spoils && (
        <SpoilsSheet
          session={session}
          spoils={card.spoils}
          theme={crawl}
          onTake={(i) => {
            setAsking(null);
            onSettle(true, i);
          }}
          onKeep={() => {
            setAsking(null);
            onSettle(true);
          }}
          onClose={() => setAsking(null)}
        />
      )}
      {spoils && sheet && (
        <SpoilsSheet
          session={session}
          spoils={spoils}
          theme={crawl}
          onTake={onSpoils}
          onKeep={onKeepGear}
          onClose={() => setSheetClosed(session.discarded)}
        />
      )}
    </>
  );
}
