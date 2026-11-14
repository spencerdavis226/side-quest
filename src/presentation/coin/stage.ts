import {
  ACESFilmicToneMapping,
  AmbientLight,
  CanvasTexture,
  CylinderGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  RepeatWrapping,
  Scene,
  sRGBEncoding,
  WebGLRenderer,
  type Texture,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { questArt, type QuestArt } from "../quest-art.generated";

// The coin (The Quest 2.1): a thick milled coin, minted on canvas from the
// Quest's emblems, flipped with no physics. The saved face is decided before
// the flip (`src/game/dice.ts`), so the spin is solved backwards from it: a
// whole number of half-turns lands the face asked for, every time. It rises
// toward the table, slows at the top of its arc, drops, rings on its edge and
// settles facing up, then a glint crosses it. Same contract as the dice
// stage (`roll`, `finish`, `dim`, `dispose`), so `FullScreenDice` mounts
// either. Display only.

export interface CoinFaces {
  heads: QuestArt;
  tails: QuestArt;
  /** Bright and deep metal. */
  metal: [string, string];
  /** The emblem's ink. */
  ink: string;
}
export const QUEST_COIN: CoinFaces = {
  heads: "crown",
  tails: "dragon",
  metal: ["#ffe08a", "#9a6512"],
  ink: "#5a3300",
};
export const TAVERN_COIN: CoinFaces = {
  heads: "tankard",
  tails: "skull",
  // Old copper, for the tavern.
  metal: ["#f6c79a", "#7a3f1c"],
  ink: "#3a1606",
};

const RADIUS = 1.15;
const THICK = 0.16;
const FLIP_MS = 1900;

/** One face, minted: the field, a raised rim, the emblem embossed with a
 * shadow and a highlight, and its word around the top. */
function mintFace(
  faces: CoinFaces,
  side: "heads" | "tails",
): HTMLCanvasElement {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const [bright, deep] = faces.metal;
  const mid = size / 2;
  // The field: a soft dome of light.
  const field = g.createRadialGradient(
    mid * 0.75,
    mid * 0.7,
    10,
    mid,
    mid,
    mid,
  );
  field.addColorStop(0, bright);
  field.addColorStop(0.65, mix(bright, deep, 0.35));
  field.addColorStop(1, deep);
  g.fillStyle = field;
  g.fillRect(0, 0, size, size);
  // Fine brushing across the field.
  g.globalAlpha = 0.06;
  for (let i = 0; i < 260; i++) {
    g.strokeStyle = i % 2 ? "#fff" : "#000";
    g.beginPath();
    const r = 40 + ((i * 37) % 200);
    g.arc(mid, mid, r, 0, Math.PI * 2);
    g.stroke();
  }
  g.globalAlpha = 1;
  // The rim: a raised ring, lit from the top left.
  const rim = g.createLinearGradient(0, 0, size, size);
  rim.addColorStop(0, "#fff6d0");
  rim.addColorStop(0.5, bright);
  rim.addColorStop(1, deep);
  g.lineWidth = 26;
  g.strokeStyle = rim;
  g.beginPath();
  g.arc(mid, mid, mid - 14, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 3;
  g.strokeStyle = mix(deep, "#000000", 0.4);
  g.beginPath();
  g.arc(mid, mid, mid - 30, 0, Math.PI * 2);
  g.stroke();
  // A ring of beads inside the rim.
  g.fillStyle = mix(bright, deep, 0.5);
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    g.beginPath();
    g.arc(
      mid + Math.cos(a) * (mid - 44),
      mid + Math.sin(a) * (mid - 44),
      3.2,
      0,
      Math.PI * 2,
    );
    g.fill();
  }
  // The word, around the top.
  const word = side === "heads" ? "HEADS" : "TAILS";
  g.font = "700 34px Georgia, 'Times New Roman', serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  const arc = 0.13 * (word.length - 1);
  [...word].forEach((ch, i) => {
    const a = -Math.PI / 2 - arc + (i * arc * 2) / (word.length - 1);
    g.save();
    g.translate(mid + Math.cos(a) * (mid - 76), mid + Math.sin(a) * (mid - 76));
    g.rotate(a + Math.PI / 2);
    g.fillStyle = "#fff4cc";
    g.fillText(ch, 1, 1.5);
    g.fillStyle = faces.ink;
    g.fillText(ch, 0, 0);
    g.restore();
  });
  // The emblem, struck: highlight up-left, shadow down-right, then the ink.
  const path = new Path2D(questArt[faces[side]]);
  const scale = 0.5;
  const emblem = (dx: number, dy: number, color: string) => {
    g.save();
    g.translate(mid - 256 * scale + dx, mid - 256 * scale + 18 + dy);
    g.scale(scale, scale);
    g.fillStyle = color;
    g.fill(path);
    g.restore();
  };
  emblem(-3, -3, "#fff8dc");
  emblem(4, 4, mix(deep, "#000000", 0.55));
  emblem(0, 0, faces.ink);
  return c;
}

/** The milled edge: fine vertical reeding. */
function mintEdge(faces: CoinFaces): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 16;
  const g = c.getContext("2d")!;
  const [bright, deep] = faces.metal;
  for (let x = 0; x < c.width; x += 4) {
    g.fillStyle = bright;
    g.fillRect(x, 0, 2, c.height);
    g.fillStyle = deep;
    g.fillRect(x + 2, 0, 2, c.height);
  }
  return c;
}

/** A soft round shadow for the table under the coin. */
function shadowTexture(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  r.addColorStop(0, "rgba(10,6,2,0.55)");
  r.addColorStop(1, "rgba(10,6,2,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  return c;
}

function mix(a: string, b: string, t: number) {
  const pa = parse(a),
    pb = parse(b);
  const m = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}
function parse(hex: string) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Build the coin's stage in `selector`. Throws when WebGL is unavailable;
 * the caller then reveals the saved face with no flip. */
export async function createCoinStage(selector: string, faces: CoinFaces) {
  const container = document.querySelector<HTMLElement>(selector)!;
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(width, height, false);
  renderer.outputEncoding = sRGBEncoding;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  container.append(renderer.domElement);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environment;
  const camera = new PerspectiveCamera(32, width / height, 0.1, 100);
  camera.position.set(0, 0, 11);
  camera.lookAt(0, 0, 0);
  scene.add(new AmbientLight(0xffffff, 0.35));
  const key = new DirectionalLight(0xfff1d0, 1.6);
  key.position.set(-3, 4, 6);
  scene.add(key);
  // The glint that crosses the coin once it has settled.
  const glint = new PointLight(0xffffff, 0, 8);
  glint.position.set(-3, 2, 3);
  scene.add(glint);

  const textures: Texture[] = [];
  const texture = (canvas: HTMLCanvasElement) => {
    const t = new CanvasTexture(canvas);
    t.encoding = sRGBEncoding;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    textures.push(t);
    return t;
  };
  const edge = texture(mintEdge(faces));
  edge.wrapS = RepeatWrapping;
  edge.repeat.set(6, 1);
  const metal = { metalness: 0.92, roughness: 0.28, envMapIntensity: 1.2 };
  // A cylinder's caps read their canvas a quarter-turn round: turned back
  // so each face stands upright when it lands toward the table.
  const cap = (side: "heads" | "tails") => {
    const t = texture(mintFace(faces, side));
    t.center.set(0.5, 0.5);
    t.rotation = side === "heads" ? Math.PI / 2 : -Math.PI / 2;
    return t;
  };
  const materials = [
    new MeshStandardMaterial({ ...metal, map: edge }),
    new MeshStandardMaterial({ ...metal, map: cap("heads") }),
    new MeshStandardMaterial({ ...metal, map: cap("tails") }),
  ];
  const geometry = new CylinderGeometry(RADIUS, RADIUS, THICK, 96, 1);
  const coin = new Mesh(geometry, materials);
  // Its axis toward the table: the top cap (heads) faces the camera.
  coin.rotation.x = Math.PI / 2;
  const pivot = new Group();
  pivot.add(coin);
  // Nothing shows while the card is read; the coin appears as it is flipped.
  pivot.visible = false;
  scene.add(pivot);
  const shadowGeometry = new PlaneGeometry(RADIUS * 3, RADIUS * 3);
  const shadowMaterial = new MeshBasicMaterial({
    map: texture(shadowTexture()),
    transparent: true,
    depthWrite: false,
  });
  const shadow = new Mesh(shadowGeometry, shadowMaterial);
  shadow.visible = false;
  shadow.position.set(0.15, -0.2, -1.2);
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
    geometry.dispose();
    shadowGeometry.dispose();
    materials.forEach((m) => m.dispose());
    shadowMaterial.dispose();
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

  return {
    /** Flip to `values[0]` (2 heads, 1 tails). Resolves with the face shown. */
    roll(_sides: number, values: readonly number[]) {
      const face = values[0] === 2 ? 2 : 1;
      speed = 1;
      // Five to seven whole turns, plus a half for tails.
      const turns = 5 + Math.floor(Math.random() * 3);
      const total = Math.PI * 2 * turns + (face === 1 ? Math.PI : 0);
      const lean = (Math.random() - 0.5) * 0.5;
      pivot.visible = shadow.visible = true;
      return new Promise<number[]>((resolve, reject) => {
        let clock = 0;
        let last = performance.now();
        const tick = (now: number) => {
          if (disposed) return reject(new Error("Coin stage disposed"));
          clock += Math.min(64, now - last) * speed;
          last = now;
          const t = Math.min(1, clock / FLIP_MS);
          // In the air until 78%, then it rings and settles.
          const air = Math.min(1, t / 0.78);
          const arc = Math.sin(Math.PI * air);
          pivot.position.y = -0.4 + arc * 2.1;
          pivot.position.z = arc * 3.2;
          // The spin slows into its last half-turn, solved to land the face.
          coin.rotation.x = Math.PI / 2 + total * easeOut(air);
          pivot.rotation.y = lean * arc;
          // The landing: a damped ring on its edge.
          const settle = Math.max(0, (t - 0.78) / 0.22);
          const ring = settle > 0 ? Math.exp(-5 * settle) : 0;
          pivot.rotation.x = ring * 0.32 * Math.cos(settle * 26);
          pivot.rotation.z = ring * 0.18 * Math.sin(settle * 21);
          // The shadow tightens as it falls back.
          const s = 1 - arc * 0.45;
          shadow.scale.set(s, s, 1);
          shadowMaterial.opacity = 0.35 + (1 - arc) * 0.65;
          // The glint crosses after it settles.
          glint.intensity =
            settle > 0.35
              ? Math.sin(Math.PI * Math.min(1, (settle - 0.35) / 0.65)) * 4
              : 0;
          glint.position.x = -3 + Math.max(0, settle - 0.35) * 9;
          render();
          if (t < 1) frame = requestAnimationFrame(tick);
          else {
            container.dataset.faceValues = String(face);
            resolve([face]);
          }
        };
        frame = requestAnimationFrame(tick);
      });
    },
    /** The table tapped: the flip plays out four times as fast. */
    finish() {
      speed = 4;
    },
    dim() {},
    dispose,
  };
}
