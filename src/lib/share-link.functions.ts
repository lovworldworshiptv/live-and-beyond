import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type AppLinks = { playStoreUrl: string; loveworldAppStoreUrl: string; androidPackage: string; appScheme: string };
export const DEFAULT_APP_LINKS: AppLinks = { playStoreUrl: "", loveworldAppStoreUrl: "", androidPackage: "com.lettflix.app", appScheme: "lettflix" };

export type SharedTarget = {
  type: "channel" | "creator";
  id: string;
  name: string;
  subtitle: string | null;
  image: string | null;
  webPath: string;
  channels: { id: string; slug: string; name: string; logo: string | null }[];
  appLinks: AppLinks;
};

/** Public: resolves a shared channel/creator link to safe, published display data plus app download links. */
export const resolveSharedTarget = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ type: z.enum(["channel", "creator"]), id: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ data }): Promise<SharedTarget | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: setting } = await supabaseAdmin.from("cms_settings").select("value").eq("key", "appLinks").maybeSingle();
    const appLinks = { ...DEFAULT_APP_LINKS, ...((setting?.value as Partial<AppLinks>) ?? {}) };
    const isUuid = z.string().uuid().safeParse(data.id).success;
    const base = () => supabaseAdmin.from("cms_channels")
      .select("id, slug, name, tagline, logo_url, banner_url, creator_id, created_by")
      .eq("is_published", true).is("deleted_at", null);
    if (data.type === "channel") {
      const { data: ch } = await base().eq(isUuid ? "id" : "slug", data.id).maybeSingle();
      if (!ch) return null;
      return { type: "channel", id: ch.id, name: ch.name, subtitle: ch.tagline, image: ch.banner_url ?? ch.logo_url,
        webPath: `/channels/${ch.slug}`, channels: [], appLinks };
    }
    if (!isUuid) return null;
    const { data: chans } = await base().or(`creator_id.eq.${data.id},created_by.eq.${data.id}`).order("display_order").limit(12);
    const { data: profile } = await supabaseAdmin.from("profiles").select("display_name, handle").eq("id", data.id).maybeSingle();
    if (!profile && !chans?.length) return null;
    const first = chans?.[0];
    return {
      type: "creator", id: data.id,
      name: profile?.display_name ?? first?.name ?? "Lettflix creator",
      subtitle: profile?.handle ? `@${profile.handle}` : "Creator on Lettflix",
      image: first?.banner_url ?? first?.logo_url ?? null,
      webPath: first ? `/channels/${first.slug}` : "/channels",
      channels: (chans ?? []).map((c) => ({ id: c.id, slug: c.slug, name: c.name, logo: c.logo_url })),
      appLinks,
    };
  });
