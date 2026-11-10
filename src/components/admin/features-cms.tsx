import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { FEATURES, isFeatureEnabled, setFeatureFlagsCache, useFeatureFlags, type FeatureFlags, type FeatureGroup, type FeatureKey } from "@/lib/feature-flags";
import { BrandLoader } from "@/components/brand-loader";

const GROUPS: FeatureGroup[] = ["Main sections", "Viewer actions", "Creator tools"];

export function FeaturesCms() {
  const { flags, loaded } = useFeatureFlags();
  const [saving, setSaving] = useState<FeatureKey | null>(null);

  async function toggle(key: FeatureKey, on: boolean) {
    const prev = flags;
    const next: FeatureFlags = { ...flags, [key]: on };
    setSaving(key);
    setFeatureFlagsCache(next);
    const { error } = await supabase.from("cms_settings").upsert({ key: "features", value: next as never }, { onConflict: "key" });
    setSaving(null);
    if (error) {
      setFeatureFlagsCache(prev);
      toast.error("Couldn't save. Try again.");
    } else {
      toast.success(`${FEATURES.find((f) => f.key === key)?.label} ${on ? "switched on" : "switched off"}`);
    }
  }

  if (!loaded) return <div className="h-40"><BrandLoader variant="section" label="Loading features" /></div>;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Switched-off features disappear for everyone across the platform. Admins can still open hidden pages to preview them.</p>
      {GROUPS.map((group) => (
        <section key={group} className="rounded-xl border border-border bg-elevated/40 p-5">
          <h3 className="font-semibold mb-3">{group}</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {FEATURES.filter((f) => f.group === group).map((f) => {
              const on = isFeatureEnabled(flags, f.key);
              return (
                <li key={f.key} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{f.label}</div>
                    <div className="text-xs text-muted-foreground">{f.description}</div>
                  </div>
                  <Switch checked={on} disabled={saving !== null} onCheckedChange={(v) => void toggle(f.key, v)} aria-label={`${f.label} ${on ? "on" : "off"}`} />
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
