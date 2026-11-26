// Haptics (experiment, 2026-11-16). iOS Safari has no `navigator.vibrate`,
// but since Safari 18 a switch control (`<input type="checkbox" switch>`)
// plays the system's light tick when it toggles, and toggling one through
// its label from inside a tap's handler counts. So `haptic()` keeps one
// hidden switch and clicks its label. It is not an API: Apple may stop it,
// and it does nothing outside a user gesture (a timer, an animation's end).
// Emulation proves only that it is harmless.

/** Safari 18+ exposes the switch attribute; elsewhere this is a no-op. */
const supported =
  typeof HTMLInputElement !== "undefined" &&
  "switch" in HTMLInputElement.prototype;

let label: HTMLLabelElement | null = null;

function host(): HTMLLabelElement {
  if (label) return label;
  label = document.createElement("label");
  label.className = "haptic";
  label.setAttribute("aria-hidden", "true");
  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  input.tabIndex = -1;
  label.append(input);
  document.body.append(label);
  return label;
}

if (supported) {
  // The label's click, and the click it forwards to the switch, must reach
  // nothing else: moments swallow "the next click" and the dice overlay
  // finishes a roll on any click. This capture listener is added at start
  // up, before any of theirs, so it runs first; stopping the event leaves
  // the switch's own toggle (its default action) alone.
  window.addEventListener(
    "click",
    (event) => {
      if (label && event.target instanceof Node && label.contains(event.target))
        event.stopImmediatePropagation();
    },
    true,
  );
}

/** A light system tick, on iOS 18+ only. Call it synchronously from a tap's
 * handler; later calls are silently ignored by the system. */
export function haptic() {
  if (supported) host().click();
}
