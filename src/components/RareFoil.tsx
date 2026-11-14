import { useEffect, useRef } from "react";
import { reducedMotion } from "../presentation/motion";

// A rare card's foil (The Quest 2.1): a living thin-film shader over the
// card in play, in place of the CSS sheen: colour bands that drift, a sheen
// that sweeps across, glints that twinkle. Lazy; paused when the tab is
// hidden; a still frame under Reduced Motion; without WebGL2 the CSS foil
// underneath shows alone. Display only.
export default function RareFoil() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let gone = false;
    let stage: ReturnType<
      typeof import("../presentation/stage/shader").runShader
    > = null;
    const hide = () => {
      if (document.hidden) stage?.pause();
      else stage?.play();
    };
    void import("../presentation/stage/shader").then(({ runShader }) => {
      if (gone || !ref.current) return;
      try {
        stage = runShader(
          ref.current,
          "foil",
          { bright: "#ffffff", deep: "#000000" },
          { still: reducedMotion(), alpha: true },
        );
      } catch {
        stage = null;
      }
    });
    document.addEventListener("visibilitychange", hide);
    return () => {
      gone = true;
      document.removeEventListener("visibilitychange", hide);
      stage?.dispose();
    };
  }, []);
  return <canvas ref={ref} className="rare-foil" aria-hidden="true" />;
}
