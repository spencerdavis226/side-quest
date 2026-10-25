import { useCallback, useEffect, useRef, useState } from "react";
import type { SessionState } from "../game/types";
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
  } | null>(null);
  useEffect(() => {
    if (form > seen.current) {
      const now = omenForm(quest);
      // A branching starter (Eevee) evolves straight from its base form; a
      // forked adventurer's second level grows from its path's first.
      const from =
        form === 1 || now?.card.branches || (now?.card.fork && form === 2)
          ? now?.card.title
          : now?.card.evolves?.[form - (now?.card.fork ? 3 : 2)]?.title;
      // What the evolution did, from the numbers: "Max HP 15 → 17." The
      // form alone: boons a crawl keeps beside it didn't change.
      const words = crawlTheme(quest?.packId).omenWords;
      const after = formEffect(quest) ?? {};
      const base = (quest?.party?.max ?? 0) - (after.hearts ?? 0);
      const change =
        words && now?.before
          ? describeChange(now.before, after, words, base)
          : "";
      if (now && from) setShown({ from, to: now.title, change });
    }
    seen.current = form;
  }, [form, quest]);
  const evolving = crawlTheme(quest?.packId).words.evolving;
  const clear = useCallback(() => setShown(null), []);
  useBannerTimeout(shown && `${shown.from}>${shown.to}`, clear);
  useAnnounce(
    shown && evolving
      ? `${evolving(shown.from)} ${shown.to}. ${shown.change}`
      : "",
    shown && evolving ? `${shown.from}>${shown.to}` : null,
  );
  if (!shown || !evolving) return null;
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

/** Pub Crawl's news, swept across the top third like an evolution: a
 * trinket found (its name and power), a jinx laid (its rule) or lifted, a
 * lost fight's drinks passed on.
 * Shown once per change, never on a resumed game. Tonight's omen is a
 * boon too, but its own card has just said so. */
export function PartyNewsBanner({ session }: { session: SessionState }) {
  const quest = session.quest;
  const party = quest?.party;
  const boons = party?.boons?.length ?? 0;
  const jinx = party?.jinx;
  const passed = party?.passed;
  const cup = party?.cup ?? 0;
  const seen = useRef({ boons, jinx, passed, cup });
  // The Cup explains itself once, on the first splash this screen sees.
  const cupTold = useRef(false);
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
    seen.current = { boons, jinx, passed, cup };
    if (!quest || !party) return;
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
    if (boons > before.boons) {
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
    else if (cup > before.cup && !cupTold.current && words.cup) {
      cupTold.current = true;
      setShown({
        key: `cup-${cup}`,
        kicker: words.cup.name,
        title: words.cup.first.title,
        line: words.cup.first.line,
        tone: "amber",
      });
    }
  }, [boons, jinx, passed, cup, quest, party, words]);
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
