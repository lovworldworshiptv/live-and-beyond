import { createFileRoute } from "@tanstack/react-router";

type CallbackPayload = { code?: string; origin?: string };

function closingPage(message: string, ok: boolean, fallbackPath = "/auth"): Response {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>KingsChat</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#111315;color:#fff;font-family:system-ui,sans-serif;text-align:center;padding:24px}
.c{max-width:340px}.d{width:44px;height:44px;border-radius:999px;margin:0 auto 16px;background:${ok ? "#1E5EFF" : "#9C1533"}}
p{opacity:.75;font-size:14px;line-height:1.5}</style></head>
<body><div class="c"><div class="d"></div><p>${message}</p></div>
<script>setTimeout(function(){
  if (window.opener && window.opener !== window) { try { window.close() } catch (e) {} }
  else { window.location.replace(${JSON.stringify(fallbackPath)}) }
},${ok ? 600 : 2000})</script>
</body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

async function handleCallback(request: Request, payload: CallbackPayload): Promise<Response> {
  const appOrigin = new URL(request.url).origin;
  const {
    exchangeCodeForTokens,
    fetchProfile,
    syntheticEmail,
    parseAttemptOrigin,
    createSessionForEmail,
  } = await import("@/lib/kingschat.server");

  const attempt = parseAttemptOrigin(payload.origin);
  let next = "/";

  if (attempt) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: attemptData } = await supabaseAdmin
      .from("kingschat_login_attempts")
      .select("return_path")
      .eq("id", attempt.attemptId)
      .maybeSingle();
    next = attempt.next ?? attemptData?.return_path ?? "/";
  }

  const markAttemptFailed = async (message: string) => {
    if (!attempt) return;
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("kingschat_login_attempts")
        .update({ status: "failed", error: message, updated_at: new Date().toISOString() })
        .eq("id", attempt.attemptId);
    } catch (err) {
      console.error(`[KingsChat] could not mark attempt failed: ${String(err)}`);
    }
  };

  const fail = async (message: string) => {
    console.error(`[KingsChat] callback failed: ${message}`);
    if (attempt) {
      await markAttemptFailed(message);
      return closingPage("KingsChat sign-in failed. You can close this window.", false, "/auth");
    }
    return Response.redirect(
      new URL(`/auth?kingschat_error=${encodeURIComponent(message)}`, appOrigin).toString(),
      303,
    );
  };

  if (!payload.code) return fail("Missing authorization code from KingsChat");
  if (!attempt) return fail("Invalid or expired KingsChat login attempt");

  try {
    // Codes expire after 1 hour — exchange immediately.
    const tokens = await exchangeCodeForTokens(payload.code);
    const profile = await fetchProfile(tokens.access_token);
    if (!profile.kingschatUserId) return fail("KingsChat profile did not include a user id");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("kingschat_identities")
      .select("user_id")
      .eq("kingschat_user_id", profile.kingschatUserId)
      .maybeSingle();

    let email = profile.email ?? syntheticEmail(profile);
    if (existing?.user_id) {
      const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(existing.user_id);
      if (existingUser?.user?.email) email = existingUser.user.email;
    } else {
      const displayName = profile.name ?? profile.username ?? "KingsChat user";
      const handle =
        "@" +
        (profile.username ?? displayName)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          display_name: displayName,
          handle,
          avatar_url: profile.avatarUrl,
          kingschat_username: profile.username,
        },
      });
      // An already-registered email simply links the KingsChat account to it.
      if (createError && !/already|exists|registered/i.test(createError.message)) {
        return fail(createError.message);
      }
    }

    const session = await createSessionForEmail(email);

    const { error: identityError } = await supabaseAdmin.from("kingschat_identities").upsert(
      {
        user_id: session.userId,
        kingschat_user_id: profile.kingschatUserId,
        username: profile.username,
        name: profile.name,
        avatar_url: profile.avatarUrl,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + (tokens.expires_in_millis ?? 0)).toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "kingschat_user_id" },
    );
    if (identityError) console.error(`[KingsChat] identity upsert failed: ${identityError.message}`);

    const { error: attemptError } = await supabaseAdmin
      .from("kingschat_login_attempts")
      .update({
        status: "ready",
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        },
        return_path: next,
        updated_at: new Date().toISOString(),
      })
      .eq("id", attempt.attemptId);
    if (attemptError) return fail(attemptError.message);
    return closingPage("Signed in with KingsChat. You can close this window.", true, "/auth");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "KingsChat sign-in failed");
  }
}

export const Route = createFileRoute("/api/public/kingschat/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const contentType = request.headers.get("content-type") ?? "";
        let payload: CallbackPayload = {};
        try {
          if (contentType.includes("application/json")) {
            payload = (await request.json()) as CallbackPayload;
          } else {
            const form = await request.formData();
            payload = {
              code: (form.get("code") as string) ?? undefined,
              origin: (form.get("origin") as string) ?? undefined,
            };
          }
        } catch {
          payload = {};
        }
        return handleCallback(request, payload);
      },
      // Fallback for browser-navigation style callbacks.
      GET: async ({ request }) => {
        const url = new URL(request.url);
        return handleCallback(request, {
          code: url.searchParams.get("code") ?? undefined,
          origin: url.searchParams.get("origin") ?? undefined,
        });
      },
    },
  },
});
