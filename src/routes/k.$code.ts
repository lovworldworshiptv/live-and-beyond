import { createFileRoute } from "@tanstack/react-router";
import { isValidShortCode, phoneMessagePage, TV_ATTEMPT_TTL_MS } from "@/lib/tv-support";

const expired = () =>
  phoneMessagePage("This code has expired", "Show a new code on your TV.", false, 410);

/** Short link shown as a QR code on the TV; forwards the phone to KingsChat sign-in. */
export const Route = createFileRoute("/k/$code")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const code = String(params.code ?? "").toUpperCase();
        if (!isValidShortCode(code)) return expired();
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data } = await supabaseAdmin
            .from("kingschat_login_attempts")
            .select("id, status, device, created_at")
            .eq("short_code", code)
            .maybeSingle();
          if (
            !data ||
            data.device !== "tv" ||
            data.status !== "pending" ||
            Date.now() - new Date(data.created_at).getTime() > TV_ATTEMPT_TTL_MS
          ) {
            return expired();
          }
          const { buildLoginUrl, buildAttemptOrigin } = await import("@/lib/kingschat.server");
          return new Response(null, {
            status: 302,
            headers: {
              Location: buildLoginUrl({ origin: buildAttemptOrigin(data.id) }),
              "Cache-Control": "no-store",
            },
          });
        } catch (error) {
          console.error(`[KingsChat] short link failed: ${String(error)}`);
          return expired();
        }
      },
    },
  },
});
