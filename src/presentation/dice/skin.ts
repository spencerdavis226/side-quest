import type { DiceColors } from "./palette";

/** Locally painted enamel and brass inlay, with exact readable face markings,
 * in the colours of the run's starter or omen (`palette.ts`). */
export function installDiceSkin(factory: any, colors: DiceColors) {
  const chamfer = factory.chamfer_geom.bind(factory);
  factory.chamfer_geom = (vertices: unknown, faces: unknown) =>
    chamfer(vertices, faces, 0.92);
  const original = factory.createTextMaterial.bind(factory);
  factory.createTextMaterial = (...args: any[]) => {
    const texture = original(...args);
    if (!texture || texture.ronPainted) return texture;
    texture.ronPainted = true;
    const [preset, labels, index] = args;
    const value = Number(labels[index]);
    const canvas = texture.composite.image as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    const size = canvas.width;
    ctx.save();
    ctx.setTransform(size, 0, 0, size, 0, 0);
    const face = index > 0 && Number.isFinite(value) && value > 0;
    const glaze = ctx.createLinearGradient(0, 0, 1, 1);
    glaze.addColorStop(0, face ? colors.body[0] : colors.metal[0]);
    glaze.addColorStop(0.45, face ? colors.body[1] : colors.metal[1]);
    glaze.addColorStop(1, face ? colors.body[2] : colors.metal[2]);
    ctx.fillStyle = glaze;
    ctx.fillRect(0, 0, 1, 1);
    // Fine fixed grain stays consistent across launches and never samples game randomness.
    for (let i = 0; i < 1600; i++) {
      const x = ((i * 73) % 997) / 997,
        y = ((i * 193) % 991) / 991;
      ctx.fillStyle = i % 2 ? "rgba(249,225,170,.065)" : "rgba(0,14,19,.10)";
      ctx.fillRect(x, y, 0.002, 0.002);
    }
    if (face) {
      ctx.strokeStyle = colors.trim;
      ctx.lineWidth = 0.008;
      if (preset.shape === "d6") {
        ctx.beginPath();
        ctx.roundRect(0.205, 0.205, 0.59, 0.59, 0.045);
        ctx.stroke();
        ctx.strokeStyle = colors.ring;
        ctx.lineWidth = 0.003;
        ctx.beginPath();
        ctx.roundRect(0.218, 0.218, 0.564, 0.564, 0.036);
        ctx.stroke();
        const pips: Record<number, number[][]> = {
          1: [[0, 0]],
          2: [
            [-1, -1],
            [1, 1],
          ],
          3: [
            [-1, -1],
            [0, 0],
            [1, 1],
          ],
          4: [
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ],
          5: [
            [-1, -1],
            [1, -1],
            [0, 0],
            [-1, 1],
            [1, 1],
          ],
          6: [
            [-1, -1],
            [1, -1],
            [-1, 0],
            [1, 0],
            [-1, 1],
            [1, 1],
          ],
        };
        for (const [x, y] of pips[value] ?? []) {
          const px = 0.5 + x * 0.205,
            py = 0.5 + y * 0.205;
          ctx.fillStyle = colors.deep;
          ctx.beginPath();
          ctx.arc(px, py, 0.07, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = colors.trim;
          ctx.beginPath();
          ctx.arc(px, py + 0.003, 0.058, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = colors.ink;
          ctx.beginPath();
          ctx.arc(px, py - 0.006, 0.047, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.beginPath();
        for (let corner = 0; corner < 3; corner++) {
          const angle = -Math.PI / 8 + (corner * Math.PI * 2) / 3;
          const x = 0.5 + Math.cos(angle) * 0.49,
            y = 0.5 - Math.sin(angle) * 0.49;
          if (corner === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        // Match the upstream d20 label rotation; the surrounding bronze bevel
        // supplies the triangular edge, leaving a generous numerical safe area.
        ctx.translate(0.5, 0.5);
        ctx.rotate((-7.5 * Math.PI) / 180);
        ctx.font = '700 .34px "Source Serif 4 Title"';
        // Safari/WebKit resolves the "middle" baseline about 0.08em higher than
        // Chromium, which left iOS d20 numerals visibly above the face centre.
        // Center the measured ink box on the canvas instead; the metrics are
        // stable across engines and keep the shadow offset below.
        const label = String(value);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        const metrics = ctx.measureText(label);
        const inkX =
          (metrics.actualBoundingBoxRight - metrics.actualBoundingBoxLeft) / 2;
        const inkY =
          (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) /
          2;
        ctx.fillStyle = colors.shade;
        ctx.fillText(label, -inkX + 0.003, inkY + 0.024);
        ctx.fillStyle = colors.ink;
        ctx.fillText(label, -inkX, inkY);
        if (value === 6 || value === 9) {
          ctx.fillStyle = colors.trim;
          ctx.fillRect(-0.045, 0.2, 0.09, 0.012);
        }
      }
    }
    ctx.restore();
    texture.composite.needsUpdate = true;
    // A color texture is not a height field. The tiny engraved relief comes
    // from the upstream numeral bump map, never from noisy painted grain.
    return texture;
  };
}
