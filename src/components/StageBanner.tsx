import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { RivalCut, SessionState } from "../game/types";
import {
  fillNames,
  finaleCard,
  finaleStage,
  questStages,
  rivalCut,
  rivalLine,
  rivalProfile,
  wantedBoss,
} from "../game/engine";
import { crawlTheme } from "./crawlTheme";
import { packs } from "../content/manifest.generated";
import { stageArt } from "../presentation/league-art";
import { useAnnounce } from "./Announcer";
import { entranceFor, hiddenRoomFor } from "./moments/detect";
import { useMoments } from "./moments/Director";

/** A landmark's mark, inked on its banner (The Quest 2.1); lazy. */
const LandmarkMark = lazy(() => import("./LandmarkMark"));

/** The banner that sweeps across the table as each finale stage begins (the
 * Legendary, the Elite Four, the Champion; a crawl's floors and bosses):
 * shown while the stage's first card is dealt face down, once per stage. It never takes a tap; the card
 * underneath stays playable. */
/** The cut-in banner's words for each way the rival turns up (Rivals
 * Phase 2). */
const CUT_INTRO: Record<RivalCut, string> = {
  meddle: "is meddling",
  snipe: "wants what this gives",
  redo: "wants a do-over",
  swipe: "has light fingers",
  handoff: "is giving your things away",
  poach: "is after your ally",
  squat: "is in your bed",
  invoice: "sends an invoice",
  curse: "has a curse for you",
};
export function StageBanner({ session }: { session: SessionState }) {
  const banner = stageBanner(session);
  // A moment (a badge, the spoils) plays first; the sweep follows it.
  const { busy } = useMoments();
  useAnnounce(
    banner
      ? [
          banner.mode,
          banner.intro,
          banner.wanted &&
            (banner.wantedWord
              ? `${banner.wantedWord}: ${banner.wanted}`
              : banner.wanted),
        ]
          .filter(Boolean)
          .join(". ")
      : "",
    banner?.key ?? null,
  );
  if (!banner || busy) return null;
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
        {banner.landmark && (
          <Suspense fallback={null}>
            <LandmarkMark title={banner.landmark} />
          </Suspense>
        )}
        <small>{mode}</small>
        <strong>{intro}</strong>
        {wanted && (
          <span className="banner-wanted">
            {wantedWord ? `${wantedWord}: ` : ""}
            {wanted}
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
  // A landmark (The Quest 2.0 Phase 3, M5): a violet banner names the
  // place as it is dealt, mid-region.
  const insert = quest.stages[stage.stage].inserts?.find(
    (i) => i.at === stage.index,
  );
  const mark = insert?.cards.find((c) => c.id === quest.finale[quest.step]);
  if (mark && !entranceFor(session)) {
    return {
      key: `${stage.stage}:${session.discarded}`,
      stage: stage.stage,
      mode: mark.ribbon?.split(" · ")[1] ?? "Landmark",
      intro: mark.title,
      tone: "violet" as const,
      art: undefined,
      wanted: undefined,
      wantedWord: undefined,
      landmark: mark.title,
    };
  }
  // The rival, uninvited (2026-11-15): cutting in on the card being dealt,
  // or standing in a room's place.
  const cut = rivalCut(quest);
  const dealt = finaleCard(quest, quest.finale[quest.step]);
  const ambush =
    !cut && stage.size > 1 && dealt?.rival
      ? rivalProfile(quest)?.profile
      : undefined;
  if ((cut || ambush) && !entranceFor(session))
    return {
      key: `rival:${session.discarded}`,
      stage: `rival:${session.discarded}`,
      mode: cut?.name ?? ambush!.name,
      intro: cut ? CUT_INTRO[cut.kind] : "is in your way",
      tone: "crimson" as const,
      art: undefined,
      wanted: cut ? cut.line : rivalLine(ambush!, "ambush"),
      wantedWord: undefined,
    };
  if (stage.index !== 0) return null;
  // A Quest region's road-so-far moment (M4, The Quest 2.0 Phase 5)
  // plays instead of its banner.
  if (quest.packId === "dungeon" && stage.size === 8) return null;
  // Once per stage: not again when a boss is dealt for another swing or a
  // lost Champion is replaced.
  const pool = quest.stages[stage.stage].cards;
  if (pool.some((c) => c.id === session.previousId)) return null;
  // A boss's own entrance plays instead (the moments layer, 2026-11-01).
  if (entranceFor(session)) return null;
  // So does a hidden room's bookcase.
  if (hiddenRoomFor(session)) return null;
  // A dragon sign has no banner: its shadow crosses the card (M9).
  if (pool.every((c) => c.ribbon === "Dragon Sign")) return null;
  const rules = packs.find((p) => p.id === quest.packId)?.quest;
  const intro = fillNames(
    quest,
    (rules && questStages(rules).find((s) => s.label === stage.label)?.intro) ??
      stage.label,
  );
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

/** A lost fight's drinks passed on (the round item), swept across the top
 * third. Shown once per change, never on a resumed game. A jinx laid or
 * lifted, a hatch, a Legendary caught and a faint became moments
 * (2026-11-01, `moments/`); a trinket became the loot moment before that. */
export function PartyNewsBanner({ session }: { session: SessionState }) {
  const quest = session.quest;
  const party = quest?.party;
  const passed = party?.passed;
  const seen = useRef(passed);
  // What the rival just took or handed back (2026-11-15), once per card,
  // or how a meeting with them went (Rivals Phase 1): in their own words.
  const rival = party?.rival;
  const news = rival?.news;
  const profile = rivalProfile(quest)?.profile;
  const record = rival ? `${rival.won}:${rival.lost}` : undefined;
  const seenRecord = useRef(record);
  const newsKey = rival ? `rival-${session.discarded}` : null;
  const seenNews = useRef(newsKey);
  const [shown, setShown] = useState<{
    key: string;
    kicker: string;
    title: string;
    line: string;
    tone: string;
  } | null>(null);
  useEffect(() => {
    const before = seen.current;
    seen.current = passed;
    if (!quest || !party) return;
    if (passed !== undefined && passed !== before) {
      const item = crawlTheme(quest.packId).loot.round;
      setShown({
        key: `passed-${passed}`,
        kicker: item.name,
        title: "Point at someone",
        line: "This fight's drinks are theirs.",
        tone: "violet",
      });
    }
  }, [passed, quest, party]);
  useEffect(() => {
    const before = seenNews.current;
    const was = seenRecord.current;
    seenNews.current = newsKey;
    seenRecord.current = record;
    if (!quest || !rival || !profile || !newsKey || newsKey === before) return;
    // A first sight (a resume, or the introduction) is no meeting.
    const [won, lost] = (was ?? "0:0").split(":").map(Number);
    const beat = was !== undefined && rival.won > won;
    const lostTo = was !== undefined && rival.lost > lost;
    const names = (items: string[] = []) =>
      items.map((item) => crawlTheme(quest.packId).loot[item as "die"].name);
    const said = (
      key: "took" | "back" | "lostTo" | "beaten",
      items?: string[],
    ) => rivalLine(profile, key, names(items)) ?? "";
    if (news?.took?.length)
      setShown({
        key: newsKey,
        kicker: profile.name,
        title: `took your ${names(news.took).join(" and ")}`,
        line: lostTo
          ? said("lostTo") || "Beat them to take one back."
          : said("took", news.took) || "Beat them to take one back.",
        tone: "crimson",
      });
    else if (news?.back?.length)
      setShown({
        key: newsKey,
        kicker: profile.name,
        title: `gave back your ${names(news.back).join(" and ")}`,
        line: said("back", news.back),
        tone: "gold",
      });
    else if (news?.gone?.length)
      setShown({
        key: newsKey,
        kicker: profile.name,
        title: `${names(news.gone).join(" and ")}: gone for good`,
        line: rivalLine(profile, "handoff") ?? "Nobody is getting that back.",
        tone: "crimson",
      });
    else if (news?.poached)
      setShown({
        key: newsKey,
        kicker: profile.name,
        title: `took ${finaleCard(quest, news.poached)?.ally?.name ?? "your ally"}`,
        line:
          rivalLine(profile, "poach") ??
          "Beat them in the duel to get them back.",
        tone: "crimson",
      });
    else if (beat || lostTo) {
      const line = said(beat ? "beaten" : "lostTo");
      // A profile from before Phase 1 has nothing to say here.
      if (line)
        setShown({
          key: newsKey,
          kicker: profile.name,
          title: beat ? "is beaten, for now" : "got the better of you",
          line,
          tone: beat ? "gold" : "crimson",
        });
    }
  }, [newsKey, news, record, rival, profile, quest]);
  const clear = useCallback(() => setShown(null), []);
  // Held while a moment plays (a boss's spoils and its jinx lifted land
  // together): the banner sweeps once the moment is done.
  const { busy } = useMoments();
  useBannerTimeout(busy ? null : (shown?.key ?? null), clear);
  useAnnounce(
    shown
      ? [shown.kicker, shown.title, shown.line].filter(Boolean).join(". ")
      : "",
    shown?.key ?? null,
  );
  if (!shown || busy) return null;
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
