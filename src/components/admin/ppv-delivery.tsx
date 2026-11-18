import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { savePpvDelivery } from "@/lib/ppv.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Save } from "lucide-react";
import { toast } from "sonner";

export function PpvDelivery({ events }: { events: { id: string; title: string }[] }) {
  const save = useServerFn(savePpvDelivery);
  const [eventId, setEventId] = useState("");
  const [uid, setUid] = useState("");
  const [sandbox, setSandbox] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  return <section className="border-t border-border pt-6"><h3 className="font-semibold">Protected event delivery</h3>
    <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={async e => {
      e.preventDefault(); setBusy(true);
      try { await save({ data: { eventId, streamUid: uid.trim(), sandbox, salesEnabled: enabled } }); toast.success("Protected delivery saved"); }
      catch (error) { toast.error(error instanceof Error ? error.message : "Could not save delivery"); } finally { setBusy(false); }
    }}>
      <label className="grid gap-2 text-sm">Event<select required value={eventId} onChange={e => setEventId(e.target.value)} className="h-10 min-w-0 rounded-md border border-input bg-background px-3"><option value="">Select event</option>{events.map(event => <option key={event.id} value={event.id}>{event.title}</option>)}</select></label>
      <label className="grid gap-2 text-sm">Protected Stream video ID<Input required pattern="[a-f0-9]{32}" value={uid} onChange={e => setUid(e.target.value)} /></label>
      <label className="flex items-center justify-between gap-3 text-sm">Squad test environment<Switch checked={sandbox} onCheckedChange={setSandbox} /></label>
      <label className="flex items-center justify-between gap-3 text-sm">Open test ticket sales<Switch checked={enabled} onCheckedChange={setEnabled} disabled={!sandbox} /></label>
      <Button disabled={busy} type="submit" variant="outline"><Save />Save delivery</Button>
    </form>
  </section>;
}