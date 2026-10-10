import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Radio, Tv, Mic2, Film, Video,
  Loader2, ShieldOff, Pencil, Sparkles, ExternalLink, Settings, Check, ArrowRight, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ChannelEditor, type Channel } from "@/routes/admin";
import { ChannelSetupWizard } from "@/components/studio/channel-setup-wizard";
import { BroadcastPanel, type TvSource } from "@/components/studio/broadcast-panel";
import { MediaLibraryPanel } from "@/components/studio/media-library-panel";
import { PlayoutPanel } from "@/components/studio/playout-panel";
import { RadioPanel } from "@/components/studio/radio-panel";
import { AnalyticsPanel } from "@/components/studio/analytics-panel";
import { TeamPanel } from "@/components/studio/team-panel";
import {
  SERVICE_CATALOG, fetchChannelServices, saveChannelServices, type ServiceKey,
} from "@/lib/channel-services";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Creator Studio — Lettflix" },
      {
        name: "description",
        content:
          "Set up your Lettflix channel, activate TV, radio, podcasts, movies and videos, and manage your media operation from one studio.",
      },
      { property: "og:title", content: "Creator Studio — Lettflix" },
      {
        property: "og:description",
        content: "Build and manage your Lettflix channel: branding, services, content and broadcasting.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudioPage,
});

const SERVICE_ICON: Record<ServiceKey, typeof Tv> = {
  tv: Tv, radio: Radio, podcasts: Mic2, movies: Film, videos: Video,
};

type Tab =
  | "overview" | "channel" | "services" | "content"
  | "broadcast" | "radio" | "analytics" | "team";

function StudioPage() {
  const { user, isAdmin, isCreator, loading } = useAuth();
  const navigate = useNavigate();
  const [channel, setChannel] = useState<Partial<Channel> | null>(null);
  const [services, setServices] = useState<ServiceKey[]>([]);
  const [loadingChannel, setLoadingChannel] = useState(true);
  const [wizard, setWizard] = useState(false);
  const [advanced, setAdvanced] = useState<Partial<Channel> | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [starting, setStarting] = useState(false);
  const [setup, setSetup] = useState<{ content: number; input: boolean; encoder: string | null; checked: Date | null; error: boolean }>({ content: 0, input: false, encoder: null, checked: null, error: false });
  const [refreshing, setRefreshing] = useState(false);
  const refreshWorkspace = useCallback(async () => {
    if (!channel?.id) return;
    setRefreshing(true);
    const [state, inputs, content] = await Promise.all([
      supabase.from("cms_channels").select("is_live, tv_source, stream_url, playout_enabled, fallback_playlist_id").eq("id", channel.id).single(),
      supabase.from("live_inputs").select("id, status, updated_at").eq("channel_id", channel.id).eq("service", "tv").maybeSingle(),
      supabase.from("cms_titles").select("id", { count: "exact", head: true }).eq("channel_id", channel.id),
    ]);
    if (!state.error && state.data) setChannel(prev => prev ? { ...prev, ...state.data } : prev);
    setSetup({ content: content.count ?? 0, input: Boolean(inputs.data), encoder: inputs.data?.status ?? null, checked: new Date(), error: Boolean(state.error || inputs.error || content.error) });
    setRefreshing(false);
  }, [channel?.id]);
  useEffect(() => {
    void refreshWorkspace();
    const timer = setInterval(() => void refreshWorkspace(), 15000);
    return () => clearInterval(timer);
  }, [refreshWorkspace]);
  const groups: { label: string; items: [Tab, string][] }[] = [
    { label: "Workspace", items: [["overview", "Overview"]] },
    { label: "Channel", items: [["channel", "Branding"], ["services", "Services"]] },
    { label: "Content", items: [["content", "Library"]] },
    { label: "Broadcast", items: [["broadcast", "Live TV"], ["radio", "Radio"]] },
    { label: "Audience & analytics", items: [["analytics", "Analytics"], ["team", "Team"]] },
  ];
  const source = (channel as { tv_source?: TvSource } | null)?.tv_source;
  const sourceName = source === "ingest" ? "Lettflix Live ingest" : source === "external" ? "Existing stream" : source === "playout" ? "Automated TV" : "No source selected";
  const checklist = [
    { label: "Channel branding", done: Boolean(channel?.logo_url && channel?.banner_url && channel?.description), tab: "channel" as Tab },
    { label: "Activate services", done: services.length > 0, tab: "services" as Tab },
    { label: "Add your first content", done: setup.content > 0, tab: "content" as Tab },
    { label: "Set up broadcasting", done: source === "ingest" ? setup.input : source === "external" ? Boolean(channel?.stream_url) : source === "playout" ? Boolean((channel as { fallback_playlist_id?: string | null } | null)?.fallback_playlist_id) : false, tab: "broadcast" as Tab },
  ];
  const completed = checklist.filter(item => item.done).length;

  const load = useCallback(async () => {
    if (!user) return;
    setLoadingChannel(true);
    const { data } = await supabase
      .from("cms_channels")
      .select("*")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: true })
      .maybeSingle();
    const ch = (data as unknown as Channel) ?? null;
    setChannel(ch);
    if (ch?.id) {
      const rows = await fetchChannelServices(ch.id);
      setServices(rows.filter((r) => r.enabled).map((r) => r.service));
    } else {
      setServices([]);
    }
    setLoadingChannel(false);
  }, [user]);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth", search: { redirect: "/studio" }, replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || !(isCreator || isAdmin)) return;
    load();
  }, [user, isCreator, isAdmin, load]);

  useEffect(() => {
    if (typeof window === "undefined" || !isCreator) return;
    if (sessionStorage.getItem("lettflix.completeChannel") === "1") {
      sessionStorage.removeItem("lettflix.completeChannel");
      setWizard(true);
    }
  }, [isCreator]);

  async function toggleService(key: ServiceKey) {
    if (!channel?.id) return;
    const next = services.includes(key) ? services.filter((s) => s !== key) : [...services, key];
    setServices(next);
    try {
      await saveChannelServices(channel.id, next);
      toast.success("Services updated");
    } catch {
      toast.error("Could not update services");
      load();
    }
  }

  async function saveAdvanced(v: Partial<Channel>) {
    if (!user) return;
    const payload = { ...v, creator_id: user.id };
    const { error } = v.id
      ? await supabase.from("cms_channels").update(payload as never).eq("id", v.id)
      : await supabase.from("cms_channels").insert(payload as never);
    if (error) { toast.error(error.message); return; }
    toast.success("Channel saved");
    setAdvanced(null);
    load();
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isCreator && !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 grid place-items-center px-6">
          <div className="max-w-md text-center py-24">
            <ShieldOff className="size-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Creator access required</h1>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-2">
              Creator Studio is available to approved creators and administrators.
            </p>
            <Link to="/" className="mt-6 inline-flex h-10 px-5 items-center rounded-md bg-primary text-primary-foreground font-semibold text-sm">
              Back to Home
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // First-login welcome
  if (!loadingChannel && !channel) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1 grid place-items-center px-6">
          <div className="max-w-xl text-center py-12">
            <div className="mx-auto size-16 rounded-2xl bg-primary/15 grid place-items-center mb-6">
              <Sparkles className="size-8 text-primary" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
              Welcome to Lettflix Creator Studio
            </h1>
            <p className="mt-4 text-[color:var(--secondary-foreground)]">
              Let's set up your channel and bring your content to your audience. TV, radio,
              podcasts, movies and videos — all under one channel identity.
            </p>
            <ol className="mt-6 grid grid-cols-2 gap-3 text-left text-sm text-muted-foreground">
              {["Channel branding", "Activate services", "Add your first content", "Set up broadcasting"].map((item, index) => <li key={item} className="border-t border-border pt-3"><span className="text-accent mr-2">{index + 1}</span>{item}</li>)}
            </ol>
            <p className="mt-4 text-xs text-muted-foreground">0 of 4 complete</p>
            <Button variant="ghost"
              onClick={() => setWizard(true)}
              className="mt-8 h-12 px-7 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition"
            >
              Set Up My Channel
            </Button>
          </div>
        </main>
        <SiteFooter />
        {wizard && (
          <ChannelSetupWizard
            channel={null}
            creatorId={user.id}
            initialServices={[]}
            onClose={() => setWizard(false)}
            onDone={() => { setWizard(false); load(); }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Channel identity header */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-10 pt-6 pb-6">
          <div className="grid gap-5 sm:flex sm:items-start sm:justify-between">
            <div className="flex items-center gap-4 min-w-0">
              {channel?.logo_url ? (
                <img src={channel.logo_url} alt={`${channel?.name ?? "Channel"} logo`} className="size-16 shrink-0 rounded-lg object-cover border border-border" />
              ) : (
                <div className="size-16 shrink-0 rounded-lg bg-elevated border border-border grid place-items-center">
                  <Tv className="size-6 text-[color:var(--muted-foreground)]" />
                </div>
              )}
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-elevated/70 border border-border text-[11px] font-medium">
                  <Sparkles className="size-3 text-accent" /> Creator Studio
                </div>
                <h1 className="mt-2 text-2xl lg:text-3xl font-extrabold tracking-tight truncate">
                  {channel?.name ?? "Your channel"}
                </h1>
                <div className="text-xs text-[color:var(--muted-foreground)]">
                  /channels/{channel?.slug}
                  {channel?.is_live && <span className="ml-2 text-primary font-semibold">● LIVE</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="ghost"
                onClick={() => setWizard(true)}
                className="h-11 px-5 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition inline-flex items-center gap-2"
              >
                <Pencil className="size-4" /> Edit channel
              </Button>
              {channel?.slug && (
                <Link
                  to="/channels/$channelId"
                  params={{ channelId: channel.slug }}
                  className="h-11 px-5 rounded-md bg-elevated border border-border font-medium hover:bg-elevated/70 transition inline-flex items-center gap-2"
                >
                  <ExternalLink className="size-4" /> View channel
                </Link>
              )}
            </div>
          </div>

        </div>
      </section>

      <section aria-label="Broadcast status" className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-10 py-3 grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center">
          <div className="min-w-0" role="status"><div className="flex items-center gap-2"><span className={`size-2.5 shrink-0 rounded-full ${starting ? "bg-warning" : channel?.is_live ? "bg-live" : "bg-muted-foreground"}`} /><span className="font-semibold">{starting ? "Starting" : channel?.is_live ? "Live" : "Off air"}</span><span className="text-xs text-muted-foreground truncate">{sourceName}</span></div><p className="mt-1 text-xs text-muted-foreground">{setup.error ? "Status refresh unavailable" : source === "ingest" ? `Encoder: ${setup.encoder === "live" || setup.encoder === "connected" ? "connected" : setup.input ? "waiting for connection" : "not configured"}` : "Playback health available in broadcast controls"}{setup.checked && ` · Checked ${setup.checked.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}</p></div>
          <div className="flex items-center gap-1"><Button variant="ghost" size="icon" className="size-11" aria-label="Refresh workspace status" disabled={refreshing} onClick={() => void refreshWorkspace()}><RefreshCw className={refreshing ? "animate-spin" : ""} /></Button><Button className="h-11 px-3" disabled={starting} onClick={() => setTab("broadcast")}>{channel?.is_live ? "Manage broadcast" : "Set up / Go live"}</Button></div>
        </div>
      </section>
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-10 py-6 grid gap-6 lg:grid-cols-[210px_minmax(0,1fr)]">
        <aside className="min-w-0 lg:sticky lg:top-40 h-max">
          <nav aria-label="Creator Studio" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-3">
            {groups.map(group => <div key={group.label} className="min-w-0"><p className="text-xs text-muted-foreground mb-1 px-2">{group.label}</p><div className="grid gap-1">{group.items.map(([key, label]) => <Button key={key} variant={tab === key ? "secondary" : "ghost"} aria-pressed={tab === key} aria-controls="studio-workspace" className={`h-11 justify-start px-3 ${tab === key ? "text-accent border-l-2 border-accent" : "text-muted-foreground"}`} onClick={() => setTab(key)}>{label}</Button>)}</div></div>)}
          </nav>
        </aside>
        <main id="studio-workspace" className="min-w-0 space-y-6 pb-10">
        {tab === "overview" && (
          <>
            <section aria-labelledby="setup-heading" className="border-b border-border pb-6">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><div><h2 id="setup-heading" className="text-xl font-semibold">{completed === 4 ? "Your workspace is ready" : "Complete your channel setup"}</h2><p className="mt-1 text-sm text-muted-foreground">{completed} of 4 complete{setup.error ? " · Some setup details could not be checked" : ""}</p></div><span className="text-accent font-semibold">{completed}/4</span></div>
              <progress aria-label="Channel setup progress" value={completed} max={4} className="w-full h-1.5 mt-4 accent-accent" />
              <div className="grid sm:grid-cols-2 gap-2 mt-4">{checklist.map(item => <Button variant="ghost" key={item.label} className="h-12 justify-start border border-border whitespace-normal text-left" onClick={() => setTab(item.tab)}>{item.done ? <Check className="text-success" /> : <span className="size-4 rounded-full border border-muted-foreground shrink-0" />}<span className="flex-1">{item.label}</span><ArrowRight /></Button>)}</div>
            </section>
            {channel?.id && <AnalyticsPanel channelId={channel.id} />}
            <div className="grid gap-4">
              <div className="border-t border-border py-5">
                <div className="text-sm font-semibold mb-4">Active services</div>
                <div className="grid gap-2">
                  {SERVICE_CATALOG.filter((s) => services.includes(s.key)).map((s) => {
                    const Icon = SERVICE_ICON[s.key];
                    return (
                      <div key={s.key} className="flex items-center gap-3 h-11 px-4 rounded-md bg-surface border border-border text-sm">
                        <Icon className="size-4 text-accent" /> {s.label}
                      </div>
                    );
                  })}
                  {!services.length && (
                    <p className="text-sm text-[color:var(--muted-foreground)]">
                      No services activated yet. Open the Services tab to choose what your channel operates.
                    </p>
                  )}
                </div>
                <Button variant="ghost"
                  onClick={() => setTab("services")}
                  className="mt-4 w-full h-10 rounded-md border border-border bg-elevated hover:bg-elevated/70 text-sm font-medium inline-flex items-center justify-center gap-2"
                >
                  <Settings className="size-4" /> Manage services
                </Button>
              </div>
            </div>
          </>
        )}

        {tab === "channel" && channel && (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-border bg-elevated/40 overflow-hidden">
              <div className="h-40 bg-surface">
                {channel.banner_url && (
                  <img src={channel.banner_url} alt={`${channel.name} cover`} className="size-full object-cover" />
                )}
              </div>
              <div className="p-5">
                <h2 className="text-lg font-bold">{channel.name}</h2>
                {channel.tagline && <p className="text-sm text-accent">{channel.tagline}</p>}
                <p className="mt-2 text-sm text-[color:var(--secondary-foreground)]">{channel.description}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                  {[
                    ["Category", channel.category],
                    ["Language", channel.language],
                    ["Country", channel.country],
                    ["Region", channel.region],
                  ].map(([l, v]) => (
                    <div key={l as string}>
                      <div className="text-xs uppercase tracking-wider text-[color:var(--muted-foreground)]">{l}</div>
                      <div>{(v as string) || "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t border-border py-5">
              <div className="text-sm font-semibold mb-3">Channel tools</div>
              <Button variant="ghost"
                onClick={() => setWizard(true)}
                className="w-full h-11 rounded-md bg-primary text-primary-foreground font-semibold text-sm mb-2"
              >
                Edit with setup wizard
              </Button>
              <Button variant="ghost"
                onClick={() => setAdvanced(channel)}
                className="w-full h-11 rounded-md border border-border bg-surface hover:bg-elevated text-sm font-medium"
              >
                Advanced settings
              </Button>
              <p className="mt-3 text-xs text-[color:var(--muted-foreground)]">
                Advanced settings expose stream source, programming metadata and library ordering.
              </p>
            </div>
          </div>
        )}

        {tab === "services" && (
          <div className="grid gap-3 max-w-3xl">
            <p className="text-sm text-[color:var(--muted-foreground)]">
              Activate the services your channel operates. Only active services appear on your public channel page.
            </p>
            {SERVICE_CATALOG.map((s) => {
              const Icon = SERVICE_ICON[s.key];
              const on = services.includes(s.key);
              return (
                <Button variant="ghost"
                  key={s.key}
                  onClick={() => toggleService(s.key)}
                  className={`flex items-start gap-3 text-left rounded-xl border p-4 transition ${
                    on ? "border-primary bg-primary/10" : "border-border bg-elevated/40 hover:bg-elevated/70"
                  }`}
                >
                  <Icon className={`mt-0.5 size-5 ${on ? "text-primary" : "text-[color:var(--muted-foreground)]"}`} />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{s.label}</span>
                    <span className="block text-xs text-[color:var(--muted-foreground)]">{s.blurb}</span>
                  </span>
                  <span className={`size-5 rounded-md grid place-items-center border ${on ? "bg-primary border-primary" : "border-border"}`}>
                    {on && <Check className="size-3.5 text-primary-foreground" />}
                  </span>
                </Button>
              );
            })}
          </div>
        )}

        {tab === "content" && channel?.id && <MediaLibraryPanel channelId={channel.id} />}



        {tab === "radio" && channel?.id && <RadioPanel channelId={channel.id} />}

        {tab === "analytics" && channel?.id && <AnalyticsPanel channelId={channel.id} />}

        {tab === "team" && channel?.id && <TeamPanel channelId={channel.id} />}

        {tab === "broadcast" && channel?.id && (
          <BroadcastPanel
            channelId={channel.id}
            channelStreamUrl={channel.stream_url ?? null}
            tvSource={((channel as { tv_source?: TvSource }).tv_source ?? "none")}
            isLive={Boolean(channel.is_live)}
            onChannelUpdated={() => { void load(); void refreshWorkspace(); }}
            onStartingChange={setStarting}
            playoutPanel={
              <PlayoutPanel
                channelId={channel.id}
                playoutEnabled={(channel as { playout_enabled?: boolean }).playout_enabled}
                fallbackPlaylistId={(channel as { fallback_playlist_id?: string | null }).fallback_playlist_id ?? null}
                onChannelUpdated={load}
              />
            }
          />
        )}

        </main>
      </div>
      <SiteFooter />

      {wizard && (
        <ChannelSetupWizard
          channel={channel}
          creatorId={user.id}
          initialServices={services}
          onClose={() => setWizard(false)}
          onDone={() => { setWizard(false); load(); }}
        />
      )}
      {advanced && (
        <ChannelEditor value={advanced} onClose={() => setAdvanced(null)} onSave={saveAdvanced} />
      )}
    </div>
  );
}
