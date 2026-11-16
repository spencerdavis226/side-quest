import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useMoments } from "../components/moments/Director";
import {
  awaitingOffer,
  currentCard,
  finaleCard,
  finaleStage,
  runNames,
} from "../game/engine";
import type { CardDefinition, SessionState } from "../game/types";
import { Button, IconButton } from "../components/UI";
import { TypeMark } from "../components/LeagueMarks";
import { classMark } from "../components/classMark";
import { QUEST_MAP, LAIR_WORDS } from "../components/crawlTheme";
import type { Prologue as PrologueAt } from "../components/prologue";
import { pokemonTypes } from "../presentation/pokemon-types";
import { questArt, type QuestArt } from "../presentation/quest-art.generated";
import RivalMedal, { RIVAL_COLOURS } from "../components/RivalMedal";
import "../presentation/prologue.css";

// The prologue scene (2026-11-15; `components/prologue.ts` says when). Not
// the table: no card, no deck, no top bar, its own backdrop and type, and
// a line that says the phone stays put. Each step shows one opening card as
// a scene of its own (a starter's medallion, a class's mark struck on iron,
// an omen's tarot, the King's sealed letter, the road's two ways), and the
// last is the handoff: the run begins and the phone goes round. The engine
// is driven through the same controller calls as the table (`onContinue`
// puts the card aside, `onOffer` takes a road), so nothing about the run
// changes. Lazy: it brings the Quest's art with it.

/** Each region's mark (`scripts/quest-art.ts`), for the road's choices and
 * the handoff. */
const TERRAIN: Record<string, QuestArt> = {
  "The King's Road": "road",
  "The Old Forest": "forest",
  "The Marsh": "marsh",
  "The Haunted Crypt": "crypt",
  "The Goblin Mines": "mines",
  "The Wizard's Tower": "tower",
  "The Sunken Coast": "coast",
  "The Fire Caverns": "caverns",
  "The Frozen Pass": "pass",
};
const REGION_WORDS: Record<string, string> = {
  ...Object.fromEntries(QUEST_MAP.flat().map((r) => [r.label, r.words])),
  ...LAIR_WORDS,
};

function Mark({ art, className }: { art: QuestArt; className: string }) {
  return (
    <svg className={className} viewBox="0 0 512 512" aria-hidden="true">
      <path d={questArt[art]} />
    </svg>
  );
}

type Kind =
  | "starter"
  | "adventurer"
  | "omen"
  | "summons"
  | "road"
  | "rival"
  | "handoff-league"
  | "handoff-quest";

function kindOf(session: SessionState, at: PrologueAt | null): Kind {
  if (!at) return "rival";
  const league = session.quest!.packId === "pokemon";
  if (at.at === at.length) return league ? "handoff-league" : "handoff-quest";
  switch (at.label) {
    case "Your starter":
      return "starter";
    case "Your adventurer":
      return "adventurer";
    case "The omen":
      return "omen";
    case "The King's Summons":
      return "summons";
    default:
      return "road";
  }
}

/** The words over each step, and what its button says. */
const HEAD: Record<Kind, { kicker: string; go: string }> = {
  starter: { kicker: "Your partner", go: "Set out" },
  adventurer: { kicker: "Your adventurer", go: "Read the omen" },
  omen: { kicker: "Tonight's omen", go: "Open the summons" },
  summons: { kicker: "The King's Summons", go: "Take the road" },
  road: { kicker: "The Road Out", go: "" },
  rival: { kicker: "Your rival", go: "Back to the table" },
  "handoff-league": { kicker: "The League begins", go: "Deal the first card" },
  "handoff-quest": { kicker: "The Quest begins", go: "Deal the first card" },
};

export default function Prologue({
  session,
  at,
  busy,
  onContinue,
  onOffer,
  onDeal,
  onMenu,
}: {
  session: SessionState;
  /** Where the opening is; null for the rival's interlude (mid-run). */
  at: PrologueAt | null;
  /** A motion or a moment is under way: the buttons wait. */
  busy: boolean;
  onContinue: () => void;
  onOffer: (index: number) => void;
  onDeal: () => void;
  onMenu: () => void;
}) {
  const quest = session.quest!;
  const league = quest.packId === "pokemon";
  const kind = kindOf(session, at);
  const handoff = !!at && at.at === at.length;
  const card =
    handoff || session.phase !== "revealed" ? null : currentCard(session);
  // The starter's type colours the whole scene, as the Quest's ember does.
  const starter = league ? finaleCard(quest, quest.finale[0]) : undefined;
  const type =
    starter?.type && starter.type in pokemonTypes ? starter.type : undefined;
  const rival = card?.rival?.who ? RIVAL_COLOURS[card.rival.who] : undefined;
  // A step whose card has its own reveal (the class drawn from the tarot,
  // the starter's ball, the Wanted poster, the rival walking in) waits for
  // it: the reveal plays alone, then the scene comes in (owner, 2026-11-15:
  // the draw "happens at the same time as the 'your adventurer' scene").
  const stageKey = `${at?.at ?? "rival"}-${card?.id ?? ""}`;
  // Held from the step's arrival, not only once its card is face up: in
  // the frames while the card is still being dealt there is no card, and
  // the scene's heading and button showed before the reveal covered them
  // (owner, 2026-11-16: "your partner" first, then the ball, then "your
  // partner" again).
  const held = useRevealFirst(stageKey, !handoff && REVEALS.has(kind), !!card);
  const tint = type
    ? ({
        "--pro-light": pokemonTypes[type].light,
        "--pro-deep": pokemonTypes[type].deep,
      } as CSSProperties)
    : rival
      ? ({
          "--pro-light": rival.light,
          "--pro-deep": rival.deep,
        } as CSSProperties)
      : undefined;
  const offers = card && awaitingOffer(session) ? card.offers! : null;
  const steps = at ? Array.from({ length: at.length + 1 }, (_, i) => i) : [];
  return (
    <section
      className={`prologue ${league ? "prologue-league" : "prologue-quest"} pro-is-${kind}`}
      style={tint}
      aria-labelledby="prologue-title"
    >
      <div className="pro-backdrop" aria-hidden="true">
        <span className="pro-glow" />
        <span className="pro-rays" />
        <span className="pro-vignette" />
      </div>
      <header className="pro-head">
        {at && (
          <ol
            className="pro-steps"
            aria-label={`Setting out: ${at.at + 1} of ${at.length + 1}`}
          >
            {steps.map((i) => (
              <li
                key={i}
                className={i < at.at ? "done" : i === at.at ? "here" : ""}
              />
            ))}
          </ol>
        )}
        <IconButton label="Menu" className="pro-menu" onClick={onMenu}>
          <svg
            className="ui-icon"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path d="M5 7h14M5 12h14M5 17h14" />
          </svg>
        </IconButton>
      </header>
      {held ? (
        <div className="pro-wait" aria-hidden="true" />
      ) : (
        <>
          <div className="pro-stage" key={stageKey}>
            <p className="pro-kicker">{HEAD[kind].kicker}</p>
            {handoff ? (
              <Handoff session={session} league={league} />
            ) : card ? (
              <Scene kind={kind} card={card} league={league} />
            ) : null}
          </div>
          <footer className="pro-foot">
            {handoff ? (
              <>
                <p className="pro-hold pro-pass">
                  <PassIcon />
                  Now pass the phone. One card each, round the table.
                </p>
                <Button className="pro-go" disabled={busy} onClick={onDeal}>
                  {HEAD[kind].go}
                </Button>
              </>
            ) : (
              <>
                <p className="pro-hold">
                  <EyesIcon />
                  {kind === "rival"
                    ? "Everyone, meet your rival. They follow you all quest."
                    : "Everyone, look together. Keep the phone here."}
                </p>
                {offers ? (
                  <div className="pro-roads">
                    {offers.map((offer, i) =>
                      offer.flip ? (
                        <Button
                          key={i}
                          variant="text-button"
                          className="pro-flip"
                          disabled={busy}
                          onClick={() => onOffer(i)}
                        >
                          {offer.label}
                        </Button>
                      ) : (
                        <button
                          key={i}
                          type="button"
                          className="pro-road"
                          disabled={busy}
                          onClick={() => onOffer(i)}
                        >
                          <Mark
                            art={TERRAIN[offer.label] ?? "compass"}
                            className="pro-road-mark"
                          />
                          <strong>{offer.label}</strong>
                          {REGION_WORDS[offer.label] && (
                            <small>{REGION_WORDS[offer.label]}</small>
                          )}
                        </button>
                      ),
                    )}
                  </div>
                ) : (
                  <Button
                    className="pro-go"
                    disabled={busy || !card}
                    onClick={onContinue}
                  >
                    {HEAD[kind].go}
                  </Button>
                )}
              </>
            )}
          </footer>
        </>
      )}
    </section>
  );
}

/** The steps whose card plays a reveal moment as it turns. */
const REVEALS: ReadonlySet<Kind> = new Set([
  "starter",
  "adventurer",
  "summons",
  "rival",
]);
/** How long a step waits for its reveal to start before showing the scene
 * anyway (a reload, where no moment plays). */
const REVEAL_GRACE_MS = 450;

/** True while the step `key` should keep its scene back: from its arrival
 * until its reveal moment has started and finished, or until the grace
 * passes with none. A step without a reveal is never held. Until its card
 * is `dealt` face up the step waits with no grace: the reveal is queued
 * only once the card turns. */
function useRevealFirst(key: string, reveals: boolean, dealt: boolean) {
  const { busy } = useMoments();
  const [step, setStep] = useState({ key, phase: "wait" });
  if (step.key !== key) setStep({ key, phase: "wait" });
  const phase = step.key === key ? step.phase : "wait";
  useEffect(() => {
    if (!reveals || phase === "shown") return;
    if (phase === "wait" && busy) {
      setStep({ key, phase: "playing" });
      return;
    }
    if (phase === "playing" && !busy) {
      setStep({ key, phase: "shown" });
      return;
    }
    if (phase === "wait" && dealt) {
      const id = setTimeout(
        () => setStep({ key, phase: "shown" }),
        REVEAL_GRACE_MS,
      );
      return () => clearTimeout(id);
    }
  }, [key, reveals, phase, busy, dealt]);
  return reveals && phase !== "shown";
}

function Scene({
  kind,
  card,
  league,
}: {
  kind: Kind;
  card: CardDefinition;
  league: boolean;
}) {
  let art: ReactNode = null;
  if (kind === "starter" && card.type)
    art = (
      <div className="pro-medal">
        <span className="pro-medal-ring" />
        <TypeMark type={card.type} className="pro-type" />
      </div>
    );
  else if (kind === "adventurer")
    art = (
      <div className="pro-iron">
        <Mark art={classMark(card.id)} className="pro-iron-mark" />
      </div>
    );
  else if (kind === "omen")
    art = (
      <div className="pro-tarot">
        <span className="pro-tarot-moon" />
        <Mark art="scroll" className="pro-tarot-mark" />
      </div>
    );
  else if (kind === "summons")
    art = (
      <div className="pro-letter">
        <span className="pro-seal">
          <Mark art="crown" className="pro-seal-mark" />
        </span>
      </div>
    );
  else if (kind === "rival")
    art = (
      <div className="pro-rival-art">
        <RivalMedal who={card.rival?.who} className="pro-rival-medal" />
      </div>
    );
  else if (kind === "road")
    art = (
      <div className="pro-compass">
        <Mark art="compass" className="pro-compass-mark" />
      </div>
    );
  const forms = card.evolves?.map((f) => f.title) ?? [];
  return (
    <>
      {art}
      <h1 id="prologue-title" className="pro-title">
        {card.title}
      </h1>
      {kind === "starter" && card.type && (
        <p className="pro-sub">{pokemonTypes[card.type].name} type</p>
      )}
      <p className="pro-rules">{card.rules}</p>
      {kind === "rival" && card.rival?.profile && (
        <p className="pro-ritual">
          <strong>Whenever they show up</strong>
          {card.rival.profile.ritual}
        </p>
      )}
      {kind === "rival" && !!card.rival?.takes && (
        <p className="pro-note">
          {card.rival.takes === 1
            ? "They take an item from the bag as they go."
            : `They take ${card.rival.takes} items from the bag as they go.`}
        </p>
      )}
      {forms.length > 0 && (
        <p
          className="pro-line"
          aria-label={`Grows into ${forms.join(", then ")}`}
        >
          <span>{card.title}</span>
          {forms.map((f) => (
            <span key={f}>
              <i aria-hidden="true">›</i>
              {f}
            </span>
          ))}
        </p>
      )}
      {league && kind === "starter" && (
        <p className="pro-note">Your starter fights beside the whole table.</p>
      )}
    </>
  );
}

function Handoff({
  session,
  league,
}: {
  session: SessionState;
  league: boolean;
}) {
  const quest = session.quest!;
  const first = finaleStage(quest).label;
  const dragon = runNames(quest).dragon;
  return (
    <>
      <div className="pro-dawn">
        {league ? (
          <span className="pro-ball" />
        ) : (
          <Mark art={TERRAIN[first] ?? "road"} className="pro-dawn-mark" />
        )}
      </div>
      <h1 id="prologue-title" className="pro-title">
        {league ? "Off to Route 1" : first}
      </h1>
      <p className="pro-rules">
        {league
          ? "Eight gyms, the League and the Champion. The whole table is one team."
          : dragon
            ? `First stop on the way to ${dragon}. The whole table is one party.`
            : "The whole table is one party."}
      </p>
      <ol className="pro-how">
        <li>Tap to turn the card.</li>
        <li>Read it out and do what it says.</li>
        <li>Pass the phone to the next player.</li>
      </ol>
    </>
  );
}

function EyesIcon() {
  return (
    <svg
      className="pro-icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}
function PassIcon() {
  return (
    <svg
      className="pro-icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M4 12h13M13 7l5 5-5 5" />
      <rect x="2" y="5" width="5" height="14" rx="1.4" />
    </svg>
  );
}
