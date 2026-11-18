import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, X, Save, Ticket, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { BrandLoader } from "@/components/brand-loader";
import { getPpvWorkspace, savePpvSettings, reviewPpvEvent } from "@/lib/ppv.functions";
import { DEFAULT_COMMISSION_BPS } from "@/lib/ppv";
import { SquadConnection } from "./squad-connection";
import { PpvDelivery } from "./ppv-delivery";

type Workspace = Awaited<ReturnType<typeof getPpvWorkspace>>;
export function PpvCms() {
  const fetchWorkspace = useServerFn(getPpvWorkspace);
  const saveSettings = useServerFn(savePpvSettings);
  const review = useServerFn(reviewPpvEvent);
  const [data, setData] = useState<Workspace | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try { setError(false); setData(await fetchWorkspace({ data: {} })); } catch { setError(true); }
  }, [fetchWorkspace]);
  useEffect(() => { void load(); }, [load]);
  async function act(action: () => Promise<unknown>) {
    setBusy(true);
    try { await action(); await load(); toast.success("Pay-Per-View updated"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Could not save"); }
    finally { setBusy(false); }
  }
  if (error) return <section><p>Pay-Per-View could not be loaded.</p><Button className="mt-3" onClick={() => void load()}><RefreshCw />Try again</Button></section>;
  if (!data) return <BrandLoader variant="section" label="Loading Pay-Per-View" />;
  return <div className="space-y-8">
    <header><h2 className="flex items-center gap-2 text-xl font-semibold"><Ticket className="text-accent" />Pay-Per-View</h2><p className="mt-2 text-sm text-muted-foreground">Event preparation, approvals and ticket sales</p></header>
    <SquadConnection />
    <PpvDelivery events={data.events} />
    <SettingsRow key={`platform-${data.platform?.updated_at}`} title="Platform-wide PPV" enabled={data.platform?.enabled ?? false} commission={data.platform?.platform_commission_bps ?? DEFAULT_COMMISSION_BPS} busy={busy} onSave={values => act(() => saveSettings({ data: values }))} />
    <section><h3 className="mb-4 font-semibold">Channels</h3><div className="divide-y divide-border">{data.channels.map(channel => {
      const setting = data.settings.find(row => row.channel_id === channel.id);
      return <SettingsRow key={`${channel.id}-${setting?.updated_at}`} title={channel.name} enabled={setting?.enabled ?? false} commission={setting?.platform_commission_bps ?? null} approvalRequired={setting?.approval_required ?? true} busy={busy} onSave={values => act(() => saveSettings({ data: { ...values, channelId: channel.id } }))} />;
    })}</div></section>
    <section><h3 className="mb-4 font-semibold">Event approval queue</h3>{!data.events.some(event => event.status === "pending") && <p className="text-sm text-muted-foreground">No events awaiting review.</p>}
      <div className="grid gap-4 sm:grid-cols-2">{data.events.filter(event => event.status === "pending").map(event => <ReviewItem key={event.id} event={event} channel={data.channels.find(c => c.id === event.channel_id)?.name ?? "Channel"} busy={busy} onReview={(status, note, commissionBps) => act(() => review({ data: { id: event.id, status, note, commissionBps } }))} />)}</div>
    </section>
    <section><h3 className="mb-4 font-semibold">Recent events</h3><div className="divide-y divide-border">{data.events.map(event => <div key={event.id} className="flex flex-wrap justify-between gap-2 py-3"><div className="min-w-0"><p className="break-words text-sm font-medium">{event.title}</p><p className="text-xs text-muted-foreground">{data.channels.find(c => c.id === event.channel_id)?.name} · {new Date(event.starts_at).toLocaleString()}</p></div><span className="text-xs text-accent">{event.status === "approved" ? "Approved · Sales not open" : event.status}</span></div>)}{!data.events.length && <p className="text-sm text-muted-foreground">No PPV events yet.</p>}</div></section>
  </div>;
}
function SettingsRow({ title, enabled, commission, approvalRequired, busy, onSave }: { title: string; enabled: boolean; commission: number | null; approvalRequired?: boolean; busy: boolean; onSave: (values: { enabled: boolean; commissionBps: number | null; approvalRequired: boolean }) => Promise<void> }) {
  const [on, setOn] = useState(enabled);
  const [rate, setRate] = useState(commission === null ? "" : String(commission / 100));
  const [approval, setApproval] = useState(approvalRequired ?? true);
  return <form className="grid items-center gap-4 border-b border-border py-5 md:grid-cols-[minmax(0,1fr)_minmax(130px,180px)_auto]" onSubmit={e => { e.preventDefault(); const value = rate === "" ? null : Number(rate); if (value !== null && (!Number.isFinite(value) || value < 0 || value > 100 || !/^\d+(\.\d{1,2})?$/.test(rate))) { toast.error("Commission must be between 0 and 100%, with up to two decimal places"); return; } void onSave({ enabled: on, commissionBps: value === null ? null : Math.round(value * 100), approvalRequired: approval }); }}>
    <div className="min-w-0"><div className="flex items-center justify-between gap-3"><span className="break-words font-medium">{title}</span><Switch aria-label={`${title} PPV`} checked={on} disabled={busy} onCheckedChange={setOn} /></div>{approvalRequired !== undefined && <label className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">Require event approval<Switch aria-label={`${title} require approval`} checked={approval} disabled={busy} onCheckedChange={setApproval} /></label>}</div>
    <label className="grid gap-1 text-xs text-muted-foreground">Platform commission (%)<Input required={approvalRequired === undefined} type="number" min={0} max={100} step="0.01" placeholder="Use platform rate" value={rate} disabled={busy} onChange={e => setRate(e.target.value)} />{rate !== "" && <span>Channel: {Number((100 - Number(rate)).toFixed(2))}%</span>}</label>
    <Button type="submit" variant="outline" disabled={busy}><Save />Save</Button>
  </form>;
}
function ReviewItem({ event, channel, busy, onReview }: { event: Workspace["events"][number]; channel: string; busy: boolean; onReview: (status: "approved" | "rejected", note: string, commission: number | null) => Promise<void> }) {
  const [note, setNote] = useState("");
  const [commission, setCommission] = useState("");
  function submit(status: "approved" | "rejected") {
    const value = commission === "" ? null : Math.round(Number(commission) * 100);
    if (value !== null && (!Number.isInteger(value) || value < 0 || value > 10000)) return toast.error("Invalid commission");
    void onReview(status, note, value);
  }
  return <article className="min-w-0 rounded-lg border border-border bg-card p-4">
    {event.poster_url && <img src={event.poster_url} alt={event.title} className="mb-3 aspect-video w-full object-contain" />}
    <p className="text-xs text-accent">{channel}</p><h4 className="mt-1 break-words font-semibold">{event.title}</h4><p className="mt-2 text-sm text-muted-foreground">{event.description}</p><p className="mt-2 text-xs">{new Date(event.starts_at).toLocaleString()} · {event.price_ngn_minor / 100} NGN · {event.price_usd_minor / 100} USD</p>
    <label className="mt-4 grid gap-1 text-xs">Review note<Input value={note} maxLength={1000} onChange={e => setNote(e.target.value)} /></label><label className="mt-3 grid gap-1 text-xs">Event platform commission override (%)<Input type="number" min={0} max={100} step="0.01" placeholder="Use channel / platform rate" value={commission} onChange={e => setCommission(e.target.value)} /></label>
    <div className="mt-4 flex flex-wrap gap-2"><Button disabled={busy} onClick={() => submit("approved")}><Check />Approve</Button><Button disabled={busy} variant="outline" onClick={() => submit("rejected")}><X />Request changes</Button></div>
  </article>;
}