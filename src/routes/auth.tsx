import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { useKingsChatLogin } from "@/hooks/use-kingschat-login";
import logoIcon from "@/assets/lettflix-icon.png.asset.json";

const searchSchema = z.object({
  redirect: z.string().optional(),
  mode: z.enum(["signin", "signup"]).optional(),
  kingschat_error: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { property: "og:title", content: "Sign in \u2014 Lettflix" },
      { property: "og:description", content: "Sign in or create your Lettflix account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Sign in — Lettflix" },
      { name: "description", content: "Sign in or create your Lettflix account." },
    ],
  }),
  component: AuthPage,
});

type AccountType = "user" | "creator";

function AuthPage() {
  const { redirect, mode: initialMode, kingschat_error: kingschatError } = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode ?? "signin");
  const [accountType, setAccountType] = useState<AccountType>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingModal, setPendingModal] = useState(false);

  const {
    startLogin: startKingsChat,
    loading: kcLoading,
    waiting: kcWaiting,
    error: kcError,
  } = useKingsChatLogin((returnPath) => {
    toast.success("Signed in with KingsChat");
    navigate({ to: (returnPath as "/") ?? "/", replace: true });
  });

  useEffect(() => {
    if (kingschatError) toast.error("KingsChat sign-in failed", { description: kingschatError });
  }, [kingschatError]);

  useEffect(() => {
    if (kcError) toast.error("KingsChat sign-in failed", { description: kcError });
  }, [kcError]);


  useEffect(() => {
    if (!loading && user && !pendingModal) {
      navigate({ to: (redirect as "/admin") ?? "/", replace: true });
    }
  }, [user, loading, redirect, navigate, pendingModal]);

  async function recordLogin(userId: string, success: boolean, reason?: string) {
    try {
      await supabase.from("login_history").insert({
        user_id: userId,
        success,
        event: success ? "sign_in" : (reason ?? "failed_sign_in"),
        provider: "password",
        user_agent: navigator.userAgent,
      });
      if (success) {
        await supabase.from("profiles").update({ last_sign_in_at: new Date().toISOString() }).eq("id", userId);
      }
    } catch { /* non-blocking */ }
  }

  async function submitCreatorApplication(userId: string) {
    const { error } = await supabase.from("creator_applications").insert({
      user_id: userId,
    });
    if (error) throw error;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signup" && password.length < 12) {
      toast.error("Password must be at least 12 characters");
      return;
    }
    if (mode === "signup" && !displayName.trim()) {
      toast.error("Display name is required");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const name = displayName.trim();
        const handle = "@" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const meta = { display_name: name, handle };
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: meta,
          },
        });
        if (error) throw error;
        if (data.user) {
          await recordLogin(data.user.id, true);
          if (accountType === "creator") {
            try {
              await submitCreatorApplication(data.user.id);
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Could not submit creator application";
              toast.error(msg);
            }
            setPendingModal(true);
            return;
          }
        }
        toast.success("Account created", { description: "Check your email to verify your address." });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) await recordLogin(data.user.id, true);
        toast.success("Signed in");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function onOAuth(provider: "google" | "apple") {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message ?? `${provider} sign-in failed`);
      setBusy(false);
    }
  }

  function onKingsChat() {
    const next = typeof redirect === "string" && redirect.startsWith("/") ? redirect : "/";
    void startKingsChat(next);
  }


  const isCreatorSignup = mode === "signup" && accountType === "creator";

  return (
    <div className="min-h-screen grid place-items-center px-4 py-16 bg-[radial-gradient(ellipse_at_top,rgba(156,21,51,0.15),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(30,94,255,0.12),transparent_55%)]">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2.5 justify-center mb-8">
          <img src={logoIcon.url} alt="Lettflix" className="size-10" />
          <span className="font-display font-extrabold tracking-tight text-2xl">
            LETT<span className="text-primary">FLIX</span>
          </span>
        </Link>

        <div className="rounded-2xl border border-border bg-surface/90 backdrop-blur-xl p-8 shadow-2xl">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-[color:var(--muted-foreground)] hover:text-foreground transition mb-4">
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <div className="flex gap-1 p-1 bg-elevated rounded-lg mb-6">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 h-9 text-sm rounded-md font-medium transition ${
                  mode === m ? "bg-background text-foreground shadow" : "text-[color:var(--muted-foreground)]"
                }`}
              >
                {m === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {mode === "signup" && (
            <div className="mb-5">
              <div className="text-xs font-medium text-[color:var(--muted-foreground)] mb-2">I'm signing up as</div>
              <div className="grid grid-cols-2 gap-2">
                {(["user", "creator"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAccountType(t)}
                    className={`h-10 rounded-md text-sm font-medium border transition ${
                      accountType === t
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-elevated text-[color:var(--muted-foreground)] hover:text-foreground"
                    }`}
                  >
                    {t === "user" ? "Viewer" : "Creator"}
                  </button>
                ))}
              </div>
              {isCreatorSignup && (
                <p className="text-[11px] text-[color:var(--muted-foreground)] mt-2">
                  Creator accounts require admin approval. You can start watching immediately after signup.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onOAuth("google")}
              disabled={busy}
              className="w-full h-11 rounded-md border border-border bg-elevated hover:bg-elevated/70 transition flex items-center justify-center gap-2.5 text-sm font-medium disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="size-4">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => onOAuth("apple")}
              disabled={busy}
              className="w-full h-11 rounded-md border border-border bg-white text-black hover:bg-white/90 transition flex items-center justify-center gap-2.5 text-sm font-medium disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
                <path d="M17.05 12.04c-.03-2.79 2.28-4.13 2.38-4.2-1.3-1.9-3.32-2.16-4.04-2.19-1.72-.17-3.36 1.01-4.23 1.01-.88 0-2.22-.99-3.65-.96-1.88.03-3.61 1.09-4.58 2.77-1.95 3.38-.5 8.38 1.4 11.13.93 1.34 2.03 2.85 3.47 2.8 1.4-.06 1.93-.9 3.62-.9 1.68 0 2.16.9 3.63.87 1.5-.03 2.45-1.37 3.36-2.72 1.06-1.56 1.5-3.07 1.52-3.15-.03-.01-2.91-1.12-2.94-4.46zM14.28 3.9c.77-.94 1.29-2.23 1.15-3.53-1.11.05-2.46.74-3.26 1.67-.71.83-1.34 2.16-1.17 3.42 1.24.1 2.51-.63 3.28-1.56z" />
              </svg>
              Continue with Apple
            </button>
            <button
              type="button"
              onClick={onKingsChat}
              disabled={busy || kcLoading || kcWaiting}
              className="group relative w-full h-11 rounded-md border border-border bg-gradient-to-r from-[#0b3d91] to-[#1e5eff] text-white hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2.5 text-sm font-semibold disabled:opacity-50 disabled:hover:scale-100 overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              {kcLoading || kcWaiting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
                  <path d="M4 4h3v6.5L13.2 4H17l-6.4 6.7L18 20h-3.7l-5.4-7.1L7 14.7V20H4z" />
                </svg>
              )}
              <span className="relative">
                {kcWaiting
                  ? "Waiting for KingsChat…"
                  : kcLoading
                    ? "Connecting…"
                    : "Continue with KingsChat"}
              </span>
            </button>

          </div>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-[color:var(--muted-foreground)]">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signup" && (
              <input
                type="text"
                required
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full h-11 px-3 rounded-md bg-elevated border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            )}
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-3 rounded-md bg-elevated border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              type="password"
              required
              minLength={mode === "signup" ? 12 : 8}
              placeholder={mode === "signup" ? "Password (min 12 characters)" : "Password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-3 rounded-md bg-elevated border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />


            <button
              type="submit"
              disabled={busy}
              className="w-full h-11 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              {mode === "signin"
                ? "Sign In"
                : isCreatorSignup
                  ? "Apply as Creator"
                  : "Create Account"}
            </button>
          </form>

          <p className="text-xs text-[color:var(--muted-foreground)] text-center mt-6">
            By continuing you agree to Lettflix's Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>

      {pendingModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-2xl text-center">
            <div className="mx-auto size-14 rounded-full bg-primary/15 grid place-items-center mb-4">
              <CheckCircle2 className="size-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Creator application submitted</h2>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-2">
              Your creator account is pending admin approval. In the meantime, you can sign in and enjoy Lettflix as a viewer with the same email and password. Once approved, you'll be prompted to create your first channel.
            </p>
            <button
              onClick={() => {
                setPendingModal(false);
                navigate({ to: "/", replace: true });
              }}
              className="mt-6 w-full h-11 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm"
            >
              Continue to Lettflix
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
