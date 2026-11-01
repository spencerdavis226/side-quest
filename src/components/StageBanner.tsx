import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PokemonType, SessionState } from "../game/types";
import {
  finaleCard,
  finaleStage,
  formEffect,
  omenForm,
  partyBoons,
  questStages,
  wantedBoss,
} from "../game/engine";
import { describeChange } from "../game/omenText";
import { crawlTheme } from "./crawlTheme";
import { packs } from "../content/manifest.generated";
import { stageArt } from "../presentation/league-art";
import { useAnnounce } from "./Announcer";
import { TypeMark } from "./LeagueMarks";
import { asset } from "../presentation/theme";

/** The banner that sweeps across the table as each finale stage begins (the
 * Legendary, the Elite Four, the Champion; a crawl's floors and bosses):
 * shown while the stage's first card is dealt face down, once per stage. It never takes a tap; the card
 * underneath stays playable. */
export function StageBanner({ session }: { session: SessionState }) {
  const banner = stageBanner(session);
  useAnnounce(
    banner
      ? [
          banner.mode,
          banner.intro,
          banner.wanted && `${banner.wantedWord}: ${banner.wanted}`,
        ]
          .filter(Boolean)
          .join(". ")
      : "",
    banner?.key ?? null,
  );
  if (!banner) return null;
  const { tone, art, mode, intro, wanted, wantedWord } = banner;
  return (
    <div
      // Keyed by stage so a new stage replays the sweep.
      key={banner.stage}
      className={`stage-banner banner-${tone}`}
      aria-hidden="true"
    >
      <div className={`stage-banner-cloth${art ? " painted-banner" : ""}`}>
        {art && <img className="stage-banner-art" src={art} alt="" />}
        <small>{mode}</small>
        <strong>{intro}</strong>
        {wanted && (
          <span className="banner-wanted">
            {wantedWord}: {wanted}
          </span>
        )}
      </div>
    </div>
  );
}
/** What the stage banner shows now, or null when none is up. */
function stageBanner(session: SessionState) {
  const quest = session.quest;
  if (!quest?.due || session.phase !== "hidden") return null;
  const stage = finaleStage(quest);
  if (stage.index !== 0) return null;
  // Once per stage: not again when a boss is dealt for another swing or a
  // lost Champion is replaced.
  const pool = quest.stages[stage.stage].cards;
  if (pool.some((c) => c.id === session.previousId)) return null;
  const rules = packs.find((p) => p.id === quest.packId)?.quest;
  const intro =
    (rules && questStages(rules).find((s) => s.label === stage.label)?.intro) ??
    stage.label;
  // The banner takes the stage's ribbon finish (pearl, violet, crimson).
  const tone = quest.stages[stage.stage].cards[0]?.ribbonTone ?? "gold";
  const art = quest.packId === "pokemon" ? stageArt(tone) : undefined;
  // A floor of rooms names the boss waiting at the bottom (Pub Crawl).
  const wantedWord = crawlTheme(quest.packId).words.wanted;
  const wanted =
    wantedWord && stage.size > 1 ? wantedBoss(quest)?.title : undefined;
  return {
    key: `${stage.stage}:${session.discarded}`,
    stage: stage.stage,
    mode: rules?.mode,
    intro,
    tone,
    art,
    wanted,
    wantedWord,
  };
}

/** How long the evolution and news banners stay up: their 5.2 s sweep
 * (theme.css), plus a little. */
const BANNER_MS = 5600;

/** Takes a banner down once its sweep ends, or after `BANNER_MS` if the
 * animation never reports its end (animations off, a paused tab), so a
 * banner can never be left standing over the table. */
function useBannerTimeout(key: string | null, clear: () => void) {
  useEffect(() => {
    if (key === null) return;
    const id = setTimeout(clear, BANNER_MS);
    return () => clearTimeout(id);
  }, [key, clear]);
}

/** The banner when the starter evolves mid-run: "What? Charmander is
 * evolving!" over its new form's name. Shown once per evolution, never on a
 * resumed game; it sits high so a stage banner below it stays readable. */
export function EvolutionBanner({ session }: { session: SessionState }) {
  const quest = session.quest;
  const form = quest?.party?.form ?? 0;
  const seen = useRef(form);
  const [shown, setShown] = useState<{
    from: string;
    to: string;
    change: string;
    /** The League's evolution plays first (2026-11-01): the old and new
     * forms' type medallions as white silhouettes, flickering faster and
     * faster, a flash, then the new form; the banner follows. */
    morph: { from: PokemonType; to: PokemonType } | null;
  } | null>(null);
  useEffect(() => {
    if (form > seen.current) {
      const now = omenForm(quest);
      // A branching starter (Eevee) evolves straight from its base form.
      const before =
        form === 1 || now?.card.branches
          ? now?.card
          : now?.card.evolves?.[form - 2];
      const from = before?.title;
      const fromType = before?.type ?? now?.card.type;
      // What the evolution did, from the numbers: "Max HP 15 → 17." The
      // form alone: boons a crawl keeps beside it didn't change.
      const words = crawlTheme(quest?.packId).omenWords;
      const after = formEffect(quest) ?? {};
      const base = (quest?.party?.max ?? 0) - (after.hearts ?? 0);
      const change =
        words && now?.before
          ? describeChange(now.before, after, words, base)
          : "";
      const still =
        document.hidden ||
        matchMedia("(prefers-reduced-motion: reduce)").matches;
      const morph =
        !still && fromType && now?.type
          ? { from: fromType, to: now.type }
          : null;
      if (now && from) setShown({ from, to: now.title, change, morph });
    }
    seen.current = form;
  }, [form, quest]);
  const evolving = crawlTheme(quest?.packId).words.evolving;
  const clear = useCallback(() => setShown(null), []);
  const morphed = useCallback(
    () => setShown((s) => (s?.morph ? { ...s, morph: null } : s)),
    [],
  );
  useBannerTimeout(
    shown && !shown.morph ? `${shown.from}>${shown.to}` : null,
    clear,
  );
  useEffect(() => {
    if (!shown?.morph) return;
    const id = setTimeout(morphed, MORPH_MS);
    return () => clearTimeout(id);
  }, [shown?.morph, morphed]);
  useAnnounce(
    shown && evolving
      ? `${evolving(shown.from)} ${shown.to}. ${shown.change}`
      : "",
    shown && evolving ? `${shown.from}>${shown.to}` : null,
  );
  if (!shown || !evolving) return null;
  if (shown.morph)
    return (
      <EvolutionMorph
        from={shown.from}
        to={shown.to}
        types={shown.morph}
        onDone={morphed}
      />
    );
  return (
    <div
      key={shown.to}
      className="stage-banner banner-pearl evolution-banner"
      aria-hidden="true"
    >
      <div
        className="stage-banner-cloth"
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget) clear();
        }}
      >
        <small>{evolving(shown.from)}</small>
        <strong>{shown.to}</strong>
        {shown.change && <span>{shown.change}</span>}
      </div>
    </div>
  );
}

/** How long the League's evolution plays before its banner (`evo-*` in
 * crawl.css: 2.0 s of flicker, the flash, the new form). */
const MORPH_MS = 3000;

/** The League's evolution, over a dimmed table (2026-11-01, owner): the
 * old form's type medallion as a white silhouette, swapping with the new
 * form's bigger one faster and faster, a white flash, then the new form in
 * colour with its name. A tap skips to the banner. Display only and
 * `aria-hidden` (the banner's words are announced). The app ships no
 * Pokémon art, so the medallions stand in for the sprites. */
function EvolutionMorph({
  from,
  to,
  types,
  onDone,
}: {
  from: string;
  to: string;
  types: { from: PokemonType; to: PokemonType };
  onDone: () => void;
}) {
  return createPortal(
    <div className="evo-stage" aria-hidden="true" onClick={onDone}>
      <div className="evo-figure">
        <span className="evo-glow" />
        <Silhouette type={types.from} className="evo-old" />
        <Silhouette type={types.to} className="evo-new" />
        <TypeMark type={types.to} className="evo-final" />
      </div>
      <div className="evo-names">
        <span className="evo-old">{from}</span>
        <span className="evo-new">{to}</span>
      </div>
      <span className="evo-flash" />
    </div>,
    document.body,
  );
}

/** A form's type glyph alone, glowing white: the evolution's silhouette. */
function Silhouette({
  type,
  className,
}: {
  type: PokemonType;
  className: string;
}) {
  const src = `url("${asset(`art/league/types/${type}.svg`)}")`;
  return (
    <span
      className={`evo-silhouette ${className}`}
      style={{ maskImage: src, WebkitMaskImage: src }}
    />
  );
}

/** Pub Crawl's news, swept across the top third like an evolution: a
 * trinket found (its name and power), a jinx laid (its rule) or lifted, a
 * lost fight's drinks passed on.
 * Shown once per change, never on a resumed game. Tonight's omen is a
 * boon too, but its own card has just said so. */
export function PartyNewsBanner({ session }: { session: SessionState }) {
  const quest = session.quest;
  const party = quest?.party;
  // The newest piece kept: a swap (2026-10-25) changes it without adding
  // to the count.
  const boons = party?.boons?.at(-1) ?? null;
  const jinx = party?.jinx;
  const passed = party?.passed;
  const fainted = party?.fainted;
  const seen = useRef({ boons, jinx, passed, fainted });
  const [shown, setShown] = useState<{
    key: string;
    kicker: string;
    title: string;
    line: string;
    tone: string;
  } | null>(null);
  const words = crawlTheme(quest?.packId).words;
  useEffect(() => {
    const before = seen.current;
    seen.current = { boons, jinx, passed, fainted };
    if (!quest || !party) return;
    // A caught Pokémon lost with (2026-10-31, a Nuzlocke): gone for good.
    if (fainted && fainted !== before.fainted) {
      const fallen = finaleCard(quest, fainted);
      if (fallen) {
        setShown({
          key: `fainted-${fainted}-${session.discarded}`,
          kicker: "Fainted",
          title: fallen.title,
          line: "Gone for good. The drawer drinks 2.",
          tone: "crimson",
        });
        return;
      }
    }
    if (passed !== undefined && passed !== before.passed) {
      const item = crawlTheme(quest.packId).loot.round;
      setShown({
        key: `passed-${passed}`,
        kicker: item.name,
        title: "Point at someone",
        line: "This fight's drinks are theirs.",
        tone: "violet",
      });
      return;
    }
    if (boons && boons !== before.boons) {
      const found = partyBoons(quest).at(-1);
      const card = found?.card;
      if (found && card?.encounter !== "omen" && words.trinketFound) {
        // A boss that falls can lift a jinx in the same breath.
        const lifted = before.jinx && !jinx && words.jinx;
        setShown({
          key: `boon-${found.key}`,
          kicker: words.trinketFound,
          title: found.boon.name,
          line: [found.boon.rules, lifted ? `${words.jinx!.lifted}.` : ""]
            .filter(Boolean)
            .join(" "),
          tone: "violet",
        });
        return;
      }
    }
    if (jinx && jinx !== before.jinx && words.jinx) {
      const laid = finaleCard(quest, jinx)?.jinx;
      if (laid)
        setShown({
          key: `jinx-${jinx}`,
          kicker: words.jinx.landed,
          title: laid.name,
          line: laid.rule,
          tone: "crimson",
        });
    } else if (before.jinx && !jinx && words.jinx)
      setShown({
        key: `lifted-${before.jinx}`,
        kicker: words.jinx.name,
        title: words.jinx.lifted,
        line: "",
        tone: "pearl",
      });
  }, [boons, jinx, passed, fainted, quest, party, words, session.discarded]);
  const clear = useCallback(() => setShown(null), []);
  useBannerTimeout(shown?.key ?? null, clear);
  useAnnounce(
    shown
      ? [shown.kicker, shown.title, shown.line].filter(Boolean).join(". ")
      : "",
    shown?.key ?? null,
  );
  if (!shown) return null;
  return (
    <div
      key={shown.key}
      className={`stage-banner banner-${shown.tone} evolution-banner news-banner`}
      aria-hidden="true"
    >
      <div
        className="stage-banner-cloth"
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget) clear();
        }}
      >
        <small>{shown.kicker}</small>
        <strong>{shown.title}</strong>
        {shown.line && <span>{shown.line}</span>}
      </div>
    </div>
  );
}
