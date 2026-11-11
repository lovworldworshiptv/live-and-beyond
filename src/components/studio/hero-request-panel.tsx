import { useCallback, useEffect, useState } from "react";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HERO_REQUEST_KINDS, type HeroRequest, type HeroRequestKind } from "@/lib/hero-requests";

type TitleOpt = { slug: string; title: string; kind: string; backdrop_url: string | null; poster_url: string | null; synopsis: string | null };
const STATUS: Record<HeroRequest["status"], string> = { pending: "Awaiting review", approved: "Approved — on the homepage", rejected: "Not approved" };

export function HeroRequestPanel({ channelId }: { channelId: string }) {
  const [rows, setRows] = useState<HeroRequest[]>([]);
  const [titles, setTitles] = useState<TitleOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState<HeroRequestKind>("movie");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [startsAt, setStartsAt] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: req }, { data: t }] = await Promise.all([
      supabase.from("hero_requests").select("*").eq("channel_id", channelId).order("created_at", { ascending: false }),
      supabase.from("cms_titles").select("slug,title,kind,backdrop_url,poster_url,synopsis").eq("channel_id", channelId).eq("is_published", true).is("deleted_at", null).order("title"),
    ]);
    setRows((req ?? []) as HeroRequest[]);
    setTitles((t ?? []) as TitleOpt[]);
    setLoading(false);
  }, [channelId]);
  useEffect(() => { void load(); }, [load]);

  const pickTitle = (s: string) => {
    setSlug(s);
    const t = titles.find(x => x.slug === s);
    if (t) { setTitle(t.title); setDescription(t.synopsis ?? ""); setImageUrl(t.backdrop_url ?? t.poster_url ?? ""); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Add a title");
    if (kind !== "upcoming" && !slug) return toast.error("Choose the published title to feature");
    if (kind === "upcoming" && !startsAt) return toast.error("Add when the show starts");
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("hero_requests").insert({
      channel_id: channelId, requested_by: u.user!.id, content_kind: kind, title: title.trim(),
      description: description.trim() || null, content_slug: kind === "upcoming" ? null : slug,
      image_url: imageUrl.trim() || null, starts_at: startsAt ? new Date(startsAt).toISOString() : null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Request sent to the Lettflix team");
    setSlug(""); setTitle(""); setDescription(""); setImageUrl(""); setStartsAt("");
    void load();
  };

  const withdraw = async (id: string) => {
    const { error } = await supabase.from("hero_requests").delete().eq("id", id);
    if (error) return toast.error(error.message);
    void load();
  };

  const field = "w-full h-11 rounded-md border border-border bg-surface px-3 text-sm";
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2"><Sparkles className="size-5 text-accent" /> Homepage spotlight</h2>
        <p className="text-sm text-muted-foreground">Apply to feature a movie, series, show, podcast or upcoming show on the Lettflix homepage banner. The Lettflix team reviews every request.</p>
      </div>
      <form onSubmit={submit} className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
        <label className="text-sm grid gap-1">What to feature
          <select className={field} value={kind} onChange={e => setKind(e.target.value as HeroRequestKind)}>
            {HERO_REQUEST_KINDS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
        </label>
        {kind === "upcoming" ? (
          <label className="text-sm grid gap-1">Starts
            <Input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} />
          </label>
        ) : (
          <label className="text-sm grid gap-1">Published title
            <select className={field} value={slug} onChange={e => pickTitle(e.target.value)}>
              <option value="">{titles.length ? "Choose…" : "No published titles yet"}</option>
              {titles.map(t => <option key={t.slug} value={t.slug}>{t.title}</option>)}
            </select>
          </label>
        )}
        <label className="text-sm grid gap-1 sm:col-span-2">Banner title<Input value={title} maxLength={160} onChange={e => setTitle(e.target.value)} /></label>
        <label className="text-sm grid gap-1 sm:col-span-2">Short description<Textarea value={description} maxLength={600} onChange={e => setDescription(e.target.value)} /></label>
        <label className="text-sm grid gap-1 sm:col-span-2">Banner image link (wide image)<Input value={imageUrl} placeholder="https://…" onChange={e => setImageUrl(e.target.value)} /></label>
        <div className="sm:col-span-2"><Button type="submit" disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" />} Send request</Button></div>
      </form>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Your requests</h3>
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : rows.length === 0 ? <p className="text-sm text-muted-foreground">No requests yet.</p> : rows.map(r => (
          <div key={r.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
            {r.image_url && <img src={r.image_url} alt="" className="h-12 w-20 shrink-0 rounded object-cover" />}
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{r.title}</p>
              <p className="text-xs text-muted-foreground">{HERO_REQUEST_KINDS.find(k => k.value === r.content_kind)?.label} · {STATUS[r.status]}</p>
              {r.admin_note && <p className="text-xs mt-1">Note: {r.admin_note}</p>}
            </div>
            {r.status === "pending" && <Button size="icon" variant="ghost" aria-label="Withdraw request" onClick={() => withdraw(r.id)}><Trash2 className="size-4" /></Button>}
          </div>
        ))}
      </div>
    </section>
  );
}
