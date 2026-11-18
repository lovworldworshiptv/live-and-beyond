import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { savePpvDelivery, getPpvDeliverySettings, reconcilePpvPayments } from "@/lib/ppv.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { X } from "lucide-react";

const EXCLUDED = new Set(["EU","EZ","UN","QO","XA","XB","ZZ","AC","CP","DG","EA","IC","TA","CQ"]);
function countryOptions() {
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  const out: { code: string; name: string }[] = [];
  for (let a = 65; a <= 90; a++) for (let b = 65; b <= 90; b++) {
    const code = String.fromCharCode(a, b);
    if (EXCLUDED.has(code)) continue;
    try { const name = names.of(code); if (name && name !== code) out.push({ code, name }); } catch { /* skip */ }
  }
  return out.sort((x, y) => x.name.localeCompare(y.name));
}
const COUNTRY_OPTIONS = countryOptions();
const countryName = (code: string) => COUNTRY_OPTIONS.find(c => c.code === code)?.name ?? code;

export function PpvDelivery({ events }: { events: { id: string; title: string }[] }) {
  const save = useServerFn(savePpvDelivery);
  const fetchSettings = useServerFn(getPpvDeliverySettings);
  const reconcile = useServerFn(reconcilePpvPayments);
  const [eventId, setEventId] = useState("");
  const [uid, setUid] = useState("");
  const [sandbox, setSandbox] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [countries, setCountries] = useState<string[]>([]);
  const [result, setResult] = useState("");
  useEffect(() => {
    let disposed = false;
    setUid(""); setCountries([]); setEnabled(false); setSandbox(false);
    if (!eventId) return;
    setBusy(true);
    void fetchSettings({ data: { eventId } }).then(settings => {
      if (disposed || !settings) return;
      setUid(settings.stream_uid); setCountries(settings.allowed_countries); setEnabled(settings.sales_enabled); setSandbox(settings.sandbox);
    }).catch(() => { if (!disposed) toast.error("Could not load delivery settings"); }).finally(() => { if (!disposed) setBusy(false); });
    return () => { disposed = true; };
  }, [eventId, fetchSettings]);
  return <section className="border-t border-border pt-6"><h3 className="font-semibold">Protected event delivery</h3>
    <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={async e => {
      e.preventDefault(); setBusy(true);
      try { await save({ data: { eventId, streamUid: uid.trim(), sandbox, salesEnabled: enabled, allowedCountries: countries } }); toast.success("Protected delivery saved"); }
      catch (error) { toast.error(error instanceof Error ? error.message : "Could not save delivery"); } finally { setBusy(false); }
    }}>
      <label className="grid gap-2 text-sm">Event<select required value={eventId} onChange={e => setEventId(e.target.value)} className="h-10 min-w-0 rounded-md border border-input bg-background px-3"><option value="">Select event</option>{events.map(event => <option key={event.id} value={event.id}>{event.title}</option>)}</select><span className="text-xs text-muted-foreground">A ticketed show a channel created in Studio → Pay-Per-View.</span></label>
      <label className="grid gap-2 text-sm">Protected Stream video ID<Input required pattern="[a-f0-9]{32}" placeholder="32-character Cloudflare Stream ID" value={uid} onChange={e => setUid(e.target.value)} data-allow-copy /><span className="text-xs text-muted-foreground">The video only paying ticket holders can watch, uploaded to Cloudflare Stream with signed links required.</span></label>
      <div className="grid gap-2 text-sm"><label htmlFor="ppv-country">Allowed countries</label><select id="ppv-country" value="" onChange={e => { const code = e.target.value; if (code && !countries.includes(code)) setCountries([...countries, code]); }} className="h-10 min-w-0 rounded-md border border-input bg-background px-3"><option value="">{countries.length ? "Add another country" : "All countries (choose to limit)"}</option>{COUNTRY_OPTIONS.filter(c => !countries.includes(c.code)).map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select>
        {countries.length > 0 && <ul className="flex flex-wrap gap-2">{countries.map(code => <li key={code}><button type="button" onClick={() => setCountries(countries.filter(c => c !== code))} aria-label={`Remove ${countryName(code)}`} className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-3 py-1 text-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{countryName(code)}<X className="size-3" /></button></li>)}</ul>}
      </div>
      <p className="self-center text-sm text-muted-foreground">One active stream per ticket · New playback takes over</p>
      <label className="flex items-center justify-between gap-3 text-sm">Squad test environment<Switch checked={sandbox} onCheckedChange={setSandbox} /></label>
      <label className="flex items-center justify-between gap-3 text-sm">{sandbox ? "Open test ticket sales" : "Open live ticket sales (real payments)"}<Switch checked={enabled} onCheckedChange={setEnabled} /></label>
      <Button disabled={busy} type="submit" variant="outline"><Save />Save delivery</Button>
    </form>
    <div className="mt-4 space-y-2"><Button variant="outline" disabled={busy} onClick={async () => { setBusy(true); try { const checked = await reconcile({ data: {} }); setResult(`${checked.checked} checked · ${checked.confirmed} confirmed · ${checked.deferred} awaiting retry`); } catch { setResult("Payment checks unavailable"); } finally { setBusy(false); } }}>Check pending payments</Button>{result && <p role="status" className="text-sm text-muted-foreground">{result}</p>}</div>
  </section>;
}