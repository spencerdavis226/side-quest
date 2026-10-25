import DiceBox from "@3d-dice/dice-box-threejs";
import { installTrajectoryPlayback } from "./trajectory";
import { installDiceSkin } from "./skin";
import { diceColors } from "./palette";
import type { DicePalette } from "../../game/types";

/** Single upstream renderer, with a recorded physical throw and local
 * materials, painted in the run's colours when it has a starter or omen. */
export async function createDiceStage(selector: string, palette?: DicePalette) {
  const colors = diceColors(palette);
  const container = document.querySelector<HTMLElement>(selector)!;
  const shortSide = Math.min(container.clientWidth, container.clientHeight);
  const scale = Math.min(150, Math.max(90, shortSide * 0.34));
  const box = new DiceBox(selector, {
    sounds: false,
    shadows: false,
    baseScale: scale,
    strength: 1,
    gravity_multiplier: 360,
    light_intensity: 0.7,
    color_spotlight: 0xffedce,
    theme_customColorset: {
      // One colorset per palette, so the library's cache never mixes them.
      name: `Side Quest ${colors.body[1]} ${colors.metal[1]}`,
      foreground: colors.ink,
      background: colors.body[1],
      outline: "none",
      edge: colors.trim,
      texture: "none",
      material: "none",
    },
  });
  // Own resize/lifecycle here instead of upstream's unremovable listener.
  box.resizeWorld = () => {};
  let disposed = false;
  let shadowCanvas: HTMLCanvasElement | null = null;
  let repaintShadows = () => {};
  let release: () => void = () => {};
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  const playback = installTrajectoryPlayback(box, () => repaintShadows());

  // Apply body parameters at creation on BOTH sides of upstream's pre-sim/replay.
  const spawn = box.spawnDice.bind(box);
  box.spawnDice = (...args: unknown[]) => {
    spawn(...args);
    const die = args[1] || box.diceList.at(-1);
    const body = (die as any)?.body;
    if (!body) return;
    body.linearDamping = 0.18;
    body.angularDamping = 0.18;
    body.sleepSpeedLimit = 12;
    body.sleepTimeLimit = 0.22;
  };
  const throwDice = box.startClickThrow.bind(box);
  box.startClickThrow = (notation: string) => {
    const result = throwDice(notation);
    // Throw from one screen edge toward the opposite half, with a little
    // separation and spin. All randomness here is trajectory only.
    const side = Math.random() < 0.5 ? -1 : 1;
    for (const [index, vector] of (result?.vectors ?? []).entries()) {
      vector.pos.x = side * container.clientWidth * (0.57 - index * 0.11);
      vector.pos.y = -container.clientHeight * 0.45 + index * scale * 1.85;
      vector.pos.z = scale * (2.2 + Math.random() * 0.7);
      vector.velocity.x = -side * shortSide * (1.7 + Math.random() * 0.7);
      vector.velocity.y = container.clientHeight * (1.25 + Math.random() * 0.4);
      vector.velocity.z = -80;
      vector.angle.x = 9 + Math.random() * 7;
      vector.angle.y = side * (10 + Math.random() * 8);
      vector.angle.z = Math.random() * 8 - 4;
    }
    return result;
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    playback.dispose();
    release();
    shadowCanvas?.remove();
    box.running = box.rolling = false;
    // Factory caches include the source geometry as well as face-swapped clones.
    const resources = new Set<any>();
    const collect = (object: any) => {
      if (object.geometry) resources.add(object.geometry);
      for (const material of [object.material].flat()) {
        if (!material) continue;
        resources.add(material);
        for (const value of Object.values(material))
          if (value && typeof value === "object" && "isTexture" in value)
            resources.add(value);
      }
    };
    box.scene.traverse(collect);
    for (const geometry of Object.values(box.DiceFactory.geometries))
      resources.add(geometry);
    for (const textures of Object.values(box.DiceFactory.materials_cache))
      for (const texture of Object.values(textures as object))
        if (texture?.dispose) resources.add(texture);
    for (const resource of resources) resource.dispose();
    if (box.renderer) {
      // Upstream's delayed clearDice paint must be harmless after dismissal.
      box.renderer.render = () => {};
      box.renderer.dispose();
      box.renderer.forceContextLoss();
      box.renderer.domElement.remove();
    }
  };
  try {
    await document.fonts.load('700 32px "Source Serif 4 Title"');
    await box.initialize();
    box.camera.position.set(
      box.cameraHeight.far * 0.1,
      -box.cameraHeight.far * 0.12,
      box.cameraHeight.far,
    );
    box.camera.lookAt(0, 0, 0);
    box.camera.updateMatrixWorld();
    installDiceSkin(box.DiceFactory, colors);
    const materials = box.DiceFactory.createMaterials.bind(box.DiceFactory);
    box.DiceFactory.createMaterials = (...args: unknown[]) => {
      const result = materials(...args);
      for (const [index, material] of result.entries()) {
        material.color.set("#ffffff");
        material.specular?.set(colors.specular[index === 0 ? 0 : 1]);
        material.shininess = index === 0 ? 70 : 100;
        // Readable painted inlays; no mismatched numeral bump beneath d6 pips.
        material.bumpScale = 0;
        material.transparent = false;
        material.depthTest = material.depthWrite = true;
      }
      return result;
    };
    box.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    box.renderer.setSize(container.clientWidth, container.clientHeight);
    // Slightly inset boundaries leave room for the perspective and die radius.
    for (const name of ["leftWall", "rightWall"])
      box.box_body[name].position.x *= 0.89;
    for (const name of ["topWall", "bottomWall"])
      box.box_body[name].position.y *= 0.91;
    for (const contact of box.world.contactmaterials) {
      const wall = contact.restitution > 0.8;
      contact.restitution = wall ? 0.55 : 0.32;
      contact.friction = wall ? 0.35 : 0.68;
    }
    box.desk.visible = false;
    const context = (shadowCanvas =
      document.createElement("canvas")).getContext("2d");
    shadowCanvas.className = "dice-shadow-layer";
    const ratio = Math.min(devicePixelRatio, 2);
    shadowCanvas.width = Math.round(container.clientWidth * ratio);
    shadowCanvas.height = Math.round(container.clientHeight * ratio);
    container.insertBefore(shadowCanvas, container.firstChild);
    repaintShadows = () => {
      if (disposed || !context || !shadowCanvas) return;
      const { width, height } = shadowCanvas;
      context.clearRect(0, 0, width, height);
      for (const die of box.diceList) {
        if (!die.geometry.boundingSphere) die.geometry.computeBoundingSphere();
        const radius = die.geometry.boundingSphere.radius;
        const ground = die.position.clone();
        ground.z = 0;
        const center = ground.clone().project(box.camera);
        ground.x += radius;
        const edge = ground.project(box.camera);
        const cx = (center.x * 0.5 + 0.5) * width;
        const cy = (1 - (center.y * 0.5 + 0.5)) * height;
        const lift = Math.max(0, die.position.z - radius * 0.6);
        const spread =
          Math.abs(edge.x - center.x) * width * 0.54 * (1 + lift / 600);
        if (!(spread > 0)) continue;
        const opacity = Math.max(0.08, 0.46 - lift / 650);
        const gradient = context.createRadialGradient(
          cx,
          cy,
          0,
          cx,
          cy,
          spread,
        );
        gradient.addColorStop(0, `rgba(14,8,3,${opacity})`);
        gradient.addColorStop(0.5, `rgba(14,8,3,${opacity * 0.55})`);
        gradient.addColorStop(1, "rgba(14,8,3,0)");
        context.fillStyle = gradient;
        context.fillRect(cx - spread, cy - spread, spread * 2, spread * 2);
      }
    };
    box.renderer.domElement.addEventListener("webglcontextlost", dispose, {
      once: true,
    });
  } catch (error) {
    dispose();
    throw error;
  }
  return {
    async roll(sides: number, values: readonly number[]) {
      // Upstream fixes the face before recorded playback begins. Finishing the
      // throw changes only its clock, never its trajectory or saved outcome.
      box.DiceFactory.baseScale = scale * (values.length > 2 ? 0.8 : 1);
      const result = await Promise.race([
        box.roll(`${values.length}d${sides}@${values.join(",")}`),
        released,
        playback.failure,
      ]);
      if (disposed || !result) throw new Error("Dice stage disposed");
      const actual = box.diceList.map((die: any) => die.getFaceValue().value);
      if (actual.join(",") !== values.join(","))
        throw new Error("Dice rendered face mismatch");
      container.dataset.faceValues = actual.join(",");
      // Project actual mesh vertices for cross-viewport visibility verification.
      container.dataset.landedBounds = JSON.stringify(
        box.diceList.map((die: any) => {
          die.updateMatrixWorld();
          const positions = die.geometry.getAttribute("position");
          const point = die.position.clone();
          const bounds = [Infinity, Infinity, -Infinity, -Infinity];
          for (let i = 0; i < positions.count; i++) {
            point
              .fromBufferAttribute(positions, i)
              .applyMatrix4(die.matrixWorld)
              .project(box.camera);
            const x = ((point.x + 1) * container.clientWidth) / 2;
            const y = ((1 - point.y) * container.clientHeight) / 2;
            bounds[0] = Math.min(bounds[0], x);
            bounds[1] = Math.min(bounds[1], y);
            bounds[2] = Math.max(bounds[2], x);
            bounds[3] = Math.max(bounds[3], y);
          }
          return bounds;
        }),
      );
      return actual as number[];
    },
    /** Fade the dice from index `from` on (a type edge's dropped attempt,
     * 2026-10-25) to a ghost of themselves over a quarter second, after
     * they have landed. Display only: the faces stay as rolled. */
    dim(from: number) {
      const faded: any[] = [];
      for (const die of box.diceList.slice(from)) {
        const list = Array.isArray(die.material)
          ? die.material
          : [die.material];
        const clones = list.map((m: any) => {
          const c = m.clone();
          c.transparent = true;
          c.depthWrite = false;
          return c;
        });
        die.material = Array.isArray(die.material) ? clones : clones[0];
        faded.push(...clones);
      }
      if (!faded.length) return;
      const start = performance.now();
      const step = (now: number) => {
        if (disposed) return;
        const t = Math.min(1, (now - start) / 240);
        for (const m of faded) m.opacity = 1 - 0.7 * t;
        box.renderer.render(box.scene, box.camera);
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
    finish: playback.finish,
    dispose,
  };
}
