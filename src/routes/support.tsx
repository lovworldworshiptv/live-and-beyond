import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LifeBuoy, Mail, Tv } from "lucide-react";

const SUPPORT_EMAIL = "support@lettflix.com";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — Lettflix" },
      { name: "description", content: "Get help with Lettflix and learn how to sign in on your TV with KingsChat." },
      { property: "og:title", content: "Support — Lettflix" },
      { property: "og:description", content: "Get help with Lettflix and learn how to sign in on your TV with KingsChat." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://lettflix.com/support" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://lettflix.com/support" }],
  }),
  component: SupportPage,
});

function SupportPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-[760px] px-6 pt-10 pb-12 lg:pt-16">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-primary/10">
            <LifeBuoy className="size-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Support</h1>
        </div>

        <section className="mb-10 rounded-xl border border-border bg-card p-6">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
            <Mail className="size-5 text-primary" /> Contact us
          </h2>
          <p className="text-muted-foreground">
            Email{" "}
            <a className="font-medium text-primary underline-offset-4 hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>{" "}
            and we'll get back to you.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Tv className="size-5 text-primary" /> How to sign in on your TV
          </h2>
          <ol className="list-decimal space-y-3 pl-5 text-muted-foreground">
            <li>Open Lettflix on your TV.</li>
            <li>Scan the code shown on the TV with your phone's camera (or type the short link).</li>
            <li>Sign in with KingsChat on your phone. Your TV signs in by itself.</li>
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">
            If the code has expired, choose sign in again on your TV to show a new one.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
