import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { MediaPicker } from "@/components/media-picker";
import { Field, inputClass, textareaClass, type Channel } from "@/routes/admin";
import {
  SERVICE_CATALOG,
  saveChannelServices,
  slugify,
  type ServiceKey,
} from "@/lib/channel-services";
import { supabase } from "@/integrations/supabase/client";

const CATEGORIES = [
  "Sports", "News", "Entertainment", "Christian Living", "Music",
  "LoveWorld", "Radio", "Audio", "Video", "Education", "Lifestyle", "Kids & Family",
];

const STEPS = ["Identity", "Branding", "Services", "Contact"] as const;

type Props = {
  channel: Partial<Channel> | null;
  creatorId: string;
  initialServices: ServiceKey[];
  onClose: () => void;
  onDone: () => void;
};

export function ChannelSetupWizard({ channel, creatorId, initialServices, onClose, onDone }: Props) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({
    kind: "tv",
    is_published: true,
    is_live: false,
    popularity: 0,
    is_trending: false,
    display_order: 0,
    name: "",
    slug: "",
    ...(channel ?? {}),
  });
  const [services, setServices] = useState<ServiceKey[]>(
    initialServices.length ? initialServices : ["tv"],
  );

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const str = (k: string) => (form[k] as string | null | undefined) ?? "";
  const social = (form["social_links"] as Record<string, string> | null) ?? {};
  const setSocial = (k: string, v: string) =>
    setForm((f) => ({ ...f, social_links: { ...social, [k]: v } }));

  const canNext =
    step !== 0 || (str("name").trim().length > 1 && slugify(str("slug")).length > 1);

  async function finish() {
    if (!services.length) {
      toast.error("Select at least one service for your channel");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: slugify(str("slug")),
        creator_id: creatorId,
        setup_completed_at: new Date().toISOString(),
      } as Record<string, unknown>;
      delete payload["created_at"];
      delete payload["updated_at"];

      let channelId = form["id"] as string | undefined;
      if (channelId) {
        const { error } = await supabase.from("cms_channels").update(payload as never).eq("id", channelId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("cms_channels")
          .insert(payload as never)
          .select("id")
          .single();
        if (error) throw error;
        channelId = (data as { id: string }).id;
      }
      await saveChannelServices(channelId!, services);
      toast.success("Channel saved");
      onDone();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save channel";
      toast.error(msg.includes("duplicate") ? "That channel address is already taken" : msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/75 backdrop-blur-sm px-4 py-8 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <div className="text-xs uppercase tracking-widest text-[color:var(--muted-foreground)]">
              Channel setup
            </div>
            <h2 className="text-lg font-bold">{STEPS[step]}</h2>
          </div>
          <button onClick={onClose} className="size-9 grid place-items-center rounded-md hover:bg-elevated" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 px-6 pt-5">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div
                className={`h-1.5 rounded-full ${i <= step ? "bg-primary" : "bg-elevated"}`}
              />
              <div className={`mt-2 text-[11px] ${i === step ? "text-foreground font-medium" : "text-[color:var(--muted-foreground)]"}`}>
                {s}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-6">
          {step === 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Channel name">
                <input
                  className={inputClass}
                  value={str("name")}
                  onChange={(e) => {
                    set("name", e.target.value);
                    if (!form["id"]) set("slug", slugify(e.target.value));
                  }}
                  placeholder="LoveWorld Expressions"
                />
              </Field>
              <Field label="Channel address (slug)">
                <input
                  className={inputClass}
                  value={str("slug")}
                  onChange={(e) => set("slug", slugify(e.target.value))}
                  placeholder="loveworld-expressions"
                />
              </Field>
              <Field label="Category">
                <select className={inputClass} value={str("category")} onChange={(e) => set("category", e.target.value)}>
                  <option value="">—</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Language">
                <input className={inputClass} value={str("language")} onChange={(e) => set("language", e.target.value)} placeholder="English" />
              </Field>
              <Field label="Country">
                <input className={inputClass} value={str("country")} onChange={(e) => set("country", e.target.value)} placeholder="Nigeria" />
              </Field>
              <Field label="Region">
                <input className={inputClass} value={str("region")} onChange={(e) => set("region", e.target.value)} placeholder="Global" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Description">
                  <textarea
                    className={textareaClass}
                    value={str("description")}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="What your channel is about, who it serves and what viewers can expect."
                  />
                </Field>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Logo">
                <MediaPicker value={str("logo_url")} onChange={(url) => set("logo_url", url)} folder="channels/logos" />
              </Field>
              <Field label="Cover image">
                <MediaPicker value={str("banner_url")} onChange={(url) => set("banner_url", url)} folder="channels/banners" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Tagline">
                  <input className={inputClass} value={str("tagline")} onChange={(e) => set("tagline", e.target.value)} placeholder="Faith. Culture. Entertainment." />
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-3">
              <p className="text-sm text-[color:var(--muted-foreground)]">
                Choose the services your channel operates. You can activate more at any time.
              </p>
              {SERVICE_CATALOG.map((s) => {
                const on = services.includes(s.key);
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() =>
                      setServices((cur) => (on ? cur.filter((x) => x !== s.key) : [...cur, s.key]))
                    }
                    className={`flex items-start gap-3 text-left rounded-xl border p-4 transition ${
                      on ? "border-primary bg-primary/10" : "border-border bg-elevated/40 hover:bg-elevated/70"
                    }`}
                  >
                    <span className={`mt-0.5 size-5 rounded-md grid place-items-center border ${on ? "bg-primary border-primary" : "border-border"}`}>
                      {on && <Check className="size-3.5 text-primary-foreground" />}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{s.label}</span>
                      <span className="block text-xs text-[color:var(--muted-foreground)]">{s.blurb}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Website">
                <input className={inputClass} value={str("website")} onChange={(e) => set("website", e.target.value)} placeholder="https://example.com" />
              </Field>
              <Field label="Contact email">
                <input className={inputClass} value={str("contact_email")} onChange={(e) => set("contact_email", e.target.value)} placeholder="hello@example.com" />
              </Field>
              <Field label="Contact phone">
                <input className={inputClass} value={str("contact_phone")} onChange={(e) => set("contact_phone", e.target.value)} />
              </Field>
              {(["youtube", "instagram", "x", "facebook"] as const).map((k) => (
                <Field key={k} label={k === "x" ? "X (Twitter)" : k[0]!.toUpperCase() + k.slice(1)}>
                  <input className={inputClass} value={social[k] ?? ""} onChange={(e) => setSocial(k, e.target.value)} placeholder="https://…" />
                </Field>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <button
            onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
            className="h-10 px-4 rounded-md border border-border bg-elevated hover:bg-elevated/70 text-sm inline-flex items-center gap-2"
          >
            <ChevronLeft className="size-4" /> {step === 0 ? "Cancel" : "Back"}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              disabled={!canNext}
              onClick={() => setStep((s) => s + 1)}
              className="h-10 px-5 rounded-md bg-primary text-primary-foreground font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-50"
            >
              Continue <ChevronRight className="size-4" />
            </button>
          ) : (
            <button
              disabled={saving}
              onClick={finish}
              className="h-10 px-5 rounded-md bg-primary text-primary-foreground font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-60"
            >
              {saving && <Loader2 className="size-4 animate-spin" />} Save channel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
