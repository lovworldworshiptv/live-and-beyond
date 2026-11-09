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
    let currentUserId: string | undefined;
    async function applySession(next: Session | null) {
      if (disposed) return;
      // Refresh tokens without replacing the user or unmounting their workspace.
      if (next?.user && next.user.id === currentUserId) {
        setSession(next);
        return;
      }
      currentUserId = next?.user.id;
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
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      observedAuthEvent = true;
      // Do not make Auth API requests inside its locked event callback.
      setTimeout(() => {
        if (event === "USER_UPDATED") currentUserId = undefined;
        if (!disposed) void applySession(next);
      }, 0);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (!disposed && !observedAuthEvent) void applySession(data.session);
    });
    return () => { disposed = true; generation++; sub.subscription.unsubscribe(); };
  }, []);

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
