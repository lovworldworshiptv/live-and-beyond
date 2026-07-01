import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, Clock, Bell, Heart, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TitleCard } from "@/components/title-card";
import {
  useProfile,
  useProgress,
  useMyList,
  useReminders,
  useFollowing,
} from "@/lib/personal";
import { getTitle, getChannel } from "@/lib/catalog";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — Lettflix" },
      {
        name: "description",
        content:
          "Your Lettflix profile: viewing history, My List, reminders and followed channels.",
      },
    ],
  }),
  component: ProfilePage,
});

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Profile header */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1480px] px-6 lg:px-10 pt-12 pb-8 flex items-center gap-6 flex-wrap">
          <div className="size-24 rounded-full bg-[image:var(--gradient-accent)] grid place-items-center text-4xl font-bold shadow-[var(--shadow-glow)]">
            {profile.displayName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-widest text-[color:var(--muted-foreground)]">
              {profile.handle} · {profile.location}
            </div>
            <h1 className="mt-1 text-3xl lg:text-4xl font-extrabold tracking-tight">
              {profile.displayName}
            </h1>
            <div className="mt-1 text-sm text-[color:var(--muted-foreground)] max-w-xl">
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
        {progressTitles.length === 0 ? (
          <Empty label="Nothing in progress yet." />
        ) : (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {progressTitles.map(({ t }) => (
              <TitleCard key={t.id} t={t} portrait={false} />
            ))}
          </div>
        )}
      </Section>

      {/* My List */}
      <Section
        icon={<Bookmark className="size-4 text-accent" />}
        title="My List"
        subtitle="Everything you saved for later."
      >
        {listTitles.length === 0 ? (
          <Empty label="Your list is empty. Tap the bookmark on any title to save it." />
        ) : (
          <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {listTitles.map(
              (t) =>
                t && (
                  <div key={t.id} className="relative">
                    <TitleCard t={t} />
                    <button
                      onClick={() => toggleList(t.id)}
                      className="absolute -top-2 -right-2 size-7 rounded-full bg-black/70 grid place-items-center hover:bg-primary transition"
                      aria-label="Remove"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                )
            )}
          </div>
        )}
      </Section>

      {/* Reminders */}
      <Section
        icon={<Bell className="size-4 text-accent" />}
        title="Reminders"
        subtitle="We'll ping you when these start."
      >
        {reminders.length === 0 ? (
          <Empty label="No reminders yet. Use the bell on any program to set one." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reminders.map((r) => {
              const ch = getChannel(r.channelId);
              return (
                <div
                  key={r.id}
                  className="rounded-xl border border-border bg-elevated/40 p-4 flex items-center gap-3"
                >
                  {ch && (
                    <img
                      src={ch.logoImg}
                      alt=""
                      className="size-12 rounded-md object-cover shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{r.title}</div>
                    <div className="text-xs text-[color:var(--muted-foreground)]">
                      {ch?.name ?? r.channelId} · {r.time}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleReminder(r)}
                    className="size-8 grid place-items-center rounded-full hover:bg-primary/20 transition"
                    aria-label="Remove"
                  >
                    <Trash2 className="size-3.5 text-[color:var(--muted-foreground)]" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Following */}
      <Section
        icon={<Heart className="size-4 text-accent" />}
        title="Followed Channels"
        subtitle="Latest from the channels you subscribe to."
      >
        {followed.length === 0 ? (
          <Empty label="Follow channels to see updates here." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {followed.map(
              (c) =>
                c && (
                  <div
                    key={c.id}
                    className="rounded-xl border border-border bg-elevated/40 overflow-hidden flex"
                  >
                    <img src={c.banner} alt="" className="w-32 h-24 object-cover" />
                    <div className="p-3 flex-1 min-w-0">
                      <div className="text-xs text-accent font-semibold uppercase tracking-wider">
                        {c.category}
                      </div>
                      <div className="font-semibold truncate">{c.name}</div>
                      <div className="mt-1 flex gap-2">
                        <Link
                          to="/channels/$channelId"
                          params={{ channelId: c.id }}
                          className="text-xs px-2 h-7 rounded-md bg-primary text-primary-foreground font-medium inline-flex items-center"
                        >
                          Watch
                        </Link>
                        <button
                          onClick={() => toggleFollow(c.id)}
                          className="text-xs px-2 h-7 rounded-md bg-surface border border-border font-medium hover:bg-elevated transition"
                        >
                          Unfollow
                        </button>
                      </div>
                    </div>
                  </div>
                )
            )}
          </div>
        )}
      </Section>

      <div className="pb-16" />
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
        {label}
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  subtitle,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-10">
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[color:var(--muted-foreground)]">
            {icon} {title}
          </div>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h2>
          {subtitle && (
            <p className="text-sm text-[color:var(--muted-foreground)] mt-1">{subtitle}</p>
          )}
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
