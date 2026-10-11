import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/offline")({
  head: () => ({ meta: [
    { title: "You're offline — Lettflix" },
    { name: "description", content: "Lettflix can't reach the internet. We'll bring you back as soon as your connection returns." },
    { property: "og:title", content: "You're offline — Lettflix" },
    { property: "og:description", content: "Reconnect to keep watching on Lettflix." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: OfflinePage,
});

function OfflinePage() {
  return (
    <main className="min-h-screen bg-background text-foreground grid place-items-center px-6 py-16">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto size-16 rounded-full bg-secondary grid place-items-center text-muted-foreground"><WifiOff className="size-7" /></div>
        <h1 className="mt-6 text-2xl font-semibold">You're offline</h1>
        <p className="mt-2 text-sm text-muted-foreground">Check your Wi‑Fi or mobile data. We'll take you back to where you were as soon as you're connected.</p>
        <div role="status" className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground"><span className="size-2 rounded-full bg-primary animate-pulse" />Waiting for connection…</div>
        <section className="mt-8 rounded-xl border border-border p-5 text-left">
          <div className="flex items-center gap-2 font-medium"><Download className="size-4" />Downloads</div>
          <p className="mt-2 text-sm text-muted-foreground">You have no downloads on this device. Offline downloads are not currently available.</p>
        </section>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button className="h-11" onClick={() => { if (navigator.onLine) window.dispatchEvent(new Event("online")); }}><RefreshCw />Try again</Button>
          <Button asChild variant="outline" className="h-11"><Link to="/">Go home</Link></Button>
        </div>
      </div>
    </main>
  );
}
