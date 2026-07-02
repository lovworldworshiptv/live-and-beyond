import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bookmark, Clock, Bell, Heart, Trash2, Radio, Mic, Users, Plus, Check, Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TitleCard } from "@/components/title-card";
import {
  useProfile, useProgress, useMyList, useReminders, useFollowing,
} from "@/lib/personal";
import { getTitle, getChannel, titles, channels, genres, channelLanguages } from "@/lib/catalog";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Dashboard — Lettflix" },
      { name: "description", content: "Personalized dashboard, family profiles, interests, watchlists, viewing history and reminders on Lettflix." },
    ],
  }),
  component: ProfilePage,
});

const FAMILY_PROFILES = [
  { id: "alex", name: "Alex", role: "Primary", color: "from-primary to-accent" },
  { id: "sam", name: "Sam", role: "Adult", color: "from-accent to-success" },
  { id: "kids", name: "Kids", role: "Kids · 3-11", color: "from-warning to-primary" },
] as const;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function ProfilePage() {
  const { profile } = useProfile();
  const { items: progress, clear: clearProgress } = useProgress();
  const { ids: myList, toggle: toggleList } = useMyList();
  const { items: reminders, toggle: toggleReminder } = useReminders();
  const { ids: following, toggle: toggleFollow } = useFollowing();

  const progressTitles = progress
    .map((p) => ({ p, t: getTitle(p.titleId) }))
    .filter((x): x is { p: (typeof progress)[number]; t: NonNullable<ReturnType<typeof getTitle>> } => !!x.t);
  const listTitles = myList.map(getTitle).filter(Boolean);
  const followed = following.map(getChannel).filter(Boolean);

  const favouriteChannels = followed.length > 0 ? followed : channels.slice(0, 4);
  const recentRadio = channels.filter((c) => c.streamKind === "radio").slice(0, 3);
  const recentPodcasts = titles.filter((t) => t.kind === "Podcast").slice(0, 4);
  const recommendations = titles.slice(0, 6);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Greeting */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1480px] px-6 lg:px-10 pt-12 pb-8 flex items-center gap-6 flex-wrap">
          <div className="size-20 rounded-full bg-[image:var(--gradient-accent)] grid place-items-center text-3xl font-bold shadow-[var(--shadow-glow)]">
            {profile.displayName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-widest text-accent font-semibold">
              {greeting()} · {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </div>
            <h1 className="mt-1 text-3xl lg:text-5xl font-extrabold tracking-tight">
              {greeting()}, Esteemed {profile.displayName}
            </h1>
            <div className="mt-1.5 text-sm text-[color:var(--muted-foreground)] max-w-xl">
              {profile.bio}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Stat label="Watched" value={String(progress.length)} />
            <Stat label="My List" value={String(myList.length)} />
            <Stat label="Reminders" value={String(reminders.length)} />
            <Stat label="Following" value={String(following.length)} />
          </div>
          <Link
            to="/account"
            className="h-10 px-4 rounded-md bg-elevated border border-border text-sm font-medium hover:bg-elevated/70 transition"
          >
            Edit profile
          </Link>
        </div>
      </section>

      {/* Family Profiles */}
      <Section icon={<Users className="size-4 text-accent" />} title="Who's Watching" subtitle="Up to 5 profiles with individual history and preferences.">
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {FAMILY_PROFILES.map((p) => (
            <button
              key={p.id}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-elevated/40 p-4 hover:border-accent/60 transition"
            >
              <div className={`size-20 rounded-2xl bg-gradient-to-br ${p.color} grid place-items-center text-2xl font-bold shadow-[var(--shadow-card)] group-hover:scale-105 transition`}>
                {p.name.charAt(0)}
              </div>
              <div className="text-sm font-semibold mt-1">{p.name}</div>
              <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">{p.role}</div>
            </button>
          ))}
          <button className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-elevated/20 p-4 hover:border-accent/40 transition text-[color:var(--muted-foreground)] hover:text-foreground">
            <div className="size-20 rounded-2xl border border-dashed border-border grid place-items-center">
              <Plus className="size-6" />
            </div>
            <div className="text-sm font-medium">Add Profile</div>
            <div className="text-[11px]">{5 - FAMILY_PROFILES.length} slots left</div>
          </button>
        </div>
      </Section>

      {/* Interest Onboarding */}
      <InterestOnboarding />

      {/* Continue watching */}
      <Section
        icon={<Clock className="size-4 text-accent" />}
        title="Continue Watching"
        subtitle="Pick up where you left off."
        action={
          progressTitles.length > 0 && (
            <button
              onClick={() => progressTitles.forEach(({ t }) => clearProgress(t.id))}
              className="text-xs text-[color:var(--muted-foreground)] hover:text-primary transition inline-flex items-center gap-1"
            >
              <Trash2 className="size-3" /> Clear
            </button>
          )
        }
      >
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {(progressTitles.length > 0 ? progressTitles.map(({ t }) => t) : titles.slice(0, 5)).map((t) => (
            <TitleCard key={t.id} t={t} portrait={false} />
          ))}
        </div>
      </Section>

      {/* Favourite Channels */}
      <Section icon={<Heart className="size-4 text-accent" />} title="Favourite Channels" subtitle="Latest from the channels you subscribe to.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {favouriteChannels.map((c) => c && (
            <div key={c.id} className="rounded-xl border border-border bg-elevated/40 overflow-hidden flex">
              <img src={c.banner} alt="" className="w-28 h-24 object-cover shrink-0" />
              <div className="p-3 flex-1 min-w-0">
                <div className="text-[10px] text-accent font-semibold uppercase tracking-wider">{c.category}</div>
                <div className="font-semibold truncate">{c.name}</div>
                <div className="mt-1.5 flex gap-2">
                  <Link
                    to="/channels/$channelId"
                    params={{ channelId: c.id }}
                    className="text-xs px-2 h-7 rounded-md bg-primary text-primary-foreground font-medium inline-flex items-center"
                  >
                    Watch
                  </Link>
                  {following.includes(c.id) && (
                    <button
                      onClick={() => toggleFollow(c.id)}
                      className="text-xs px-2 h-7 rounded-md bg-surface border border-border font-medium hover:bg-elevated transition"
                    >
                      Unfollow
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Recent Radio */}
      <Section icon={<Radio className="size-4 text-accent" />} title="Recent Radio" subtitle="Stations you've tuned into.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recentRadio.map((c) => (
            <Link
              key={c.id}
              to="/channels/$channelId"
              params={{ channelId: c.id }}
              className="group flex gap-3 p-3 rounded-xl border border-border bg-elevated/40 hover:border-accent/40 transition"
            >
              <div className="size-16 shrink-0 rounded-md overflow-hidden">
                <img src={c.banner} alt="" className="size-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-accent font-semibold uppercase tracking-wider">ON AIR</div>
                <div className="font-semibold truncate">{c.name}</div>
                <div className="text-xs text-[color:var(--muted-foreground)] truncate">Now: {c.nowPlaying.title}</div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* Recent Podcasts */}
      <Section icon={<Mic className="size-4 text-accent" />} title="Recent Podcasts" subtitle="Episodes you've been listening to.">
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {recentPodcasts.map((t) => (
            <TitleCard key={t.id} t={t} portrait={false} />
          ))}
        </div>
      </Section>

      {/* My List (Watchlists) */}
      <Section icon={<Bookmark className="size-4 text-accent" />} title="Watchlists" subtitle="Everything you saved for later.">
        {listTitles.length === 0 ? (
          <Empty label="Your list is empty. Tap the bookmark on any title to save it." />
        ) : (
          <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {listTitles.map((t) => t && (
              <div key={t.id} className="relative">
                <TitleCard t={t} />
                <button
                  onClick={() => toggleList(t.id)}
                  className="absolute -top-2 -right-2 size-7 rounded-full bg-black/70 grid place-items-center hover:bg-primary transition z-10"
                  aria-label="Remove"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Viewing History */}
      <Section icon={<Clock className="size-4 text-accent" />} title="Viewing History" subtitle="Everything you've watched recently.">
        {progressTitles.length === 0 ? (
          <Empty label="Your viewing history will appear here." />
        ) : (
          <div className="rounded-xl border border-border bg-elevated/30 divide-y divide-border">
            {progressTitles.map(({ p, t }) => (
              <Link
                key={t.id}
                to="/on-demand/$titleId"
                params={{ titleId: t.id }}
                className="flex items-center gap-4 p-3 hover:bg-elevated/50 transition"
              >
                <img src={t.cover} alt="" className="w-24 h-14 object-cover rounded-md shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{t.title}</div>
                  <div className="mt-1 h-1 bg-white/10 rounded overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${Math.max(4, p.positionPct)}%` }} />
                  </div>
                </div>
                <div className="text-xs text-[color:var(--muted-foreground)] shrink-0">{Math.round(p.positionPct)}%</div>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* Reminders */}
      <Section icon={<Bell className="size-4 text-accent" />} title="Reminders" subtitle="We'll ping you when these start.">
        {reminders.length === 0 ? (
          <Empty label="No reminders yet. Use the bell on any program to set one." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reminders.map((r) => {
              const ch = getChannel(r.channelId);
              return (
                <div key={r.id} className="rounded-xl border border-border bg-elevated/40 p-4 flex items-center gap-3">
                  {ch && <img src={ch.logoImg} alt="" className="size-12 rounded-md object-cover shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{r.title}</div>
                    <div className="text-xs text-[color:var(--muted-foreground)]">{ch?.name ?? r.channelId} · {r.time}</div>
                  </div>
                  <button onClick={() => toggleReminder(r)} className="size-8 grid place-items-center rounded-full hover:bg-primary/20 transition" aria-label="Remove">
                    <Trash2 className="size-3.5 text-[color:var(--muted-foreground)]" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Recommendations */}
      <Section icon={<Sparkles className="size-4 text-accent" />} title="Recommendations" subtitle="Personalized picks based on your interests.">
        <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {recommendations.map((t) => (
            <TitleCard key={t.id} t={t} />
          ))}
        </div>
      </Section>

      <div className="pb-16" />
      <SiteFooter />
    </div>
  );
}

function InterestOnboarding() {
  const [cats, setCats] = useState<string[]>(["Music", "LoveWorld", "Sports"]);
  const [langs, setLangs] = useState<string[]>(["English"]);
  const [followedCh, setFollowedCh] = useState<string[]>(["loveworld-plus", "worship-live"]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, v: string) =>
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const creators = useMemo(
    () => ["Sinach", "Frank Edwards", "Ada Ehi", "Pastor Chris", "DJ Solo", "Miss B"],
    []
  );
  const [followedCreators, setFollowedCreators] = useState<string[]>(["Sinach", "Pastor Chris"]);

  return (
    <Section
      icon={<Sparkles className="size-4 text-accent" />}
      title="Your Interests"
      subtitle="Tell Lettflix what you love — we'll tune your rows."
    >
      <div className="rounded-2xl border border-border bg-elevated/40 p-5 lg:p-6 space-y-6">
        <InterestGroup label="Categories" values={cats}>
          {genres.filter((g) => g !== "All").map((g) => (
            <Chip key={g} active={cats.includes(g)} onClick={() => toggle(cats, setCats, g)}>{g}</Chip>
          ))}
        </InterestGroup>
        <InterestGroup label="Languages" values={langs}>
          {channelLanguages.filter((l) => l !== "All").map((l) => (
            <Chip key={l} active={langs.includes(l)} onClick={() => toggle(langs, setLangs, l)}>{l}</Chip>
          ))}
        </InterestGroup>
        <InterestGroup label="Channels" values={followedCh}>
          {channels.slice(0, 8).map((c) => (
            <Chip key={c.id} active={followedCh.includes(c.id)} onClick={() => toggle(followedCh, setFollowedCh, c.id)}>{c.name}</Chip>
          ))}
        </InterestGroup>
        <InterestGroup label="Creators" values={followedCreators}>
          {creators.map((c) => (
            <Chip key={c} active={followedCreators.includes(c)} onClick={() => toggle(followedCreators, setFollowedCreators, c)}>{c}</Chip>
          ))}
        </InterestGroup>
      </div>
    </Section>
  );
}

function InterestGroup({ label, values, children }: { label: string; values: string[]; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs uppercase tracking-widest text-[color:var(--muted-foreground)]">{label}</div>
        <div className="text-[11px] text-accent">{values.length} selected</div>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`h-8 px-3 rounded-full text-sm border transition inline-flex items-center gap-1.5 ${
        active
          ? "bg-accent/20 border-accent/60 text-accent"
          : "bg-elevated border-border text-[color:var(--secondary-foreground)] hover:text-foreground"
      }`}
    >
      {active && <Check className="size-3" />}
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">{label}</div>
    </div>
  );
}

function Section({
  icon, title, subtitle, action, children,
}: {
  icon: React.ReactNode; title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-10">
      <div className="flex items-end justify-between mb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[color:var(--muted-foreground)]">
            {icon} {title}
          </div>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-[color:var(--muted-foreground)] mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-[color:var(--muted-foreground)]">
      {label}
    </div>
  );
}
