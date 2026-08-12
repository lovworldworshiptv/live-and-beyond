import { createFileRoute } from "@tanstack/react-router";

/**
 * Starts a KingsChat login attempt for the popup flow.
 * Returns the KingsChat auth URL plus a poll secret the client uses to pick up
 * the finished session (the popup itself cannot write to the opener's storage).
 */
async function start(request: Request): Promise<Response> {
  const { buildLoginUrl, buildAttemptOrigin, safeRelativePath } = await import(
    "@/lib/kingschat.server"
  );

  let body: { return_path?: string; force_login?: boolean } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const returnPath = safeRelativePath(body.return_path, "/");

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const pollSecret = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");

    const { data, error } = await supabaseAdmin
      .from("kingschat_login_attempts")
      .insert({ poll_secret: pollSecret, return_path: returnPath, status: "pending" })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Could not start KingsChat login");

    const authUrl = buildLoginUrl({
      origin: buildAttemptOrigin(data.id),
      forceLogin: body.force_login === true,
    });

    return Response.json({ auth_url: authUrl, poll_secret: pollSecret, return_path: returnPath });
  } catch (error) {
    const message = error instanceof Error ? error.message : "KingsChat login failed";
    console.error(`[KingsChat] login start failed: ${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/kingschat/login")({
  server: {
    handlers: {
      POST: async ({ request }) => start(request),
    },
  },
});
