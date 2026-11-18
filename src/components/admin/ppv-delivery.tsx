import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { savePpvDelivery, getPpvDeliverySettings, reconcilePpvPayments } from "@/lib/ppv.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Save } from "lucide-react";
import { toast } from "sonner";

export function PpvDelivery({ events }: { events: { id: string; title: string }[] }) {
  const save = useServerFn(savePpvDelivery);
  const fetchSettings = useServerFn(getPpvDeliverySettings);
  const reconcile = useServerFn(reconcilePpvPayments);
  const [eventId, setEventId] = useState("");
  const [uid, setUid] = useState("");
  const [sandbox, setSandbox] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [countries, setCountries] = useState("");
  const [result, setResult] = useState("");
  useEffect(() => {
    let disposed = false;
    setUid(""); setCountries(""); setEnabled(false); setSandbox(true);
    if (!eventId) return;
    setBusy(true);
    void fetchSettings({ data: { eventId } }).then(settings => {
      if (disposed || !settings) return;
      setUid(settings.stream_uid); setCountries(settings.allowed_countries.join(", ")); setEnabled(settings.sales_enabled); setSandbox(settings.sandbox);
    }).catch(() => { if (!disposed) toast.error("Could not load delivery settings"); }).finally(() => { if (!disposed) setBusy(false); });
    return () => { disposed = true; };
  }, [eventId, fetchSettings]);
  return <section className="border-t border-border pt-6"><h3 className="font-semibold">Protected event delivery</h3>
    <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={async e => {
      e.preventDefault(); setBusy(true);
      try { await save({ data: { eventId, streamUid: uid.trim(), sandbox, salesEnabled: enabled, allowedCountries: countries.split(",").map(value => value.trim().toUpperCase()).filter(Boolean) } }); toast.success("Protected delivery saved"); }
      catch (error) { toast.error(error instanceof Error ? error.message : "Could not save delivery"); } finally { setBusy(false); }
    }}>
      <label className="grid gap-2 text-sm">Event<select required value={eventId} onChange={e => setEventId(e.target.value)} className="h-10 min-w-0 rounded-md border border-input bg-background px-3"><option value="">Select event</option>{events.map(event => <option key={event.id} value={event.id}>{event.title}</option>)}</select></label>
      <label className="grid gap-2 text-sm">Protected Stream video ID<Input required pattern="[a-f0-9]{32}" value={uid} onChange={e => setUid(e.target.value)} /></label>
      <label className="grid gap-2 text-sm">Allowed countries (ISO codes)<Input placeholder="NG, GB, US · empty for all countries" value={countries} onChange={e => setCountries(e.target.value)} /></label>
      <p className="self-center text-sm text-muted-foreground">One active stream per ticket · New playback takes over</p>
      <label className="flex items-center justify-between gap-3 text-sm">Squad test environment<Switch checked={sandbox} onCheckedChange={setSandbox} /></label>
      <label className="flex items-center justify-between gap-3 text-sm">Open test ticket sales<Switch checked={enabled} onCheckedChange={setEnabled} disabled={!sandbox} /></label>
      <Button disabled={busy} type="submit" variant="outline"><Save />Save delivery</Button>
    </form>
    <div className="mt-4 space-y-2"><Button variant="outline" disabled={busy} onClick={async () => { setBusy(true); try { const checked = await reconcile({ data: {} }); setResult(`${checked.checked} checked · ${checked.confirmed} confirmed · ${checked.deferred} awaiting retry`); } catch { setResult("Payment checks unavailable"); } finally { setBusy(false); } }}>Check pending payments</Button>{result && <p role="status" className="text-sm text-muted-foreground">{result}</p>}</div>
  </section>;
}