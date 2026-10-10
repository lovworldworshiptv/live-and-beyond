import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MessageCircle,
  Heart,
  Users,
  Sparkles,
  Radio,
  Send,
  Trophy,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Community \u2014 Lettflix" },
      { property: "og:description", content: "Watch parties, live chat, fan clubs and creator meet-ups. Lettflix Community brings the audience together." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Community — Lettflix" },
      {
        name: "description",
        content:
          "Watch parties, live chat, fan clubs and creator meet-ups. Lettflix Community brings the audience together.",
      },
    ],
  }),
  component: CommunityPage,
});

const parties = [
  {
    id: "wp-1",
    title: "Champions League Final — Live Watch Party",
    host: "Sports HQ",
    time: "Tonight · 20:00 GMT",
    viewers: "3.2K joining",
    img: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&auto=format&fit=crop",
    tag: "Live in 4h",
  },
  {
    id: "wp-2",
    title: "Sunday Service Global Room",
    host: "Faith Channel",
    time: "Sun · 09:00 GMT",
    viewers: "12.8K subscribed",
    img: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&auto=format&fit=crop",
    tag: "Recurring",
  },
  {
    id: "wp-3",
    title: "Season Finale — Kings of the Coast",
    host: "Editors' Room",
    time: "Fri · 21:00 GMT",
    viewers: "980 joining",
    img: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop",
    tag: "Premiere",
  },
];

const clubs = [
  { name: "Afrobeats Fans", members: "24.1K", color: "from-amber-500 to-rose-500" },
  { name: "Nollywood Weekly", members: "18.7K", color: "from-purple-500 to-fuchsia-500" },
  { name: "Podcast Book Club", members: "9.3K", color: "from-emerald-500 to-teal-500" },
  { name: "Live Worship", members: "42.6K", color: "from-blue-500 to-indigo-600" },
];

const chat = [
  { u: "Ada", m: "This scene 🔥🔥", t: "just now" },
  { u: "Kunle", m: "Watching from Lagos 🇳🇬", t: "1m" },
  { u: "Marcus", m: "The soundtrack is unreal", t: "3m" },
  { u: "Zara", m: "Anyone joining the watch party at 20:00?", t: "5m" },
];

function CommunityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="relative border-b border-border overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: "var(--gradient-live)" }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative mx-auto max-w-[1480px] px-6 lg:px-10 pt-16 pb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/20 text-xs font-medium">
            <Users className="size-3.5" /> Lettflix Community
          </div>
          <h1 className="mt-5 text-4xl lg:text-6xl font-extrabold tracking-tight max-w-3xl">
            Watch together. Chat live. Build fandom.
          </h1>
          <p className="mt-4 text-lg text-white/85 max-w-2xl">
            Rooms for every premiere, live chat inside every stream and clubs that
            meet week after week.
          </p>
          <div className="mt-6 flex gap-2 flex-wrap">
            <button className="h-11 px-5 rounded-md bg-white text-background font-semibold hover:bg-white/90 transition inline-flex items-center gap-2">
              <Sparkles className="size-4" /> Start a watch party
            </button>
            <Link
              to="/guide"
              className="h-11 px-5 rounded-md bg-black/40 backdrop-blur border border-white/20 font-medium hover:bg-black/60 transition inline-flex items-center gap-2"
            >
              <Radio className="size-4" /> Browse live rooms
            </Link>
          </div>
        </div>
      </section>

      {/* Watch parties */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-10">
        <SectionHeader
          eyebrow="Upcoming"
          title="Watch parties"
          subtitle="Curated live rooms with synchronised playback and chat."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {parties.map((p) => (
            <div
              key={p.id}
              className="group relative rounded-2xl overflow-hidden border border-border bg-elevated/50 hover:border-accent/50 transition"
            >
              <div className="relative aspect-[16/9]">
                <img
                  src={p.img}
                  alt=""
                  className="size-full object-cover group-hover:scale-105 transition duration-700"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: "var(--gradient-card)" }}
                />
                <span className="absolute top-3 left-3 inline-flex items-center px-2 py-1 rounded text-[11px] font-bold bg-black/60 backdrop-blur">
                  {p.tag}
                </span>
              </div>
              <div className="p-5">
                <div className="text-xs text-accent font-semibold uppercase tracking-wider">
                  {p.host}
                </div>
                <div className="mt-1 font-semibold text-lg leading-tight">
                  {p.title}
                </div>
                <div className="text-sm text-[color:var(--muted-foreground)] mt-1">
                  {p.time} · {p.viewers}
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 h-9 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition">
                    Join
                  </button>
                  <button className="h-9 px-3 rounded-md bg-surface border border-border text-sm font-medium hover:bg-elevated transition">
                    Remind me
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Fan clubs + live chat */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-14 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionHeader
            eyebrow="Fandom"
            title="Fan clubs"
            subtitle="Ongoing communities around your favourite genres."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {clubs.map((c) => (
              <div
                key={c.name}
                className={`relative rounded-2xl overflow-hidden border border-border p-5 h-40 bg-gradient-to-br ${c.color}`}
              >
                <div className="absolute inset-0 bg-black/30" />
                <div className="relative h-full flex flex-col justify-between text-white">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold">
                      <Trophy className="size-3.5" /> Fan Club
                    </div>
                    <span className="text-xs bg-black/40 rounded-full px-2 py-0.5">
                      {c.members} members
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold tracking-tight">{c.name}</div>
                    <button className="mt-2 h-8 px-3 rounded-md bg-white text-background text-xs font-semibold">
                      Join club
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionHeader
            eyebrow="Right now"
            title="Live chat"
            subtitle="Trending in the current premiere room."
          />
          <div className="rounded-2xl border border-border bg-elevated/40 flex flex-col h-[420px]">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              <div className="text-sm font-semibold">Premiere Room · 2,148 online</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chat.map((c, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="size-8 rounded-full bg-[image:var(--gradient-accent)] grid place-items-center text-xs font-bold shrink-0">
                    {c.u.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs">
                      <span className="font-semibold">{c.u}</span>
                      <span className="text-[color:var(--muted-foreground)] ml-2">
                        {c.t}
                      </span>
                    </div>
                    <div className="text-sm mt-0.5">{c.m}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-border flex items-center gap-2">
              <input
                placeholder="Say something…"
                className="flex-1 h-10 px-3 rounded-md bg-surface border border-border text-sm outline-none focus:border-accent transition"
              />
              <button className="size-10 grid place-items-center rounded-md bg-accent text-accent-foreground hover:bg-accent/90 transition">
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Community stats */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-14 mb-16">
        <div className="rounded-2xl border border-border bg-elevated/40 p-8 grid gap-6 sm:grid-cols-3">
          <Stat icon={Users} value="1.2M" label="Community members" />
          <Stat icon={MessageCircle} value="84K" label="Messages / day" />
          <Stat icon={Heart} value="410K" label="Watch party joins / mo" />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-5">
      <div className="text-[11px] uppercase tracking-widest text-accent font-semibold">
        {eyebrow}
      </div>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-[color:var(--muted-foreground)] mt-1">{subtitle}</p>
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Users;
  value: string;
  label: string;
}) {
  return (
    <div className="text-center">
      <Icon className="size-6 mx-auto text-accent" />
      <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
      <div className="text-xs uppercase tracking-widest text-[color:var(--muted-foreground)]">
        {label}
      </div>
    </div>
  );
}
