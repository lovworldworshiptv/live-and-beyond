import QRCode from "qrcode";

/** Canvas colours are drawing values, not UI classes; they mirror the brand tokens. */
const BG = "#111315";
const MAROON = "#9C1533";
const BLUE = "#1E5EFF";

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > max && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

/** Builds a 1080x1920 story-format share card with artwork and a unique QR code for the URL. */
export async function createShareCard(opts: {
  title: string;
  subtitle?: string;
  url: string;
  image?: string | null;
}): Promise<Blob> {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, MAROON);
  g.addColorStop(0.55, BG);
  g.addColorStop(1, BLUE);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const art = opts.image ? await loadImage(opts.image) : null;
  const ax = 90, ay = 260, aw = 900, ah = 900;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(ax, ay, aw, ah, 40);
  ctx.clip();
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(ax, ay, aw, ah);
  if (art) {
    // Blurred fill + contained foreground so artwork is never cropped.
    ctx.filter = "blur(40px) brightness(0.7)";
    const s1 = Math.max(aw / art.width, ah / art.height);
    ctx.drawImage(art, ax + (aw - art.width * s1) / 2, ay + (ah - art.height * s1) / 2, art.width * s1, art.height * s1);
    ctx.filter = "none";
    const s2 = Math.min(aw / art.width, ah / art.height);
    ctx.drawImage(art, ax + (aw - art.width * s2) / 2, ay + (ah - art.height * s2) / 2, art.width * s2, art.height * s2);
  }
  ctx.restore();

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 64px Oswald, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("LETTFLIX", 90, 170);

  ctx.font = "700 76px Oswald, sans-serif";
  const lines = wrap(ctx, opts.title, 900);
  lines.forEach((l, i) => ctx.fillText(l, 90, 1270 + i * 88));
  let y = 1270 + lines.length * 88;
  if (opts.subtitle) {
    ctx.font = "500 38px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(opts.subtitle, 90, y + 10);
    y += 50;
  }

  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, opts.url, { width: 260, margin: 1, color: { dark: BG, light: "#ffffff" } });
  const qy = H - 400;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(90, qy, 300, 300, 28);
  ctx.fill();
  ctx.drawImage(qr, 110, qy + 20, 260, 260);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 44px sans-serif";
  ctx.fillText("Scan to watch", 430, qy + 120);
  ctx.font = "400 32px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText(opts.url.replace(/^https?:\/\//, "").slice(0, 34), 430, qy + 175);

  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/png");
    } catch (e) {
      reject(e);
    }
  });
}
