import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { checkSquadPayments } from "@/lib/ppv.functions";

export function SquadConnection() {
  const check = useServerFn(checkSquadPayments);
  const [sandbox, setSandbox] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  async function verify() {
    setBusy(true);
    try {
      const response = await check({ data: { sandbox } });
      setResult(response.connected ? `Squad ${sandbox ? "test" : "live"} account verified · Sales remain closed` : response.error);
    } catch { setResult("Could not check Squad. Try again."); }
    finally { setBusy(false); }
  }
  return <section className="space-y-3 border-b border-border pb-6">
    <h3 className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-4 text-accent" />Squad payments</h3>
    <div className="flex flex-wrap items-center gap-4">
      <label className="flex items-center gap-3 text-sm">Test account<Switch checked={sandbox} disabled={busy} aria-label="Squad test account" onCheckedChange={value => { setSandbox(value); setResult(null); }} /></label>
      <Button variant="outline" disabled={busy} onClick={() => void verify()}><RefreshCw className={busy ? "animate-spin" : ""} />{busy ? "Checking" : "Verify connection"}</Button>
    </div>
    {result && <p role="status" className="break-words text-sm text-muted-foreground">{result}</p>}
  </section>;
}