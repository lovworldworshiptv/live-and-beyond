import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type DeleteAccountResult = { ok: true } | { ok: false; reason: "owns_channels" | "failed"; message: string };

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { confirm: string }) => {
    if (input?.confirm !== "DELETE") throw new Error("Type DELETE to confirm.");
    return input;
  })
  .handler(async ({ context }): Promise<DeleteAccountResult> => {
    const userId = context.userId;
    const email = typeof context.claims?.email === "string" ? context.claims.email : null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: owned, error: ownedError } = await supabaseAdmin
      .from("cms_channels").select("id, name").eq("creator_id", userId).eq("is_published", true).is("deleted_at", null);
    if (ownedError) { console.error("deleteMyAccount channel lookup", ownedError); return { ok: false, reason: "failed", message: "We couldn't check your channels. Nothing was deleted. Try again." }; }
    if (owned && owned.length) {
      return { ok: false, reason: "owns_channels", message: `You still own ${owned.map((c) => c.name).join(", ")}. Transfer or delete your channels in Studio first.` };
    }

    try {
      const { data: files } = await supabaseAdmin.storage.from("avatars").list(userId, { limit: 1000 });
      if (files?.length) await supabaseAdmin.storage.from("avatars").remove(files.map((f) => `${userId}/${f.name}`));

      const byUser = ["channel_follows", "channel_members", "notifications", "device_push_tokens", "login_history", "kingschat_identities", "user_roles", "creator_applications"] as const;
      for (const table of byUser) {
        const { error } = await supabaseAdmin.from(table).delete().eq("user_id", userId);
        if (error) throw new Error(`${table}: ${error.message}`);
      }
      await supabaseAdmin.from("playback_events").update({ user_id: null }).eq("user_id", userId);
      const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", userId);
      if (profileError) throw new Error(`profiles: ${profileError.message}`);

      await supabaseAdmin.from("audit_log").insert({ actor_id: null, actor_email: email, action: "account.deleted", resource_type: "user", resource_id: userId, metadata: {} });

      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) throw new Error(`auth: ${authError.message}`);
      return { ok: true };
    } catch (err) {
      console.error("deleteMyAccount failed", err);
      return { ok: false, reason: "failed", message: "We couldn't finish deleting your account. Try again or email support@lettflix.com." };
    }
  });
