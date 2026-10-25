import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bookmark, Clock, Bell, Heart, Trash2, Pencil, ArrowRight, Loader2, Camera } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TitleCard } from "@/components/title-card";
import { PlaybackPreferences } from "@/components/playback-preferences";
import { UserAvatar } from "@/components/user-avatar";
import { AvatarPickerDialog } from "@/components/avatar-picker";
import { useAuth } from "@/hooks/use-auth";
import { useAccountProfile } from "@/lib/account-profile";
import { useProfile, useProgress, useMyList, useReminders, useFollowing } from "@/lib/personal";
import { useCmsChannels, useCmsTitles } from "@/lib/cms-catalog";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [
    { title: "Your Profile — Lettflix" },
    { name: "description", content: "Return to your viewing, saved titles, followed channels and reminders on Lettflix." },
    { property: "og:title", content: "Your Profile — Lettflix" },
    { property: "og:description", content: "Your saved activity and viewing history, all in one place." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ProfilePage,
});
type Activity = "list" | "following" | "reminders" | "history";
function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const { items: progress, clear } = useProgress();
  const { ids: myList, toggle: toggleList } = useMyList();
  const { items: reminders, toggle: toggleReminder } = useReminders();
  const { ids: following, toggle: toggleFollow } = useFollowing();
  const { titles, loading: titlesLoading } = useCmsTitles();
  const { channels, loading: channelsLoading } = useCmsChannels();
  const { profile: account, avatarSrc } = useAccountProfile();
  const [greeting, setGreeting] = useState("Welcome back");
  const [active, setActive] = useState<Activity>("list");
  const [pickerOpen, setPickerOpen] = useState(false);
  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening");
  }, []);
  const metadataName = typeof user?.user_metadata?.display_name === "string" ? user.user_metadata.display_name : "";
  const name = account?.display_name || metadataName || profile.displayName || "there";
  const memberSince = account?.created_at ? new Date(account.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : null;
  const history = progress.flatMap(p => { const t = titles.find(t => t.id === p.titleId); return t ? [{ p, t }] : []; });
  const continuing = history.filter(({ p }) => p.positionPct > 0 && p.positionPct < 95);
  const saved = titles.filter(t => myList.includes(t.id));
  const followed = channels.filter(c => following.includes(c.id));
  const sections = [
    { key: "list" as const, label: "My List", count: myList.length, icon: Bookmark },
    { key: "following" as const, label: "Following", count: following.length, icon: Heart },
    { key: "reminders" as const, label: "Reminders", count: reminders.length, icon: Bell },
    { key: "history" as const, label: "History", count: progress.length, icon: Clock },
  ];
  const busy = authLoading || titlesLoading || channelsLoading;
  return <div className="min-h-screen bg-background text-foreground">
    <SiteHeader />
    <main className="mx-auto max-w-[1480px] px-6 py-8 lg:px-10 lg:py-10 space-y-8 pb-16">
      <header className="profile-hero relative overflow-hidden rounded-3xl border border-border">
        <div aria-hidden className="profile-hero-glow absolute inset-0" />
        <div className="relative grid gap-6 p-5 sm:p-8 lg:p-10 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
          <div className="relative mx-auto md:mx-0 w-max">
            <UserAvatar src={avatarSrc} name={name === "there" ? null : name} className="size-24 sm:size-28 lg:size-32 text-4xl ring-4 ring-background shadow-[var(--shadow-elegant)]" />
            {user && <button type="button" onClick={() => setPickerOpen(true)} aria-label="Change avatar" className="absolute bottom-1 right-1 grid size-10 place-items-center rounded-full bg-accent text-accent-foreground ring-4 ring-background transition hover:scale-105 focus-visible:outline-none focus-visible:ring-accent/60"><Camera className="size-4" /></button>}
          </div>
          <div className="min-w-0 text-center md:text-left">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Your profile</p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight break-words">{greeting}{name !== "there" ? `, ${name}` : ""}</h1>
            <p className="text-sm text-muted-foreground truncate mt-1.5">{user?.email || "Your saved activity on this device"}{memberSince ? ` · Member since ${memberSince}` : ""}</p>
            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
              {sections.map(s => <button key={s.key} type="button" onClick={() => { setActive(s.key); document.getElementById("profile-activity")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/50 backdrop-blur px-3 h-9 text-xs text-muted-foreground transition hover:text-foreground hover:border-foreground/30"><s.icon className="size-3.5" /><span className="font-semibold text-foreground">{s.count}</span>{s.label}</button>)}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col gap-2 justify-center">
            {user && <Button variant="secondary" className="h-11" onClick={() => setPickerOpen(true)}><Camera />Change avatar</Button>}
            <Button asChild variant="outline" className="h-11 bg-background/40"><Link to="/account"><Pencil />Edit profile</Link></Button>
          </div>
        </div>
      </header>
      <p className="-mt-4 text-xs text-muted-foreground text-center md:text-left">Saved activity is stored on this device.</p>
      <AvatarPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} />
      {busy ? <div role="status" className="py-8 flex gap-2 items-center text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading your activity…</div> : continuing.length ? <section aria-labelledby="continue-heading">
        <div className="flex justify-between items-center gap-3 mb-4"><h2 id="continue-heading" className="text-xl font-semibold">Continue watching</h2><span className="text-sm text-muted-foreground">{continuing.length} titles</span></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">{continuing.map(({ p, t }) => <div key={t.id}><TitleCard t={t} portrait={false} preview={false} /><progress aria-label={`${t.title} viewing progress`} value={p.positionPct} max={100} className="mt-2 w-full h-1.5 accent-accent" /><p className="text-xs text-muted-foreground mt-1">{Math.round(p.positionPct)}% watched</p></div>)}</div>
      </section> : <section className="border-b border-border pb-7">
        <p className="text-xs text-accent mb-2">Your next watch</p><h2 className="text-2xl font-semibold">{myList.length ? "Find your next watch" : "Build your watchlist"}</h2>
        <p className="text-sm text-muted-foreground mt-2">{myList.length ? "Choose a saved title below, or discover something new." : "Save a title for later or follow a channel you love."}</p>
        <div className="flex gap-3 flex-wrap mt-4"><Button asChild className="h-11"><Link to="/movies">Browse movies<ArrowRight /></Link></Button><Button asChild variant="outline" className="h-11"><Link to="/channels">Follow a channel</Link></Button></div>
      </section>}
      <section aria-label="Saved activity" className="space-y-5">
        <nav aria-label="Profile activity" className="grid grid-cols-2 sm:grid-cols-4 gap-2 sticky top-16 z-20 bg-background/95 backdrop-blur-xl py-2">
          {sections.map(s => <Button key={s.key} variant={active === s.key ? "secondary" : "ghost"} onClick={() => setActive(s.key)} aria-pressed={active === s.key} aria-controls="profile-activity" className={`h-12 px-3 justify-start min-w-0 ${active === s.key ? "border border-accent text-accent" : "border border-transparent text-muted-foreground"}`}><s.icon /><span>{s.label}</span><span className="ml-auto text-xs">{s.count}</span></Button>)}
        </nav>
        <div id="profile-activity" aria-live="polite">
          <h2 className="text-xl font-semibold mb-4">{sections.find(s => s.key === active)?.label}</h2>
          {busy ? <p className="text-muted-foreground">Loading saved activity…</p> : <>
          {active === "list" && (saved.length ? <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">{saved.map(t => <div key={t.id}><TitleCard t={t} /><Button variant="ghost" className="h-11 w-full text-muted-foreground" onClick={() => { toggleList(t.id); toast.success("Removed from My List"); }} aria-label={`Remove ${t.title} from My List`}><Trash2 />Remove</Button></div>)}</div> : <Empty title={myList.length ? "Saved titles are currently unavailable" : "Nothing saved yet"} description="Browse published titles and save something for your next watch." destination="/movies" action="Browse movies" />)}
          {active === "following" && (followed.length ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{followed.map(c => <article key={c.id} className="rounded-lg border border-border overflow-hidden"><Link to="/channels/$channelId" params={{ channelId: c.id }}><img src={c.banner} alt={c.name} className="aspect-video w-full object-cover" /><h3 className="font-semibold px-4 pt-3">{c.name}</h3></Link><Button variant="ghost" className="m-1 h-11 text-muted-foreground" onClick={() => { toggleFollow(c.id); toast.success(`Unfollowed ${c.name}`); }}>Unfollow</Button></article>)}</div> : <Empty title={following.length ? "Followed channels are currently unavailable" : "Follow your first channel"} description="Keep the channels you enjoy together here." destination="/channels" action="Browse channels" />)}
          {active === "reminders" && (reminders.length ? <div className="divide-y divide-border">{reminders.map(r => <div key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center py-4"><div className="min-w-0"><h3 className="text-sm font-semibold break-words">{r.title}</h3><p className="text-sm text-muted-foreground mt-1">{channels.find(c => c.id === r.channelId)?.name || "Channel unavailable"} · {r.time}</p><p className="text-xs text-muted-foreground mt-1">Saved on this device</p></div><Button variant="ghost" size="icon" className="size-11" aria-label={`Remove reminder for ${r.title}`} onClick={() => { toggleReminder(r); toast.success("Reminder removed"); }}><Trash2 /></Button></div>)}</div> : <Empty title="No reminders yet" description="Save a programme reminder from a channel’s schedule." destination="/guide" action="Browse the guide" />)}
          {active === "history" && (history.length ? <div className="divide-y divide-border">{history.map(({ p, t }) => <div key={t.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-center py-3"><Link to="/movies/$titleId" params={{ titleId: t.id }} className="flex gap-3 min-w-0 items-center"><img src={t.cover} alt="" className="w-20 aspect-video object-cover rounded-md shrink-0" /><div className="min-w-0"><p className="text-sm font-medium truncate">{t.title}</p><p className="text-xs text-muted-foreground mt-1">{Math.round(p.positionPct)}% watched · {new Date(p.updatedAt).toLocaleDateString()}</p></div></Link><Button variant="ghost" size="icon" className="size-11" aria-label={`Remove ${t.title} from history`} onClick={() => { clear(t.id); toast.success("Removed from history"); }}><Trash2 /></Button></div>)}</div> : <Empty title="Your viewing history starts here" description="Titles appear after you play them—not just open their pages." destination="/movies" action="Find something to watch" />)}
          </>}
        </div>
      </section>
      <PlaybackPreferences />
      <section className="border-t border-border pt-6" aria-labelledby="profiles-heading"><div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><div className="min-w-0"><h2 id="profiles-heading" className="text-lg font-semibold">Watching profile</h2><p className="text-sm text-muted-foreground mt-1">{user ? `${name === "there" ? "Your account" : name} · Current profile` : "Sign in to manage your account profile."}</p></div><Button asChild variant="outline" className="h-11"><Link to={user ? "/account" : "/auth"}>{user ? "Manage profile" : "Sign in"}</Link></Button></div></section>
    </main><SiteFooter />
  </div>;
}
function Empty({ title, description, destination, action }: { title: string; description: string; destination: "/movies" | "/channels" | "/guide"; action: string }) {
  return <div className="py-8 sm:py-12 border-y border-border"><h3 className="text-lg font-medium">{title}</h3><p className="text-sm text-muted-foreground mt-2 mb-4">{description}</p><Button asChild variant="outline" className="h-11"><Link to={destination}>{action}<ArrowRight /></Link></Button></div>;
}
