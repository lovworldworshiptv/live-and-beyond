import { Captions, Languages, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PLAYBACK_LANGUAGES, useSettings, type SettingsData } from "@/lib/personal";

export function PlaybackPreferences() {
  const { settings, setSettings } = useSettings();
  const update = <K extends keyof SettingsData>(key: K, value: SettingsData[K], message: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    toast.success(message);
  };
  const row = "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-4";
  const icon = "size-10 rounded-full bg-secondary grid place-items-center text-muted-foreground";
  const languageSelect = (id: string, value: string, onChange: (v: string) => void, disabled = false) => (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} className="h-11 w-[8.5rem] sm:w-40"><SelectValue /></SelectTrigger>
      <SelectContent>{PLAYBACK_LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}</SelectContent>
    </Select>
  );
  const label = (code: string) => PLAYBACK_LANGUAGES.find((l) => l.code === code)?.label ?? code;

  return (
    <section aria-labelledby="playback-heading" className="border-t border-border pt-6">
      <h2 id="playback-heading" className="text-lg font-semibold">Playback preferences</h2>
      <p className="text-sm text-muted-foreground mt-1">Applied when a title or channel offers these options. Saved on this device.</p>
      <div className="divide-y divide-border mt-2">
        <div className={row}>
          <span className={icon}><Captions className="size-5" /></span>
          <div className="min-w-0"><label htmlFor="pref-captions" className="text-sm font-medium">Captions</label><p className="text-xs text-muted-foreground mt-0.5">Show subtitles automatically</p></div>
          <Switch id="pref-captions" className="scale-110" checked={settings.captions} onCheckedChange={(v) => update("captions", v, v ? "Captions on" : "Captions off")} />
        </div>
        <div className={row}>
          <span className={icon}><Captions className="size-5" /></span>
          <div className="min-w-0"><label htmlFor="pref-caption-lang" className="text-sm font-medium">Caption language</label><p className="text-xs text-muted-foreground mt-0.5">{settings.captions ? "Preferred subtitle track" : "Turn on captions to use"}</p></div>
          {languageSelect("pref-caption-lang", settings.captionLanguage, (v) => update("captionLanguage", v, `Captions: ${label(v)}`), !settings.captions)}
        </div>
        <div className={row}>
          <span className={icon}><Languages className="size-5" /></span>
          <div className="min-w-0"><label htmlFor="pref-audio-lang" className="text-sm font-medium">Audio language</label><p className="text-xs text-muted-foreground mt-0.5">Preferred soundtrack when available</p></div>
          {languageSelect("pref-audio-lang", settings.audioLanguage, (v) => update("audioLanguage", v, `Audio: ${label(v)}`))}
        </div>
        <div className={row}>
          <span className={icon}><PlayCircle className="size-5" /></span>
          <div className="min-w-0"><label htmlFor="pref-autoplay" className="text-sm font-medium">Autoplay</label><p className="text-xs text-muted-foreground mt-0.5">Start playing when you open a title</p></div>
          <Switch id="pref-autoplay" className="scale-110" checked={settings.autoplayPlayback} onCheckedChange={(v) => update("autoplayPlayback", v, v ? "Autoplay on" : "Autoplay off")} />
        </div>
        <div className={row}>
          <span className={icon}><PlayCircle className="size-5" /></span>
          <div className="min-w-0"><label htmlFor="pref-previews" className="text-sm font-medium">Autoplay previews</label><p className="text-xs text-muted-foreground mt-0.5">Muted previews when browsing</p></div>
          <Switch id="pref-previews" className="scale-110" checked={settings.autoplayPreviews} onCheckedChange={(v) => update("autoplayPreviews", v, v ? "Previews on" : "Previews off")} />
        </div>
      </div>
    </section>
  );
}
