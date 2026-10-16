import { useEffect, useState } from "react";
function isStandaloneApp() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && navigator.standalone === true)
  );
}
/** Whether the game runs as the installed Home Screen app. While it does,
 * the root carries the `standalone` class and the page is pinned to the top. */
export function useStandalone() {
  const [standalone, setStandalone] = useState(isStandaloneApp);
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
  return standalone;
}
