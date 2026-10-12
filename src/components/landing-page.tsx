import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Play, Tv, Radio, Download, Users, ArrowRight } from "lucide-react";
import logoIcon from "@/assets/lettflix-icon.png.asset.json";
import heroBg from "@/assets/landing-hero.png.asset.json";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Tv,
    title: "Live channels, always on",
    body: "Broadcast-grade live TV from ministries, broadcasters and creators around the world — no cable box required.",
  },
  {
    icon: Play,
    title: "Movies, series & documentaries",
    body: "Discover movies, series and documentaries alongside live channels in the Lettflix catalogue.",
  },
  {
    icon: Radio,
    title: "Radio & podcasts",
    body: "Listen to live radio and discover podcasts from broadcasters and creators.",
  },
  {
    icon: Users,
    title: "Make it your own",
    body: "Save titles to your watchlist and return to content you have started watching.",
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
    a: "Watch in your browser on desktop, tablet and mobile. Content availability depends on the channel and your plan.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Review the pricing page and terms for your plan’s billing and cancellation details.",
  },
  {
    q: "Is there content for kids?",
    a: "Check individual title information before choosing content for children. Content availability varies by channel.",
  },
];

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} data-visible={visible} className={`landing-reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function StartHereCta({ label = "Create your account", className = "mx-auto mt-7" }: { label?: string; className?: string }) {
  return (
    <Button asChild className={`relative overflow-hidden landing-glow flex h-12 w-fit px-6 text-base font-semibold transition-transform hover:scale-[1.03] ${className}`}>
    <Link
      to="/auth"
      search={{ mode: "signup" as const }}
      className="group relative"
    >
      <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-primary-foreground/25 blur-sm transition-all duration-700 group-hover:left-[120%]" />
      <span className="relative">{label}</span>
      <ArrowRight className="relative size-4 transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
    </Button>
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
          className="absolute inset-0 size-full object-cover landing-kenburns"
        />
        <div className="absolute inset-0 landing-overlay" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

        <div className="relative mx-auto flex max-w-[1480px] flex-col px-4 sm:px-8">
          <header className="flex items-center justify-between py-5">
            <Link to="/" className="group flex items-center gap-2.5 landing-fade-up">
              <img src={logoIcon.url} alt="Lettflix" className="size-8 transition-transform duration-500 group-hover:rotate-[8deg] group-hover:scale-110 sm:size-9" />
              <span className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
                LETT<span className="text-primary">FLIX</span>
              </span>
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signin" as const }}
              className="landing-fade-up inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_var(--primary)] hover:brightness-110 active:translate-y-0"
            >
              Sign In
            </Link>
          </header>

          <div className="mx-auto max-w-3xl pb-8 pt-16 text-center sm:pt-24 lg:pt-28">
            <span style={{ animationDelay: "100ms" }} className="landing-fade-up inline-flex items-center gap-2 rounded-full border border-foreground/20 bg-foreground/5 px-3 py-1 transition-colors duration-300 hover:border-primary/60 hover:bg-primary/10 text-[11px] font-medium uppercase tracking-[0.18em] backdrop-blur">
              <span className="size-1.5 rounded-full bg-primary live-pulse" />
              Live TV · Radio · Podcasts · On-Demand
            </span>
            <h1 style={{ animationDelay: "250ms" }} className="landing-fade-up mt-5 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Lettflix
              <br />
              <span className="text-2xl sm:text-4xl">Live TV and on-demand, together.</span>
            </h1>
            <p style={{ animationDelay: "400ms" }} className="landing-fade-up mx-auto mt-4 max-w-xl text-sm text-[color:var(--muted-foreground)] sm:text-base">
              Watch live channels, discover movies and series, or listen to radio and podcasts — all in one place.
            </p>
            <div style={{ animationDelay: "550ms" }} className="landing-fade-up mt-7 flex flex-wrap items-center justify-center gap-3">
              <StartHereCta className="" />
              <Button asChild variant="outline" className="h-12 bg-background/50 px-6 text-base">
                <Link to="/pricing">Explore plans</Link>
              </Button>
            </div>
            <Button variant="ghost" size="icon" aria-label="Explore more about Lettflix" className="mx-auto mt-10 size-11 rounded-full border border-foreground/20 hover:bg-foreground/10 hover:text-foreground" onClick={() => document.getElementById("landing-discover")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" })}>
              <ChevronDown aria-hidden className="size-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="landing-discover" className="mx-auto max-w-[1480px] scroll-mt-4 px-4 py-14 sm:px-8 sm:py-20">
        <Reveal>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            More than streaming — a broadcast ecosystem
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 110} className="h-full">
              <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-surface/70 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:bg-surface hover:shadow-[0_18px_40px_-18px_var(--primary)]">
                <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-primary/20 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative grid size-11 place-items-center rounded-xl bg-primary/15 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="size-5" />
                </div>
                <h3 className="relative mt-4 text-base font-semibold transition-colors group-hover:text-primary">{f.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-[color:var(--muted-foreground)]">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* DEVICES STRIP */}
      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto grid max-w-[1480px] items-center gap-8 px-4 py-14 sm:px-8 lg:grid-cols-2 lg:py-20">
          <Reveal>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Watch everywhere. Pick up where you left off.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-[color:var(--muted-foreground)] sm:text-base">
               Browse Lettflix on your laptop, tablet or phone. Save titles to your watchlist and return to your recently watched content.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-[color:var(--muted-foreground)]">
              {["Desktop", "Tablet", "Mobile", "Smart TV browser"].map((d) => (
                <span key={d} className="cursor-default rounded-full border border-border px-3 py-1 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:text-foreground">
                  {d}
                </span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="group relative overflow-hidden rounded-2xl border border-border transition-all duration-500 hover:border-primary/40 hover:shadow-[0_24px_60px_-24px_var(--primary)]">
              <img src={heroBg.url} alt="Lettflix catalogue preview" className="aspect-[16/9] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-foreground/10 blur-md transition-all duration-1000 group-hover:left-[130%]" />
              <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <span className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_0_30px_-4px_var(--primary)]">
                  <Play className="size-6 fill-current" />
                </span>
              </div>
              <div className="absolute bottom-4 left-4 flex items-center gap-2 text-sm font-medium">
                <Download className="size-4 text-primary" />
                Live and on-demand, one place
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-8 sm:py-20">
        <Reveal>
          <h2 className="text-center font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Frequently asked questions
          </h2>
        </Reveal>
        <div className="mt-8 space-y-2">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={i * 70}>
            <div className={`overflow-hidden rounded-xl border bg-surface/70 transition-all duration-300 hover:border-foreground/20 hover:bg-surface ${open === i ? "border-primary/50" : "border-border"}`}>
              <Button variant="ghost"
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold transition-colors hover:text-primary sm:text-base"
              >
                {f.q}
                <ChevronDown className={`size-5 shrink-0 transition-transform duration-300 ${open === i ? "rotate-180 text-primary" : ""}`} />
              </Button>
              <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-[color:var(--muted-foreground)]">
                    {f.a}
                  </p>
                </div>
              </div>
            </div>
            </Reveal>
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
              <Link to="/pricing" className="transition-colors duration-200 hover:text-primary">Pricing</Link>
              <Link to="/enterprise" className="transition-colors duration-200 hover:text-primary">Enterprise</Link>
              <Link to="/privacy" className="transition-colors duration-200 hover:text-primary">Privacy</Link>
              <Link to="/terms" className="transition-colors duration-200 hover:text-primary">Terms</Link>
              <Link to="/cookies" className="transition-colors duration-200 hover:text-primary">Cookies</Link>
              <Link to="/auth" search={{ mode: "signin" as const }} className="transition-colors duration-200 hover:text-primary">Sign In</Link>
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
