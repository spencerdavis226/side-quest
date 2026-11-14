import {
  ACESFilmicToneMapping,
  AmbientLight,
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  DirectionalLight,
  Group,
  LinearEncoding,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  Quaternion,
  RepeatWrapping,
  Scene,
  sRGBEncoding,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Texture,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { questArt, type QuestArt } from "../quest-art.generated";

// The coin (The Quest 2.1): struck metal with an antique finish, its relief
// a normal map baked from the Quest's emblems so the light moves across the
// crown or the dragon as it turns, a raised rim on each face and a reeded
// edge. It is thrown like the dice: in from the edge of the table, tumbling
// end over end through its arc, it lands, kicks up once, then rolls on its
// rim in a tightening spiral (as a real coin winds down) and lies flat on
// the face the engine saved. No physics engine: the saved face is decided
// first (`src/game/dice.ts`) and every turn is solved backwards from it, so
// it cannot land on the other face. A glint crosses it once it rests. Same
// contract as the dice stage (`roll`, `finish`, `dim`, `dispose`), so
// `FullScreenDice` mounts either. Display only.

export interface CoinFaces {
  heads: QuestArt;
  tails: QuestArt;
  /** Bright and deep metal. */
  metal: [string, string];
}
export const QUEST_COIN: CoinFaces = {
  heads: "crown",
  tails: "dragon",
  metal: ["#ffd978", "#8a5a10"],
};
export const TAVERN_COIN: CoinFaces = {
  heads: "tankard",
  tails: "skull",
  // Old copper, for the tavern.
  metal: ["#f2b88a", "#6e3418"],
};

const RADIUS = 0.95;
const THICK = 0.13;
/** The throw at full speed; a tap plays it four times as fast. */
const THROW_MS = 2300;
const SIZE = 512;

const mix = (a: string, b: string, t: number) => {
  const pa = parse(a),
    pb = parse(b);
  const m = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
};
function parse(hex: string) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

/** Draw a face's relief: the rim, a ring of beads, the word and the
 * emblem. `ink` paints raised parts; the field is left as it was. */
function relief(
  g: CanvasRenderingContext2D,
  emblem: QuestArt,
  word: string,
  ink: string,
) {
  const mid = SIZE / 2;
  g.fillStyle = ink;
  g.strokeStyle = ink;
  g.lineWidth = 30;
  g.beginPath();
  g.arc(mid, mid, mid - 15, 0, Math.PI * 2);
  g.stroke();
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    g.beginPath();
    g.arc(
      mid + Math.cos(a) * (mid - 46),
      mid + Math.sin(a) * (mid - 46),
      3.4,
      0,
      Math.PI * 2,
    );
    g.fill();
  }
  g.font = "700 40px Georgia, 'Times New Roman', serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  const arc = 0.14 * (word.length - 1);
  [...word].forEach((ch, i) => {
    const a = -Math.PI / 2 - arc + (i * arc * 2) / (word.length - 1);
    g.save();
    g.translate(mid + Math.cos(a) * (mid - 82), mid + Math.sin(a) * (mid - 82));
    g.rotate(a + Math.PI / 2);
    g.fillText(ch, 0, 0);
    g.restore();
  });
  const scale = 0.52;
  g.save();
  g.translate(mid - 256 * scale, mid - 256 * scale + 22);
  g.scale(scale, scale);
  g.fill(new Path2D(questArt[emblem]));
  g.restore();
}

/** A face's height (white raised, grey field), softened a touch so the
 * relief has shoulders. */
function heightMap(emblem: QuestArt, word: string) {
  const c = document.createElement("canvas");
  c.width = c.height = SIZE;
  const g = c.getContext("2d")!;
  g.fillStyle = "#555";
  g.fillRect(0, 0, SIZE, SIZE);
  g.filter = "blur(2.5px)";
  relief(g, emblem, word, "#fff");
  g.filter = "none";
  return c;
}

/** The height turned into a tangent-space normal map. */
function normalMap(height: HTMLCanvasElement, strength = 3.2) {
  const src = height.getContext("2d")!.getImageData(0, 0, SIZE, SIZE).data;
  const out = document.createElement("canvas");
  out.width = out.height = SIZE;
  const g = out.getContext("2d")!;
  const img = g.createImageData(SIZE, SIZE);
  const h = (x: number, y: number) =>
    src[
      (Math.min(SIZE - 1, Math.max(0, y)) * SIZE +
        Math.min(SIZE - 1, Math.max(0, x))) *
        4
    ] / 255;
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const dx = (h(x + 1, y) - h(x - 1, y)) * strength;
      const dy = (h(x, y + 1) - h(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * SIZE + x) * 4;
      img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  return out;
}

/** The face's colour: the metal, darkened in the recesses round the relief
 * (an antique finish) and polished bright on top of it. */
function colorMap(faces: CoinFaces, emblem: QuestArt, word: string) {
  const [bright, deep] = faces.metal;
  const c = document.createElement("canvas");
  c.width = c.height = SIZE;
  const g = c.getContext("2d")!;
  const mid = SIZE / 2;
  const field = g.createRadialGradient(
    mid * 0.8,
    mid * 0.75,
    20,
    mid,
    mid,
    mid,
  );
  field.addColorStop(0, mix(bright, deep, 0.3));
  field.addColorStop(1, mix(bright, deep, 0.6));
  g.fillStyle = field;
  g.fillRect(0, 0, SIZE, SIZE);
  // The patina pooled round the relief.
  g.filter = "blur(7px)";
  g.globalAlpha = 0.55;
  relief(g, emblem, word, mix(deep, "#000000", 0.35));
  g.globalAlpha = 1;
  g.filter = "none";
  // The raised parts, polished.
  relief(g, emblem, word, bright);
  return c;
}

/** The reeded edge, as a normal map. */
function edgeNormal() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 8;
  const g = c.getContext("2d")!;
  for (let x = 0; x < c.width; x++) {
    const s = Math.sin((x / 4) * Math.PI);
    g.fillStyle = `rgb(${Math.round((s * 0.5 + 0.5) * 255)},128,${Math.round(220 + 35 * Math.abs(s))})`;
    g.fillRect(x, 0, 1, c.height);
  }
  return c;
}

/** A soft round shadow for the table. */
function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(64, 64, 2, 64, 64, 64);
  r.addColorStop(0, "rgba(8,4,1,0.75)");
  r.addColorStop(0.5, "rgba(8,4,1,0.35)");
  r.addColorStop(1, "rgba(8,4,1,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  return c;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 2.4);
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Build the coin's stage in `selector`. Throws when WebGL is unavailable;
 * the caller then reveals the saved face with no throw. */
export async function createCoinStage(selector: string, faces: CoinFaces) {
  const container = document.querySelector<HTMLElement>(selector)!;
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(width, height, false);
  renderer.outputEncoding = sRGBEncoding;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  container.append(renderer.domElement);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environment = environment;
  // Looking down on the table from a little behind and to the side, as the
  // dice are seen.
  // The camera stands back far enough that the coin is about a third of
  // the table's short side, as a die is.
  const aspect = width / height;
  const tan = Math.tan((30 / 2) * (Math.PI / 180));
  const distance = Math.max(
    RADIUS / 0.34 / (tan * Math.min(1, aspect)),
    RADIUS / 0.4 / tan,
  );
  const camera = new PerspectiveCamera(30, aspect, 0.1, distance * 3);
  camera.position.set(distance * 0.075, -distance * 0.09, distance);
  camera.lookAt(0, 0, 0);
  // The table's half-height and half-width at its plane.
  const halfH = tan * distance;
  const halfW = halfH * aspect;
  scene.add(new AmbientLight(0xffffff, 0.25));
  const key = new DirectionalLight(0xfff0d0, 2.2);
  key.position.set(-4, 5, 7);
  scene.add(key);
  const rim = new DirectionalLight(0xffe2b0, 0.9);
  rim.position.set(5, -3, 3);
  scene.add(rim);
  // The glint that crosses the coin once it rests.
  const glint = new PointLight(0xffffff, 0, 6);
  glint.position.set(-2, 1.5, 2.2);
  scene.add(glint);

  const textures: Texture[] = [];
  const keep = <T extends Texture>(t: T) => (textures.push(t), t);
  const anisotropy = renderer.capabilities.getMaxAnisotropy();
  // The underside's cap reads its canvas mirrored: tails is drawn flipped
  // so it lands the right way round.
  const flipped = (c: HTMLCanvasElement, flip: boolean) => {
    if (!flip) return c;
    const f = document.createElement("canvas");
    f.width = c.width;
    f.height = c.height;
    const g = f.getContext("2d")!;
    g.translate(0, c.height);
    g.scale(1, -1);
    g.drawImage(c, 0, 0);
    return f;
  };
  const face = (side: "heads" | "tails") => {
    const word = side === "heads" ? "HEADS" : "TAILS";
    const flip = side === "tails";
    const map = keep(
      new CanvasTexture(flipped(colorMap(faces, faces[side], word), flip)),
    );
    map.encoding = sRGBEncoding;
    map.anisotropy = anisotropy;
    const normal = keep(
      new CanvasTexture(normalMap(flipped(heightMap(faces[side], word), flip))),
    );
    normal.encoding = LinearEncoding;
    normal.anisotropy = anisotropy;
    return new MeshPhysicalMaterial({
      map,
      normalMap: normal,
      normalScale: new Vector2(1.1, 1.1),
      metalness: 1,
      roughness: 0.34,
      clearcoat: 0.35,
      clearcoatRoughness: 0.4,
      envMapIntensity: 0.75,
    });
  };
  const edge = keep(new CanvasTexture(edgeNormal()));
  edge.wrapS = RepeatWrapping;
  edge.repeat.set(3, 1);
  const metal = new MeshPhysicalMaterial({
    color: mix(faces.metal[0], faces.metal[1], 0.35),
    normalMap: edge,
    metalness: 1,
    roughness: 0.3,
    envMapIntensity: 0.8,
  });
  const heads = face("heads");
  const tails = face("tails");

  // The coin, its axis along y: the edge, the two faces, a raised rim on
  // each. The body group turns its axis toward the table's normal.
  const body = new Group();
  const edgeGeo = new CylinderGeometry(RADIUS, RADIUS, THICK, 128, 1, true);
  const faceGeo = new CircleGeometry(RADIUS * 0.985, 128);
  const rimGeo = new TorusGeometry(RADIUS * 0.975, THICK * 0.18, 12, 128);
  const geometries: { dispose(): void }[] = [edgeGeo, faceGeo, rimGeo];
  body.add(new Mesh(edgeGeo, metal));
  const top = new Mesh(faceGeo, heads);
  top.rotation.x = -Math.PI / 2;
  top.position.y = THICK / 2;
  const bottom = new Mesh(faceGeo, tails);
  bottom.rotation.x = Math.PI / 2;
  bottom.rotation.z = Math.PI;
  bottom.position.y = -THICK / 2;
  body.add(top, bottom);
  for (const y of [THICK / 2, -THICK / 2]) {
    const ring = new Mesh(rimGeo, metal);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    body.add(ring);
  }
  body.rotation.x = Math.PI / 2;
  const coin = new Group();
  coin.add(body);
  coin.visible = false;
  scene.add(coin);
  const shadowGeo = new PlaneGeometry(RADIUS * 3.2, RADIUS * 3.2);
  geometries.push(shadowGeo);
  const shadowMat = new MeshBasicMaterial({
    map: keep(new CanvasTexture(shadowTexture())),
    transparent: true,
    depthWrite: false,
  });
  const shadow = new Mesh(shadowGeo, shadowMat);
  shadow.visible = false;
  scene.add(shadow);

  let frame = 0;
  let disposed = false;
  let speed = 1;
  const render = () => renderer.render(scene, camera);
  render();

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    geometries.forEach((g) => g.dispose());
    [heads, tails, metal, shadowMat].forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    environment.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
  renderer.domElement.addEventListener("webglcontextlost", dispose, {
    once: true,
  });

  const q = new Quaternion();
  const q2 = new Quaternion();
  const axis = new Vector3();
  const zAxis = new Vector3(0, 0, 1);
  return {
    /** Throw it to `values[0]` (2 heads, 1 tails). Resolves with the face
     * it shows. */
    roll(_sides: number, values: readonly number[]) {
      const face = values[0] === 2 ? 2 : 1;
      speed = 1;
      // Where it lands, where it comes from (an edge of the table), and the
      // line it tumbles about.
      const land = new Vector3(
        rand(-1, 1) * Math.max(0, halfW - RADIUS * 1.4),
        rand(-0.3, 0.08) * halfH,
        0,
      );
      const fromSide = Math.random() < 0.5 ? -1 : 1;
      const from = new Vector3(
        fromSide * halfW * rand(0.3, 0.8),
        -halfH * 1.25,
        0.6,
      );
      const heading = Math.atan2(land.y - from.y, land.x - from.x);
      // It tumbles end over end along its flight: about the horizontal line
      // across it.
      const tumble = new Vector3(-Math.sin(heading), Math.cos(heading), 0);
      // The face it rests on: heads up is the body's own orientation.
      const rest = new Quaternion();
      if (face === 1) rest.setFromAxisAngle(new Vector3(1, 0, 0), Math.PI);
      // Its turn on the table at rest: a little off square, never upside
      // down to the reader.
      const yaw = rand(-0.3, 0.3);
      const restYaw = new Quaternion().setFromAxisAngle(zAxis, yaw);
      // Whole turns in the air, then the landing's lean is taken off.
      const turns = 4 + Math.floor(Math.random() * 3);
      const lean = rand(0.45, 0.6);
      const spinYaw = rand(2.5, 4.5) * (Math.random() < 0.5 ? -1 : 1);
      // The rim's roll: it starts across the tumble and winds round.
      const roll0 = heading + Math.PI / 2;
      coin.visible = shadow.visible = true;
      return new Promise<number[]>((resolve, reject) => {
        let clock = 0;
        let last = performance.now();
        const tick = (now: number) => {
          if (disposed) return reject(new Error("Coin stage disposed"));
          clock += Math.min(48, now - last) * speed;
          last = now;
          const t = Math.min(1, clock / THROW_MS);
          let z: number;
          let tiltAxis: Vector3;
          let tilt: number;
          let spin: number;
          let pos: Vector3;
          if (t < 0.5) {
            // The arc: in from the edge, up toward the table's eye, down.
            const u = t / 0.5;
            pos = from.clone().lerp(land, easeOut(u));
            z = 0.6 + Math.sin(Math.PI * u) * 3.4 * (1 - u * 0.15);
            tiltAxis = tumble;
            tilt = (1 - easeOut(u)) * turns * Math.PI * 2 + lean;
            spin = spinYaw * (1 - u);
          } else if (t < 0.64) {
            // It strikes the table on its rim and kicks up once.
            const u = (t - 0.5) / 0.14;
            pos = land.clone();
            z = Math.sin(Math.PI * u) * 0.45;
            tiltAxis = tumble;
            tilt = lean * (1 - 0.35 * smooth(u));
            spin = 0;
          } else {
            // Its rim rolls round in a tightening spiral, faster as it
            // flattens, and it lies down on the saved face.
            const u = (t - 0.64) / 0.36;
            const decay = Math.pow(1 - u, 1.8);
            tilt = lean * 0.65 * decay;
            const turn =
              roll0 + 9 * (1 - Math.pow(1 - u, 0.55)) * (spinYaw > 0 ? 1 : -1);
            tiltAxis = axis.set(Math.cos(turn), Math.sin(turn), 0);
            pos = land.clone();
            z = 0;
            spin = 0;
          }
          // Orientation: the tilt about its axis, over the resting face,
          // turned to its resting angle (and spun in the air).
          q.setFromAxisAngle(tiltAxis, tilt);
          q2.setFromAxisAngle(zAxis, spin * Math.PI);
          coin.quaternion.copy(restYaw).multiply(q2).multiply(q).multiply(rest);
          // Resting on its rim: the centre stands up by the lean.
          const lift =
            (THICK / 2) * Math.abs(Math.cos(tilt)) +
            RADIUS * Math.abs(Math.sin(tilt % Math.PI));
          coin.position.set(pos.x, pos.y, z + lift);
          // The shadow on the table: offset from the light, softer and
          // fainter the higher it is.
          const up = coin.position.z;
          shadow.position.set(pos.x + up * 0.32, pos.y - up * 0.4, 0.001);
          const s = 0.85 + up * 0.22;
          shadow.scale.set(s, s, 1);
          shadowMat.opacity = Math.max(0.15, 0.95 - up * 0.17);
          // The glint, once it rests.
          const settle = Math.max(0, (t - 0.9) / 0.1);
          glint.intensity = settle > 0 ? Math.sin(Math.PI * settle) * 1.1 : 0;
          glint.position.set(pos.x - 1.6 + settle * 3.2, pos.y + 1.2, 2.2);
          render();
          if (t < 1) frame = requestAnimationFrame(tick);
          else {
            // A last frame with the glint gone.
            glint.intensity = 0;
            render();
            container.dataset.faceValues = String(face);
            resolve([face]);
          }
        };
        frame = requestAnimationFrame(tick);
      });
    },
    /** The table tapped: the throw plays out four times as fast. */
    finish() {
      speed = 4;
    },
    dim() {},
    dispose,
  };
}
