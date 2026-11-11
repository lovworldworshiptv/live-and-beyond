import { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defaultHero, type HeroConfig } from "@/lib/homepage-defaults";
import { addSlideToHero, heroSlideFromRequest, HERO_REQUEST_KINDS, type HeroRequest } from "@/lib/hero-requests";

export function HeroRequestsCms({ onApproved }: { onApproved?: () => void }) {
  const [rows, setRows] = useState<(HeroRequest & { cms_channels: { name: string } | null })[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("hero_requests").select("*, cms_channels(name)").eq("status", "pending").order("created_at");
    setRows((data ?? []) as never);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const review = async (r: (typeof rows)[number], approve: boolean) => {
    setBusy(r.id);
    try {
      if (approve) {
        const { data } = await supabase.from("cms_settings").select("value").eq("key", "hero").maybeSingle();
        const hero = { ...defaultHero, ...((data?.value as HeroConfig | null) ?? {}) };
        const next = addSlideToHero(hero, heroSlideFromRequest(r, r.cms_channels?.name ?? "Lettflix"));
        const { error } = await supabase.from("cms_settings").upsert({ key: "hero", value: next as never });
        if (error) throw error;
      }
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("hero_requests").update({
        status: approve ? "approved" : "rejected", admin_note: notes[r.id]?.trim() || null,
        reviewed_by: u.user?.id, reviewed_at: new Date().toISOString(),
      }).eq("id", r.id);
      if (error) throw error;
      toast.success(approve ? "Added to the homepage banner" : "Request declined");
      if (approve) onApproved?.();
      void load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(null); }
  };

  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <div>
        <h3 className="font-semibold">Channel spotlight requests</h3>
        <p className="text-sm text-[color:var(--muted-foreground)]">Only admins place content in the hero. Approving adds the request as the first banner slide.</p>
      </div>
      {rows.length === 0 ? <p className="text-sm text-[color:var(--muted-foreground)]">No pending requests.</p> : rows.map(r => (
        <div key={r.id} className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center">
          {r.image_url && <img src={r.image_url} alt="" className="h-16 w-28 shrink-0 rounded object-cover" />}
          <div className="min-w-0 flex-1">
            <p className="font-medium">{r.title}</p>
            <p className="text-xs text-[color:var(--muted-foreground)]">{r.cms_channels?.name} · {HERO_REQUEST_KINDS.find(k => k.value === r.content_kind)?.label}{r.starts_at ? ` · ${new Date(r.starts_at).toLocaleString()}` : ""}</p>
            {r.description && <p className="text-xs mt-1 line-clamp-2">{r.description}</p>}
            <Input className="mt-2 h-9" placeholder="Optional note to the channel" value={notes[r.id] ?? ""} onChange={e => setNotes(n => ({ ...n, [r.id]: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={busy === r.id} onClick={() => review(r, true)}><Check className="size-4" /> Approve</Button>
            <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => review(r, false)}><X className="size-4" /> Decline</Button>
          </div>
        </div>
      ))}
    </div>
  );
}
