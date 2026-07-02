import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Plus, Pencil, Trash2, ShieldCheck, ShieldOff, Video, Radio, Layers, Users as UsersIcon } from "lucide-react";
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

        <Tabs defaultValue="channels" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="channels"><Radio className="size-4" /> Channels</TabsTrigger>
            <TabsTrigger value="titles"><Video className="size-4" /> Titles</TabsTrigger>
            <TabsTrigger value="collections"><Layers className="size-4" /> Collections</TabsTrigger>
            <TabsTrigger value="users"><UsersIcon className="size-4" /> Users</TabsTrigger>
          </TabsList>
          <TabsContent value="channels"><ChannelsCms /></TabsContent>
          <TabsContent value="titles"><TitlesCms /></TabsContent>
          <TabsContent value="collections"><CollectionsCms /></TabsContent>
          <TabsContent value="users"><UsersCms /></TabsContent>
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
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[color:var(--muted-foreground)] mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full h-10 px-3 rounded-md bg-elevated border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";
const textareaClass =
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
type Channel = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  category: string | null;
  language: string | null;
  country: string | null;
  logo_url: string | null;
  banner_url: string | null;
  kind: string;
  is_live: boolean;
  is_published: boolean;
};

function ChannelsCms() {
  const { rows, loading, save, remove } = useCrud<Channel>("cms_channels");
  const [editing, setEditing] = useState<Partial<Channel> | null>(null);

  function openNew() {
    setEditing({ kind: "video", is_published: true, is_live: false });
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

function ChannelEditor({ value, onClose, onSave }: { value: Partial<Channel>; onClose: () => void; onSave: (v: Partial<Channel>) => void | Promise<void> }) {
  const [form, setForm] = useState<Partial<Channel>>(value);
  const set = <K extends keyof Channel>(k: K, v: Channel[K]) => setForm((f) => ({ ...f, [k]: v }));

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
          <select className={inputClass} value={form.kind ?? "video"} onChange={(e) => set("kind", e.target.value)}>
            <option value="video">Video</option>
            <option value="radio">Radio</option>
          </select>
        </Field>
        <Field label="Language"><input className={inputClass} value={form.language ?? ""} onChange={(e) => set("language", e.target.value)} /></Field>
        <Field label="Country"><input className={inputClass} value={form.country ?? ""} onChange={(e) => set("country", e.target.value)} /></Field>
        <Field label="Logo URL"><input className={inputClass} value={form.logo_url ?? ""} onChange={(e) => set("logo_url", e.target.value)} /></Field>
        <Field label="Banner URL"><input className={inputClass} value={form.banner_url ?? ""} onChange={(e) => set("banner_url", e.target.value)} /></Field>
      </div>
      <div className="grid gap-4 mt-4">
        <Field label="Tagline"><input className={inputClass} value={form.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} /></Field>
        <Field label="Description"><textarea className={textareaClass} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} /></Field>
      </div>
      <div className="flex gap-6 mt-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_published ?? true} onChange={(e) => set("is_published", e.target.checked)} /> Published</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_live ?? false} onChange={(e) => set("is_live", e.target.checked)} /> Live now</label>
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
  duration_minutes: number | null;
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
          </select>
        </Field>
        <Field label="Genre"><input className={inputClass} value={form.genre ?? ""} onChange={(e) => set("genre", e.target.value)} /></Field>
        <Field label="Year"><input type="number" className={inputClass} value={form.year ?? ""} onChange={(e) => set("year", e.target.value ? Number(e.target.value) : null)} /></Field>
        <Field label="Duration (minutes)"><input type="number" className={inputClass} value={form.duration_minutes ?? ""} onChange={(e) => set("duration_minutes", e.target.value ? Number(e.target.value) : null)} /></Field>
        <Field label="Poster URL"><input className={inputClass} value={form.poster_url ?? ""} onChange={(e) => set("poster_url", e.target.value)} /></Field>
        <Field label="Backdrop URL"><input className={inputClass} value={form.backdrop_url ?? ""} onChange={(e) => set("backdrop_url", e.target.value)} /></Field>
      </div>
      <div className="mt-4">
        <Field label="Synopsis"><textarea className={textareaClass} value={form.synopsis ?? ""} onChange={(e) => set("synopsis", e.target.value)} /></Field>
      </div>
      <label className="flex items-center gap-2 text-sm mt-4"><input type="checkbox" checked={form.is_published ?? true} onChange={(e) => set("is_published", e.target.checked)} /> Published</label>
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
function ModalShell({ title, onClose, onSave, children }: { title: string; onClose: () => void; onSave: () => void | Promise<void>; children: React.ReactNode }) {
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
