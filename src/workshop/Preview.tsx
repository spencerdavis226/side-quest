import { useRef, useState, type CSSProperties } from "react";
import { PresentationController } from "../presentation/controller";
import { usePresentation } from "../presentation/usePresentation";
import { theme } from "../presentation/theme";
import { Play } from "../screens/Play";
import { Atmosphere } from "../components/Atmosphere";
import { seededRandom, workshopCards, workshopSession } from "./session";

/**
 * Dev-only production preview. Loaded inside the workshop's iframe so real
 * viewport/media conditions, the body-portalled dice overlay, and the WebGL
 * renderer all run in a real document that is not the saved-game app.
 */
const params = new URLSearchParams(location.search);
const flag = (name: string) => params.get(name) === "1";
const motionStyles = Object.fromEntries(
  Object.entries(theme.motion).map(([key, value]) => [
    `--motion-${key}`,
    `${value}ms`,
  ]),
) as CSSProperties;

export default function Preview() {
  const requested = params.get("card") ?? "core.house-special";
  const id = workshopCards.some((c) => c.id === requested)
    ? requested
    : "core.house-special";
  const seed = params.get("seed") ?? "tavern-1";
  const outcome = params.get("outcome") ?? "Seeded";
  const revealed = flag("revealed");
  const enlarged = flag("enlarged");
  const [initial] = useState(() => workshopSession(seed, id, revealed));
  const random = useRef(initial.random);
  const diceRandom = useRef(seededRandom(`${seed}:dice`));
  const { controller, session, outgoing, motion, transition, finishingRoll } =
    usePresentation(
      () =>
        new PresentationController(
          initial.session,
          () => {},
          () => {},
          () => random.current(),
          () =>
            outcome === "Minimum"
              ? 0
              : outcome === "Maximum"
                ? 0.999999
                : diceRandom.current(),
        ),
    );
  return (
    <>
      <Atmosphere hidden={false} />
      <main
        className={`app playing ${enlarged ? "enlarged" : ""}`}
        style={motionStyles}
      >
        <Play
          session={(outgoing ?? session)!}
          motion={motion}
          transition={transition}
          finishingRoll={finishingRoll}
          onTap={() => controller.tap()}
          onChoose={(option) => controller.choose(option)}
          onSettle={(won) => controller.settle(won)}
          onRevealRoll={() => controller.revealRoll()}
          onFinish={controller.finish.bind(controller)}
        />
      </main>
    </>
  );
}
