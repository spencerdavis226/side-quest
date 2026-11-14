import { useEffect, useRef } from "react";
import type { SceneName } from "../presentation/stage/shader";
import { reducedMotion } from "../presentation/motion";

// The dragon's lair behind the card (The Quest 2.1): a living shader in the
// dragon's colours for its lair, fire, frost or tide, hotter once it is
// enraged. Lazy, inside the atmosphere layer; it pauses with the table
// (hidden tab or idle) and is one still frame under Reduced Motion. Without
// WebGL2 the atmosphere's own glow shows instead. Display only.
export default function LairBackdrop({
  scene,
  bright,
  deep,
  enraged,
  paused,
}: {
  scene: SceneName;
  bright: string;
  deep: string;
  enraged: boolean;
  paused: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const stage = useRef<ReturnType<
    typeof import("../presentation/stage/shader").runShader
  > | null>(null);
  useEffect(() => {
    let gone = false;
    void import("../presentation/stage/shader").then(({ runShader }) => {
      if (gone || !ref.current) return;
      try {
        stage.current = runShader(
          ref.current,
          scene,
          { bright, deep },
          { still: reducedMotion() },
        );
      } catch {
        stage.current = null;
      }
    });
    return () => {
      gone = true;
      stage.current?.dispose();
      stage.current = null;
    };
  }, [scene, bright, deep]);
  useEffect(() => {
    stage.current?.setRage(enraged);
  }, [enraged]);
  useEffect(() => {
    const s = stage.current;
    if (!s) return;
    if (paused) s.pause();
    else s.play();
  }, [paused]);
  return <canvas ref={ref} className="lair-backdrop" aria-hidden="true" />;
}
