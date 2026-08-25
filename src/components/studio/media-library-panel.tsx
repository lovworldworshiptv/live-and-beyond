import { useCallback, useEffect, useState } from "react";
import { Film, Music, Loader2, Plus, Trash2, Upload, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MediaPicker } from "@/components/media-picker";
import { fetchMediaAssets, formatDuration, type MediaAsset } from "@/lib/playout";
import { slugify } from "@/lib/channel-services";

type Draft = {
  id?: string;
  title: string;
  description: string;
  media_type: "video" | "audio";
  source_url: string | null;
  poster_url: string | null;
  duration_seconds: number;
};

const EMPTY: Draft = {
  title: "",
  description: "",
  media_type: "video",
  source_url: null,
  poster_url: null,
  duration_seconds: 0,
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

function AssetEditor({
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

  async function setSource(url: string | null) {
    setDraft((d) => ({ ...d, source_url: url }));
    if (!url) return;
    setProbing(true);
    const secs = await probeDuration(url, draft.media_type);
    setProbing(false);
    if (secs) setDraft((d) => ({ ...d, duration_seconds: secs }));
  }

  async function save() {
    if (!draft.title.trim()) { toast.error("Give the media a title"); return; }
    if (!draft.source_url) { toast.error("Upload or paste a media file URL"); return; }
    setSaving(true);
    const payload = {
      channel_id: channelId,
      title: draft.title.trim(),
      description: draft.description || null,
      media_type: draft.media_type,
      source_url: draft.source_url,
      poster_url: draft.poster_url,
      duration_seconds: draft.duration_seconds,
      status: draft.duration_seconds > 0 ? "ready" : "processing",
    };
    const { error } = draft.id
      ? await supabase.from("media_assets").update(payload as never).eq("id", draft.id)
      : await supabase.from("media_assets").insert(payload as never);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(draft.id ? "Media updated" : "Media added to library");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-background p-6 my-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{draft.id ? "Edit media" : "Add media"}</h3>
          <button onClick={onClose} aria-label="Close" className="size-9 grid place-items-center rounded-md hover:bg-elevated">
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-[color:var(--muted-foreground)]">Title</label>
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="mt-1 w-full h-11 rounded-md border border-border bg-elevated px-3 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-[color:var(--muted-foreground)]">Description</label>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-md border border-border bg-elevated p-3 text-sm outline-none"
            />
          </div>
          <div className="flex gap-2">
            {(["video", "audio"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setDraft({ ...draft, media_type: t })}
                className={`h-10 px-4 rounded-md text-sm font-medium capitalize ${
                  draft.media_type === t ? "bg-primary text-primary-foreground" : "border border-border bg-elevated"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-[color:var(--muted-foreground)]">Media file</label>
            <MediaPicker
              value={draft.source_url}
              onChange={setSource}
              kind={draft.media_type === "audio" ? "video" : "video"}
              accept={draft.media_type === "audio" ? "audio/*" : "video/*"}
              folder="media-library"
              label="Upload or paste a media URL"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-[color:var(--muted-foreground)]">Poster</label>
            <MediaPicker
              value={draft.poster_url}
              onChange={(u) => setDraft({ ...draft, poster_url: u })}
              folder="media-posters"
              label="Upload or paste a poster URL"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-[color:var(--muted-foreground)]">
              Duration (seconds){probing && " — reading…"}
            </label>
            <input
              type="number"
              value={draft.duration_seconds}
              onChange={(e) => setDraft({ ...draft, duration_seconds: Number(e.target.value) })}
              className="mt-1 w-full h-11 rounded-md border border-border bg-elevated px-3 text-sm outline-none"
            />
            <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
              Duration drives automated playout timing and the programme guide.
            </p>
          </div>
        </div>

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

function PublishDialog({
  asset,
  onClose,
  onDone,
}: {
  asset: MediaAsset;
  onClose: () => void;
  onDone: () => void;
}) {
  const [kind, setKind] = useState<"movie" | "series" | "podcast" | "documentary">("movie");
  const [genre, setGenre] = useState("");
  const [busy, setBusy] = useState(false);

  async function publish() {
    setBusy(true);
    const slug = `${slugify(asset.title)}-${asset.id.slice(0, 6)}`;
    const { data, error } = await supabase
      .from("cms_titles")
      .insert({
        slug,
        title: asset.title,
        synopsis: asset.description,
        kind,
        genre: genre || null,
        poster_url: asset.poster_url,
        backdrop_url: asset.poster_url,
        stream_url: asset.source_url,
        duration_minutes: Math.round(asset.duration_seconds / 60) || null,
        duration_label: formatDuration(asset.duration_seconds),
        is_published: true,
      } as never)
      .select("id")
      .single();
    if (error) { setBusy(false); toast.error(error.message); return; }
    await supabase.from("media_assets").update({ title_id: (data as { id: string }).id } as never).eq("id", asset.id);
    setBusy(false);
    toast.success("Published to on-demand");
    onDone();
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6">
        <h3 className="text-lg font-bold">Publish to on-demand</h3>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          “{asset.title}” becomes a viewable title on Lettflix.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {(["movie", "series", "podcast", "documentary"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`h-10 rounded-md text-sm font-medium capitalize ${
                kind === k ? "bg-primary text-primary-foreground" : "border border-border bg-elevated"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        <input
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          placeholder="Genre (optional)"
          className="mt-3 w-full h-11 rounded-md border border-border bg-elevated px-3 text-sm outline-none"
        />
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="h-11 px-5 rounded-md border border-border bg-elevated text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={publish}
            disabled={busy}
            className="h-11 px-6 rounded-md bg-primary text-primary-foreground font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Publish
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
  const [publishing, setPublishing] = useState<MediaAsset | null>(null);

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
          <h3 className="text-lg font-bold">Media library</h3>
          <p className="text-sm text-[color:var(--muted-foreground)]">
            Upload videos and audio once, then reuse them in playlists, automated playout and on-demand.
          </p>
        </div>
        <button
          onClick={() => setEditing(EMPTY)}
          className="h-11 px-5 rounded-md bg-primary text-primary-foreground font-semibold text-sm inline-flex items-center gap-2"
        >
          <Plus className="size-4" /> Add media
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
            Your library is empty. Add your first video or audio file to start building playlists.
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
                        id: a.id,
                        title: a.title,
                        description: a.description ?? "",
                        media_type: a.media_type,
                        source_url: a.source_url,
                        poster_url: a.poster_url,
                        duration_seconds: a.duration_seconds,
                      })
                    }
                    className="h-9 px-3 rounded-md border border-border bg-surface text-xs font-medium"
                  >
                    Edit
                  </button>
                  {!a.title_id && (
                    <button
                      onClick={() => setPublishing(a)}
                      className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold"
                    >
                      Publish to on-demand
                    </button>
                  )}
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
        <AssetEditor
          value={editing}
          channelId={channelId}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
      {publishing && (
        <PublishDialog
          asset={publishing}
          onClose={() => setPublishing(null)}
          onDone={() => { setPublishing(null); load(); }}
        />
      )}
    </div>
  );
}
