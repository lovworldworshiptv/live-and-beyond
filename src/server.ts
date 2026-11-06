import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

type AssetsBinding = { fetch: (request: Request) => Promise<Response> };

/**
 * The VIDAA TV app is a self-contained static app in public/tv/. Static assets are normally
 * served before this worker runs; this only covers what reaches it so no app route renders there.
 */
async function serveTvApp(request: Request, env: unknown): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/tv" && !url.pathname.startsWith("/tv/")) return null;
  if (url.pathname === "/tv") {
    return new Response(null, { status: 301, headers: { Location: `/tv/${url.search}` } });
  }
  const isIndex = url.pathname === "/tv/" || url.pathname === "/tv/index.html";
  if (import.meta.env.DEV) {
    // Vite dev does not reliably serve public/tv; read it from disk (dev only).
    const rel = isIndex ? "index.html" : decodeURIComponent(url.pathname.slice(4));
    if (rel.includes("..")) return new Response("Not found", { status: 404 });
    try {
      const fs = await import("node:fs/promises");
      const body = await fs.readFile(`${process.cwd()}/public/tv/${rel}`);
      const ext = rel.split(".").pop() ?? "";
      const types: Record<string, string> = {
        html: "text/html; charset=utf-8", js: "text/javascript", css: "text/css",
        json: "application/json", png: "image/png", jpg: "image/jpeg", svg: "image/svg+xml",
        webp: "image/webp", mp4: "video/mp4", woff2: "font/woff2",
      };
      return new Response(body, {
        headers: {
          "Content-Type": types[ext] ?? "application/octet-stream",
          "Cache-Control": isIndex ? "no-cache" : "public, max-age=86400",
        },
      });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  }
  const assets = (env as { ASSETS?: AssetsBinding } | undefined)?.ASSETS;
  if (!isIndex) {
    if (assets?.fetch) return assets.fetch(request);
    return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain" } });
  }
  if (request.headers.get("x-lettflix-tv-index")) return null; // loop guard
  let res: Response | null = null;
  for (const path of ["/tv/index.html", "/tv/"]) {
    const sub = new Request(new URL(path, url.origin), {
      headers: { "x-lettflix-tv-index": "1" },
    });
    const r = assets?.fetch ? await assets.fetch(sub) : await fetch(sub);
    if (r.ok) {
      res = r;
      break;
    }
  }
  if (!res) return new Response("TV app not found", { status: 404 });
  const headers = new Headers(res.headers);
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Cache-Control", "no-cache");
  return new Response(res.body, { status: 200, headers });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const tv = await serveTvApp(request, env);
      if (tv) return tv;
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
