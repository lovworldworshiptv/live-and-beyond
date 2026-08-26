import { useCallback, useEffect, useState } from "react";
import { Film, Music, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MediaPicker } from "@/components/media-picker";
import { Field, inputClass, textareaClass } from "@/routes/admin";
import { fetchMediaAssets, formatDuration, type MediaAsset } from "@/lib/playout";
import { slugify } from "@/lib/channel-services";

type Kind = "movie" | "series" | "podcast" | "documentary";

type Draft = {
  id?: string;
  title_id?: string | null;
  slug: string;
  title: string;
  description: string;
  media_type: "video" | "audio";
  source_url: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  trailer_url: string | null;
  duration_seconds: number;
  // On-demand catalogue metadata (mirrors the admin Titles editor)
  kind: Kind;
  genre: string;
  year: number | null;
  rating: string;
  duration_label: string;
  seasons: number | null;
  episodes: number | null;
  cast_list: string[];
  display_order: number;
  is_published: boolean;
  is_featured: boolean;
  publish_to_catalog: boolean;
};

const EMPTY: Draft = {
  slug: "",
  title: "",
  description: "",
  media_type: "video",
  source_url: null,
  poster_url: null,
  backdrop_url: null,
  trailer_url: null,
  duration_seconds: 0,
  kind: "movie",
  genre: "",
  year: null,
  rating: "",
  duration_label: "",
  seasons: null,
  episodes: null,
  cast_list: [],
  display_order: 0,
  is_published: true,
  is_featured: false,
  publish_to_catalog: true,
};

/** Read duration from a media URL in the browser — our lightweight "processing" step. */
function probeDuration(url: string, type: "video" | "audio"): Promise<number> {
  return new Promise((resolve) => {
    const el = document.createElement(type === "audio" ? "audio" : "video");
    el.preload = "metadata";
    el.onloadedmetadata = () => resolve(Math.round(el.duration || 0));
    el.onerror = () => resolve(0);
    el.src = url;
  });
}

function ContentEditor({
  value,
  channelId,
  onClose,
  onSaved,
}: {
  value: Draft;
  channelId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(value);
  const [saving, setSaving] = useState(false);
  const [probing, setProbing] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  // Pull the linked on-demand title so edits round-trip both records.
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!value.title_id) return;
      const { data } = await supabase.from("cms_titles").select("*").eq("id", value.title_id).maybeSingle();
      if (!data || !alive) return;
      const t = data as Record<string, unknown>;
      setDraft((d) => ({
        ...d,
        slug: (t.slug as string) ?? d.slug,
        kind: ((t.kind as Kind) ?? d.kind),
        genre: (t.genre as string) ?? "",
        year: (t.year as number) ?? null,
        rating: (t.rating as string) ?? "",
        duration_label: (t.duration_label as string) ?? "",
        seasons: (t.seasons as number) ?? null,
        episodes: (t.episodes as number) ?? null,
        cast_list: (t.cast_list as string[]) ?? [],
        display_order: (t.display_order as number) ?? 0,
        backdrop_url: (t.backdrop_url as string) ?? d.backdrop_url,
        trailer_url: (t.trailer_url as string) ?? d.trailer_url,
        is_published: Boolean(t.is_published),
        is_featured: Boolean(t.is_featured),
        publish_to_catalog: true,
      }));
    })();
    return () => { alive = false; };
  }, [value.title_id]);

  async function setSource(url: string | null) {
    setDraft((d) => ({ ...d, source_url: url }));
    if (!url) return;
    setProbing(true);
    const secs = await probeDuration(url, draft.media_type);
    setProbing(false);
    if (secs) setDraft((d) => ({ ...d, duration_seconds: secs }));
  }

  async function save() {
    if (!draft.title.trim()) { toast.error("Give the content a title"); return; }
    if (!draft.source_url) { toast.error("Upload or paste a media file URL"); return; }
    setSaving(true);

    const assetPayload = {
      channel_id: channelId,
      title: draft.title.trim(),
      description: draft.description || null,
      media_type: draft.media_type,
      source_url: draft.source_url,
      poster_url: draft.poster_url,
      duration_seconds: draft.duration_seconds,
      status: draft.duration_seconds > 0 ? "ready" : "processing",
    };

    let assetId = draft.id ?? null;
    if (assetId) {
      const { error } = await supabase.from("media_assets").update(assetPayload as never).eq("id", assetId);
      if (error) { setSaving(false); toast.error(error.message); return; }
    } else {
      const { data, error } = await supabase.from("media_assets").insert(assetPayload as never).select("id").single();
      if (error || !data) { setSaving(false); toast.error(error?.message ?? "Could not save media"); return; }
      assetId = (data as { id: string }).id;
    }

    if (draft.publish_to_catalog) {
      const slug =
        draft.slug.trim() || `${slugify(draft.title)}-${(assetId ?? "").slice(0, 6)}`;
      const titlePayload = {
        channel_id: channelId,
        slug,
        title: draft.title.trim(),
        synopsis: draft.description || null,
        kind: draft.kind,
        genre: draft.genre || null,
        year: draft.year,
        rating: draft.rating || null,
        duration_minutes: Math.round(draft.duration_seconds / 60) || null,
        duration_label: draft.duration_label || formatDuration(draft.duration_seconds),
        seasons: draft.seasons,
        episodes: draft.episodes,
        cast_list: draft.cast_list,
        poster_url: draft.poster_url,
        backdrop_url: draft.backdrop_url ?? draft.poster_url,
        stream_url: draft.source_url,
        trailer_url: draft.trailer_url,
        display_order: draft.display_order,
        is_published: draft.is_published,
        is_featured: draft.is_featured,
      };

      if (draft.title_id) {
        const { error } = await supabase.from("cms_titles").update(titlePayload as never).eq("id", draft.title_id);
        if (error) { setSaving(false); toast.error(error.message); return; }
      } else {
        const { data, error } = await supabase.from("cms_titles").insert(titlePayload as never).select("id").single();
        if (error || !data) { setSaving(false); toast.error(error?.message ?? "Could not publish title"); return; }
        await supabase
          .from("media_assets")
          .update({ title_id: (data as { id: string }).id } as never)
          .eq("id", assetId!);
      }
    }

    setSaving(false);
    toast.success(draft.id ? "Content updated" : "Content added");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-background p-6 my-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{draft.id ? "Edit content" : "New content"}</h3>
          <button onClick={onClose} aria-label="Close" className="size-9 grid place-items-center rounded-md hover:bg-elevated">
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <input className={inputClass} value={draft.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Slug (leave blank to generate)">
            <input className={inputClass} value={draft.slug} onChange={(e) => set("slug", e.target.value)} />
          </Field>
          <Field label="Kind">
            <select className={inputClass} value={draft.kind} onChange={(e) => set("kind", e.target.value as Kind)}>
              <option value="movie">Movie → /movies</option>
              <option value="series">Series → /series</option>
              <option value="podcast">Podcast → /podcasts</option>
              <option value="documentary">Documentary → /documentaries</option>
            </select>
          </Field>
          <Field label="Media type">
            <select
              className={inputClass}
              value={draft.media_type}
              onChange={(e) => set("media_type", e.target.value as "video" | "audio")}
            >
              <option value="video">Video</option>
              <option value="audio">Audio</option>
            </select>
          </Field>
          <Field label="Genre">
            <input className={inputClass} value={draft.genre} onChange={(e) => set("genre", e.target.value)} />
          </Field>
          <Field label="Year">
            <input type="number" className={inputClass} value={draft.year ?? ""} onChange={(e) => set("year", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Rating">
            <input className={inputClass} value={draft.rating} onChange={(e) => set("rating", e.target.value)} placeholder="TV-PG" />
          </Field>
          <Field label="Duration label">
            <input className={inputClass} value={draft.duration_label} onChange={(e) => set("duration_label", e.target.value)} placeholder="2h 14m" />
          </Field>
          <Field label="Seasons">
            <input type="number" className={inputClass} value={draft.seasons ?? ""} onChange={(e) => set("seasons", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Episodes">
            <input type="number" className={inputClass} value={draft.episodes ?? ""} onChange={(e) => set("episodes", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Display order (lower = first)">
            <input type="number" className={inputClass} value={draft.display_order} onChange={(e) => set("display_order", Number(e.target.value))} />
          </Field>
          <Field label={`Duration (seconds)${probing ? " — reading…" : ""}`}>
            <input
              type="number"
              className={inputClass}
              value={draft.duration_seconds}
              onChange={(e) => set("duration_seconds", Number(e.target.value))}
            />
          </Field>
        </div>

        <div className="grid gap-4 mt-4 md:grid-cols-2">
          <Field label="Poster">
            <MediaPicker value={draft.poster_url} onChange={(u) => set("poster_url", u)} folder="titles/posters" />
          </Field>
          <Field label="Backdrop">
            <MediaPicker value={draft.backdrop_url} onChange={(u) => set("backdrop_url", u)} folder="titles/backdrops" />
          </Field>
          <Field label="Video / audio file">
            <MediaPicker
              value={draft.source_url}
              onChange={setSource}
              kind="video"
              accept={draft.media_type === "audio" ? "audio/*" : "video/*"}
              folder="media-library"
              label="Upload or paste a media URL"
            />
          </Field>
          <Field label="Trailer">
            <MediaPicker value={draft.trailer_url} onChange={(u) => set("trailer_url", u)} folder="titles/trailers" kind="video" />
          </Field>
        </div>

        <div className="mt-4 grid gap-4">
          <Field label="Cast (comma-separated)">
            <input
              className={inputClass}
              value={draft.cast_list.join(", ")}
              onChange={(e) => set("cast_list", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            />
          </Field>
          <Field label="Synopsis / description">
            <textarea className={textareaClass} value={draft.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </div>

        <div className="flex gap-6 mt-4 flex-wrap">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.publish_to_catalog} onChange={(e) => set("publish_to_catalog", e.target.checked)} />
            List on-demand (feeds movies / series / podcasts / documentaries)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.is_published} onChange={(e) => set("is_published", e.target.checked)} /> Published
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.is_featured} onChange={(e) => set("is_featured", e.target.checked)} /> Featured
          </label>
        </div>
        <p className="mt-2 text-xs text-[color:var(--muted-foreground)]">
          Content published here is owned by this channel and appears on its page as well as the
          matching platform section. Duration also drives automated playout timing and the guide.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="h-11 px-5 rounded-md border border-border bg-elevated text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="h-11 px-6 rounded-md bg-primary text-primary-foreground font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function MediaLibraryPanel({ channelId }: { channelId: string }) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Draft | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setAssets(await fetchMediaAssets(channelId));
    setLoading(false);
  }, [channelId]);

  useEffect(() => { load(); }, [load]);

  async function remove(id: string) {
    const { error } = await supabase.from("media_assets").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Removed from library");
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-bold">Content library</h3>
          <p className="text-sm text-[color:var(--muted-foreground)]">
            Upload once, then reuse in playlists and automated playout — and publish straight to
            movies, series, podcasts or documentaries under your channel.
          </p>
        </div>
        <button
          onClick={() => setEditing(EMPTY)}
          className="h-11 px-5 rounded-md bg-primary text-primary-foreground font-semibold text-sm inline-flex items-center gap-2"
        >
          <Plus className="size-4" /> New content
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[color:var(--muted-foreground)]">
          <Loader2 className="size-4 animate-spin" /> Loading library…
        </div>
      ) : assets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Film className="size-8 mx-auto text-[color:var(--muted-foreground)]" />
          <p className="mt-3 text-sm text-[color:var(--muted-foreground)]">
            Your library is empty. Add your first video or audio file to start building your channel.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((a) => (
            <div key={a.id} className="rounded-2xl border border-border bg-elevated/40 overflow-hidden">
              <div className="aspect-video bg-surface grid place-items-center overflow-hidden">
                {a.poster_url ? (
                  <img src={a.poster_url} alt={`${a.title} poster`} className="size-full object-cover" />
                ) : a.media_type === "audio" ? (
                  <Music className="size-8 text-[color:var(--muted-foreground)]" />
                ) : (
                  <Film className="size-8 text-[color:var(--muted-foreground)]" />
                )}
              </div>
              <div className="p-4">
                <div className="text-sm font-semibold truncate">{a.title}</div>
                <div className="text-xs text-[color:var(--muted-foreground)]">
                  {a.media_type} · {formatDuration(a.duration_seconds)} · {a.status}
                  {a.title_id && <span className="ml-1 text-accent">· on-demand</span>}
                </div>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <button
                    onClick={() =>
                      setEditing({
                        ...EMPTY,
                        id: a.id,
                        title_id: a.title_id ?? null,
                        title: a.title,
                        description: a.description ?? "",
                        media_type: a.media_type,
                        source_url: a.source_url,
                        poster_url: a.poster_url,
                        duration_seconds: a.duration_seconds,
                        publish_to_catalog: Boolean(a.title_id),
                      })
                    }
                    className="h-9 px-3 rounded-md border border-border bg-surface text-xs font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(a.id)}
                    aria-label={`Delete ${a.title}`}
                    className="size-9 grid place-items-center rounded-md border border-border bg-surface text-primary"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ContentEditor
          value={editing}
          channelId={channelId}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
