import { useEffect, useState, useSyncExternalStore } from "react";
import { PresentationController } from "./controller";
import { theme } from "./theme";
import { REDUCED_MOTION, reducedMotion } from "./motion";
export function usePresentation(create: () => PresentationController) {
  const [controller] = useState(create);
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
  );
  useEffect(() => {
    if (!state.motion) return;
    const reduced = matchMedia(REDUCED_MOTION);
    // Reduced Motion is always honored in production; the dev override settles
    // through the normal token so the animation still plays for review.
    const settleNow = reducedMotion();
    if (document.hidden) {
      controller.settleAll();
      return;
    }
    const timeout = setTimeout(
      () => controller.finish(state.transition),
      settleNow
        ? 0
        : (state.motion === "roll" ? 12000 : theme.motion[state.motion]) + 80,
    );
    const skip = () => {
      if (document.hidden || reducedMotion()) controller.settleAll();
    };
    document.addEventListener("visibilitychange", skip);
    reduced.addEventListener("change", skip);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener("visibilitychange", skip);
      reduced.removeEventListener("change", skip);
    };
  }, [controller, state.motion, state.transition]);
  return { controller, ...state };
}
