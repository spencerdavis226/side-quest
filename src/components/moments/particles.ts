// One full-viewport canvas for every moment's particles (2026-11-01):
// confetti, sparks, embers, coins, motes drawn inward, shards and
// fireworks. Created on first use, driven by one requestAnimationFrame that
// stops when the last particle dies, capped so a busy second never drops
// frames on a phone. Display only; nothing here is saved or announced.

export type Preset =
  | "confetti"
  | "sparks"
  | "embers"
  | "coins"
  | "implode"
  | "shards"
  | "firework"
  | "dust"
  | "motes";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Seconds lived and the lifespan. */
  t: number;
  life: number;
  size: number;
  rot: number;
  spin: number;
  color: string;
  shape: "rect" | "glow" | "coin" | "shard" | "dot";
  gravity: number;
  drag: number;
  /** Fade in over the first share of life (motes drawn inward). */
  fadeIn: number;
}

export interface BurstOptions {
  /** Centre in CSS pixels; defaults to the middle of the screen. */
  x?: number;
  y?: number;
  count?: number;
  colors?: string[];
  /** Scales speed (and reach). */
  power?: number;
  /** For `implode`: the ring's radius the motes start on. */
  radius?: number;
  /** Spread in radians around `angle`; a full circle by default. */
  spread?: number;
  angle?: number;
}

const CAP = 420;
const GOLD = ["#ffe9a8", "#f2c94c", "#d9a336", "#fff6d6"];

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let frame = 0;
let last = 0;
let dpr = 1;

function ensure() {
  if (canvas && canvas.isConnected) return true;
  canvas = document.createElement("canvas");
  canvas.className = "moment-particles";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);
  ctx = canvas.getContext("2d");
  resize();
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearParticles();
  });
  return !!ctx;
}

function resize() {
  if (!canvas) return;
  dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)];

/** Scatter a preset's particles. A hidden tab or Reduced Motion should not
 * call this (the moment that would has not played). */
export function burst(preset: Preset, options: BurstOptions = {}) {
  if (document.hidden || !ensure()) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const x = options.x ?? w / 2;
  const y = options.y ?? h / 2;
  const unit = Math.min(w, h);
  const power = (options.power ?? 1) * unit;
  const spread = options.spread ?? Math.PI * 2;
  const angle = options.angle ?? -Math.PI / 2;
  const colors = options.colors?.length ? options.colors : GOLD;
  const count = Math.min(options.count ?? 40, CAP - particles.length);
  for (let i = 0; i < count; i++) {
    const a =
      angle +
      (spread >= Math.PI * 2
        ? Math.random() * Math.PI * 2
        : rand(-spread / 2, spread / 2));
    const base: Particle = {
      x,
      y,
      vx: 0,
      vy: 0,
      t: 0,
      life: 1,
      size: 4,
      rot: rand(0, Math.PI * 2),
      spin: rand(-8, 8),
      color: pick(colors),
      shape: "glow",
      gravity: 0,
      drag: 2,
      fadeIn: 0,
    };
    let p: Particle;
    switch (preset) {
      case "confetti": {
        const v = rand(0.6, 1.25) * power;
        p = {
          ...base,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - power * 0.25,
          life: rand(1.6, 2.4),
          size: rand(5, 9),
          shape: "rect",
          gravity: unit * 0.9,
          drag: 2.4,
        };
        break;
      }
      case "coins": {
        const v = rand(0.3, 0.9) * power;
        p = {
          ...base,
          x: options.x ?? rand(0, w),
          y: options.y ?? rand(-h * 0.2, 0),
          vx: Math.cos(a) * v * 0.3,
          vy: options.y === undefined ? rand(0, 0.3) * power : Math.sin(a) * v,
          life: rand(1.8, 2.6),
          size: rand(9, 14),
          shape: "coin",
          gravity: unit * 1.4,
          drag: 0.6,
          spin: rand(6, 14),
        };
        break;
      }
      case "embers": {
        const v = rand(0.1, 0.45) * power;
        p = {
          ...base,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - rand(0.1, 0.3) * power,
          life: rand(1, 2),
          size: rand(2, 4),
          gravity: -unit * 0.15,
          drag: 1.2,
        };
        break;
      }
      case "implode": {
        const r = options.radius ?? unit * 0.45;
        const sx = x + Math.cos(a) * r * rand(0.8, 1.2);
        const sy = y + Math.sin(a) * r * rand(0.8, 1.2);
        const life = rand(0.7, 1.2);
        p = {
          ...base,
          x: sx,
          y: sy,
          vx: (x - sx) / life,
          vy: (y - sy) / life,
          life,
          size: rand(2, 4.5),
          drag: 0,
          fadeIn: 0.4,
        };
        break;
      }
      case "shards": {
        const v = rand(0.4, 1.1) * power;
        p = {
          ...base,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          life: rand(0.7, 1.2),
          size: rand(6, 14),
          shape: "shard",
          gravity: unit * 1.1,
          drag: 1.6,
          spin: rand(-14, 14),
        };
        break;
      }
      case "firework": {
        const v = rand(0.85, 1) * power * 0.55;
        p = {
          ...base,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          life: rand(1.1, 1.6),
          size: rand(2, 3.4),
          gravity: unit * 0.35,
          drag: 2.2,
        };
        break;
      }
      case "dust": {
        const v = rand(0.05, 0.35) * power;
        p = {
          ...base,
          x:
            options.x === undefined
              ? rand(0, w)
              : x + rand(-unit * 0.4, unit * 0.4),
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          life: rand(0.8, 1.5),
          size: rand(6, 16),
          shape: "dot",
          gravity: -unit * 0.05,
          drag: 2.6,
        };
        break;
      }
      case "motes": {
        p = {
          ...base,
          x:
            options.x === undefined
              ? rand(0, w)
              : x + rand(-unit * 0.3, unit * 0.3),
          y: options.y === undefined ? h + 10 : y,
          vx: rand(-0.03, 0.03) * power,
          vy: -rand(0.25, 0.55) * power,
          life: rand(1.1, 1.8),
          size: rand(2, 4),
          drag: 0.4,
          fadeIn: 0.2,
        };
        break;
      }
      default: {
        // sparks
        const v = rand(0.35, 1) * power;
        p = {
          ...base,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          life: rand(0.45, 0.85),
          size: rand(1.6, 3.2),
          gravity: unit * 0.6,
          drag: 3,
        };
      }
    }
    particles.push(p);
  }
  if (!frame) {
    last = performance.now();
    frame = requestAnimationFrame(step);
  }
}

/** Fireworks: a few shells bursting in sequence over the top half. */
export function fireworks(shells = 5, colors?: string[][]) {
  const palettes = colors ?? [
    ["#ffe9a8", "#f2c94c"],
    ["#ff9fb2", "#ff5d7a"],
    ["#9fd6ff", "#5aa9e6"],
    ["#b8f5c4", "#7bd389"],
    ["#e2c6ff", "#a86bff"],
  ];
  const timers: number[] = [];
  for (let i = 0; i < shells; i++)
    timers.push(
      window.setTimeout(
        () => {
          burst("firework", {
            x: window.innerWidth * rand(0.18, 0.82),
            y: window.innerHeight * rand(0.14, 0.42),
            count: 46,
            colors: palettes[i % palettes.length],
          });
        },
        i * 360 + rand(0, 120),
      ),
    );
  return () => timers.forEach(clearTimeout);
}

export function clearParticles() {
  particles = [];
  if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  cancelAnimationFrame(frame);
  frame = 0;
}

function step(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!ctx || !canvas) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const alive: Particle[] = [];
  for (const p of particles) {
    p.t += dt;
    if (p.t >= p.life) continue;
    const k = Math.max(0, 1 - p.drag * dt);
    p.vx *= k;
    p.vy = p.vy * k + p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.spin * dt;
    const age = p.t / p.life;
    const alpha =
      (p.fadeIn && age < p.fadeIn ? age / p.fadeIn : 1) *
      (age > 0.7 ? (1 - age) / 0.3 : 1);
    draw(ctx, p, alpha);
    alive.push(p);
  }
  particles = alive;
  if (particles.length) frame = requestAnimationFrame(step);
  else {
    frame = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function draw(c: CanvasRenderingContext2D, p: Particle, alpha: number) {
  c.globalAlpha = alpha;
  c.fillStyle = p.color;
  switch (p.shape) {
    case "rect":
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      // A flat ribbon catching the light as it turns.
      c.scale(1, Math.abs(Math.cos(p.rot * 1.7)) * 0.8 + 0.2);
      c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      c.restore();
      break;
    case "coin": {
      c.save();
      c.translate(p.x, p.y);
      const sx = Math.abs(Math.cos(p.rot));
      c.scale(Math.max(0.12, sx), 1);
      c.beginPath();
      c.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = alpha * 0.55;
      c.fillStyle = "#fff6d6";
      c.beginPath();
      c.arc(-p.size * 0.12, -p.size * 0.12, p.size * 0.22, 0, Math.PI * 2);
      c.fill();
      c.restore();
      break;
    }
    case "shard":
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      c.beginPath();
      c.moveTo(0, -p.size / 2);
      c.lineTo(p.size / 3, p.size / 2);
      c.lineTo(-p.size / 3, p.size / 3);
      c.closePath();
      c.fill();
      c.restore();
      break;
    case "dot":
      c.globalAlpha = alpha * 0.35;
      c.beginPath();
      c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      c.fill();
      break;
    default: {
      // A glowing point: a soft halo and a bright core.
      c.globalCompositeOperation = "lighter";
      c.globalAlpha = alpha * 0.35;
      c.beginPath();
      c.arc(p.x, p.y, p.size * 2.6, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = alpha;
      c.beginPath();
      c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      c.fill();
      c.globalCompositeOperation = "source-over";
    }
  }
  c.globalAlpha = 1;
}
