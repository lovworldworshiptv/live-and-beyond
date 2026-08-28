import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ListVideo, Plus, Trash2, Loader2, Clock, ArrowUp, ArrowDown, Play, CalendarClock, Power,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  DAY_LABELS, fetchMediaAssets, fetchPlaylistItems, fetchPlaylists, fetchPlayoutSchedules,
  formatDuration, playlistDuration, publishScheduleToGuide, resolveNowPlaying,
  type MediaAsset, type NowPlaying, type Playlist, type PlaylistItem, type PlayoutSchedule,
} from "@/lib/playout";

type Service = "tv" | "radio";

export function PlayoutPanel({
  channelId,
  playoutEnabled,
  fallbackPlaylistId,
  onChannelUpdated,
}: {
  channelId: string;
  playoutEnabled?: boolean;
  fallbackPlaylistId?: string | null;
  onChannelUpdated?: () => void;
}) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [items, setItems] = useState<Record<string, PlaylistItem[]>>({});
  const [schedules, setSchedules] = useState<PlayoutSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [newPlaylist, setNewPlaylist] = useState("");
  const [enabled, setEnabled] = useState(Boolean(playoutEnabled));
  const [fallback, setFallback] = useState<string | null>(fallbackPlaylistId ?? null);
  const [now, setNow] = useState<NowPlaying | null>(null);

  const assetMap = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets]);

  const load = useCallback(async () => {
    setLoading(true);
    const [a, p, s] = await Promise.all([
      fetchMediaAssets(channelId),
      fetchPlaylists(channelId),
      fetchPlayoutSchedules(channelId),
    ]);
    setAssets(a);
    setPlaylists(p);
    setSchedules(s);
    const entries = await Promise.all(p.map(async (pl) => [pl.id, await fetchPlaylistItems(pl.id)] as const));
    setItems(Object.fromEntries(entries));
    setSelected((cur) => cur ?? p[0]?.id ?? null);
    setLoading(false);
  }, [channelId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setEnabled(Boolean(playoutEnabled)); }, [playoutEnabled]);
  useEffect(() => { setFallback(fallbackPlaylistId ?? null); }, [fallbackPlaylistId]);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const np = await resolveNowPlaying(channelId);
      if (alive) setNow(np);
    };
    tick();
    const t = setInterval(tick, 30_000);
    return () => { alive = false; clearInterval(t); };
  }, [channelId, schedules, items]);

  async function saveChannelPlayout(patch: { playout_enabled?: boolean; fallback_playlist_id?: string | null }) {
    const { error } = await supabase.from("cms_channels").update(patch as never).eq("id", channelId);
    if (error) { toast.error(error.message); return; }
    toast.success("Playout settings saved");
    onChannelUpdated?.();
  }

  async function createPlaylist() {
    const name = newPlaylist.trim();
    if (!name) return;
    const { data, error } = await supabase
      .from("playlists")
      .insert({ channel_id: channelId, name } as never)
      .select("id")
      .single();
    if (error) { toast.error(error.message); return; }
    setNewPlaylist("");
    setSelected((data as { id: string }).id);
    toast.success("Playlist created");
    load();
  }

  async function deletePlaylist(id: string) {
    const { error } = await supabase.from("playlists").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    if (selected === id) setSelected(null);
    toast.success("Playlist deleted");
    load();
  }

  async function addItem(playlistId: string, assetId: string) {
    const list = items[playlistId] ?? [];
    const { error } = await supabase
      .from("playlist_items")
      .insert({ playlist_id: playlistId, media_asset_id: assetId, position: list.length } as never);
    if (error) { toast.error(error.message); return; }
    load();
  }

  async function removeItem(id: string) {
    const { error } = await supabase.from("playlist_items").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  }

  async function moveItem(playlistId: string, index: number, dir: -1 | 1) {
    const list = [...(items[playlistId] ?? [])];
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const a = list[index]!;
    const b = list[target]!;
    await Promise.all([
      supabase.from("playlist_items").update({ position: target } as never).eq("id", a.id),
      supabase.from("playlist_items").update({ position: index } as never).eq("id", b.id),
    ]);
    load();
  }

  const activePlaylist = selected ? playlists.find((p) => p.id === selected) ?? null : null;
  const activeItems = selected ? items[selected] ?? [] : [];

  return (
    <div className="space-y-6">
      {/* Playout switch + now playing */}
      <section className="rounded-2xl border border-border bg-elevated/40 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-lg font-bold">Automated TV</h3>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
              Schedule playlists and Lettflix runs your channel around the clock — no encoder required.
            </p>
          </div>
          <button
            onClick={() => { const v = !enabled; setEnabled(v); saveChannelPlayout({ playout_enabled: v }); }}
            className={`h-11 px-5 rounded-md text-sm font-semibold inline-flex items-center gap-2 ${
              enabled ? "bg-primary text-primary-foreground" : "border border-border bg-surface"
            }`}
          >
            <Power className="size-4" /> {enabled ? "Playout on" : "Playout off"}
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="text-[11px] uppercase tracking-wider text-[color:var(--muted-foreground)]">On air now</div>
            {now ? (
              <>
                <div className="mt-1 text-sm font-semibold truncate">{now.asset.title}</div>
                <div className="text-xs text-[color:var(--muted-foreground)]">
                  {now.schedule.name} · {formatDuration(now.offsetSeconds)} in · ends{" "}
                  {now.endsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </>
            ) : (
              <div className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                Nothing scheduled right now — fallback programming will play.
              </div>
            )}
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <label className="text-[11px] uppercase tracking-wider text-[color:var(--muted-foreground)]">
              Fallback playlist
            </label>
            <select
              value={fallback ?? ""}
              onChange={(e) => {
                const v = e.target.value || null;
                setFallback(v);
                saveChannelPlayout({ fallback_playlist_id: v });
              }}
              className="mt-1 w-full h-10 rounded-md border border-border bg-elevated px-3 text-sm outline-none"
            >
              <option value="">None</option>
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <p className="mt-2 text-xs text-[color:var(--muted-foreground)]">
              Plays whenever no schedule or live broadcast is on air.
            </p>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[color:var(--muted-foreground)]">
          <Loader2 className="size-4 animate-spin" /> Loading playout…
        </div>
      ) : (
        <>
          {/* Playlists */}
          <section className="rounded-2xl border border-border bg-elevated/40 p-6">
            <h3 className="text-lg font-bold inline-flex items-center gap-2"><ListVideo className="size-5" /> Playlists</h3>
            <div className="mt-4 flex gap-2 flex-wrap">
              <input
                value={newPlaylist}
                onChange={(e) => setNewPlaylist(e.target.value)}
                placeholder="Playlist name"
                aria-label="Playlist name"
                className="flex-1 min-w-[220px] h-11 rounded-md border border-border bg-surface px-3 text-sm outline-none"
              />
              <button onClick={createPlaylist} className="h-11 px-5 rounded-md bg-primary text-primary-foreground font-semibold text-sm inline-flex items-center gap-2">
                <Plus className="size-4" /> New playlist
              </button>
            </div>

            {playlists.length > 0 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {playlists.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p.id)}
                    className={`h-9 px-4 rounded-md text-sm font-medium whitespace-nowrap ${
                      selected === p.id ? "bg-primary text-primary-foreground" : "border border-border bg-surface"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}

            {activePlaylist && (
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{activePlaylist.name}</div>
                    <button
                      onClick={() => deletePlaylist(activePlaylist.id)}
                      className="text-xs text-primary inline-flex items-center gap-1"
                    >
                      <Trash2 className="size-3.5" /> Delete
                    </button>
                  </div>
                  <div className="text-xs text-[color:var(--muted-foreground)]">
                    {activeItems.length} items · {formatDuration(playlistDuration(activeItems, assetMap))}
                  </div>
                  <div className="mt-3 space-y-2">
                    {activeItems.length === 0 && (
                      <p className="text-sm text-[color:var(--muted-foreground)]">
                        Add media from your library to build the running order.
                      </p>
                    )}
                    {activeItems.map((it, i) => {
                      const a = assetMap.get(it.media_asset_id);
                      return (
                        <div key={it.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2">
                          <span className="text-xs w-5 text-[color:var(--muted-foreground)]">{i + 1}</span>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm truncate">{a?.title ?? "Missing media"}</div>
                            <div className="text-xs text-[color:var(--muted-foreground)]">
                              {formatDuration(a?.duration_seconds ?? 0)}
                            </div>
                          </div>
                          <button onClick={() => moveItem(activePlaylist.id, i, -1)} aria-label="Move up" className="size-8 grid place-items-center rounded-md hover:bg-elevated">
                            <ArrowUp className="size-4" />
                          </button>
                          <button onClick={() => moveItem(activePlaylist.id, i, 1)} aria-label="Move down" className="size-8 grid place-items-center rounded-md hover:bg-elevated">
                            <ArrowDown className="size-4" />
                          </button>
                          <button onClick={() => removeItem(it.id)} aria-label="Remove item" className="size-8 grid place-items-center rounded-md hover:bg-elevated text-primary">
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold">Library</div>
                  <div className="text-xs text-[color:var(--muted-foreground)]">Click to append to the playlist.</div>

                  <div className="mt-3 rounded-xl border border-border bg-surface p-3 space-y-2">
                    <div className="text-xs font-semibold">Add media by URL</div>
                    <input
                      value={urlTitle}
                      onChange={(e) => setUrlTitle(e.target.value)}
                      placeholder="Title"
                      aria-label="Media title"
                      className="w-full h-10 rounded-md border border-border bg-elevated px-3 text-sm outline-none"
                    />
                    <input
                      value={urlSrc}
                      onChange={(e) => setUrlSrc(e.target.value)}
                      placeholder="https://… (MP4, MP3 or HLS)"
                      aria-label="Media URL"
                      className="w-full h-10 rounded-md border border-border bg-elevated px-3 text-sm outline-none"
                    />
                    <div className="flex gap-2">
                      <select
                        value={urlType}
                        onChange={(e) => setUrlType(e.target.value as "video" | "audio")}
                        aria-label="Media type"
                        className="h-10 rounded-md border border-border bg-elevated px-2 text-sm outline-none"
                      >
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                      </select>
                      <input
                        type="number"
                        min={0}
                        value={urlDuration}
                        onChange={(e) => setUrlDuration(Number(e.target.value))}
                        placeholder="Seconds"
                        aria-label="Duration in seconds"
                        className="w-28 h-10 rounded-md border border-border bg-elevated px-3 text-sm outline-none"
                      />
                      <button
                        onClick={() => addUrlMedia(activePlaylist.id)}
                        disabled={addingUrl}
                        className="flex-1 h-10 rounded-md bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {addingUrl ? <Loader2 className="size-4 animate-spin" /> : <LinkIcon className="size-4" />}
                        Add to playlist
                      </button>
                    </div>
                    <p className="text-[11px] text-[color:var(--muted-foreground)]">
                      Duration is detected automatically for direct files; enter it manually for live/HLS URLs.
                    </p>
                  </div>

                  <div className="mt-3 space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {assets.length === 0 && (
                      <p className="text-sm text-[color:var(--muted-foreground)]">
                        No media yet — upload files in the Content tab first.
                      </p>
                    )}
                    {assets.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => addItem(activePlaylist.id, a.id)}
                        className="w-full flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2 text-left hover:bg-elevated"
                      >
                        <Play className="size-4 text-accent" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm truncate">{a.title}</span>
                          <span className="block text-xs text-[color:var(--muted-foreground)]">
                            {a.media_type} · {formatDuration(a.duration_seconds)}
                          </span>
                        </span>
                        <Plus className="size-4 text-[color:var(--muted-foreground)]" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          <ScheduleSection
            channelId={channelId}
            playlists={playlists}
            schedules={schedules}
            onChange={load}
          />
        </>
      )}
    </div>
  );
}

function ScheduleSection({
  channelId,
  playlists,
  schedules,
  onChange,
}: {
  channelId: string;
  playlists: Playlist[];
  schedules: PlayoutSchedule[];
  onChange: () => void;
}) {
  const [name, setName] = useState("");
  const [playlistId, setPlaylistId] = useState("");
  const [service, setService] = useState<Service>("tv");
  const [startsAt, setStartsAt] = useState("");
  const [duration, setDuration] = useState(60);
  const [recurrence, setRecurrence] = useState<"none" | "daily" | "weekly">("daily");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [publishing, setPublishing] = useState(false);

  async function create() {
    if (!name.trim() || !playlistId || !startsAt) {
      toast.error("Name, playlist and start time are required");
      return;
    }
    const { error } = await supabase.from("playout_schedules").insert({
      channel_id: channelId,
      playlist_id: playlistId,
      name: name.trim(),
      service,
      starts_at: new Date(startsAt).toISOString(),
      duration_minutes: duration,
      recurrence,
      days_of_week: recurrence === "weekly" ? days : [],
    } as never);
    if (error) { toast.error(error.message); return; }
    setName("");
    toast.success("Programming block scheduled");
    onChange();
  }

  async function toggle(s: PlayoutSchedule) {
    await supabase.from("playout_schedules").update({ is_active: !s.is_active } as never).eq("id", s.id);
    onChange();
  }

  async function remove(id: string) {
    await supabase.from("playout_schedules").delete().eq("id", id);
    toast.success("Block removed");
    onChange();
  }

  return (
    <section className="rounded-2xl border border-border bg-elevated/40 p-6">
      <h3 className="text-lg font-bold inline-flex items-center gap-2">
        <CalendarClock className="size-5" /> Programming schedule
      </h3>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Block name (e.g. Morning Show)"
          aria-label="Block name"
          className="h-11 rounded-md border border-border bg-surface px-3 text-sm outline-none"
        />
        <select
          value={playlistId}
          onChange={(e) => setPlaylistId(e.target.value)}
          aria-label="Playlist"
          className="h-11 rounded-md border border-border bg-surface px-3 text-sm outline-none"
        >
          <option value="">Select playlist…</option>
          {playlists.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select
          value={service}
          onChange={(e) => setService(e.target.value as Service)}
          aria-label="Service"
          className="h-11 rounded-md border border-border bg-surface px-3 text-sm outline-none"
        >
          <option value="tv">TV</option>
          <option value="radio">Radio</option>
        </select>
        <input
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          aria-label="Start time"
          className="h-11 rounded-md border border-border bg-surface px-3 text-sm outline-none"
        />
        <input
          type="number"
          min={5}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          aria-label="Duration in minutes"
          className="h-11 rounded-md border border-border bg-surface px-3 text-sm outline-none"
        />
        <select
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value as typeof recurrence)}
          aria-label="Recurrence"
          className="h-11 rounded-md border border-border bg-surface px-3 text-sm outline-none"
        >
          <option value="none">One-off</option>
          <option value="daily">Every day</option>
          <option value="weekly">Selected days</option>
        </select>
      </div>

      {recurrence === "weekly" && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {DAY_LABELS.map((d, i) => (
            <button
              key={d}
              onClick={() => setDays((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]))}
              className={`h-9 px-3 rounded-md text-xs font-medium ${
                days.includes(i) ? "bg-primary text-primary-foreground" : "border border-border bg-surface"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2 flex-wrap">
        <button onClick={create} className="h-11 px-5 rounded-md bg-primary text-primary-foreground font-semibold text-sm inline-flex items-center gap-2">
          <Plus className="size-4" /> Add block
        </button>
        <button
          onClick={async () => {
            setPublishing(true);
            try {
              const n = await publishScheduleToGuide(channelId);
              toast.success(`${n} programmes published to the guide`);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Could not publish schedule");
            } finally { setPublishing(false); }
          }}
          disabled={publishing}
          className="h-11 px-5 rounded-md border border-border bg-surface text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50"
        >
          {publishing ? <Loader2 className="size-4 animate-spin" /> : <CalendarClock className="size-4" />}
          Publish to guide
        </button>
      </div>

      <div className="mt-5 space-y-2">
        {schedules.length === 0 && (
          <p className="text-sm text-[color:var(--muted-foreground)]">No programming blocks yet.</p>
        )}
        {schedules.map((s) => {
          const pl = playlists.find((p) => p.id === s.playlist_id);
          const start = new Date(s.starts_at);
          return (
            <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 flex-wrap">
              <Clock className="size-4 text-[color:var(--muted-foreground)]" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{s.name}</div>
                <div className="text-xs text-[color:var(--muted-foreground)]">
                  {pl?.name ?? "No playlist"} · {s.service.toUpperCase()} ·{" "}
                  {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} for {s.duration_minutes}m ·{" "}
                  {s.recurrence === "weekly"
                    ? s.days_of_week.map((d) => DAY_LABELS[d]).join(", ") || "no days"
                    : s.recurrence === "daily"
                      ? "daily"
                      : start.toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => toggle(s)}
                className={`h-9 px-3 rounded-md text-xs font-semibold ${
                  s.is_active ? "bg-primary/20 text-primary" : "border border-border"
                }`}
              >
                {s.is_active ? "Active" : "Paused"}
              </button>
              <button onClick={() => remove(s.id)} aria-label={`Delete ${s.name}`} className="size-9 grid place-items-center rounded-md border border-border text-primary">
                <Trash2 className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
