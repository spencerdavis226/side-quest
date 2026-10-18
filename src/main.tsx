import React, { useEffect, useState, type CSSProperties } from "react";
import { createRoot } from "react-dom/client";
import { packs } from "./content/manifest.generated";
import { loadedPackCards, loadPackCards } from "./content/loaders";
import { createSession, questRecord, replaySession } from "./game/engine";
import type { SessionState } from "./game/types";
import {
  loadPreferences,
  loadSession,
  migrateStorageKeys,
  MODE_LIMITS,
  requestPersistence,
  save,
  SAVE_KEY,
  SETTINGS_KEY,
} from "./app/persistence";
import { PresentationController } from "./presentation/controller";
import { usePresentation } from "./presentation/usePresentation";
import { theme } from "./presentation/theme";
import { preloadUrl } from "./presentation/artwork";
import {
  coreFrameSurfaces,
  LEAGUE_QUEST,
  leagueSurfaces,
} from "./presentation/frame-surfaces";
import { Button, IconButton, Notice } from "./components/UI";
import { TopBar } from "./components/TopBar";
import { useAppUpdate } from "./app/useAppUpdate";
import { useStandalone } from "./app/useStandalone";
import {
  INSTALL_HELP_KEY,
  isIOSSafari,
  loadInstallHelpDismissed,
} from "./app/install-help";
import { Atmosphere } from "./components/Atmosphere";
import { Setup } from "./screens/Setup";
import { Play } from "./screens/Play";
import { Completion } from "./screens/Completion";
import { GameDialogs, type DialogName } from "./screens/GameDialogs";
import { useWakeLock } from "./app/wakeLock";
import { PortraitGate } from "./components/PortraitGate";
import {
  EvolutionBanner,
  PartyNewsBanner,
  StageBanner,
} from "./components/StageBanner";
import { PartyPulse } from "./components/Crawl";
import "./style.css";
import "./presentation/theme.css";
import "./presentation/card-front.css";
import "./presentation/crawl.css";
migrateStorageKeys();
// theme.motion's camelCase keys become kebab-case CSS variables
// (dialogExit -> --motion-dialog-exit), set once on the app root.
const motionStyles = Object.fromEntries(
  Object.entries(theme.motion).map(([key, value]) => [
    `--motion-${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`,
    `${value}ms`,
  ]),
) as CSSProperties;
function App() {
  const [loaded] = useState(loadSession),
    [corrupt, setCorrupt] = useState(loaded.corrupt),
    [notice, setNotice] = useState(loaded.unavailable),
    [prefs, setPrefs] = useState(loadPreferences),
    [modal, setModal] = useState<DialogName>(null),
    [installHelpDismissed, setInstallHelpDismissed] = useState(
      loadInstallHelpDismissed,
    ),
    [hidden, setHidden] = useState(document.hidden),
    [starting, setStarting] = useState(false),
    [loadFailed, setLoadFailed] = useState(false);
  const { controller, session, outgoing, motion, transition, finishingRoll } =
    usePresentation(
      () =>
        new PresentationController(loaded.session, (next) => {
          if (!save(SAVE_KEY, next)) setNotice(true);
        }),
    );
  const display = outgoing ?? session;
  const active = !!display && display.phase !== "complete";
  useWakeLock(active);
  useEffect(requestPersistence, []);
  const { offlineReady, updateReady } = useAppUpdate();
  const standalone = useStandalone();
  useEffect(() => {
    if (!save(SETTINGS_KEY, prefs)) setNotice(true);
  }, [prefs]);
  useEffect(() => {
    // Shared surfaces only: hero illustrations are retired from card fronts.
    for (const src of [...coreFrameSurfaces, ...leagueSurfaces])
      void preloadUrl(src);
    for (const path of Object.values(theme.assets)) void preloadUrl(path);
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  // Warm the selected packs' card chunks while setup is open, so Play starts
  // from memory. Card text never blocks the first screen.
  useEffect(() => {
    if (!display) void loadPackCards(prefs.config.packIds).catch(() => {});
  }, [display, prefs.config.packIds]);
  const start = () => {
    const packIds = prefs.config.packIds.filter((id) =>
      packs.some((pack) => pack.id === id),
    );
    if (!packIds.length || starting) return;
    const { quest, ...rest } = prefs.config;
    const config = {
      ...rest,
      packIds,
      limit: MODE_LIMITS[prefs.choice],
      ...(prefs.choice === "quest" && quest ? { quest } : {}),
    };
    setPrefs({ ...prefs, config });
    // A crawl is its own deck: the other selected packs sit it out, and stay
    // selected for the next game.
    const crawl =
      config.quest &&
      packs.find((p) => p.id === config.quest)?.quest?.party &&
      config.quest;
    const game = crawl ? { ...config, packIds: [crawl] } : config;
    const ready = loadedPackCards(game.packIds);
    if (ready) return controller.start(createSession(game, ready, packs));
    setStarting(true);
    setLoadFailed(false);
    loadPackCards(game.packIds)
      .then((cards) => controller.start(createSession(game, cards, packs)))
      .catch(() => setLoadFailed(true))
      .finally(() => setStarting(false));
  };
  // Play again. A crawl draws a fresh omen and fresh floors from its pack,
  // so the next run is a different dungeon; anything else replays its own
  // snapshot (and so does a crawl whose cards can't load).
  const replay = (s: SessionState) => {
    if (starting) return;
    if (!s.quest?.party) return controller.start(replaySession(s));
    const ready = loadedPackCards(s.config.packIds);
    if (ready) return controller.start(createSession(s.config, ready, packs));
    setStarting(true);
    loadPackCards(s.config.packIds)
      .then((cards) => controller.start(createSession(s.config, cards, packs)))
      .catch(() => controller.start(replaySession(s)))
      .finally(() => setStarting(false));
  };
  const finish = (id: number) => controller.finish(id);
  return (
    <>
      <Atmosphere hidden={hidden} />
      <PortraitGate />
      <main
        className={`${active ? "app playing" : "app"} ${hidden ? "suspended" : ""} ${
          // A Pokémon League game deals every card in the Ancient Mew pair.
          display?.config.quest === LEAGUE_QUEST ? "league-deck" : ""
        } ${display?.quest?.party ? "crawl-deck" : ""}`}
        style={motionStyles}
      >
        {!display &&
          !corrupt &&
          !standalone &&
          !installHelpDismissed &&
          isIOSSafari(navigator) && (
            <IconButton
              className="install-info"
              label="Add to Home Screen help"
              onClick={() => setModal("install")}
            >
              <svg
                className="ui-icon"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 10.5v6M12 7.5h.01" />
              </svg>
            </IconButton>
          )}
        {active && (
          <TopBar
            session={display}
            disabled={!!motion}
            onOpenMeter={() => setModal("badges")}
            onOpenMenu={() => setModal("menu")}
            onOpenPrevious={() => setModal("recap")}
            onOpenStrip={setModal}
          />
        )}
        {notice && (
          <Notice>
            Saving is unavailable. This game may not survive closing the app.
          </Notice>
        )}
        {loadFailed && !display && (
          <Notice>
            Couldn’t load the cards. Check the connection and try again.
          </Notice>
        )}
        {corrupt ? (
          <section className="recovery">
            <h1>
              This save lost
              <br />
              its place.
            </h1>
            <p>We couldn’t restore the previous game.</p>
            <Button
              onClick={() => {
                controller.clear();
                setCorrupt(false);
              }}
            >
              Return to setup
            </Button>
          </section>
        ) : !display ? (
          <Setup
            prefs={prefs}
            packs={packs}
            starting={starting}
            onChange={setPrefs}
            onStart={start}
          />
        ) : display.phase === "complete" ? (
          <Completion
            count={display.discarded}
            record={questRecord(display)}
            league={display.quest?.packId === "pokemon"}
            packId={display.quest?.packId}
            mode={
              packs.find((p) => p.id === display.quest?.packId)?.quest?.mode
            }
            celebrate={motion === "complete"}
            starting={starting}
            onReplay={() => replay(display)}
            onSetup={() => controller.clear()}
            onFinish={() => finish(transition)}
          />
        ) : (
          <>
            <Play
              session={display}
              motion={motion}
              transition={transition}
              finishingRoll={finishingRoll}
              onTap={() => controller.tap()}
              onChoose={(option) => controller.choose(option)}
              onSettle={(won) => controller.settle(won)}
              onSpend={(item) => controller.spend(item)}
              onOffer={(index, branch) => controller.offer(index, branch)}
              onQuaff={() => controller.quaff()}
              onSpoils={(index) => controller.spoils(index)}
              onCashOut={() => controller.cashOut()}
              onPress={() => controller.press()}
              onRevealRoll={() => controller.revealRoll()}
              onFinish={finish}
            />
            <StageBanner session={display} />
            <EvolutionBanner session={display} />
            <PartyNewsBanner session={display} />
          </>
        )}
        {!active && !motion && updateReady && (
          <Button
            variant="text-button"
            className="update"
            onClick={() => location.reload()}
          >
            Update game
          </Button>
        )}
        {display?.quest?.party && (
          <PartyPulse party={display.quest.party} hidden={hidden} />
        )}
        <GameDialogs
          onSpend={(item) => controller.spend(item)}
          modal={modal}
          setModal={setModal}
          session={session}
          offlineReady={offlineReady}
          onHideInstallHelp={() => {
            setInstallHelpDismissed(true);
            save(INSTALL_HELP_KEY, true);
            setModal(null);
          }}
          onEnd={() => {
            // The brief dice-result reveal can start under the open menu;
            // settle it so a confirmed End game is never ignored.
            controller.settleAll();
            controller.clear();
            setModal(null);
          }}
        />
      </main>
    </>
  );
}
document.documentElement.dataset.release =
  import.meta.env.VITE_RELEASE_ID || "development";
const root = createRoot(document.getElementById("root")!);
const params = new URLSearchParams(location.search);
const renderApp = () =>
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
if (import.meta.env.DEV && params.get("preview") === "1") {
  void import("./workshop/Preview").then(({ default: Preview }) =>
    root.render(
      <React.StrictMode>
        <Preview />
      </React.StrictMode>,
    ),
  );
} else if (import.meta.env.DEV && params.get("review") === "1") {
  void import("./workshop/CardReview").then(({ default: CardReview }) =>
    root.render(
      <React.StrictMode>
        <CardReview />
      </React.StrictMode>,
    ),
  );
} else if (import.meta.env.DEV && params.get("workshop") === "1") {
  void import("./workshop/Workshop").then(({ default: Workshop }) =>
    root.render(
      <React.StrictMode>
        <Workshop />
      </React.StrictMode>,
    ),
  );
} else {
  // The painted surfaces are CSS images, which WebKit only discovers once the
  // element exists and never paints partially: a first launch would show the
  // flat fallback Play bar and system serif until they arrive. Hold the first
  // render until what that screen needs is decoded; a resumed game opens on
  // the table, so it waits for the card surfaces as well.
  let resuming = false,
    league = false;
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    resuming = saved !== null;
    league = !!saved && JSON.parse(saved)?.config?.quest === LEAGUE_QUEST;
  } catch {
    // Storage unavailable or unreadable: the app opens on setup.
  }
  const firstScreen: string[] = resuming
    ? [
        ...Object.values(theme.assets),
        ...coreFrameSurfaces,
        ...(league ? leagueSurfaces : []),
      ]
    : [theme.assets.table, theme.assets.button, theme.assets.titleCrest];
  const fonts = ["700 1em Grenze", "italic 600 1em Grenze"].map((font) =>
    document.fonts.load(font).catch(() => undefined),
  );
  // A dead connection must not strand the app on bare wood; the themed
  // fallbacks take over after the cap.
  const cap = new Promise((resolve) => window.setTimeout(resolve, 4000));
  void Promise.race([
    Promise.all([...firstScreen.map(preloadUrl), ...fonts]),
    cap,
  ]).then(renderApp);
}
