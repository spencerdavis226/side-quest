import { useEffect } from "react";

// Banners sweep in with their words already inside them, and a live region
// inserted together with its text is often never read out (VoiceOver among
// them). So one polite region stays on the page from the start, and each
// banner adds its own line to it while it is up; the banner itself is hidden
// from assistive technology so nothing is read twice. A line added is read
// on its own, so banners that arrive together (a level-up and the next
// room) are both read.
const ID = "banner-announcer";

export function Announcer() {
  return <div id={ID} className="sr-only" role="status" aria-live="polite" />;
}

/** Read `text` out once for each new `key` (nothing while `key` is null). */
export function useAnnounce(text: string, key: string | null) {
  useEffect(() => {
    const region = document.getElementById(ID);
    if (!region || key === null || !text) return;
    const line = document.createElement("p");
    line.textContent = text;
    region.append(line);
    return () => line.remove();
    // The key alone decides when to speak; text follows it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/** Read `text` out once, now (the moments layer, whose moments may be
 * skipped or never play under Reduced Motion). */
export function announce(text: string) {
  const region = document.getElementById(ID);
  if (!region || !text) return;
  const line = document.createElement("p");
  line.textContent = text;
  region.append(line);
  setTimeout(() => line.remove(), 12000);
}
