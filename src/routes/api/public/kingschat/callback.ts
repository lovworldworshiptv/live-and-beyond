import { createFileRoute } from "@tanstack/react-router";

type CallbackPayload = { code?: string; origin?: string };

async function handleCallback(request: Request, payload: CallbackPayload): Promise<Response> {
  const appOrigin = new URL(request.url).origin;
  const {
    exchangeCodeForTokens,
    fetchProfile,
    safeRelativePath,
    syntheticEmail,
  } = await import("@/lib/kingschat.server");

  const next = safeRelativePath(payload.origin, "/");
  const fail = (message: string) => {
    console.error(`[KingsChat] callback failed: ${message}`);
    return Response.redirect(
      new URL(`/auth?kingschat_error=${encodeURIComponent(message)}`, appOrigin).toString(),
      303,
    );
  };

  if (!payload.code) return fail("Missing authorization code from KingsChat");

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

    const redirectTo = new URL(next, appOrigin).toString();
    const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });
    if (linkError || !link?.properties?.action_link || !link.user) {
      return fail(linkError?.message ?? "Could not start a Lettflix session");
    }

    const { error: identityError } = await supabaseAdmin.from("kingschat_identities").upsert(
      {
        user_id: link.user.id,
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

    return Response.redirect(link.properties.action_link, 303);
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
