import { dragonColors } from "./dragon-colors";
import { questArt } from "./quest-art.generated";

// The ballad as a picture (The Quest 2.1): the end screen's verse set on a
// parchment page in the app's own fonts, the dragon's mark at its head in
// the dragon's colours, ready for the table's group chat. Drawn on a canvas
// when asked for, never stored. Display only.

const W = 1080;
const H = 1350;

/** The app's font for a CSS variable, as a canvas font family. */
const fontOf = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
  fallback;

function wrap(g: CanvasRenderingContext2D, text: string, width: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (g.measureText(next).width > width && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export async function balladImage(
  title: [string, string],
  lines: string[],
  dragon?: string,
): Promise<Blob | null> {
  await document.fonts?.ready;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  if (!g) return null;
  const [bright, deep] = dragonColors(dragon);
  const titleFont = fontOf("--font-card-title", "Georgia, serif");
  const bodyFont = fontOf("--font-tavern", "Georgia, serif");
  // The page.
  const paper = g.createRadialGradient(
    W / 2,
    H * 0.4,
    50,
    W / 2,
    H / 2,
    H * 0.8,
  );
  paper.addColorStop(0, "#f6e7c2");
  paper.addColorStop(0.7, "#e6cf9c");
  paper.addColorStop(1, "#b8955a");
  g.fillStyle = paper;
  g.fillRect(0, 0, W, H);
  // Grain.
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = `rgba(90,60,25,${Math.random() * 0.06})`;
    g.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }
  // Rules.
  g.strokeStyle = "#7a5a2c";
  g.lineWidth = 6;
  g.strokeRect(48, 48, W - 96, H - 96);
  g.lineWidth = 2;
  g.strokeRect(64, 64, W - 128, H - 128);
  // The dragon's mark in a medallion.
  const cx = W / 2;
  const cy = 230;
  const ring = g.createLinearGradient(cx - 110, cy - 110, cx + 110, cy + 110);
  ring.addColorStop(0, bright);
  ring.addColorStop(1, deep);
  g.fillStyle = ring;
  g.beginPath();
  g.arc(cx, cy, 110, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#f2c94c";
  g.lineWidth = 6;
  g.stroke();
  g.save();
  g.translate(cx - 75, cy - 75);
  g.scale(150 / 512, 150 / 512);
  g.fillStyle = "#fff4dc";
  g.fill(new Path2D(questArt.dragon));
  g.restore();
  // The title.
  g.textAlign = "center";
  g.fillStyle = "#3a2410";
  g.font = `700 32px ${bodyFont}`;
  g.fillText("THE QUEST", cx, 410);
  g.font = `800 92px ${titleFont}`;
  g.fillText(title[0], cx, 510, W - 200);
  g.font = `italic 700 80px ${titleFont}`;
  g.fillStyle = deep;
  g.fillText(title[1], cx, 600, W - 200);
  // The verse.
  g.fillStyle = "#3a2410";
  g.font = `italic 600 46px ${bodyFont}`;
  // Centred in the space between the title and the foot.
  const set = lines.flatMap((verse) => wrap(g, verse, W - 220));
  let y = 680 + Math.max(0, (H - 180 - 680 - set.length * 64) / 2) + 40;
  for (const line of set) {
    g.fillText(line, cx, y);
    y += 64;
  }
  g.font = `700 30px ${bodyFont}`;
  g.fillStyle = "#7a5a2c";
  g.fillText("Side Quest", cx, H - 100);
  return new Promise((resolve) => c.toBlob(resolve, "image/png"));
}

/** Share the ballad's picture where the device can (the share sheet on a
 * phone), else save it. Resolves false when neither worked. */
export async function shareBallad(
  title: [string, string],
  lines: string[],
  dragon?: string,
): Promise<boolean> {
  const blob = await balladImage(title, lines, dragon);
  if (!blob) return false;
  const file = new File([blob], "ballad.png", { type: "image/png" });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: title.join(" ") });
      return true;
    }
  } catch (error) {
    // The table closed the share sheet: nothing more to do.
    if ((error as Error).name === "AbortError") return true;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ballad.png";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return true;
}
