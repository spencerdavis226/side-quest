import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
// A new release's worker can take control before the app has mounted (the
// first render is held for its art) or before the update hook is listening.
// Catch that takeover here, at import, so the Update game offer is never
// lost. The first install also fires controllerchange; it replaces nothing,
// so it is ignored.
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
/** The service worker's state: whether the game is cached for offline play,
 * and whether a newer release has taken over and wants a reload. */
export function useAppUpdate() {
  const [cachedReady, setCachedReady] = useState(false),
    [updateReady, setUpdateReady] = useState(false);
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
  return { offlineReady: offlineReady || cachedReady, updateReady };
}
