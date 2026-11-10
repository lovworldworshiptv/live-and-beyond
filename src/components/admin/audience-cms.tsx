import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AudienceReach } from "@/components/audience-reach";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_APP_LINKS, type AppLinks } from "@/lib/share-link.functions";

export function AudienceCms() {
  const [channels, setChannels] = useState<{ id: string; name: string }[]>([]);
  const [channelId, setChannelId] = useState("");
  const [links, setLinks] = useState<AppLinks>(DEFAULT_APP_LINKS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("cms_channels").select("id, name").is("deleted_at", null).order("name").then(({ data }) => setChannels(data ?? []));
    supabase.from("cms_settings").select("value").eq("key", "appLinks").maybeSingle().then(({ data }) => {
      if (data?.value) setLinks({ ...DEFAULT_APP_LINKS, ...(data.value as Partial<AppLinks>) });
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("cms_settings").upsert({ key: "appLinks", value: links as never, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) toast.error("Could not save app links"); else toast.success("App links saved");
  };

  const field = (key: keyof AppLinks, label: string, placeholder: string) => (
    <div className="min-w-0 space-y-1.5"><Label htmlFor={`al-${key}`}>{label}</Label>
      <Input id={`al-${key}`} value={links[key]} placeholder={placeholder} onChange={(e) => setLinks({ ...links, [key]: e.target.value.trim() })} /></div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 space-y-1.5"><Label htmlFor="aud-ch">Channel</Label>
          <select id="aud-ch" value={channelId} onChange={(e) => setChannelId(e.target.value)} className="h-10 w-full max-w-xs rounded-md border border-border bg-background px-3 text-sm">
            <option value="">All of Lettflix</option>
            {channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></div>
      </div>
      <AudienceReach channelId={channelId || undefined} title={channelId ? "Channel audience" : "Platform audience"} />

      <section className="rounded-lg border border-border bg-elevated/40 p-5 space-y-4">
        <div><h2 className="text-lg font-semibold">Phone app links</h2>
          <p className="mt-1 text-xs text-muted-foreground">Shared links and QR codes open the Lettflix app when it is installed, or send people to these download pages.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("playStoreUrl", "Google Play link", "https://play.google.com/store/apps/details?id=…")}
          {field("loveworldAppStoreUrl", "Loveworld AppStore link", "https://…")}
          {field("androidPackage", "Android app ID", "com.lettflix.app")}
          {field("appScheme", "App link prefix", "lettflix")}
        </div>
        <Button onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save app links"}</Button>
      </section>
    </div>
  );
}
