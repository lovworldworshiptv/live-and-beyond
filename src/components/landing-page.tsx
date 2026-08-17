import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Play, Tv, Radio, Download, Users, ArrowRight } from "lucide-react";
import logoIcon from "@/assets/lettflix-icon.png.asset.json";
import heroBg from "@/assets/landing-hero.png.asset.json";

const FEATURES = [
  {
    icon: Tv,
    title: "Live channels, always on",
    body: "Broadcast-grade live TV from ministries, broadcasters and creators around the world — no cable box required.",
  },
  {
    icon: Play,
    title: "Movies, series & originals",
    body: "Stream premium on-demand titles, documentaries and Lettflix Originals in crisp quality on any screen.",
  },
  {
    icon: Radio,
    title: "Radio & podcasts",
    body: "Audio channels and shows that keep going when the screen goes off — in the car, at work, on the move.",
  },
  {
    icon: Users,
    title: "Profiles for everyone",
    body: "Family profiles, personalised rows and a watchlist that follows you across every device you own.",
  },
];

const FAQS = [
  {
    q: "What is Lettflix?",
    a: "Lettflix is a digital television ecosystem that unifies live TV, radio, podcasts and on-demand entertainment into one premium subscription.",
  },
  {
    q: "How much does Lettflix cost?",
    a: "One subscription covers every channel and every title. Browse our plans on the pricing page and pick the tier that fits your household.",
  },
  {
    q: "Where can I watch?",
    a: "Anywhere. Watch in your browser on desktop, tablet and mobile — live channels and on-demand content stream instantly.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. There are no long-term contracts. Manage or cancel your plan from your account settings in two clicks.",
  },
  {
    q: "Is there content for kids?",
    a: "Yes. Create a kids profile and get a curated, family-safe catalogue of shows, movies and educational programming.",
  },
];

function StartHereCta({ label = "Start Here" }: { label?: string }) {
  return (
    <Link
      to="/auth"
      search={{ mode: "signup" as const }}
      className="mx-auto mt-7 inline-flex h-13 items-center justify-center gap-2 rounded-md bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-[0_0_30px_-6px_var(--primary)] transition hover:brightness-110"
    >
      {label}
      <ArrowRight className="size-4" />
    </Link>
  );
}

export function LandingPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroBg.url}
          alt="A mosaic of Lettflix film and series posters"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.55),rgba(0,0,0,0.88))]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

        <div className="relative mx-auto flex max-w-[1480px] flex-col px-4 sm:px-8">
          <header className="flex items-center justify-between py-5">
            <Link to="/" className="flex items-center gap-2.5">
              <img src={logoIcon.url} alt="Lettflix" className="size-8 sm:size-9" />
              <span className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
                LETT<span className="text-primary">FLIX</span>
              </span>
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signin" as const }}
              className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              Sign In
            </Link>
          </header>

          <div className="mx-auto max-w-3xl py-20 text-center sm:py-32 lg:py-40">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] backdrop-blur">
              Live TV · Radio · Podcasts · On-Demand
            </span>
            <h1 className="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              One subscription.
              <br />
              The whole broadcast world.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm text-[color:var(--muted-foreground)] sm:text-base">
              Live channels, radio, podcasts, events and premium films — streaming together on Lettflix.
              Ready to watch? Get started in seconds.
            </p>
            <StartHereCta />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-[1480px] px-4 py-14 sm:px-8 sm:py-20">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          More than streaming — a broadcast ecosystem
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-surface/70 p-6 transition hover:border-primary/50"
            >
              <div className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted-foreground)]">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DEVICES STRIP */}
      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto grid max-w-[1480px] items-center gap-8 px-4 py-14 sm:px-8 lg:grid-cols-2 lg:py-20">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Watch everywhere. Pick up where you left off.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-[color:var(--muted-foreground)] sm:text-base">
              Start a film on your laptop and finish it on your phone. Your watchlist, progress and reminders
              stay in sync across every device on your account.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-[color:var(--muted-foreground)]">
              {["Desktop", "Tablet", "Mobile", "Smart TV browser"].map((d) => (
                <span key={d} className="rounded-full border border-border px-3 py-1">
                  {d}
                </span>
              ))}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-border">
            <img src={heroBg.url} alt="Lettflix catalogue preview" className="aspect-[16/9] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-4 left-4 flex items-center gap-2 text-sm font-medium">
              <Download className="size-4 text-primary" />
              Thousands of hours, one place
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-8 sm:py-20">
        <h2 className="text-center font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Frequently asked questions
        </h2>
        <div className="mt-8 space-y-2">
          {FAQS.map((f, i) => (
            <div key={f.q} className="overflow-hidden rounded-xl border border-border bg-surface/70">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold sm:text-base"
              >
                {f.q}
                <ChevronDown className={`size-5 shrink-0 transition ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && (
                <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-[color:var(--muted-foreground)]">
                  {f.a}
                </p>
              )}
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-[color:var(--muted-foreground)]">
          Ready to watch? Get started in seconds.
        </p>
        <StartHereCta />
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-[1480px] px-4 py-10 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoIcon.url} alt="Lettflix" className="size-7" />
              <span className="font-display font-extrabold tracking-tight">
                LETT<span className="text-primary">FLIX</span>
              </span>
            </Link>
            <div className="flex flex-wrap gap-5 text-sm text-[color:var(--muted-foreground)]">
              <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
              <Link to="/enterprise" className="hover:text-foreground">Enterprise</Link>
              <Link to="/auth" search={{ mode: "signin" as const }} className="hover:text-foreground">Sign In</Link>
            </div>
          </div>
          <p className="mt-6 text-xs text-[color:var(--muted-foreground)]">
            © {new Date().getFullYear()} Lettflix — LoveWorld Entertainment Flix. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
