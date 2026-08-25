import { useCallback, useEffect, useState } from "react";
import { Loader2, Radio as RadioIcon, Save, Music2 } from "lucide-react";
import { toast } from "sonner";
import { MediaPicker } from "@/components/media-picker";
import {
  fetchRadioSettings, saveRadioSettings, METADATA_PROVIDERS, RADIO_FORMATS,
  type MetadataProvider, type RadioFormat, type RadioSettings,
} from "@/lib/radio";

const EMPTY: Partial<RadioSettings> = {
  is_enabled: true,
  stream_url: "",
  format: "mp3",
  bitrate_kbps: 128,
  metadata_provider: "none",
  metadata_url: "",
  now_playing_title: "",
  now_playing_artist: "",
  now_playing_artwork_url: "",
  station_message: "",
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] uppercase tracking-wider text-[color:var(--muted-foreground)] mb-1.5">
      {children}
    </div>
  );
}

const inputCls =
  "w-full h-11 px-3 rounded-md bg-surface border border-border text-sm outline-none focus:border-primary";

export function RadioPanel({ channelId }: { channelId: string }) {
  const [value, setValue] = useState<Partial<RadioSettings>>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const row = await fetchRadioSettings(channelId);
    setValue(row ? { ...EMPTY, ...row } : EMPTY);
    setLoading(false);
  }, [channelId]);

  useEffect(() => { load(); }, [load]);

  function set<K extends keyof RadioSettings>(key: K, v: RadioSettings[K]) {
    setValue((prev) => ({ ...prev, [key]: v }));
  }

  async function save() {
    setSaving(true);
    try {
      await saveRadioSettings(channelId, {
        is_enabled: value.is_enabled ?? true,
        stream_url: value.stream_url || null,
        format: (value.format ?? "mp3") as RadioFormat,
        bitrate_kbps: Number(value.bitrate_kbps) || 128,
        metadata_provider: (value.metadata_provider ?? "none") as MetadataProvider,
        metadata_url: value.metadata_url || null,
        now_playing_title: value.now_playing_title || null,
        now_playing_artist: value.now_playing_artist || null,
        now_playing_artwork_url: value.now_playing_artwork_url || null,
        now_playing_updated_at: new Date().toISOString(),
        station_message: value.station_message || null,
      });
      toast.success("Radio settings saved");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save radio settings");
    } finally { setSaving(false); }
  }

  if (loading) {
    return <div className="py-20 grid place-items-center"><Loader2 className="size-5 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <section className="rounded-2xl border border-border bg-elevated/40 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-lg font-bold inline-flex items-center gap-2">
              <RadioIcon className="size-5 text-primary" /> Radio station
            </h3>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
              Point Lettflix at your existing Icecast/Shoutcast stream, or use the HLS playback URL from
              your Lettflix Live radio ingest in the Broadcast tab.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.is_enabled ?? true}
              onChange={(e) => set("is_enabled", e.target.checked)}
              className="size-4 accent-[color:var(--primary)]"
            />
            Listed publicly
          </label>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Stream URL</Label>
            <input
              className={inputCls}
              placeholder="https://stream.example.com/live.mp3"
              value={value.stream_url ?? ""}
              onChange={(e) => set("stream_url", e.target.value)}
            />
          </div>
          <div>
            <Label>Format</Label>
            <select
              className={inputCls}
              value={value.format ?? "mp3"}
              onChange={(e) => set("format", e.target.value as RadioFormat)}
            >
              {RADIO_FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <Label>Bitrate (kbps)</Label>
            <input
              type="number"
              className={inputCls}
              value={value.bitrate_kbps ?? 128}
              onChange={(e) => set("bitrate_kbps", Number(e.target.value))}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Station message</Label>
            <input
              className={inputCls}
              placeholder="Great music and the Word, 24/7"
              value={value.station_message ?? ""}
              onChange={(e) => set("station_message", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-elevated/40 p-6">
        <h3 className="text-lg font-bold inline-flex items-center gap-2">
          <Music2 className="size-5 text-accent" /> Now playing metadata
        </h3>
        <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
          Lettflix reads your track metadata every 30 seconds and shows it in the radio player.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Metadata source</Label>
            <select
              className={inputCls}
              value={value.metadata_provider ?? "none"}
              onChange={(e) => set("metadata_provider", e.target.value as MetadataProvider)}
            >
              {METADATA_PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <Label>Metadata URL</Label>
            <input
              className={inputCls}
              placeholder="https://stream.example.com/status-json.xsl"
              value={value.metadata_url ?? ""}
              onChange={(e) => set("metadata_url", e.target.value)}
            />
          </div>
          <div>
            <Label>Track title</Label>
            <input
              className={inputCls}
              value={value.now_playing_title ?? ""}
              onChange={(e) => set("now_playing_title", e.target.value)}
            />
          </div>
          <div>
            <Label>Artist</Label>
            <input
              className={inputCls}
              value={value.now_playing_artist ?? ""}
              onChange={(e) => set("now_playing_artist", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Artwork</Label>
            <MediaPicker
              value={value.now_playing_artwork_url ?? null}
              onChange={(url) => set("now_playing_artwork_url", url)}
              folder="radio"
            />
          </div>
        </div>
      </section>

      <button
        onClick={save}
        disabled={saving}
        className="h-11 px-6 rounded-md bg-primary text-primary-foreground font-semibold inline-flex items-center gap-2 disabled:opacity-50"
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save radio settings
      </button>
    </div>
  );
}
