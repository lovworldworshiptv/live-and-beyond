import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  User, Bell, CreditCard, Shield, Monitor, Globe, LogOut, Check, KeyRound, AlertTriangle,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useProfile, useSettings, type SettingsData } from "@/lib/personal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";


export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account Settings — Lettflix" },
      { name: "description", content: "Manage your Lettflix profile, notifications, playback quality, security and billing." },
    ],
  }),
  component: AccountPage,
});

const sections = [
  { id: "profile", label: "Personal", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "playback", label: "Playback", icon: Monitor },
  { id: "language", label: "Language & Region", icon: Globe },
  { id: "billing", label: "Subscription", icon: CreditCard },
  { id: "security", label: "Security", icon: KeyRound },
  { id: "privacy", label: "Privacy", icon: Shield },
] as const;

function AccountPage() {
  const { profile, setProfile } = useProfile();
  const { settings, setSettings } = useSettings();
  const [active, setActive] = useState<(typeof sections)[number]["id"]>("profile");
  const [pushEnabled, setPushEnabled] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const update = <K extends keyof SettingsData>(k: K, v: SettingsData[K]) => {
    setSettings({ ...settings, [k]: v });
    toast.success("Settings saved");
  };


  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-border">
        <div className="mx-auto max-w-[1480px] px-6 lg:px-10 pt-12 pb-8">
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
            Account settings
          </h1>
          <p className="mt-2 text-[color:var(--secondary-foreground)]">
            Personalise your Lettflix experience across devices.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-8 mb-16 grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 h-max">
          <nav className="rounded-2xl border border-border bg-elevated/40 p-2 flex lg:flex-col overflow-x-auto">
            {sections.map((s) => {
              const isActive = active === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={`flex items-center gap-3 h-10 px-3 rounded-md text-sm whitespace-nowrap transition ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-surface text-[color:var(--secondary-foreground)]"
                  }`}
                >
                  <s.icon className="size-4" /> {s.label}
                </button>
              );
            })}
            <div className="h-px bg-border my-2 hidden lg:block" />
            <button className="hidden lg:flex items-center gap-3 h-10 px-3 rounded-md text-sm text-[color:var(--muted-foreground)] hover:text-primary transition">
              <LogOut className="size-4" /> Sign out
            </button>
          </nav>
        </aside>

        {/* Content */}
        <div className="space-y-4">
          {active === "profile" && (
            <Card title="Profile" subtitle="How you appear across Lettflix.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Display name">
                  <input
                    className={inputClass}
                    value={profile.displayName}
                    onChange={(e) =>
                      setProfile({ ...profile, displayName: e.target.value })
                    }
                  />
                </Field>
                <Field label="Handle">
                  <input
                    className={inputClass}
                    value={profile.handle}
                    onChange={(e) =>
                      setProfile({ ...profile, handle: e.target.value })
                    }
                  />
                </Field>
                <Field label="Location">
                  <input
                    className={inputClass}
                    value={profile.location}
                    onChange={(e) =>
                      setProfile({ ...profile, location: e.target.value })
                    }
                  />
                </Field>
                <Field label="Avatar seed">
                  <input
                    className={inputClass}
                    value={profile.avatarSeed}
                    onChange={(e) =>
                      setProfile({ ...profile, avatarSeed: e.target.value })
                    }
                  />
                </Field>
                <Field label="Bio" className="sm:col-span-2">
                  <textarea
                    rows={3}
                    className={inputClass}
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  />
                </Field>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => toast.success("Profile updated")}
                  className="h-10 px-5 rounded-md bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition"
                >
                  Save changes
                </button>
              </div>
            </Card>
          )}

          {active === "notifications" && (
            <Card title="Notifications" subtitle="Choose what pings you.">
              <Toggle
                label="Email notifications"
                description="Weekly digests, receipts and account updates."
                value={settings.emailNotifications}
                onChange={(v) => update("emailNotifications", v)}
              />
              <Toggle
                label="Push notifications"
                description="Real-time pings on your mobile and desktop devices."
                value={pushEnabled}
                onChange={(v) => {
                  setPushEnabled(v);
                  toast.success(v ? "Push notifications enabled" : "Push notifications disabled");
                }}
              />
              <Toggle
                label="Live channel alerts"
                description="Ping me when a followed channel goes live."
                value={settings.liveAlerts}
                onChange={(v) => update("liveAlerts", v)}
              />
              <Toggle
                label="New releases"
                description="Tell me when new episodes and films drop."
                value={settings.newReleases}
                onChange={(v) => update("newReleases", v)}
              />
            </Card>
          )}

          {active === "playback" && (
            <Card title="Playback" subtitle="Tune quality and previews.">
              <Toggle
                label="Autoplay next episode"
                description="Automatically continue to the next episode in a series."
                value={autoAdvance}
                onChange={(v) => {
                  setAutoAdvance(v);
                  toast.success("Autoplay preference saved");
                }}
              />
              <Toggle
                label="Auto preview on hover"
                description="Netflix-style muted previews when hovering titles and channels."
                value={settings.autoplayPreviews}
                onChange={(v) => update("autoplayPreviews", v)}
              />
              <Field label="Preferred quality">
                <div className="flex gap-2">
                  {(["auto", "hd", "4k"] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => update("playbackQuality", q)}
                      className={`h-10 px-4 rounded-md border text-sm font-medium transition ${
                        settings.playbackQuality === q
                          ? "bg-accent border-accent text-accent-foreground"
                          : "bg-surface border-border hover:bg-elevated"
                      }`}
                    >
                      {q.toUpperCase()}
                    </button>
                  ))}
                </div>
              </Field>
            </Card>
          )}


          {active === "language" && (
            <Card title="Language & Region" subtitle="Interface and captions.">
              <Field label="Language">
                <select
                  className={inputClass}
                  value={settings.language}
                  onChange={(e) => update("language", e.target.value)}
                >
                  {["English", "French", "Spanish", "Portuguese", "Yoruba", "Igbo"].map(
                    (l) => (
                      <option key={l}>{l}</option>
                    )
                  )}
                </select>
              </Field>
              <Field label="Maturity">
                <div className="flex gap-2">
                  {(["all", "teen", "kids"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => update("maturity", m)}
                      className={`h-10 px-4 rounded-md border text-sm font-medium capitalize transition ${
                        settings.maturity === m
                          ? "bg-accent border-accent text-accent-foreground"
                          : "bg-surface border-border hover:bg-elevated"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </Field>
            </Card>
          )}

          {active === "billing" && (
            <Card title="Billing" subtitle="Your subscription plan.">
              <div className="grid gap-3 sm:grid-cols-3">
                {(
                  [
                    { id: "essential", name: "Essential", price: "$5.99", features: ["HD", "1 device", "Basic library"] },
                    { id: "premium", name: "Premium", price: "$12.99", features: ["4K UHD", "4 devices", "Full library", "Live TV"] },
                    { id: "family", name: "Family", price: "$18.99", features: ["4K UHD", "6 profiles", "Full library", "Kids mode"] },
                  ] as const
                ).map((p) => {
                  const on = settings.plan === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => update("plan", p.id)}
                      className={`text-left rounded-xl border p-4 transition ${
                        on
                          ? "border-accent bg-accent/10"
                          : "border-border bg-surface hover:border-accent/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{p.name}</div>
                        {on && (
                          <span className="text-[10px] uppercase tracking-widest text-accent font-bold">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-2xl font-bold">
                        {p.price}
                        <span className="text-sm text-[color:var(--muted-foreground)] font-normal">
                          /mo
                        </span>
                      </div>
                      <ul className="mt-3 space-y-1.5 text-sm text-[color:var(--secondary-foreground)]">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-center gap-1.5">
                            <Check className="size-3.5 text-accent" /> {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 rounded-xl border border-border bg-surface p-4 text-sm">
                <div className="font-medium">Next payment</div>
                <div className="text-[color:var(--muted-foreground)] mt-1">
                  {settings.plan === "essential" ? "$5.99" : settings.plan === "premium" ? "$12.99" : "$18.99"} on {new Date(Date.now() + 12 * 24 * 3600 * 1000).toDateString()}
                </div>
              </div>
            </Card>
          )}

          {active === "security" && (
            <Card title="Security" subtitle="Passwords and authentication.">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Current password">
                  <input
                    type="password"
                    className={inputClass}
                    value={pw.current}
                    onChange={(e) => setPw({ ...pw, current: e.target.value })}
                  />
                </Field>
                <Field label="New password">
                  <input
                    type="password"
                    className={inputClass}
                    value={pw.next}
                    onChange={(e) => setPw({ ...pw, next: e.target.value })}
                  />
                </Field>
                <Field label="Confirm new password">
                  <input
                    type="password"
                    className={inputClass}
                    value={pw.confirm}
                    onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                  />
                </Field>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (!pw.current || !pw.next) return toast.error("Fill both fields");
                    if (pw.next !== pw.confirm) return toast.error("Passwords do not match");
                    setPw({ current: "", next: "", confirm: "" });
                    toast.success("Password updated");
                  }}
                  className="h-10 px-5 rounded-md bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition"
                >
                  Update password
                </button>
              </div>
              <MfaPanel />
              <LoginHistoryPanel />
            </Card>
          )}


          {active === "privacy" && (
            <Card title="Privacy" subtitle="Control your data and account.">
              <Toggle
                label="Personalised recommendations"
                description="Use viewing history to power your rows."
                value={true}
                onChange={() => toast.success("Preference updated")}
              />
              <div className="pt-2 flex gap-2">
                <button className="h-10 px-4 rounded-md bg-surface border border-border text-sm hover:bg-elevated transition">
                  Download my data
                </button>
              </div>
              <div className="mt-6 rounded-xl border border-primary/40 bg-primary/5 p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="size-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold">Delete account</div>
                    <p className="text-sm text-[color:var(--secondary-foreground)] mt-1">
                      Permanent, after a 30-day grace period. To confirm, type <span className="font-mono text-primary">DELETE</span> below.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <input
                        className={inputClass + " max-w-[220px]"}
                        placeholder="Type DELETE to confirm"
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                      />
                      <button
                        disabled={deleteConfirm !== "DELETE"}
                        onClick={() => toast.success("Deletion scheduled — you have 30 days to cancel.")}
                        className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition"
                      >
                        Delete my account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

const inputClass =
  "w-full h-10 px-3 rounded-md bg-surface border border-border text-sm outline-none focus:border-accent transition";

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-elevated/40 p-6">
      <div className="mb-5">
        <div className="text-lg font-semibold">{title}</div>
        {subtitle && (
          <div className="text-sm text-[color:var(--muted-foreground)] mt-0.5">
            {subtitle}
          </div>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <div className="text-xs uppercase tracking-widest text-[color:var(--muted-foreground)] mb-1.5">
        {label}
      </div>
      {children}
    </label>
  );
}

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-[color:var(--muted-foreground)] mt-0.5">
          {description}
        </div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition shrink-0 ${
          value ? "bg-accent" : "bg-surface border border-border"
        }`}
        aria-pressed={value}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white transition ${
            value ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
