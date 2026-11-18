import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, Play, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BrandLoader } from "@/components/brand-loader";
import { Button } from "@/components/ui/button";
import { confirmPpvReturn } from "@/lib/ppv.functions";
import { canPollPayment, paymentReturnReference, PAYMENT_POLL_INTERVAL_MS } from "@/lib/ppv-checkout";

export const Route = createFileRoute("/ppv/payment/return")({
  validateSearch: (search: Record<string, unknown>) => ({ reference: paymentReturnReference(search) }),
  head: () => ({ meta: [
    { title: "Confirm Your PPV Payment — Lettflix" },
    { name: "description", content: "Secure payment confirmation for your Lettflix Pay-Per-View ticket." },
    { property: "og:title", content: "Confirm Your PPV Payment — Lettflix" },
    { property: "og:description", content: "Check your ticket payment securely and return to your event." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: PaymentReturn,
});

function PaymentReturn() {
  const { reference } = Route.useSearch();
  const { user, loading } = useAuth();
  const confirm = useServerFn(confirmPpvReturn);
  const [state, setState] = useState<"confirming" | "paid" | "pending" | "failed" | "refunded" | "error">("confirming");
  const [eventId, setEventId] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!user || !reference) return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();
    setState("confirming");
    const poll = async () => {
      try {
        const result = await confirm({ data: { reference } });
        if (disposed) return;
        setEventId(result.eventId);
        if (result.status === "paid" || result.status === "failed" || result.status === "refunded") { setState(result.status); return; }
        if (!canPollPayment(startedAt, Date.now())) { setState("pending"); return; }
      } catch {
        if (disposed) return;
        setState("error"); return;
      }
      timer = setTimeout(() => { if (canPollPayment(startedAt, Date.now())) void poll(); else setState("pending"); }, PAYMENT_POLL_INTERVAL_MS);
    };
    void poll();
    return () => { disposed = true; if (timer) clearTimeout(timer); };
  }, [user, reference, confirm, attempt]);
  return <div className="flex min-h-screen flex-col"><SiteHeader /><main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
    <p className="text-sm font-semibold text-accent">Lettflix Pay-Per-View</p>
    <h1 className="mt-3 break-words text-3xl font-bold">Your Ticket Payment</h1>
    {loading ? <BrandLoader variant="section" label="Loading account" /> : !reference ? <p role="alert" className="mt-6 text-muted-foreground">A valid payment reference is required.</p> : !user ? <div className="mt-6 space-y-4"><p>Sign in to confirm your own ticket payment.</p><Button asChild><Link to="/auth">Sign in</Link></Button></div> : <div className="mt-8 space-y-5" aria-live="polite">
      {state === "confirming" && <BrandLoader variant="section" label="Confirming payment" />}
      {state === "paid" && <><CheckCircle2 className="size-10 text-accent" /><h2 className="text-xl font-semibold">Payment Verified</h2><p className="text-muted-foreground">Your ticket is ready.</p>{eventId && <Button asChild><Link to="/ppv/$eventId" params={{ eventId }}><Play />Go to event</Link></Button>}</>}
      {state === "pending" && <><Clock className="size-10 text-muted-foreground" /><h2 className="text-xl font-semibold">Payment Pending</h2><p className="text-muted-foreground">Your payment has not been confirmed yet. You can check again shortly.</p></>}
      {state === "failed" && <><h2 className="text-xl font-semibold">Payment Unsuccessful</h2><p className="text-muted-foreground">No ticket access was granted.</p>{eventId && <Button asChild><Link to="/ppv/$eventId" params={{ eventId }}>Try again</Link></Button>}</>}
      {state === "refunded" && <><h2 className="text-xl font-semibold">Payment Refunded</h2><p className="text-muted-foreground">This ticket no longer grants access.</p></>}
      {state === "error" && <p role="alert" className="text-muted-foreground">We could not verify this purchase. Check that you are signed in to the account that bought the ticket.</p>}
      {(state === "pending" || state === "error") && <Button variant="outline" onClick={() => setAttempt(value => value + 1)}><RefreshCw />Check payment again</Button>}
    </div>}
  </main><SiteFooter /></div>;
}