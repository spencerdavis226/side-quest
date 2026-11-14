// The shader stage (The Quest 2.1): one full-screen quad, one fragment
// shader, a few uniforms. No library: WebGL2 and a triangle. Used for the
// dragon's lair behind the card. It draws at a capped resolution, halves it
// if frames run long, pauses when the tab is hidden or the table is idle,
// draws one still frame under Reduced Motion, and releases its context when
// it is unmounted. Display only.

const VERTEX = `#version 300 es
in vec2 p;
out vec2 uv;
void main() {
  uv = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}`;

/** Shared noise for every scene. */
const COMMON = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 color;
uniform float time;
uniform vec2 size;
uniform vec3 bright;
uniform vec3 deep;
uniform float rage;
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 7.1; a *= 0.5; }
  return v;
}
// Darkens the edges so the card stays the brightest thing on the table.
float vignette(vec2 q) {
  vec2 d = q - 0.5;
  return smoothstep(0.95, 0.25, length(d * vec2(1.1, 0.9)));
}
`;

/** Each lair's light. `rage` (0 to 1) runs hotter once the dragon is
 * enraged. */
export const SCENES = {
  // The Fire Caverns: heat rising, a floor of embers, sparks.
  fire: `
void main() {
  vec2 q = uv;
  float aspect = size.x / size.y;
  vec2 p = vec2(q.x * aspect, q.y);
  float t = time * (0.25 + rage * 0.25);
  float heat = fbm(vec2(p.x * 2.2, p.y * 1.4 - t * 1.6) + fbm(p * 3.0 - t) * 0.6);
  float floorGlow = smoothstep(0.75, 0.0, q.y) * (0.55 + 0.45 * heat);
  float tongues = smoothstep(0.35, 0.95, heat) * smoothstep(1.0, 0.1, q.y);
  vec3 c = deep * 0.18;
  c += deep * floorGlow * (0.8 + rage * 0.6);
  c += bright * tongues * (0.35 + rage * 0.4);
  // Sparks: bright points riding up.
  vec2 g = vec2(p.x * 26.0, p.y * 14.0 - time * (2.5 + rage * 2.0));
  vec2 cell = floor(g);
  float h = hash(cell);
  vec2 f = fract(g) - vec2(0.5 + 0.3 * sin(h * 40.0 + time), 0.5);
  float spark = step(0.93, h) * smoothstep(0.08, 0.0, length(f));
  c += bright * spark * (0.9 + rage) * smoothstep(1.0, 0.2, q.y);
  color = vec4(c * vignette(q), 1.0);
}`,
  // The Frozen Pass: drifting snow, a cold aurora, frost at the edges.
  frost: `
void main() {
  vec2 q = uv;
  float aspect = size.x / size.y;
  vec2 p = vec2(q.x * aspect, q.y);
  float t = time * 0.12;
  float aurora = fbm(vec2(p.x * 1.6 + t, p.y * 3.0 - t * 0.5));
  float band = smoothstep(0.25, 0.0, abs(q.y - 0.72 - 0.08 * sin(p.x * 2.0 + time * 0.3)));
  vec3 c = mix(deep * 0.12, deep * 0.35, q.y);
  c += bright * band * aurora * (0.55 + rage * 0.4);
  float edge = smoothstep(0.32, 0.5, length(q - 0.5));
  float frostTex = fbm(p * 18.0);
  c += vec3(0.85, 0.95, 1.0) * edge * smoothstep(0.45, 0.8, frostTex) * 0.35;
  for (int i = 0; i < 3; i++) {
    float s = float(i) + 1.0;
    vec2 g = vec2(p.x * 10.0 * s + sin(time * 0.6 + s) * 0.6, p.y * 10.0 * s + time * (0.6 + 0.3 * s) * (1.0 + rage));
    vec2 cell = floor(g);
    float h = hash(cell + s * 13.0);
    vec2 f = fract(g) - 0.5;
    c += vec3(0.9, 0.97, 1.0) * step(0.86, h) * smoothstep(0.12 / s, 0.0, length(f)) * (0.9 / s);
  }
  color = vec4(c * vignette(q), 1.0);
}`,
  // The Sunken Coast: water overhead, caustics and drifting light.
  tide: `
void main() {
  vec2 q = uv;
  float aspect = size.x / size.y;
  vec2 p = vec2(q.x * aspect, q.y) * 3.0;
  float t = time * (0.35 + rage * 0.3);
  vec2 w = p + vec2(fbm(p + t), fbm(p - t + 3.1)) * 1.4;
  float caustic = pow(1.0 - abs(sin(w.x * 2.2) * sin(w.y * 2.2)), 7.0);
  vec3 c = mix(deep * 0.12, deep * 0.45, q.y);
  c += bright * caustic * 0.35 * smoothstep(0.0, 1.0, q.y);
  float ray = smoothstep(0.7, 1.0, sin(q.x * 9.0 + q.y * 3.0 + time * 0.4)) * q.y;
  c += bright * ray * 0.12;
  // Bubbles rising.
  vec2 g = vec2(p.x * 4.0, p.y * 3.0 - time * 1.2);
  vec2 cell = floor(g);
  float h = hash(cell);
  vec2 f = fract(g) - 0.5;
  float r = length(f);
  c += bright * step(0.9, h) * smoothstep(0.12, 0.09, r) * smoothstep(0.05, 0.1, r) * 0.8;
  color = vec4(c * vignette(q), 1.0);
}`,
  // A rare card's foil (The Quest 2.1): thin-film colours sweeping across
  // in bands, a slow sheen, and glints; transparent, laid over the card.
  foil: `
vec3 film(float t) {
  return 0.5 + 0.5 * cos(6.2831 * (t + vec3(0.0, 0.33, 0.67)));
}
void main() {
  vec2 q = uv;
  float aspect = size.x / size.y;
  vec2 p = vec2(q.x * aspect, q.y);
  float t = time * 0.12;
  float n = fbm(p * 3.0 + t);
  float bands = q.x * 1.3 + q.y * 0.9 + n * 0.6 - t * 2.0;
  vec3 c = film(bands);
  // A sheen that sweeps corner to corner every few seconds.
  float sweep = smoothstep(0.18, 0.0, abs(fract(t * 0.9) * 2.6 - 0.8 - (q.x + 1.0 - q.y) * 0.5));
  // Glints: tiny stars that twinkle.
  vec2 g = p * vec2(34.0, 34.0);
  vec2 cell = floor(g);
  float h = hash(cell);
  float tw = 0.5 + 0.5 * sin(time * 3.0 + h * 40.0);
  float star = step(0.965, h) * smoothstep(0.12, 0.0, length(fract(g) - 0.5)) * tw;
  float a = 0.22 + 0.25 * sweep + star * 0.9;
  vec3 rgb = mix(c, vec3(1.0), sweep * 0.5 + star);
  color = vec4(rgb * a, a);
}`,
} as const;
export type SceneName = keyof typeof SCENES;

const rgb = (hex: string) => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
};

/** Run `scene` on `canvas`. Returns controls, or null without WebGL2. */
export function runShader(
  canvas: HTMLCanvasElement,
  scene: SceneName,
  colors: { bright: string; deep: string },
  options: { still: boolean; alpha?: boolean },
) {
  const gl = canvas.getContext("webgl2", {
    alpha: !!options.alpha,
    premultipliedAlpha: true,
    antialias: false,
    powerPreference: "low-power",
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw Error(gl.getShaderInfoLog(s) ?? "shader");
    return s;
  };
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, COMMON + SCENES[scene]));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw Error(gl.getProgramInfoLog(program) ?? "link");
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const at = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(at);
  gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
  const u = (n: string) => gl.getUniformLocation(program, n);
  const uTime = u("time"),
    uSize = u("size"),
    uRage = u("rage");
  gl.uniform3fv(u("bright"), rgb(colors.bright));
  gl.uniform3fv(u("deep"), rgb(colors.deep));

  // Drawn small and stretched: a soft backdrop needs few pixels.
  let resolution = 0.5;
  let rage = 0;
  let target = 0;
  const resize = () => {
    const w = Math.max(1, Math.round(canvas.clientWidth * resolution));
    const h = Math.max(1, Math.round(canvas.clientHeight * resolution));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uSize, w, h);
  };
  const start = performance.now();
  let frame = 0;
  let running = false;
  let slow = 0;
  let last = 0;
  const draw = (now: number) => {
    resize();
    rage += (target - rage) * 0.05;
    gl.uniform1f(uTime, (now - start) / 1000);
    gl.uniform1f(uRage, rage);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const loop = (now: number) => {
    if (!running) return;
    // A long frame, again and again: draw fewer pixels.
    if (last && now - last > 40) slow++;
    else slow = Math.max(0, slow - 1);
    if (slow > 20 && resolution > 0.25) {
      resolution /= 2;
      slow = 0;
    }
    last = now;
    draw(now);
    frame = requestAnimationFrame(loop);
  };
  const play = () => {
    if (running || options.still) return;
    running = true;
    last = 0;
    frame = requestAnimationFrame(loop);
  };
  const pause = () => {
    running = false;
    cancelAnimationFrame(frame);
  };
  draw(performance.now() + 7000);
  if (!options.still) play();
  return {
    play,
    pause,
    /** Hotter once the dragon is enraged. */
    setRage(on: boolean) {
      target = on ? 1 : 0;
      if (options.still) {
        rage = target;
        draw(performance.now() + 7000);
      }
    },
    dispose() {
      pause();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
