import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MediaPicker } from "@/components/media-picker";
import { Loader2, Plus, Pencil, Trash2, ShieldCheck, ShieldOff, Video, Radio, Layers, Users as UsersIcon, LayoutDashboard, CalendarClock, Sparkles, Megaphone, Building2, KeyRound, UserPlus, Check, X, Home } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "CMS Admin — Lettflix" },
      { name: "description", content: "Manage channels, on-demand titles, collections, and user roles." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth", search: { redirect: "/admin" }, replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 grid place-items-center px-6">
          <div className="max-w-md text-center py-24">
            <ShieldOff className="size-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Admin access required</h1>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-2">
              Your account isn't provisioned as an administrator. Ask an existing admin to grant you the role, or return home.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex h-10 px-5 items-center rounded-md bg-primary text-primary-foreground font-semibold text-sm"
            >
              Back to Home
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-[1480px] w-full px-6 lg:px-10 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="size-10 rounded-lg bg-primary/10 grid place-items-center">
            <ShieldCheck className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">CMS Admin</h1>
            <p className="text-sm text-[color:var(--muted-foreground)]">
              Manage the Lettflix catalog and user roles.
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6 flex flex-wrap h-auto">
            <TabsTrigger value="overview"><LayoutDashboard className="size-4" /> Overview</TabsTrigger>
            <TabsTrigger value="homepage"><Home className="size-4" /> Homepage</TabsTrigger>
            <TabsTrigger value="channels"><Radio className="size-4" /> Channels</TabsTrigger>
            <TabsTrigger value="titles"><Video className="size-4" /> Titles</TabsTrigger>
            <TabsTrigger value="schedule"><CalendarClock className="size-4" /> Schedule</TabsTrigger>
            <TabsTrigger value="events"><Sparkles className="size-4" /> Events</TabsTrigger>
            <TabsTrigger value="collections"><Layers className="size-4" /> Collections</TabsTrigger>
            <TabsTrigger value="sponsors"><Megaphone className="size-4" /> Sponsors</TabsTrigger>
            <TabsTrigger value="leads"><Building2 className="size-4" /> Leads</TabsTrigger>
            <TabsTrigger value="users"><UsersIcon className="size-4" /> Users</TabsTrigger>
            <TabsTrigger value="applications"><UserPlus className="size-4" /> Applications</TabsTrigger>
            <TabsTrigger value="security"><KeyRound className="size-4" /> Security</TabsTrigger>
          </TabsList>
          <TabsContent value="overview"><OverviewCms /></TabsContent>
          <TabsContent value="homepage"><HomepageCms /></TabsContent>
          <TabsContent value="channels"><ChannelsCms /></TabsContent>
          <TabsContent value="titles"><TitlesCms /></TabsContent>
          <TabsContent value="schedule"><ScheduleCms /></TabsContent>
          <TabsContent value="events"><EventsCms /></TabsContent>
          <TabsContent value="collections"><CollectionsCms /></TabsContent>
          <TabsContent value="sponsors"><SponsorsCms /></TabsContent>
          <TabsContent value="leads"><LeadsCms /></TabsContent>
          <TabsContent value="users"><UsersCms /></TabsContent>
          <TabsContent value="applications"><ApplicationsCms /></TabsContent>
          <TabsContent value="security"><SecurityCms /></TabsContent>
        </Tabs>

      </main>
      <SiteFooter />
    </div>
  );
}

// ---------- Generic CRUD hook ----------
function useCrud<T extends { id: string }>(table: string, orderCol = "created_at") {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const { data, error } = await supabase.from(table as never).select("*").order(orderCol, { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as T[]);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(payload: Partial<T> & { id?: string }) {
    if (payload.id) {
      const { error } = await supabase.from(table as never).update(payload as never).eq("id", payload.id);
      if (error) return toast.error(error.message);
      toast.success("Updated");
    } else {
      const { error } = await supabase.from(table as never).insert(payload as never);
      if (error) return toast.error(error.message);
      toast.success("Created");
    }
    await refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    const { error } = await supabase.from(table as never).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    await refresh();
  }

  return { rows, loading, save, remove, refresh };
}

// ---------- Shared form primitives ----------
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[color:var(--muted-foreground)] mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full h-10 px-3 rounded-md bg-elevated border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";
export const textareaClass =
  "w-full min-h-24 px-3 py-2 rounded-md bg-elevated border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-surface/50 p-6">{children}</div>;
}


function EmptyState({ label, onNew }: { label: string; onNew: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-border py-16 text-center">
      <p className="text-sm text-[color:var(--muted-foreground)]">No {label} yet.</p>
      <button onClick={onNew} className="mt-4 inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-sm">
        <Plus className="size-4" /> New {label.slice(0, -1)}
      </button>
    </div>
  );
}

// ---------- Channels CMS ----------
export type Channel = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  category: string | null;
  language: string | null;
  country: string | null;
  region: string | null;
  viewers: string | null;
  popularity: number | null;
  is_trending: boolean | null;
  stream_url: string | null;
  logo_url: string | null;
  banner_url: string | null;
  kind: string;
  is_live: boolean;
  is_published: boolean;
  creator_id?: string | null;
  now_playing: { title?: string; startsAt?: string; endsAt?: string; description?: string } | null;
  video_library: string[] | null;
  podcast_library: string[] | null;
  featured_content: string[] | null;
};



function ChannelsCms() {
  const { rows, loading, save, remove } = useCrud<Channel>("cms_channels");
  const [editing, setEditing] = useState<Partial<Channel> | null>(null);

  function openNew() {
    setEditing({ kind: "tv", is_published: true, is_live: false, popularity: 0, is_trending: false });
  }

  if (loading) return <Loader2 className="size-5 animate-spin text-primary" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Channels</h2>
          <p className="text-xs text-[color:var(--muted-foreground)]">Live TV, radio, and event feeds.</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-sm">
          <Plus className="size-4" /> New Channel
        </button>
      </div>

      {rows.length === 0 ? (
        <EmptyState label="channels" onNew={openNew} />
      ) : (
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-[color:var(--muted-foreground)] uppercase tracking-wide">
                <tr className="border-b border-border">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Category</th>
                  <th className="pb-3 pr-4">Kind</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Language</th>
                  <th className="pb-3 pr-4 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-[color:var(--muted-foreground)]">{r.slug}</div>
                    </td>
                    <td className="py-3 pr-4">{r.category ?? "—"}</td>
                    <td className="py-3 pr-4 capitalize">{r.kind}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${r.is_published ? "bg-emerald-500/15 text-emerald-400" : "bg-elevated text-[color:var(--muted-foreground)]"}`}>
                        {r.is_published ? "Published" : "Draft"}
                      </span>
                      {r.is_live && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                          Live
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4">{r.language ?? "—"}</td>
                    <td className="py-3 pr-4">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setEditing(r)} className="size-8 grid place-items-center rounded-md hover:bg-elevated"><Pencil className="size-4" /></button>
                        <button onClick={() => remove(r.id)} className="size-8 grid place-items-center rounded-md hover:bg-elevated text-destructive"><Trash2 className="size-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {editing && (
        <ChannelEditor
          value={editing}
          onClose={() => setEditing(null)}
          onSave={async (v) => {
            await save(v);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

export function ChannelEditor({ value, onClose, onSave }: { value: Partial<Channel>; onClose: () => void; onSave: (v: Partial<Channel>) => void | Promise<void> }) {
  const [form, setForm] = useState<Partial<Channel>>(value);
  const set = <K extends keyof Channel>(k: K, v: Channel[K]) => setForm((f) => ({ ...f, [k]: v }));
  const np = form.now_playing ?? {};
  const setNp = (patch: Partial<NonNullable<Channel["now_playing"]>>) =>
    setForm((f) => ({ ...f, now_playing: { ...(f.now_playing ?? {}), ...patch } }));
  const listToStr = (a?: string[] | null) => (a ?? []).join(", ");
  const strToList = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

  return (
    <ModalShell title={form.id ? "Edit channel" : "New channel"} onClose={onClose} onSave={() => onSave(form)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name"><input className={inputClass} value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Slug"><input className={inputClass} value={form.slug ?? ""} onChange={(e) => set("slug", e.target.value)} placeholder="loveworld-plus" /></Field>
        <Field label="Category">
          <select className={inputClass} value={form.category ?? ""} onChange={(e) => set("category", e.target.value)}>
            <option value="">—</option>
            {["Sports","News","Entertainment","Christian Living","Music","LoveWorld","Radio","Audio","Video","Education","Lifestyle","Kids & Family"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Kind">
          <select className={inputClass} value={form.kind ?? "tv"} onChange={(e) => set("kind", e.target.value)}>
            <option value="tv">TV / Video</option>
            <option value="radio">Radio</option>
          </select>
        </Field>
        <Field label="Language"><input className={inputClass} value={form.language ?? ""} onChange={(e) => set("language", e.target.value)} /></Field>
        <Field label="Country"><input className={inputClass} value={form.country ?? ""} onChange={(e) => set("country", e.target.value)} /></Field>
        <Field label="Region"><input className={inputClass} value={form.region ?? ""} onChange={(e) => set("region", e.target.value)} placeholder="Global" /></Field>
        <Field label="Viewers (display)"><input className={inputClass} value={form.viewers ?? ""} onChange={(e) => set("viewers", e.target.value)} placeholder="12.4K" /></Field>
        <Field label="Popularity (0-100)"><input type="number" min={0} max={100} className={inputClass} value={form.popularity ?? 0} onChange={(e) => set("popularity", Number(e.target.value))} /></Field>
        <Field label="Stream URL (HLS / MP4 / radio)"><input className={inputClass} value={form.stream_url ?? ""} onChange={(e) => set("stream_url", e.target.value)} placeholder="https://…/index.m3u8" /></Field>
      </div>

      <div className="grid gap-4 mt-4 md:grid-cols-2">
        <Field label="Logo">
          <MediaPicker value={form.logo_url} onChange={(url) => set("logo_url", url)} folder="channels/logos" />
        </Field>
        <Field label="Banner">
          <MediaPicker value={form.banner_url} onChange={(url) => set("banner_url", url)} folder="channels/banners" />
        </Field>
      </div>

      <div className="grid gap-4 mt-4">
        <Field label="Tagline"><input className={inputClass} value={form.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} /></Field>
        <Field label="Description"><textarea className={textareaClass} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} /></Field>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold mb-2">Now Playing</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Program title"><input className={inputClass} value={np.title ?? ""} onChange={(e) => setNp({ title: e.target.value })} /></Field>
          <Field label="Description"><input className={inputClass} value={np.description ?? ""} onChange={(e) => setNp({ description: e.target.value })} /></Field>
          <Field label="Starts at (label)"><input className={inputClass} value={np.startsAt ?? ""} onChange={(e) => setNp({ startsAt: e.target.value })} placeholder="10:00" /></Field>
          <Field label="Ends at (label)"><input className={inputClass} value={np.endsAt ?? ""} onChange={(e) => setNp({ endsAt: e.target.value })} placeholder="12:00" /></Field>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <Field label="Video library (title slugs, comma-separated)">
          <input className={inputClass} value={listToStr(form.video_library)} onChange={(e) => set("video_library", strToList(e.target.value))} />
        </Field>
        <Field label="Podcast library (title slugs, comma-separated)">
          <input className={inputClass} value={listToStr(form.podcast_library)} onChange={(e) => set("podcast_library", strToList(e.target.value))} />
        </Field>
        <Field label="Featured content (title slugs, comma-separated)">
          <input className={inputClass} value={listToStr(form.featured_content)} onChange={(e) => set("featured_content", strToList(e.target.value))} />
        </Field>
      </div>

      <div className="flex gap-6 mt-6 flex-wrap">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_published ?? true} onChange={(e) => set("is_published", e.target.checked)} /> Published</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_live ?? false} onChange={(e) => set("is_live", e.target.checked)} /> Live now</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_trending ?? false} onChange={(e) => set("is_trending", e.target.checked)} /> Trending</label>
      </div>
    </ModalShell>
  );
}


// ---------- Titles CMS ----------
type Title = {
  id: string;
  slug: string;
  title: string;
  synopsis: string | null;
  kind: string;
  genre: string | null;
  year: number | null;
  rating: string | null;
  duration_minutes: number | null;
  duration_label: string | null;
  seasons: number | null;
  episodes: number | null;
  cast_list: string[] | null;
  is_featured: boolean | null;
  stream_url: string | null;
  trailer_url: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  is_published: boolean;
};

function TitlesCms() {
  const { rows, loading, save, remove } = useCrud<Title>("cms_titles");
  const [editing, setEditing] = useState<Partial<Title> | null>(null);
  const openNew = () => setEditing({ kind: "movie", is_published: true });

  if (loading) return <Loader2 className="size-5 animate-spin text-primary" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">On-Demand Titles</h2>
          <p className="text-xs text-[color:var(--muted-foreground)]">Movies, series, and podcasts library.</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-sm">
          <Plus className="size-4" /> New Title
        </button>
      </div>

      {rows.length === 0 ? (
        <EmptyState label="titles" onNew={openNew} />
      ) : (
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-[color:var(--muted-foreground)] uppercase tracking-wide">
                <tr className="border-b border-border">
                  <th className="pb-3 pr-4">Title</th>
                  <th className="pb-3 pr-4">Kind</th>
                  <th className="pb-3 pr-4">Genre</th>
                  <th className="pb-3 pr-4">Year</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{r.title}</div>
                      <div className="text-xs text-[color:var(--muted-foreground)]">{r.slug}</div>
                    </td>
                    <td className="py-3 pr-4 capitalize">{r.kind}</td>
                    <td className="py-3 pr-4">{r.genre ?? "—"}</td>
                    <td className="py-3 pr-4">{r.year ?? "—"}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${r.is_published ? "bg-emerald-500/15 text-emerald-400" : "bg-elevated text-[color:var(--muted-foreground)]"}`}>
                        {r.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setEditing(r)} className="size-8 grid place-items-center rounded-md hover:bg-elevated"><Pencil className="size-4" /></button>
                        <button onClick={() => remove(r.id)} className="size-8 grid place-items-center rounded-md hover:bg-elevated text-destructive"><Trash2 className="size-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {editing && (
        <TitleEditor value={editing} onClose={() => setEditing(null)} onSave={async (v) => { await save(v); setEditing(null); }} />
      )}
    </div>
  );
}

function TitleEditor({ value, onClose, onSave }: { value: Partial<Title>; onClose: () => void; onSave: (v: Partial<Title>) => void | Promise<void> }) {
  const [form, setForm] = useState<Partial<Title>>(value);
  const set = <K extends keyof Title>(k: K, v: Title[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <ModalShell title={form.id ? "Edit title" : "New title"} onClose={onClose} onSave={() => onSave(form)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title"><input className={inputClass} value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} /></Field>
        <Field label="Slug"><input className={inputClass} value={form.slug ?? ""} onChange={(e) => set("slug", e.target.value)} /></Field>
        <Field label="Kind">
          <select className={inputClass} value={form.kind ?? "movie"} onChange={(e) => set("kind", e.target.value)}>
            <option value="movie">Movie</option>
            <option value="series">Series</option>
            <option value="podcast">Podcast</option>
            <option value="documentary">Documentary</option>
            <option value="concert">Concert</option>
            <option value="event">Event</option>
          </select>
        </Field>
        <Field label="Genre"><input className={inputClass} value={form.genre ?? ""} onChange={(e) => set("genre", e.target.value)} /></Field>
        <Field label="Year"><input type="number" className={inputClass} value={form.year ?? ""} onChange={(e) => set("year", e.target.value ? Number(e.target.value) : null)} /></Field>
        <Field label="Rating"><input className={inputClass} value={form.rating ?? ""} onChange={(e) => set("rating", e.target.value)} placeholder="TV-PG" /></Field>
        <Field label="Duration label"><input className={inputClass} value={form.duration_label ?? ""} onChange={(e) => set("duration_label", e.target.value)} placeholder="2h 14m" /></Field>
        <Field label="Duration (minutes)"><input type="number" className={inputClass} value={form.duration_minutes ?? ""} onChange={(e) => set("duration_minutes", e.target.value ? Number(e.target.value) : null)} /></Field>
        <Field label="Seasons"><input type="number" className={inputClass} value={form.seasons ?? ""} onChange={(e) => set("seasons", e.target.value ? Number(e.target.value) : null)} /></Field>
        <Field label="Episodes"><input type="number" className={inputClass} value={form.episodes ?? ""} onChange={(e) => set("episodes", e.target.value ? Number(e.target.value) : null)} /></Field>
      </div>

      <div className="grid gap-4 mt-4 md:grid-cols-2">
        <Field label="Poster">
          <MediaPicker value={form.poster_url} onChange={(url) => set("poster_url", url)} folder="titles/posters" />
        </Field>
        <Field label="Backdrop">
          <MediaPicker value={form.backdrop_url} onChange={(url) => set("backdrop_url", url)} folder="titles/backdrops" />
        </Field>
      </div>

      <div className="grid gap-4 mt-4 md:grid-cols-2">
        <Field label="Video / stream file">
          <MediaPicker value={form.stream_url} onChange={(url) => set("stream_url", url)} folder="titles/video" kind="video" />
        </Field>
        <Field label="Trailer">
          <MediaPicker value={form.trailer_url} onChange={(url) => set("trailer_url", url)} folder="titles/trailers" kind="video" />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Cast (comma-separated)">
          <input className={inputClass} value={(form.cast_list ?? []).join(", ")} onChange={(e) => set("cast_list", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Synopsis"><textarea className={textareaClass} value={form.synopsis ?? ""} onChange={(e) => set("synopsis", e.target.value)} /></Field>
      </div>
      <div className="flex gap-6 mt-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_published ?? true} onChange={(e) => set("is_published", e.target.checked)} /> Published</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_featured ?? false} onChange={(e) => set("is_featured", e.target.checked)} /> Featured</label>
      </div>
    </ModalShell>
  );
}

// ---------- Collections CMS ----------
type Collection = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  is_featured: boolean;
  is_published: boolean;
};

function CollectionsCms() {
  const { rows, loading, save, remove } = useCrud<Collection>("cms_collections");
  const [editing, setEditing] = useState<Partial<Collection> | null>(null);
  const openNew = () => setEditing({ is_published: true, is_featured: false });

  if (loading) return <Loader2 className="size-5 animate-spin text-primary" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Collections</h2>
          <p className="text-xs text-[color:var(--muted-foreground)]">Curated bundles across channels and titles.</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-sm">
          <Plus className="size-4" /> New Collection
        </button>
      </div>

      {rows.length === 0 ? (
        <EmptyState label="collections" onNew={openNew} />
      ) : (
        <Panel>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <div key={r.id} className="rounded-lg border border-border bg-elevated/40 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-xs text-[color:var(--muted-foreground)]">{r.slug}</div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditing(r)} className="size-8 grid place-items-center rounded-md hover:bg-elevated"><Pencil className="size-4" /></button>
                    <button onClick={() => remove(r.id)} className="size-8 grid place-items-center rounded-md hover:bg-elevated text-destructive"><Trash2 className="size-4" /></button>
                  </div>
                </div>
                {r.description && <p className="text-sm text-[color:var(--muted-foreground)] mt-2 line-clamp-2">{r.description}</p>}
                <div className="flex gap-2 mt-3">
                  {r.is_featured && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">Featured</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_published ? "bg-emerald-500/15 text-emerald-400" : "bg-elevated text-[color:var(--muted-foreground)]"}`}>
                    {r.is_published ? "Published" : "Draft"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {editing && (
        <ModalShell title={editing.id ? "Edit collection" : "New collection"} onClose={() => setEditing(null)} onSave={async () => { await save(editing); setEditing(null); }}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name"><input className={inputClass} value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Slug"><input className={inputClass} value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></Field>
            <Field label="Cover URL"><input className={inputClass} value={editing.cover_url ?? ""} onChange={(e) => setEditing({ ...editing, cover_url: e.target.value })} /></Field>
          </div>
          <div className="mt-4">
            <Field label="Description"><textarea className={textareaClass} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
          </div>
          <div className="flex gap-6 mt-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.is_published ?? true} onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })} /> Published</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.is_featured ?? false} onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })} /> Featured</label>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

// ---------- Users CMS ----------
type UserRow = {
  id: string;
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
  created_at: string;
  roles: string[];
};

function UsersCms() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  async function refresh() {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, display_name, handle, avatar_url, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const roleMap = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    }
    setRows((profiles ?? []).map((p) => ({ ...p, roles: roleMap.get(p.id) ?? [] })));
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  async function toggleRole(userId: string, role: "creator" | "admin", enabled: boolean) {
    if (enabled) {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) return toast.error(error.message);
    }
    toast.success("Role updated");
    refresh();
  }

  const filtered = useMemo(
    () => rows.filter((r) => !filter || (r.display_name ?? "").toLowerCase().includes(filter.toLowerCase()) || (r.handle ?? "").toLowerCase().includes(filter.toLowerCase())),
    [rows, filter]
  );

  if (loading) return <Loader2 className="size-5 animate-spin text-primary" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Users & Roles</h2>
          <p className="text-xs text-[color:var(--muted-foreground)]">Every account is a Viewer by default. Grant Creator or Admin as needed.</p>
        </div>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search users…" className={`${inputClass} max-w-xs`} />
      </div>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-[color:var(--muted-foreground)] uppercase tracking-wide">
              <tr className="border-b border-border">
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 pr-4">Joined</th>
                <th className="pb-3 pr-4">Creator</th>
                <th className="pb-3 pr-4">Admin</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{r.display_name ?? "—"}</div>
                    <div className="text-xs text-[color:var(--muted-foreground)]">{r.handle ?? r.id.slice(0, 8)}</div>
                  </td>
                  <td className="py-3 pr-4 text-[color:var(--muted-foreground)]">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="py-3 pr-4">
                    <input type="checkbox" checked={r.roles.includes("creator")} onChange={(e) => toggleRole(r.id, "creator", e.target.checked)} className="size-4 accent-primary" />
                  </td>
                  <td className="py-3 pr-4">
                    <input type="checkbox" checked={r.roles.includes("admin")} onChange={(e) => toggleRole(r.id, "admin", e.target.checked)} className="size-4 accent-primary" />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-sm text-[color:var(--muted-foreground)]">No users match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// ---------- Modal shell ----------
export function ModalShell({ title, onClose, onSave, children }: { title: string; onClose: () => void; onSave: () => void | Promise<void>; children: React.ReactNode }) {
  const [saving, setSaving] = useState(false);
  async function handleSave() {
    setSaving(true);
    try { await onSave(); } finally { setSaving(false); }
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-surface/95 backdrop-blur">
          <h3 className="font-semibold">{title}</h3>
          <div className="flex gap-2">
            <button onClick={onClose} className="h-9 px-4 rounded-md bg-elevated hover:bg-elevated/70 text-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="h-9 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-60">
              {saving && <Loader2 className="size-4 animate-spin" />} Save
            </button>
          </div>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ---------- Overview ----------
function OverviewCms() {
  const [stats, setStats] = useState<{ label: string; value: number; icon: React.ComponentType<{ className?: string }> }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const tables: { key: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
        { key: "cms_channels", label: "Channels", icon: Radio },
        { key: "cms_titles", label: "Titles", icon: Video },
        { key: "cms_schedule", label: "Scheduled programs", icon: CalendarClock },
        { key: "cms_events", label: "Events", icon: Sparkles },
        { key: "cms_collections", label: "Collections", icon: Layers },
        { key: "cms_sponsors", label: "Sponsors", icon: Megaphone },
        { key: "enterprise_leads", label: "Enterprise leads", icon: Building2 },
        { key: "profiles", label: "Users", icon: UsersIcon },
      ];
      const results = await Promise.all(
        tables.map((t) => supabase.from(t.key as never).select("*", { count: "exact", head: true }))
      );
      setStats(tables.map((t, i) => ({ label: t.label, icon: t.icon, value: (results[i] as { count: number | null }).count ?? 0 })));
      setLoading(false);
    })();
  }, []);

  if (loading) return <Loader2 className="size-5 animate-spin text-primary" />;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Platform overview</h2>
        <p className="text-xs text-[color:var(--muted-foreground)]">Live counts across the Lettflix catalog.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-border bg-surface/60 p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wide text-[color:var(--muted-foreground)]">{s.label}</div>
                <Icon className="size-4 text-primary" />
              </div>
              <div className="mt-2 text-3xl font-bold">{s.value.toLocaleString()}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Schedule (EPG) CMS ----------
type ScheduleRow = {
  id: string;
  channel_id: string;
  program_title: string;
  description: string | null;
  category: string | null;
  starts_at: string;
  ends_at: string;
};

function ScheduleCms() {
  const { rows, loading, save, remove } = useCrud<ScheduleRow>("cms_schedule", "starts_at");
  const [channels, setChannels] = useState<{ id: string; name: string }[]>([]);
  const [editing, setEditing] = useState<Partial<ScheduleRow> | null>(null);
  const [channelFilter, setChannelFilter] = useState("");

  useEffect(() => {
    supabase.from("cms_channels").select("id, name").order("name").then(({ data }) => setChannels(data ?? []));
  }, []);

  const openNew = () => setEditing({ starts_at: new Date().toISOString().slice(0, 16), ends_at: "" });
  const channelName = (id: string) => channels.find((c) => c.id === id)?.name ?? "—";

  const filtered = useMemo(
    () => (channelFilter ? rows.filter((r) => r.channel_id === channelFilter) : rows),
    [rows, channelFilter]
  );

  if (loading) return <Loader2 className="size-5 animate-spin text-primary" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Program Schedule</h2>
          <p className="text-xs text-[color:var(--muted-foreground)]">EPG entries powering the Live Guide.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className={`${inputClass} max-w-xs`}>
            <option value="">All channels</option>
            {channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={openNew} className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-sm">
            <Plus className="size-4" /> New Program
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState label="programs" onNew={openNew} />
      ) : (
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-[color:var(--muted-foreground)] uppercase tracking-wide">
                <tr className="border-b border-border">
                  <th className="pb-3 pr-4">Program</th>
                  <th className="pb-3 pr-4">Channel</th>
                  <th className="pb-3 pr-4">Starts</th>
                  <th className="pb-3 pr-4">Ends</th>
                  <th className="pb-3 pr-4 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{r.program_title}</div>
                      {r.category && <div className="text-xs text-[color:var(--muted-foreground)]">{r.category}</div>}
                    </td>
                    <td className="py-3 pr-4">{channelName(r.channel_id)}</td>
                    <td className="py-3 pr-4 text-[color:var(--muted-foreground)]">{new Date(r.starts_at).toLocaleString()}</td>
                    <td className="py-3 pr-4 text-[color:var(--muted-foreground)]">{new Date(r.ends_at).toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setEditing(r)} className="size-8 grid place-items-center rounded-md hover:bg-elevated"><Pencil className="size-4" /></button>
                        <button onClick={() => remove(r.id)} className="size-8 grid place-items-center rounded-md hover:bg-elevated text-destructive"><Trash2 className="size-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {editing && (
        <ModalShell
          title={editing.id ? "Edit program" : "New program"}
          onClose={() => setEditing(null)}
          onSave={async () => {
            const payload = {
              ...editing,
              starts_at: editing.starts_at ? new Date(editing.starts_at).toISOString() : "",
              ends_at: editing.ends_at ? new Date(editing.ends_at).toISOString() : "",
            };
            await save(payload as Partial<ScheduleRow>);
            setEditing(null);
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Channel">
              <select className={inputClass} value={editing.channel_id ?? ""} onChange={(e) => setEditing({ ...editing, channel_id: e.target.value })}>
                <option value="">Select channel…</option>
                {channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Program title"><input className={inputClass} value={editing.program_title ?? ""} onChange={(e) => setEditing({ ...editing, program_title: e.target.value })} /></Field>
            <Field label="Starts at"><input type="datetime-local" className={inputClass} value={toLocal(editing.starts_at)} onChange={(e) => setEditing({ ...editing, starts_at: e.target.value })} /></Field>
            <Field label="Ends at"><input type="datetime-local" className={inputClass} value={toLocal(editing.ends_at)} onChange={(e) => setEditing({ ...editing, ends_at: e.target.value })} /></Field>
            <Field label="Category"><input className={inputClass} value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></Field>
          </div>
          <div className="mt-4">
            <Field label="Description"><textarea className={textareaClass} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

function toLocal(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(0, 16);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

// ---------- Events CMS ----------
type EventRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  starts_at: string;
  ends_at: string | null;
  cover_url: string | null;
  channel_id: string | null;
  is_published: boolean;
  is_sponsored: boolean;
};

function EventsCms() {
  const { rows, loading, save, remove } = useCrud<EventRow>("cms_events", "starts_at");
  const [editing, setEditing] = useState<Partial<EventRow> | null>(null);
  const [channels, setChannels] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => { supabase.from("cms_channels").select("id, name").order("name").then(({ data }) => setChannels(data ?? [])); }, []);

  const openNew = () => setEditing({ is_published: true });

  if (loading) return <Loader2 className="size-5 animate-spin text-primary" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Upcoming Events</h2>
          <p className="text-xs text-[color:var(--muted-foreground)]">Conferences, concerts, sports and broadcast specials.</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-sm">
          <Plus className="size-4" /> New Event
        </button>
      </div>

      {rows.length === 0 ? (
        <EmptyState label="events" onNew={openNew} />
      ) : (
        <Panel>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <div key={r.id} className="rounded-lg border border-border bg-elevated/40 overflow-hidden">
                {r.cover_url && <img src={r.cover_url} alt="" className="w-full h-32 object-cover" />}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{r.name}</div>
                      <div className="text-xs text-[color:var(--muted-foreground)]">{new Date(r.starts_at).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setEditing(r)} className="size-8 grid place-items-center rounded-md hover:bg-elevated"><Pencil className="size-4" /></button>
                      <button onClick={() => remove(r.id)} className="size-8 grid place-items-center rounded-md hover:bg-elevated text-destructive"><Trash2 className="size-4" /></button>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {r.category && <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">{r.category}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_published ? "bg-emerald-500/15 text-emerald-400" : "bg-elevated text-[color:var(--muted-foreground)]"}`}>
                      {r.is_published ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {editing && (
        <ModalShell
          title={editing.id ? "Edit event" : "New event"}
          onClose={() => setEditing(null)}
          onSave={async () => {
            const payload = {
              ...editing,
              starts_at: editing.starts_at ? new Date(editing.starts_at).toISOString() : "",
              ends_at: editing.ends_at ? new Date(editing.ends_at).toISOString() : null,
              channel_id: editing.channel_id || null,
            };
            await save(payload as Partial<EventRow>);
            setEditing(null);
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name"><input className={inputClass} value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Slug"><input className={inputClass} value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></Field>
            <Field label="Starts at"><input type="datetime-local" className={inputClass} value={toLocal(editing.starts_at)} onChange={(e) => setEditing({ ...editing, starts_at: e.target.value })} /></Field>
            <Field label="Ends at"><input type="datetime-local" className={inputClass} value={toLocal(editing.ends_at)} onChange={(e) => setEditing({ ...editing, ends_at: e.target.value })} /></Field>
            <Field label="Category"><input className={inputClass} value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></Field>
            <Field label="Channel (optional)">
              <select className={inputClass} value={editing.channel_id ?? ""} onChange={(e) => setEditing({ ...editing, channel_id: e.target.value || null })}>
                <option value="">None</option>
                {channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Cover URL"><input className={inputClass} value={editing.cover_url ?? ""} onChange={(e) => setEditing({ ...editing, cover_url: e.target.value })} /></Field>
          </div>
          <div className="mt-4">
            <Field label="Description"><textarea className={textareaClass} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
          </div>
          <div className="flex flex-wrap items-center gap-6 mt-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.is_published ?? true} onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })} /> Published</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.is_sponsored ?? false} onChange={(e) => setEditing({ ...editing, is_sponsored: e.target.checked })} /> Sponsored (feature in homepage sponsor banner rotation)</label>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

// ---------- Sponsors CMS ----------
type SponsorRow = {
  id: string;
  name: string;
  headline: string | null;
  description: string | null;
  cta_label: string | null;
  cta_url: string | null;
  image_url: string | null;
  placement: string;
  placements: string[];
  home_sections: string[];
  channel_ids: string[];
  event_ids: string[];
  starts_at: string | null;
  ends_at: string | null;
  priority: number;
  is_active: boolean;
};

const PLACEMENT_OPTIONS: { value: string; label: string }[] = [
  { value: "home", label: "Home page" },
  { value: "channels", label: "Channels index" },
  { value: "channel_page", label: "Channel pages" },
  { value: "on-demand", label: "On-Demand" },
  { value: "guide", label: "Guide (EPG)" },
  { value: "event_banner", label: "Event banners" },
];

const HOME_SECTION_OPTIONS: { value: string; label: string }[] = [
  { value: "hero", label: "Hero showcase" },
  { value: "live_now", label: "Live Right Now" },
  { value: "featured_channels", label: "Featured Channels" },
  { value: "trending", label: "Trending" },
  { value: "continue_watching", label: "Continue Watching" },
  { value: "upcoming_events", label: "Upcoming Events" },
  { value: "collections", label: "Collections" },
];

function isSponsorLive(s: SponsorRow, now = new Date()) {
  if (!s.is_active) return false;
  if (s.starts_at && new Date(s.starts_at) > now) return false;
  if (s.ends_at && new Date(s.ends_at) < now) return false;
  return true;
}

function CheckGrid({ options, value, onChange }: { options: { value: string; label: string }[]; value: string[]; onChange: (next: string[]) => void }) {
  const set = new Set(value ?? []);
  return (
    <div className="grid gap-2 sm:grid-cols-2 rounded-md border border-border bg-elevated/40 p-3">
      {options.map((o) => (
        <label key={o.value} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={set.has(o.value)}
            onChange={(e) => {
              const next = new Set(set);
              if (e.target.checked) next.add(o.value); else next.delete(o.value);
              onChange(Array.from(next));
            }}
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}

function SponsorsCms() {
  const { rows, loading, save, remove } = useCrud<SponsorRow>("cms_sponsors", "priority");
  const [editing, setEditing] = useState<Partial<SponsorRow> | null>(null);
  const [channels, setChannels] = useState<{ id: string; name: string }[]>([]);
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    supabase.from("cms_channels").select("id, name").order("name").then(({ data }) => setChannels(data ?? []));
    supabase.from("cms_events").select("id, name").order("starts_at", { ascending: false }).then(({ data }) => setEvents(data ?? []));
  }, []);

  const openNew = () => setEditing({
    placement: "home",
    placements: ["home"],
    home_sections: [],
    channel_ids: [],
    event_ids: [],
    priority: 0,
    is_active: true,
  });

  if (loading) return <Loader2 className="size-5 animate-spin text-primary" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Sponsors & Ads</h2>
          <p className="text-xs text-[color:var(--muted-foreground)]">Target placements across the app and set publish windows.</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-sm">
          <Plus className="size-4" /> New Sponsor
        </button>
      </div>

      {rows.length === 0 ? (
        <EmptyState label="sponsors" onNew={openNew} />
      ) : (
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-[color:var(--muted-foreground)] uppercase tracking-wide">
                <tr className="border-b border-border">
                  <th className="pb-3 pr-4">Sponsor</th>
                  <th className="pb-3 pr-4">Placements</th>
                  <th className="pb-3 pr-4">Window</th>
                  <th className="pb-3 pr-4">Priority</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const live = isSponsorLive(r);
                  const labels = (r.placements?.length ? r.placements : [r.placement]).map(
                    (p) => PLACEMENT_OPTIONS.find((o) => o.value === p)?.label ?? p
                  );
                  return (
                    <tr key={r.id} className="border-b border-border/60 last:border-0 align-top">
                      <td className="py-3 pr-4">
                        <div className="font-medium">{r.name}</div>
                        {r.headline && <div className="text-xs text-[color:var(--muted-foreground)] line-clamp-1">{r.headline}</div>}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {labels.map((l) => (
                            <span key={l} className="text-[10px] px-1.5 py-0.5 rounded-full bg-elevated border border-border">{l}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-xs text-[color:var(--muted-foreground)]">
                        {r.starts_at ? new Date(r.starts_at).toLocaleDateString() : "Any"}
                        {" → "}
                        {r.ends_at ? new Date(r.ends_at).toLocaleDateString() : "Any"}
                      </td>
                      <td className="py-3 pr-4">{r.priority}</td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${live ? "bg-emerald-500/15 text-emerald-400" : r.is_active ? "bg-amber-500/15 text-amber-400" : "bg-elevated text-[color:var(--muted-foreground)]"}`}>
                          {live ? "Live" : r.is_active ? "Scheduled" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setEditing(r)} className="size-8 grid place-items-center rounded-md hover:bg-elevated"><Pencil className="size-4" /></button>
                          <button onClick={() => remove(r.id)} className="size-8 grid place-items-center rounded-md hover:bg-elevated text-destructive"><Trash2 className="size-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {editing && (
        <ModalShell
          title={editing.id ? "Edit sponsor" : "New sponsor"}
          onClose={() => setEditing(null)}
          onSave={async () => {
            const placements = editing.placements?.length ? editing.placements : [editing.placement ?? "home"];
            const payload: Partial<SponsorRow> = {
              ...editing,
              placements,
              placement: placements[0],
              home_sections: placements.includes("home") ? (editing.home_sections ?? []) : [],
              channel_ids: placements.includes("channel_page") ? (editing.channel_ids ?? []) : [],
              event_ids: placements.includes("event_banner") ? (editing.event_ids ?? []) : [],
              starts_at: editing.starts_at ? new Date(editing.starts_at).toISOString() : null,
              ends_at: editing.ends_at ? new Date(editing.ends_at).toISOString() : null,
            };
            await save(payload);
            setEditing(null);
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Sponsor name"><input className={inputClass} value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Priority (higher shows first)"><input type="number" className={inputClass} value={editing.priority ?? 0} onChange={(e) => setEditing({ ...editing, priority: Number(e.target.value) })} /></Field>
            <Field label="Headline"><input className={inputClass} value={editing.headline ?? ""} onChange={(e) => setEditing({ ...editing, headline: e.target.value })} /></Field>
            <Field label="Image URL"><input className={inputClass} value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} /></Field>
            <Field label="CTA label"><input className={inputClass} value={editing.cta_label ?? ""} onChange={(e) => setEditing({ ...editing, cta_label: e.target.value })} /></Field>
            <Field label="CTA URL"><input className={inputClass} value={editing.cta_url ?? ""} onChange={(e) => setEditing({ ...editing, cta_url: e.target.value })} /></Field>
          </div>
          <div className="mt-4">
            <Field label="Description"><textarea className={textareaClass} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
          </div>

          <div className="mt-6">
            <Field label="Placements — pick every surface where this ad should appear">
              <CheckGrid
                options={PLACEMENT_OPTIONS}
                value={editing.placements ?? (editing.placement ? [editing.placement] : [])}
                onChange={(next) => setEditing({ ...editing, placements: next })}
              />
            </Field>
          </div>

          {(editing.placements ?? []).includes("home") && (
            <div className="mt-4">
              <Field label="Home sections">
                <CheckGrid
                  options={HOME_SECTION_OPTIONS}
                  value={editing.home_sections ?? []}
                  onChange={(next) => setEditing({ ...editing, home_sections: next })}
                />
              </Field>
            </div>
          )}

          {(editing.placements ?? []).includes("channel_page") && (
            <div className="mt-4">
              <Field label="Target specific channels (leave empty for all)">
                <CheckGrid
                  options={channels.map((c) => ({ value: c.id, label: c.name }))}
                  value={editing.channel_ids ?? []}
                  onChange={(next) => setEditing({ ...editing, channel_ids: next })}
                />
              </Field>
            </div>
          )}

          {(editing.placements ?? []).includes("event_banner") && (
            <div className="mt-4">
              <Field label="Target specific events (leave empty for all)">
                <CheckGrid
                  options={events.map((e) => ({ value: e.id, label: e.name }))}
                  value={editing.event_ids ?? []}
                  onChange={(next) => setEditing({ ...editing, event_ids: next })}
                />
              </Field>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 mt-6">
            <Field label="Publish from (optional)">
              <input type="datetime-local" className={inputClass} value={toLocal(editing.starts_at)} onChange={(e) => setEditing({ ...editing, starts_at: e.target.value || null })} />
            </Field>
            <Field label="Publish until (optional)">
              <input type="datetime-local" className={inputClass} value={toLocal(editing.ends_at)} onChange={(e) => setEditing({ ...editing, ends_at: e.target.value || null })} />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm mt-4">
            <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Active (turn off to unpublish immediately)
          </label>
        </ModalShell>
      )}
    </div>
  );
}

// ---------- Enterprise Leads CMS ----------
type LeadRow = {
  id: string;
  name: string;
  org: string | null;
  email: string;
  plan: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

function LeadsCms() {
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const { data, error } = await supabase.from("enterprise_leads").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as LeadRow[]);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("enterprise_leads").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    refresh();
  }
  async function remove(id: string) {
    if (!confirm("Delete this lead?")) return;
    const { error } = await supabase.from("enterprise_leads").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }

  if (loading) return <Loader2 className="size-5 animate-spin text-primary" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Enterprise Leads</h2>
        <p className="text-xs text-[color:var(--muted-foreground)]">Contact-sales submissions from the Enterprise page.</p>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-[color:var(--muted-foreground)]">
          No leads yet. Submissions from the Enterprise page will appear here.
        </div>
      ) : (
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-[color:var(--muted-foreground)] uppercase tracking-wide">
                <tr className="border-b border-border">
                  <th className="pb-3 pr-4">Contact</th>
                  <th className="pb-3 pr-4">Organization</th>
                  <th className="pb-3 pr-4">Plan</th>
                  <th className="pb-3 pr-4">Received</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 last:border-0 align-top">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{r.name}</div>
                      <a href={`mailto:${r.email}`} className="text-xs text-accent hover:underline">{r.email}</a>
                      {r.message && <div className="text-xs text-[color:var(--muted-foreground)] mt-1 line-clamp-2 max-w-sm">{r.message}</div>}
                    </td>
                    <td className="py-3 pr-4">{r.org ?? "—"}</td>
                    <td className="py-3 pr-4">{r.plan ?? "—"}</td>
                    <td className="py-3 pr-4 text-[color:var(--muted-foreground)]">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="py-3 pr-4">
                      <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} className="h-8 rounded-md bg-elevated border border-border text-xs px-2">
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="won">Won</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="py-3 pr-4">
                      <button onClick={() => remove(r.id)} className="size-8 grid place-items-center rounded-md hover:bg-elevated text-destructive"><Trash2 className="size-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}

type LoginRow = { id: string; user_id: string; event: string; success: boolean; provider: string | null; ip_address: string | null; user_agent: string | null; created_at: string };
type AuditRow = { id: string; actor_id: string | null; action: string; resource_type: string; resource_id: string | null; metadata: unknown; created_at: string };

function SecurityCms() {
  const [logins, setLogins] = useState<LoginRow[]>([]);
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [l, a] = await Promise.all([
        supabase.from("login_history").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(50),
      ]);
      setLogins((l.data ?? []) as LoginRow[]);
      setAudits((a.data ?? []) as AuditRow[]);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="py-12 text-center"><Loader2 className="size-5 animate-spin inline text-primary" /></div>;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-3">Recent sign-ins</h2>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-elevated text-xs uppercase tracking-wide text-[color:var(--muted-foreground)]">
              <tr><th className="text-left px-3 py-2">When</th><th className="text-left px-3 py-2">User</th><th className="text-left px-3 py-2">Event</th><th className="text-left px-3 py-2">Provider</th><th className="text-left px-3 py-2">IP</th><th className="text-left px-3 py-2">Agent</th></tr>
            </thead>
            <tbody>
              {logins.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-[color:var(--muted-foreground)]">No sign-ins recorded.</td></tr>}
              {logins.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.user_id.slice(0, 8)}…</td>
                  <td className="px-3 py-2"><span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ${r.success ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/15 text-primary"}`}>{r.event}</span></td>
                  <td className="px-3 py-2 text-xs">{r.provider ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">{r.ip_address ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-[color:var(--muted-foreground)] truncate max-w-[240px]" title={r.user_agent ?? ""}>{r.user_agent?.slice(0, 60) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Audit log</h2>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-elevated text-xs uppercase tracking-wide text-[color:var(--muted-foreground)]">
              <tr><th className="text-left px-3 py-2">When</th><th className="text-left px-3 py-2">Actor</th><th className="text-left px-3 py-2">Action</th><th className="text-left px-3 py-2">Resource</th><th className="text-left px-3 py-2">Metadata</th></tr>
            </thead>
            <tbody>
              {audits.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-[color:var(--muted-foreground)]">No audit events yet.</td></tr>}
              {audits.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.actor_id?.slice(0, 8) ?? "system"}…</td>
                  <td className="px-3 py-2 text-xs">{r.action}</td>
                  <td className="px-3 py-2 text-xs">{r.resource_type}{r.resource_id ? ` · ${r.resource_id.slice(0, 8)}…` : ""}</td>
                  <td className="px-3 py-2 text-xs font-mono text-[color:var(--muted-foreground)] truncate max-w-[280px]">{r.metadata ? JSON.stringify(r.metadata).slice(0, 80) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ---------- Applications CMS ----------
type CreatorApp = {
  id: string;
  user_id: string;
  channel_name: string;
  category: string;
  description: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
};

function ApplicationsCms() {
  const [rows, setRows] = useState<CreatorApp[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { display_name: string | null; handle: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("creator_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    const list = (data ?? []) as CreatorApp[];
    setRows(list);
    const ids = Array.from(new Set(list.map((r) => r.user_id)));
    if (ids.length) {
      const { data: prof } = await supabase.from("profiles").select("id, display_name, handle").in("id", ids);
      const map: Record<string, { display_name: string | null; handle: string | null }> = {};
      (prof ?? []).forEach((p) => { map[p.id] = { display_name: p.display_name, handle: p.handle }; });
      setProfiles(map);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function approve(app: CreatorApp) {
    const { error } = await supabase
      .from("creator_applications")
      .update({ status: "approved", rejection_reason: null })
      .eq("id", app.id);
    if (error) return toast.error(error.message);
    // Also seed a cms_channel for the creator if not present
    const slug = app.channel_name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { data: existing } = await supabase.from("cms_channels").select("id").eq("slug", slug).maybeSingle();
    if (!existing) {
      await supabase.from("cms_channels").insert({
        slug,
        name: app.channel_name,
        description: app.description,
        category: app.category,
        creator_id: app.user_id,
        is_published: true,
      } as never);
    } else {
      await supabase.from("cms_channels").update({ is_published: true, creator_id: app.user_id } as never).eq("id", existing.id);
    }

    toast.success(`${app.channel_name} approved`);
    load();
  }

  async function reject(app: CreatorApp) {
    const reason = window.prompt("Reason for rejection (optional)") ?? "";
    const { error } = await supabase
      .from("creator_applications")
      .update({ status: "rejected", rejection_reason: reason || null, reviewed_at: new Date().toISOString() })
      .eq("id", app.id);
    if (error) return toast.error(error.message);
    toast.success("Application rejected");
    load();
  }

  const visible = rows.filter((r) => filter === "all" || r.status === filter);

  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold">Creator Applications</h2>
          <p className="text-xs text-[color:var(--muted-foreground)]">Review and approve creator signups. Approving grants the creator role and seeds a channel draft.</p>
        </div>
        <div className="flex gap-1 p-1 bg-elevated rounded-md">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 h-8 text-xs rounded font-medium capitalize ${filter === f ? "bg-background shadow" : "text-[color:var(--muted-foreground)]"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-12 grid place-items-center"><Loader2 className="size-5 animate-spin text-primary" /></div>
      ) : visible.length === 0 ? (
        <div className="py-12 text-center text-sm text-[color:var(--muted-foreground)]">No applications.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-[color:var(--muted-foreground)] uppercase tracking-wider">
              <tr className="border-b border-border">
                <th className="py-2 pr-4">Channel</th>
                <th className="py-2 pr-4">Applicant</th>
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Submitted</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const p = profiles[r.user_id];
                return (
                  <tr key={r.id} className="border-b border-border/50 align-top">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{r.channel_name}</div>
                      {r.description && <div className="text-xs text-[color:var(--muted-foreground)] max-w-xs mt-1">{r.description}</div>}
                    </td>
                    <td className="py-3 pr-4">
                      <div>{p?.display_name ?? "—"}</div>
                      <div className="text-xs text-[color:var(--muted-foreground)]">{p?.handle ?? ""}</div>
                    </td>
                    <td className="py-3 pr-4">{r.category}</td>
                    <td className="py-3 pr-4 text-xs text-[color:var(--muted-foreground)]">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.status === "approved" ? "bg-emerald-500/15 text-emerald-400"
                        : r.status === "rejected" ? "bg-red-500/15 text-red-400"
                        : "bg-amber-500/15 text-amber-400"
                      }`}>{r.status}</span>
                      {r.rejection_reason && <div className="text-xs text-[color:var(--muted-foreground)] mt-1">{r.rejection_reason}</div>}
                    </td>
                    <td className="py-3 pr-4 text-right whitespace-nowrap">
                      {r.status === "pending" && (
                        <div className="inline-flex gap-2">
                          <button onClick={() => approve(r)} className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-emerald-500/90 hover:bg-emerald-500 text-white text-xs font-medium">
                            <Check className="size-3.5" /> Approve
                          </button>
                          <button onClick={() => reject(r)} className="inline-flex items-center gap-1 h-8 px-3 rounded-md border border-border hover:bg-elevated text-xs font-medium">
                            <X className="size-3.5" /> Reject
                          </button>
                        </div>
                      )}
                      {r.status === "approved" && (
                        <button onClick={() => reject(r)} className="text-xs text-[color:var(--muted-foreground)] hover:text-foreground">Revoke</button>
                      )}
                      {r.status === "rejected" && (
                        <button onClick={() => approve(r)} className="text-xs text-primary hover:underline">Approve now</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}


// ============ Homepage CMS ============
type SettingKey = "nav" | "hero" | "footer";

function HomepageCms() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Homepage & Chrome</h2>
        <p className="text-sm text-[color:var(--muted-foreground)]">
          Control the top navigation, hero section, and site footer. Changes publish immediately.
        </p>
      </div>
      <SettingEditor
        settingKey="nav"
        title="Top Navigation"
        description="Configure the primary nav links shown in the header."
        sample={`{
  "brand": "Lettflix",
  "items": [
    { "label": "Home", "to": "/" },
    { "label": "Channels", "to": "/channels" },
    { "label": "On-Demand", "to": "/on-demand" },
    { "label": "Guide", "to": "/guide" },
    { "label": "Pricing", "to": "/pricing" }
  ]
}`}
      />
      <SettingEditor
        settingKey="hero"
        title="Hero Section"
        description="Headline, description, CTAs, and stat tiles on the homepage."
        sample={`{
  "badge": "LIVE NOW",
  "badgeMeta": "184 channels broadcasting",
  "title": "The future of",
  "titleAccent": "broadcasting, streaming together.",
  "description": "Live TV, radio, podcasts and on-demand — one subscription.",
  "primaryCta":   { "label": "Watch Live",       "to": "/channels" },
  "secondaryCta": { "label": "Browse Channels",  "to": "/channels" },
  "tertiaryCta":  { "label": "Open Live Guide",  "to": "/guide" },
  "stats": [
    { "k": "184",  "v": "Live channels" },
    { "k": "12K+", "v": "On-demand titles" },
    { "k": "320",  "v": "Radio stations" }
  ]
}`}
      />
      <SettingEditor
        settingKey="footer"
        title="Footer"
        description="Tagline, columns, and legal notes."
        sample={`{
  "tagline": "One subscription. Everything.",
  "copyright": "Lettflix — LoveWorld Entertainment Flix",
  "note": "All rights reserved.",
  "columns": [
    { "title": "Watch", "items": [
      { "label": "Channels", "href": "/channels" },
      { "label": "On-Demand", "href": "/on-demand" }
    ]},
    { "title": "Company", "items": [
      { "label": "Pricing", "href": "/pricing" },
      { "label": "Enterprise", "href": "/enterprise" }
    ]}
  ]
}`}
      />
    </div>
  );
}

function SettingEditor({ settingKey, title, description, sample }: { settingKey: SettingKey; title: string; description: string; sample: string }) {
  const [value, setValue] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: fetchErr } = await supabase
        .from("cms_settings")
        .select("value")
        .eq("key", settingKey)
        .maybeSingle();
      if (cancelled) return;
      if (fetchErr) {
        setError(fetchErr.message);
      } else if (data?.value) {
        setValue(JSON.stringify(data.value, null, 2));
      } else {
        setValue(sample);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [settingKey, sample]);

  async function save() {
    setError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      setError("Invalid JSON — fix syntax and try again.");
      return;
    }
    setSaving(true);
    const { error: upsertErr } = await supabase
      .from("cms_settings")
      .upsert({ key: settingKey, value: parsed as never }, { onConflict: "key" });
    setSaving(false);
    if (upsertErr) {
      setError(upsertErr.message);
      toast.error(`Failed to save ${title}`);
    } else {
      toast.success(`${title} updated`);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-elevated/40 p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-[color:var(--muted-foreground)] mt-0.5">{description}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setValue(sample)}
            className="h-9 px-3 text-xs rounded-md border border-border hover:bg-elevated transition"
          >
            Reset to sample
          </button>
          <button
            type="button"
            onClick={save}
            disabled={loading || saving}
            className="h-9 px-4 text-xs font-semibold rounded-md bg-primary text-primary-foreground disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      {loading ? (
        <div className="h-40 grid place-items-center"><Loader2 className="size-4 animate-spin" /></div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          spellCheck={false}
          className="w-full min-h-[280px] rounded-md bg-background border border-border p-3 font-mono text-xs leading-relaxed"
        />
      )}
      {error && <div className="mt-2 text-xs text-primary">{error}</div>}
    </section>
  );
}
