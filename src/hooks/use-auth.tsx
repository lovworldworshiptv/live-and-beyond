import { useEffect, useState, createContext, useContext, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "viewer" | "creator" | "admin";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  roles: Role[];
  isAdmin: boolean;
  isCreator: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let disposed = false;
    let generation = 0;
    let observedAuthEvent = false;
    async function applySession(next: Session | null) {
      const request = ++generation;
      setSession(next);
      setUser(next?.user ?? null);
      setRoles([]);
      setLoading(true);
      if (next?.user) {
        const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", next.user.id);
        if (disposed || request !== generation) return;
        setRoles(error ? [] : (data ?? []).map(r => r.role as Role));
      }
      if (!disposed && request === generation) setLoading(false);
    }
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      observedAuthEvent = true;
      // Do not make Auth API requests inside its locked event callback.
      setTimeout(() => { if (!disposed) void applySession(next); }, 0);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (!disposed && !observedAuthEvent) void applySession(data.session);
    });
    return () => { disposed = true; generation++; sub.subscription.unsubscribe(); };
  }, []);

  // Idle auto sign-out after 30 minutes of inactivity
  useEffect(() => {
    if (!session) return;
    const TIMEOUT_MS = 30 * 60 * 1000;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await supabase.auth.signOut();
        if (typeof window !== "undefined") {
          window.location.href = "/auth";
        }
      }, TIMEOUT_MS);
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [session]);


  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        roles,
        isAdmin: roles.includes("admin"),
        isCreator: roles.includes("creator") || roles.includes("admin"),
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
