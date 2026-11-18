import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Ticket, Send, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MediaPicker } from "@/components/media-picker";
import { BrandLoader } from "@/components/brand-loader";
import { getPpvWorkspace, savePpvDraft, requestPpvSpotlight } from "@/lib/ppv.functions";
import { ppvEnabled, resolveCommission, toMinorUnits, type PpvDraft } from "@/lib/ppv";

type Workspace = Awaited<ReturnType<typeof getPpvWorkspace>>;
type Event = Workspace["events"][number];
const SELECT = "h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm";
const labels: Record<string, string> = { draft: "Draft", pending: "Awaiting review", approved: "Approved · Sales not open", rejected: "Changes requested" };

export function PpvPanel({ channelId }: { channelId: string }) {
  const getWorkspace = useServerFn(getPpvWorkspace);
  const saveDraft = useServerFn(savePpvDraft);
  const requestSpotlight = useServerFn(requestPpvSpotlight);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState(false);
  const [editor, setEditor] = useState<Event | "new" | null>(null);
  const load = useCallback(async () => {
    try { setError(false); setWorkspace(await getWorkspace({ data: { channelId } })); }
    catch { setError(true); }
  }, [getWorkspace, channelId]);
  useEffect(() => { void load(); }, [load]);
  if (error) return <section><p>Pay-Per-View could not be loaded.</p><Button className="mt-3" onClick={() => void load()}><RefreshCw />Try again</Button></section>;
  if (!workspace) return <BrandLoader variant="section" label="Loading Pay-Per-View" />;
  const settings = workspace.settings.find(item => item.channel_id === channelId);
  const enabled = ppvEnabled(workspace.platform?.enabled ?? false, settings?.enabled ?? false);
  const commission = resolveCommission(null, settings?.platform_commission_bps ?? null, workspace.platform?.platform_commission_bps);
  return <section className="space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-semibold"><Ticket className="text-accent" />Pay-Per-View</h2><p className="mt-1 text-sm text-muted-foreground">Platform {commission / 100}% · Channel {(10000 - commission) / 100}%</p></div><Button disabled={!enabled} onClick={() => setEditor("new")}><Plus />New event</Button></header>
    {!enabled && <p role="status" className="border-l-2 border-primary bg-primary/10 p-4 text-sm">Pay-Per-View is switched off {!workspace.platform?.enabled ? "platform-wide" : "for this channel"}. A Lettflix admin can enable it.</p>}
    <p className="text-sm text-muted-foreground">Ticket sales are not open. Payments and protected playback must be connected before launch.</p>
    {!workspace.events.length ? <div className="border-y border-border py-12 text-center"><Ticket className="mx-auto mb-3 size-8 text-muted-foreground" /><p>No PPV events yet.</p></div> : <div className="grid gap-3 sm:grid-cols-2">{workspace.events.map(event => <article key={event.id} className="min-w-0 overflow-hidden rounded-lg border border-border bg-card">
      {event.poster_url && <div className="aspect-video bg-surface"><img src={event.poster_url} alt={event.title} className="size-full object-contain" /></div>}
      <div className="p-4"><p className="text-xs font-medium text-accent">{labels[event.status]}</p><h3 className="mt-2 break-words font-semibold">{event.title}</h3><p className="mt-1 text-xs text-muted-foreground">Ticket sales: {event.sales_starts_at.startsWith("1970-") ? "On approval and activation" : new Date(event.sales_starts_at).toLocaleString()}</p><p className="mt-1 text-xs text-muted-foreground">Event starts: {new Date(event.starts_at).toLocaleString()} · {event.event_type === "vod" ? "VOD rental" : "Live event"}</p><p className="mt-3 text-sm">{new Intl.NumberFormat(undefined, { style: "currency", currency: "NGN" }).format(event.price_ngn_minor / 100)} · {new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(event.price_usd_minor / 100)}</p>
      {event.admin_note && <p className="mt-2 text-sm text-muted-foreground">{event.admin_note}</p>}
      <div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" disabled={!enabled} onClick={() => setEditor(event)}><Pencil />Edit draft</Button>
      {event.status === "approved" && <Button variant="secondary" disabled={!enabled || !event.poster_url || requesting !== null} onClick={async () => { setRequesting(event.id); try { await requestSpotlight({ data: { eventId: event.id } }); toast.success("Homepage spotlight requested — awaiting Admin approval"); } catch (err) { toast.error(err instanceof Error ? err.message : "Could not request spotlight"); } finally { setRequesting(null); } }}><Send />Request homepage spotlight</Button>}</div></div>
    </article>)}</div>}
    {editor && <EventEditor key={editor === "new" ? "new" : editor.id} event={editor === "new" ? null : editor} onClose={() => setEditor(null)} onSave={async payload => { await saveDraft({ data: { ...payload, channel_id: channelId } }); setEditor(null); toast.success(payload.status === "pending" ? "Event submitted" : "Draft saved"); await load(); }} />}
  </section>;
}

function EventEditor({ event, onClose, onSave }: { event: Event | null; onClose: () => void; onSave: (payload: Omit<PpvDraft, "channel_id">) => Promise<void> }) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [poster, setPoster] = useState(event?.poster_url ?? null);
  const [kind, setKind] = useState<"live" | "live_replay" | "vod">(event?.event_type === "vod" ? "vod" : event?.event_type === "live_replay" ? "live_replay" : "live");
  const localStart = event ? new Date(new Date(event.starts_at).getTime() - new Date(event.starts_at).getTimezoneOffset() * 60000).toISOString().slice(0,16) : "";
  const [starts, setStarts] = useState(localStart);
  const salesDate = new Date(event ? (event.sales_starts_at.startsWith("1970-") ? Math.min(Date.parse(event.created_at), Date.parse(event.starts_at)) : event.sales_starts_at) : Date.now());
  const [salesStarts, setSalesStarts] = useState(new Date(salesDate.getTime() - salesDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  const [duration, setDuration] = useState(event?.duration_minutes ?? 120);
  const [hours, setHours] = useState(event?.replay_hours ?? 48);
  const [days, setDays] = useState(event?.rental_start_days ?? 30);
  const [ngn, setNgn] = useState(event ? (event.price_ngn_minor / 100).toFixed(2) : "");
  const [usd, setUsd] = useState(event ? (event.price_usd_minor / 100).toFixed(2) : "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  async function save(status: "draft" | "pending") {
    setBusy(true); setError("");
    try {
      if (!title.trim() || !starts || !salesStarts) throw new Error("Add a title, ticket-sales start and event start");
      if (Date.parse(salesStarts) > Date.parse(starts)) throw new Error("Ticket sales must start before or at the event start time");
      await onSave({ ...(event ? { id: event.id } : {}), title, description, poster_url: poster, event_type: kind, sales_starts_at: new Date(salesStarts).toISOString(), starts_at: new Date(starts).toISOString(), duration_minutes: duration, replay_hours: hours, rental_start_days: days, price_ngn_minor: toMinorUnits(ngn), price_usd_minor: toMinorUnits(usd), status });
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save event"); }
    finally { setBusy(false); }
  }
  return <Dialog open onOpenChange={open => { if (!open && !busy && !uploading) onClose(); }}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-lg">
    <DialogHeader><DialogTitle>{event ? "Edit PPV event" : "New PPV event"}</DialogTitle><DialogDescription>Standard access · NGN and USD pricing</DialogDescription></DialogHeader>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-1 text-sm sm:col-span-2">Title<Input value={title} maxLength={160} onChange={e => setTitle(e.target.value)} /></label>
      <label className="grid gap-1 text-sm">Event type<select className={SELECT} value={kind} onChange={e => setKind(e.target.value as typeof kind)}><option value="live">Live event</option><option value="live_replay">Live + replay</option><option value="vod">VOD rental</option></select></label>
      <label className="grid gap-1 text-sm">Ticket sales start (your local time)<Input type="datetime-local" value={salesStarts} max={starts || undefined} onChange={e => setSalesStarts(e.target.value)} /></label>
      <label className="grid gap-1 text-sm">Event starts (your local time)<Input type="datetime-local" value={starts} min={salesStarts || undefined} onChange={e => setStarts(e.target.value)} /></label>
      <label className="grid gap-1 text-sm">NGN price<Input inputMode="decimal" value={ngn} onChange={e => setNgn(e.target.value)} /></label>
      <label className="grid gap-1 text-sm">USD price<Input inputMode="decimal" value={usd} onChange={e => setUsd(e.target.value)} /></label>
      <label className="grid gap-1 text-sm">Duration (minutes)<Input type="number" min={1} max={1440} value={duration} onChange={e => setDuration(Number(e.target.value))} /></label>
      {kind !== "live" && <label className="grid gap-1 text-sm">{kind === "vod" ? "Hours to finish once started" : "Replay access (hours)"}<Input type="number" min={1} max={720} value={hours} onChange={e => setHours(Number(e.target.value))} /></label>}
      {kind === "vod" && <label className="grid gap-1 text-sm">Days to start rental<Input type="number" min={1} max={365} value={days} onChange={e => setDays(Number(e.target.value))} /></label>}
      <label className="grid gap-1 text-sm sm:col-span-2">Description<Textarea value={description} maxLength={4000} onChange={e => setDescription(e.target.value)} /></label>
      <div className="sm:col-span-2"><p className="mb-2 text-sm">Event artwork</p><MediaPicker value={poster} onChange={setPoster} folder="ppv/posters" onUploadingChange={setUploading} /></div>
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" disabled={busy || uploading} onClick={() => void save("draft")}>Save draft</Button><Button disabled={busy || uploading} onClick={() => void save("pending")}><Send />Submit for review</Button></div>
  </DialogContent></Dialog>;
}