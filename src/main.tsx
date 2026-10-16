import React, { useEffect, useState, type CSSProperties } from "react";
import { createRoot } from "react-dom/client";
import { useRegisterSW } from "virtual:pwa-register/react";
import { packs } from "./content/manifest.generated";
import { loadedPackCards, loadPackCards } from "./content/loaders";
import { createSession, questRecord, replaySession } from "./game/engine";
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
import { QuestMeter } from "./components/QuestMeter";
import { StageBanner } from "./components/StageBanner";
import "./style.css";
import "./presentation/theme.css";
import "./presentation/card-front.css";
migrateStorageKeys();
function isStandaloneApp() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && navigator.standalone === true)
  );
}
// A new release's worker can take control before the app has mounted (the
// first render is held for its art) or before the update hook is listening.
// Catch that takeover here so the Update game offer is never lost. The first
// install also fires controllerchange; it replaces nothing, so it is ignored.
const takeover: { seen: boolean; notify: (() => void) | null } = {
  seen: false,
  notify: null,
};
if ("serviceWorker" in navigator) {
  let controlled = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (controlled) {
      takeover.seen = true;
      takeover.notify?.();
    }
    controlled = true;
  });
}
function App() {
  const [loaded] = useState(loadSession),
    [corrupt, setCorrupt] = useState(loaded.corrupt),
    [notice, setNotice] = useState(loaded.unavailable),
    [prefs, setPrefs] = useState(loadPreferences),
    [cachedReady, setCachedReady] = useState(false),
    [updateReady, setUpdateReady] = useState(false),
    [modal, setModal] = useState<DialogName>(null),
    [standalone, setStandalone] = useState(isStandaloneApp),
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
  const {
    offlineReady: [offlineReady],
  } = useRegisterSW({
    // A newer worker already controls the page; keep playing on this build and
    // offer the reload between games. Every navigation from now on is served
    // by the new release, so closing or refreshing the app also updates it.
    onNeedReload: () => setUpdateReady(true),
    onRegisteredSW(_url, registration) {
      if (registration?.active) setCachedReady(true);
    },
  });
  useEffect(() => {
    takeover.notify = () => setUpdateReady(true);
    if (takeover.seen) setUpdateReady(true);
    return () => {
      takeover.notify = null;
    };
  }, []);
  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const update = () => setStandalone(isStandaloneApp());
    media.addEventListener("change", update);
    window.addEventListener("pageshow", update);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("pageshow", update);
    };
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("standalone", standalone);
    if (!standalone) return;
    // iOS can launch or resume the installed app with the page resting one
    // status-bar inset down. The root never scrolls there (style.css), so hold
    // it at the top, where the page covers the whole screen.
    const pin = () => {
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };
    const events = ["scroll", "resize", "pageshow", "orientationchange"];
    pin();
    for (const name of events) window.addEventListener(name, pin);
    document.addEventListener("visibilitychange", pin);
    return () => {
      for (const name of events) window.removeEventListener(name, pin);
      document.removeEventListener("visibilitychange", pin);
    };
  }, [standalone]);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const check = () => {
      navigator.serviceWorker
        .getRegistration()
        .then((registration) => registration?.update())
        .catch(() => {});
    };
    const onResume = () => {
      if (!document.hidden) check();
    };
    // Installed apps are rarely navigated, so look for a new release when the
    // app starts, comes back to the foreground, and periodically while open.
    const timer = window.setInterval(check, 15 * 60 * 1000);
    check();
    window.addEventListener("pageshow", onResume);
    document.addEventListener("visibilitychange", onResume);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pageshow", onResume);
      document.removeEventListener("visibilitychange", onResume);
    };
  }, []);
  useEffect(() => {
    // An update can replace this page's hashed chunks while it is still open.
    // The active worker already serves the new release, so a single reload
    // repairs the mismatch instead of stranding a dead lazy import.
    const onPreloadError = (event: Event) => {
      event.preventDefault();
      location.reload();
    };
    window.addEventListener("vite:preloadError", onPreloadError);
    return () =>
      window.removeEventListener("vite:preloadError", onPreloadError);
  }, []);
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
    const ready = loadedPackCards(packIds);
    if (ready) return controller.start(createSession(config, ready, packs));
    setStarting(true);
    setLoadFailed(false);
    loadPackCards(packIds)
      .then((cards) => controller.start(createSession(config, cards, packs)))
      .catch(() => setLoadFailed(true))
      .finally(() => setStarting(false));
  };
  const finish = (id: number) => controller.finish(id);
  const styles = Object.fromEntries(
    Object.entries(theme.motion).map(([key, value]) => [
      // camelCase keys become kebab-case CSS variables (dialogExit -> --motion-dialog-exit).
      `--motion-${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`,
      `${value}ms`,
    ]),
  ) as CSSProperties;
  return (
    <>
      <Atmosphere hidden={hidden} />
      <PortraitGate />
      <main
        className={`${active ? "app playing" : "app"} ${hidden ? "suspended" : ""} ${
          // A Pokémon League game deals every card in the Ancient Mew pair.
          display?.config.quest === LEAGUE_QUEST ? "league-deck" : ""
        }`}
        style={styles}
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
          <header className="topbar">
            {/* One row of table furniture: a pack quest's meter, the
                    count on a brass medallion, the menu on a matching stud. */}
            <QuestMeter
              session={display}
              disabled={!!motion}
              onOpen={() => setModal("badges")}
            />
            <div
              className="progress"
              role="img"
              aria-label={`Card ${display.discarded + 1} of ${display.config.limit ?? "endless"}`}
            >
              <strong>{display.discarded + 1}</strong>
              <span className="muted"> / {display.config.limit ?? "∞"}</span>
            </div>
            <IconButton
              className="menu-button"
              label="Open game menu"
              disabled={!!motion}
              onClick={() => setModal("menu")}
            >
              <span className="menu-icon" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </IconButton>
          </header>
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
            onChange={setPrefs}
            onStart={start}
          />
        ) : display.phase === "complete" ? (
          <Completion
            count={display.discarded}
            record={questRecord(display)}
            league={display.quest?.packId === "pokemon"}
            mode={
              packs.find((p) => p.id === display.quest?.packId)?.quest?.mode
            }
            celebrate={motion === "complete"}
            onReplay={() => controller.start(replaySession(display))}
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
              onRevealRoll={() => controller.revealRoll()}
              onFinish={finish}
            />
            <StageBanner session={display} />
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
        <GameDialogs
          modal={modal}
          setModal={setModal}
          session={session}
          offlineReady={offlineReady || cachedReady}
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
