/** Shared, side-effect-free helpers for the VIDAA TV app support (CORS, short codes, device). */

export const SHORT_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O/1/I/L
export const SHORT_CODE_LENGTH = 6;
export const TV_ATTEMPT_TTL_MS = 10 * 60_000;

const DEFAULT_TV_ORIGINS = ["https://lettflix.com", "https://www.lettflix.com"];

export function normalizeDevice(value: unknown): "tv" | null {
  return value === "tv" ? "tv" : null;
}

export function generateShortCode(random: (n: number) => Uint8Array = defaultRandom): string {
  const bytes = random(SHORT_CODE_LENGTH);
  let out = "";
  for (let i = 0; i < SHORT_CODE_LENGTH; i++) {
    out += SHORT_CODE_ALPHABET[bytes[i] % SHORT_CODE_ALPHABET.length];
  }
  return out;
}

function defaultRandom(n: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(n));
}

export function isValidShortCode(code: string): boolean {
  if (code.length !== SHORT_CODE_LENGTH) return false;
  for (const ch of code) if (!SHORT_CODE_ALPHABET.includes(ch)) return false;
  return true;
}

export function allowedTvOrigins(envValue: string | undefined): string[] {
  const extra = (envValue ?? "")
    .split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter((s) => s && s !== "*");
  return [...DEFAULT_TV_ORIGINS, ...extra];
}

/** CORS headers for an allow-listed origin; empty when the origin is not allowed. Never "*". */
export function tvCorsHeaders(
  origin: string | null,
  envValue: string | undefined,
): Record<string, string> {
  if (!origin || !allowedTvOrigins(envValue).includes(origin)) return { Vary: "Origin" };
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function withTvCors(request: Request, response: Response): Response {
  const headers = tvCorsHeaders(request.headers.get("origin"), process.env.TV_ALLOWED_ORIGINS);
  for (const [k, v] of Object.entries(headers)) response.headers.set(k, v);
  return response;
}

export function tvPreflight(request: Request): Response {
  const headers = tvCorsHeaders(request.headers.get("origin"), process.env.TV_ALLOWED_ORIGINS);
  const allowed = "Access-Control-Allow-Origin" in headers;
  return new Response(null, { status: allowed ? 204 : 403, headers });
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Static phone page used for TV sign-in results and expired codes. Never redirects. */
export function phoneMessagePage(title: string, message: string, ok: boolean, status = 200): Response {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)} — Lettflix</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#111315;color:#fff;font-family:system-ui,sans-serif;text-align:center;padding:24px}
.c{max-width:360px}img{width:72px;height:72px;margin:0 auto 20px;display:block}
h1{font-size:22px;margin:0 0 10px}p{opacity:.75;font-size:15px;line-height:1.5;margin:0}
.b{width:40px;height:4px;border-radius:4px;margin:18px auto 0;background:${ok ? "#1E5EFF" : "#9C1533"}}</style></head>
<body><div class="c"><img src="/icon-192.png" alt="Lettflix"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p><div class="b"></div></div></body></html>`,
    {
      status,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    },
  );
}
