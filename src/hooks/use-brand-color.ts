import { useEffect, useState } from "react";

const cache = new Map<string, [number, number, number] | null>();

/** Picks the most vivid dominant colour of an image; null when unreadable (e.g. cross-origin). */
function extract(src: string): Promise<[number, number, number] | null> {
  if (cache.has(src)) return Promise.resolve(cache.get(src)!);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      try {
        const s = 32;
        const canvas = document.createElement("canvas");
        canvas.width = s;
        canvas.height = s;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("no ctx");
        ctx.drawImage(img, 0, 0, s, s);
        const d = ctx.getImageData(0, 0, s, s).data;
        const buckets = new Map<string, { n: number; r: number; g: number; b: number; sat: number }>();
        for (let i = 0; i < d.length; i += 4) {
          const [r, g, b, a] = [d[i], d[i + 1], d[i + 2], d[i + 3]];
          if (a < 128) continue;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const sat = max === 0 ? 0 : (max - min) / max;
          if (max < 40 || (max > 235 && sat < 0.1) || sat < 0.25) continue;
          const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
          const bk = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0, sat: 0 };
          bk.n++; bk.r += r; bk.g += g; bk.b += b; bk.sat += sat;
          buckets.set(key, bk);
        }
        let best: [number, number, number] | null = null;
        let score = 0;
        for (const bk of buckets.values()) {
          const sc = bk.n * (0.5 + bk.sat / bk.n);
          if (sc > score) {
            score = sc;
            best = [Math.round(bk.r / bk.n), Math.round(bk.g / bk.n), Math.round(bk.b / bk.n)];
          }
        }
        cache.set(src, best);
        resolve(best);
      } catch {
        cache.set(src, null);
        resolve(null);
      }
    };
    img.onerror = () => {
      cache.set(src, null);
      resolve(null);
    };
    img.src = src;
  });
}

/** Returns an "r g b" string from the first readable image, or null to keep the default colour. */
export function useBrandColor(...sources: (string | undefined)[]) {
  const [rgb, setRgb] = useState<string | null>(null);
  const key = sources.filter(Boolean).join("|");
  useEffect(() => {
    let alive = true;
    (async () => {
      for (const src of sources) {
        if (!src) continue;
        const c = await extract(src);
        if (c) {
          if (alive) setRgb(c.join(" "));
          return;
        }
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return rgb;
}
