// A prize flown into its place on the table (2026-11-01): a badge into the
// badges chip, an item into the bag, a medallion into the edge chip. The
// element is cloned and flown along a curve, then the chip it lands in
// pulses. Targets carry `data-fly` (`Crawl.tsx`, `QuestMeter.tsx`); a target
// that isn't on screen just lets the prize fade where it is.

/** Fly a copy of `source` into the element marked `data-fly="<target>"`.
 * Resolves when it lands. */
export function flyTo(
  source: Element | null,
  target: string,
  { duration = 620, lift = 0.22 }: { duration?: number; lift?: number } = {},
): Promise<void> {
  const into = document.querySelector<HTMLElement>(`[data-fly="${target}"]`);
  if (!source || document.hidden) return Promise.resolve();
  const from = source.getBoundingClientRect();
  const clone = source.cloneNode(true) as HTMLElement;
  // The clone leaves the stage whose variables coloured it: pin its look.
  freeze(source, clone);
  clone.classList.add("moment-flier");
  Object.assign(clone.style, {
    position: "fixed",
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    margin: "0",
    pointerEvents: "none",
    zIndex: "var(--z-flier)",
    animation: "none",
    transformOrigin: "50% 50%",
  });
  document.body.append(clone);
  const to = into?.getBoundingClientRect();
  const visible = !!to && to.width > 0 && to.bottom > 0;
  const dx = visible
    ? to.left + to.width / 2 - (from.left + from.width / 2)
    : 0;
  const dy = visible
    ? to.top + to.height / 2 - (from.top + from.height / 2)
    : -40;
  const end = visible
    ? Math.min(1, (to.height * 0.9) / Math.max(1, from.height))
    : 0.6;
  const arc = Math.min(window.innerHeight, window.innerWidth) * lift;
  // A quadratic curve sampled into keyframes: up and over, then down into
  // the chip, shrinking as it goes.
  const frames: Keyframe[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const x = dx * e;
    const y = dy * e - arc * 4 * t * (1 - t);
    const s = 1 + (end - 1) * e;
    frames.push({
      transform: `translate(${x}px, ${y}px) scale(${s})`,
      opacity: visible ? (t > 0.92 ? (1 - t) / 0.08 : 1) : 1 - t,
    });
  }
  return new Promise((resolve) => {
    const done = () => {
      clone.remove();
      if (visible && into)
        into.animate?.(
          [
            { transform: "scale(1)", filter: "brightness(1)" },
            { transform: "scale(1.28)", filter: "brightness(1.8)" },
            { transform: "scale(1)", filter: "brightness(1)" },
          ],
          { duration: 420, easing: "cubic-bezier(.2,.9,.3,1.2)" },
        );
      resolve();
    };
    const anim = clone.animate?.(frames, {
      duration,
      easing: "linear",
      fill: "forwards",
    });
    if (!anim) return done();
    anim.onfinish = done;
    anim.oncancel = done;
  });
}

/** The centre of the element marked `data-fly="<target>"`, if on screen. */
export function flyTarget(target: string) {
  const r = document
    .querySelector(`[data-fly="${target}"]`)
    ?.getBoundingClientRect();
  return r && r.width
    ? { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    : null;
}

// Longhands only: WebKit's computed style can serialise a shorthand
// (`background`, `mask`) as an empty string, which dropped the clone's
// colours. Sizes too: a medallion sized by `.moment .type-mark` keeps its
// size once the clone leaves the stage.
const FROZEN = [
  "background-color",
  "background-image",
  "background-size",
  "background-position",
  "background-repeat",
  "box-shadow",
  "color",
  "filter",
  "border-radius",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "width",
  "height",
  "mask-image",
  "-webkit-mask-image",
  "mask-size",
  "-webkit-mask-size",
  "mask-position",
  "-webkit-mask-position",
  "mask-repeat",
  "-webkit-mask-repeat",
  "opacity",
] as const;
/** Copy each element's painted look onto its clone, pair by pair. */
function freeze(source: Element, clone: Element) {
  const from = [source, ...source.querySelectorAll("*")];
  const to = [clone, ...clone.querySelectorAll("*")];
  from.forEach((el, i) => {
    const copy = to[i] as HTMLElement | undefined;
    if (!copy?.style) return;
    const cs = getComputedStyle(el);
    for (const prop of FROZEN)
      copy.style.setProperty(prop, cs.getPropertyValue(prop));
    copy.style.animation = "none";
    copy.style.visibility = "visible";
  });
  (clone as HTMLElement).style.opacity = "1";
}
