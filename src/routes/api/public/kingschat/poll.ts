import { createFileRoute } from "@tanstack/react-router";

/** Client polls this until the popup callback has stored a session. */
async function poll(request: Request): Promise<Response> {
  let body: { poll_secret?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }
  const secret = typeof body.poll_secret === "string" ? body.poll_secret : "";
  if (!secret) return Response.json({ status: "unknown" });

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("kingschat_login_attempts")
    .select("id, status, session, error, return_path, created_at")
    .eq("poll_secret", secret)
    .maybeSingle();

  if (!data) return Response.json({ status: "unknown" });

  // Attempts are single-use and short-lived.
  if (Date.now() - new Date(data.created_at).getTime() > 10 * 60_000) {
    await supabaseAdmin.from("kingschat_login_attempts").delete().eq("id", data.id);
    return Response.json({ status: "failed", error: "KingsChat sign-in expired" });
  }

  if (data.status === "ready" && data.session) {
    await supabaseAdmin.from("kingschat_login_attempts").delete().eq("id", data.id);
    return Response.json({
      status: "ready",
      session: data.session,
      return_path: data.return_path,
    });
  }

  if (data.status === "failed") {
    await supabaseAdmin.from("kingschat_login_attempts").delete().eq("id", data.id);
    return Response.json({ status: "failed", error: data.error ?? "KingsChat sign-in failed" });
  }

  return Response.json({ status: "pending" });
}

export const Route = createFileRoute("/api/public/kingschat/poll")({
  server: {
    handlers: {
      POST: async ({ request }) => poll(request),
    },
  },
});
