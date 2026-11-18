import { Link } from "@tanstack/react-router";
import { ppvAccountReturn } from "@/lib/ppv-discovery";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Ticket, RefreshCw, Play } from "lucide-react";
import { getPpvPurchase, startPpvCheckout, confirmPpvPurchase, getPpvPlaybackAccess, getPpvReceipt } from "@/lib/ppv.functions";
import { useHlsAttach } from "@/hooks/use-hls";
import { registerMediaElement, pauseOtherMedia } from "@/lib/media-playback";
import { formatPpvCountdown, remainingPpvWait } from "@/lib/ppv-waiting";

export function PpvPurchase({ eventId, salesOpen }: { eventId: string; salesOpen: boolean }) {
  const { user } = useAuth();
  const fetchPurchase = useServerFn(getPpvPurchase);
  const checkout = useServerFn(startPpvCheckout);
  const confirm = useServerFn(confirmPpvPurchase);
  const [purchase, setPurchase] = useState<Awaited<ReturnType<typeof getPpvPurchase>> | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [watching, setWatching] = useState(false);
  const load = useCallback(async () => { if (user) setPurchase(await fetchPurchase({ data: { eventId } })); }, [user, fetchPurchase, eventId]);
  useEffect(() => {
    let disposed = false;
    if (!user) { setPurchase(null); setWatching(false); return; }
    const returnedOrder = new URL(window.location.href).searchParams.get("order");
    void (async () => {
      if (returnedOrder && /^[a-f0-9-]{36}$/i.test(returnedOrder)) {
        const result = await confirm({ data: { orderId: returnedOrder } });
        if (!disposed) setMessage(result.status === "paid" ? "Payment verified." : "Payment is not confirmed or has been refunded.");
      }
      if (!disposed) await load();
    })().catch(() => { if (!disposed) setMessage("Could not confirm your purchase. Try Confirm payment."); });
    return () => { disposed = true; };
  }, [load, user, confirm]);
  async function act(payment: boolean) {
    setBusy(true); setMessage("");
    try {
      if (payment) { const result = await checkout({ data: { eventId } }); window.location.assign(result.checkoutUrl); }
      else if (purchase) { const result = await confirm({ data: { orderId: purchase.id } }); setMessage(result.status === "paid" ? "Payment verified." : result.status === "refunded" ? "This purchase has been refunded." : "Payment is not confirmed yet."); await load(); }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }
  if (!user) return <div className="mt-4 flex flex-wrap gap-3"><Button asChild><Link to="/auth" search={{ mode: "signup", redirect: ppvAccountReturn(eventId) }}><Ticket />Create account to get access</Link></Button><Button asChild variant="outline"><Link to="/auth" search={{ mode: "signin", redirect: ppvAccountReturn(eventId) }}>Sign in</Link></Button></div>;
  return <div className="mt-4 space-y-4">
    {purchase && <p className="break-words text-sm">Purchase: {purchase.status} · {new Intl.NumberFormat(undefined, { style: "currency", currency: purchase.currency }).format(purchase.amount_minor / 100)}</p>}
    <div className="flex flex-wrap gap-2">
      {purchase?.status === "paid" && purchase.payment_state === "fulfilled" ? <Button disabled={busy} onClick={() => setWatching(true)}><Play />Watch event</Button> : <Button disabled={busy || !salesOpen} onClick={() => void act(true)}><Ticket />{salesOpen ? "Buy test ticket" : "Sales not open"}</Button>}
      {purchase && purchase.status !== "refunded" && <Button variant="outline" disabled={busy} onClick={() => void act(false)}><RefreshCw />Confirm payment</Button>}
    </div>
    {message && <p role="status" className="break-words text-sm text-muted-foreground">{message}</p>}
    {purchase?.status === "paid" && <PpvReceipt orderId={purchase.id} currency={purchase.currency} />}
    {watching && purchase && <PpvWaitingPlayer orderId={purchase.id} startsAt={purchase.access_starts_at} serverNow={purchase.serverNow} />}
  </div>;
}

function PpvReceipt({ orderId, currency }: { orderId: string; currency: string }) {
  const fetchReceipt = useServerFn(getPpvReceipt);
  const [receipt, setReceipt] = useState<Awaited<ReturnType<typeof getPpvReceipt>>>(null);
  useEffect(() => { let disposed = false; void fetchReceipt({ data: { orderId } }).then(result => { if (!disposed) setReceipt(result); }).catch(() => {}); return () => { disposed = true; }; }, [orderId, fetchReceipt]);
  if (!receipt) return null;
  return <div className="border-t border-border pt-4 text-sm" data-allow-copy><h3 className="font-semibold">Payment Receipt</h3><p className="mt-2">{new Intl.NumberFormat(undefined, { style: "currency", currency }).format(receipt.amount_minor / 100)} · {new Date(receipt.verified_at).toLocaleString()}</p><p className="mt-1 break-all text-xs text-muted-foreground">Ticket {orderId}</p></div>;
}

function PpvWaitingPlayer({ orderId, startsAt, serverNow }: { orderId: string; startsAt: string; serverNow: string }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => { const start = performance.now(); setElapsed(0); const timer = setInterval(() => setElapsed(performance.now() - start), 1000); return () => clearInterval(timer); }, [serverNow]);
  const remaining = remainingPpvWait(startsAt, serverNow, elapsed);
  if (remaining > 0) return <div className="border-t border-border py-8"><h2 className="text-xl font-semibold">Your Event Starts Soon</h2><p className="mt-4 font-mono text-3xl tabular-nums">{formatPpvCountdown(remaining)}</p><p className="mt-3 text-sm text-muted-foreground">Your ticket is verified. Playback opens when access begins.</p></div>;
  return <ProtectedPpvPlayer orderId={orderId} />;
}

function ProtectedPpvPlayer({ orderId }: { orderId: string }) {
  const access = useServerFn(getPpvPlaybackAccess);
  const media = useRef<HTMLVideoElement | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useHlsAttach(media, source, Boolean(source), undefined, setError);
  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sessionId = crypto.randomUUID();
    let start = true;
    const renew = async () => {
      try {
        const result = await access({ data: { orderId, sessionId, start } });
        start = false;
        if (disposed) return;
        const position = media.current?.currentTime ?? 0;
        if (position > 0) media.current?.addEventListener("loadedmetadata", () => { if (media.current && Number.isFinite(media.current.duration)) media.current.currentTime = Math.min(position, media.current.duration); }, { once: true });
        setError(""); setSource(result.playbackUrl);
        timer = setTimeout(() => void renew(), Math.max(1000, Date.parse(result.expiresAt) - Date.now() - 20000));
      } catch {
        if (disposed) return;
        media.current?.pause(); setSource(null); setError("Playback ended or moved to another device. Confirm your payment before retrying.");
      }
    };
    void renew();
    return () => { disposed = true; if (timer) clearTimeout(timer); media.current?.pause(); };
  }, [access, orderId, retry]);
  useEffect(() => { if (media.current) return registerMediaElement(media.current); }, []);
  return <div className="space-y-3">
    <div data-video-player data-protected-player className="aspect-video overflow-hidden rounded-lg border border-border bg-background">
      <video ref={media} controls playsInline autoPlay controlsList="nodownload" className="size-full object-contain" onPlaying={() => { if (media.current) pauseOtherMedia(media.current); }} />
    </div>
    {error && <div><p role="alert" className="text-sm text-muted-foreground">{error}</p><Button variant="outline" className="mt-2" onClick={() => setRetry(value => value + 1)}><RefreshCw />Retry access</Button></div>}
  </div>;
}