import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Loader2, CheckCircle2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useKingsChatLogin } from "@/hooks/use-kingschat-login";
import logoIcon from "@/assets/lettflix-icon.png.asset.json";
import kingschatLogo from "@/assets/kingschat-logo.svg.asset.json";
import authCinema from "@/assets/auth-cinema.jpg";
import { Button } from "@/components/ui/button";

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
  const [showPassword, setShowPassword] = useState(false);
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


  function onKingsChat() {
    const next = typeof redirect === "string" && redirect.startsWith("/") ? redirect : "/";
    void startKingsChat(next);
  }


  const isCreatorSignup = mode === "signup" && accountType === "creator";

  return (
    <div className="auth-stage relative isolate min-h-svh flex flex-col overflow-hidden px-6 py-6 sm:px-8 sm:py-8">
      <div className="auth-scenery pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <img src={authCinema} alt="" width={1920} height={1088} fetchPriority="high" className="auth-camera h-full w-full object-cover" />
        <div className="auth-shade absolute inset-0" />
        <div className="auth-projector absolute inset-0" />
        <div className="auth-grain absolute inset-0" />
      </div>
      <header className="relative z-10 flex items-center justify-between w-full max-w-6xl mx-auto">
        <Link to="/" className="flex items-center gap-2" aria-label="Lettflix home">
          <img src={logoIcon.url} alt="" className="size-9 object-contain" />
          <span className="font-display font-extrabold text-2xl">
            LETT<span className="text-primary">FLIX</span>
          </span>
        </Link>
        <Button asChild variant="ghost" className="h-11 text-secondary-foreground">
          <Link to="/">
            <ArrowLeft aria-hidden="true" />
            Home
          </Link>
        </Button>
      </header>
      <main className="auth-entrance w-full max-w-[400px] mx-auto flex-1 flex flex-col justify-center py-8 sm:py-10">
        <div className="auth-form">
          <div className="text-center mb-7">
            <img src={logoIcon.url} alt="" className="size-16 object-contain mx-auto mb-4" />
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">{mode === "signin" ? "Welcome to Lettflix" : "Join Lettflix"}</h1>
            <p className="text-sm text-secondary-foreground">{mode === "signin" ? "Sign in. Tune in. Make it yours." : "Your next favourite starts here."}</p>
          </div>
          <div className="flex gap-4 border-b border-input mb-6">
            {(["signin", "signup"] as const).map((m) => (
              <Button
                variant="ghost"
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={`auth-mode flex-1 h-11 text-sm rounded-none font-semibold border-b-2 transition ${
                  mode === m ? "border-primary text-foreground" : "border-transparent text-secondary-foreground"
                }`}
              >
                {m === "signin" ? "Sign In" : "Sign Up"}
              </Button>
            ))}
          </div>

          {mode === "signup" && (
            <div className="mb-5">
              <div className="text-xs font-medium text-[color:var(--muted-foreground)] mb-2">I'm signing up as</div>
              <div className="grid grid-cols-2 gap-2">
                {(["user", "creator"] as const).map((t) => (
                  <Button
                    variant="ghost"
                    key={t}
                    type="button"
                    aria-pressed={accountType === t}
                    onClick={() => setAccountType(t)}
                    className={`h-11 rounded-md text-sm font-medium border transition ${
                      accountType === t
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-elevated text-[color:var(--muted-foreground)] hover:text-foreground"
                    }`}
                  >
                    {t === "user" ? "Viewer" : "Creator"}
                  </Button>
                ))}
              </div>
              {isCreatorSignup && (
                <p className="text-xs text-secondary-foreground mt-2">
                  Creator accounts require admin approval. You can start watching immediately after signup.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onKingsChat}
              disabled={busy || kcLoading || kcWaiting}
              className="auth-kingschat relative w-full h-12 rounded-lg border border-input text-foreground transition-all duration-200 gap-3 text-sm font-semibold overflow-hidden"
            >
              {kcLoading || kcWaiting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <span className="relative grid place-items-center size-7 rounded-full bg-foreground shadow-sm">
                  <img src={kingschatLogo.url} alt="" aria-hidden className="size-5 object-contain" draggable={false} />
                </span>
              )}
              <span className="relative">
                {kcWaiting
                  ? "Waiting for KingsChat…"
                  : kcLoading
                    ? "Connecting…"
                    : "Continue with KingsChat"}
              </span>
            </Button>

          </div>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-secondary-foreground">or continue with email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
              <label htmlFor="auth-name" className="block text-sm font-medium">Display name</label>
              <input
                id="auth-name"
                type="text"
                required
                placeholder="Display name"
                aria-label="Display name"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full h-12 px-4 rounded-lg bg-surface border border-input text-base focus:outline-none focus:ring-2 focus:ring-ring"
              />
              </div>
            )}
            <div className="space-y-2">
            <label htmlFor="auth-email" className="block text-sm font-medium">Email address</label>
            <input
              id="auth-email"
              type="email"
              required
              placeholder="name@example.com"
              aria-label="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 rounded-lg bg-surface border border-input text-base focus:outline-none focus:ring-2 focus:ring-ring"
            />
            </div>
            <div className="space-y-2">
            <label htmlFor="auth-password" className="block text-sm font-medium">Password</label>
            <div className="relative">
            <input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              required
              minLength={mode === "signup" ? 12 : 8}
              placeholder={mode === "signup" ? "Password (min 12 characters)" : "Password"}
              aria-label="Password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 pl-4 pr-14 rounded-lg bg-surface border border-input text-base focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-0.5 size-11 text-secondary-foreground" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} title={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </Button>
            </div>
            </div>

            <Button
              type="submit"
              disabled={busy}
              className="w-full h-12 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base transition gap-2 disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              {mode === "signin"
                ? "Sign In"
                : isCreatorSignup
                  ? "Apply as Creator"
                  : "Create Account"}
            </Button>
          </form>

          <p className="text-xs leading-5 text-secondary-foreground text-center mt-6">
            By continuing you agree to Lettflix's <Link to="/terms" className="text-secondary-foreground hover:text-foreground underline underline-offset-2">Terms of Service</Link> and <Link to="/privacy" className="text-secondary-foreground hover:text-foreground underline underline-offset-2">Privacy Policy</Link>.
          </p>
        </div>
      </main>

      {pendingModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/90 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-2xl text-center">
            <div className="mx-auto size-14 rounded-full bg-primary/15 grid place-items-center mb-4">
              <CheckCircle2 className="size-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Creator application submitted</h2>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-2">
              Your creator account is pending admin approval. In the meantime, you can sign in and enjoy Lettflix as a viewer with the same email and password. Once approved, you'll be prompted to create your first channel.
            </p>
            <Button
              onClick={() => {
                setPendingModal(false);
                navigate({ to: "/", replace: true });
              }}
              className="mt-6 w-full h-11 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm"
            >
              Continue to Lettflix
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
