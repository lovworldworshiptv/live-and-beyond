import { createFileRoute } from "@tanstack/react-router";
import { generateShortCode, normalizeDevice, tvPreflight, withTvCors } from "@/lib/tv-support";

/**
 * Starts a KingsChat login attempt for the popup flow.
 * Returns the KingsChat auth URL plus a poll secret the client uses to pick up
 * the finished session (the popup itself cannot write to the opener's storage).
 * With { device: "tv" } it also returns a short_url for a scannable QR code.
 */
async function start(request: Request): Promise<Response> {
  const { buildLoginUrl, buildAttemptOrigin, safeRelativePath } = await import(
    "@/lib/kingschat.server"
  );

  let body: { return_path?: string; force_login?: boolean; device?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const returnPath = safeRelativePath(body.return_path, "/");
  const device = normalizeDevice(body.device);

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const pollSecret = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");

    let data: { id: string } | null = null;
    let shortCode: string | null = null;
    for (let tries = 0; tries < 5 && !data; tries++) {
      shortCode = device === "tv" ? generateShortCode() : null;
      const row: Record<string, unknown> = {
        poll_secret: pollSecret,
        return_path: returnPath,
        status: "pending",
      };
      if (device) row.device = device;
      if (shortCode) row.short_code = shortCode;
      const res = await supabaseAdmin
        .from("kingschat_login_attempts")
        .insert(row as never)
        .select("id")
        .single();
      if (res.error) {
        if (shortCode && res.error.code === "23505") continue; // code collision, retry
        throw new Error(res.error.message);
      }
      data = res.data;
    }
    if (!data) throw new Error("Could not start KingsChat login");

    const authUrl = buildLoginUrl({
      origin: buildAttemptOrigin(data.id),
      forceLogin: body.force_login === true,
    });

    const payload: Record<string, string> = {
      auth_url: authUrl,
      poll_secret: pollSecret,
      return_path: returnPath,
    };
    if (shortCode) payload.short_url = `${new URL(request.url).origin}/k/${shortCode}`;
    return Response.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "KingsChat login failed";
    console.error(`[KingsChat] login start failed: ${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/kingschat/login")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => tvPreflight(request),
      POST: async ({ request }) => withTvCors(request, await start(request)),
    },
  },
});
