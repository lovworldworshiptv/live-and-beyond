import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

export function CreatorApprovalWatcher() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [app, setApp] = useState<{ id: string; channel_name: string } | null>(null);

  useEffect(() => {
    if (!user) { setApp(null); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("creator_applications")
        .select("id, channel_name, status, onboarded_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data && data.status === "approved" && !data.onboarded_at) {
        setApp({ id: data.id, channel_name: data.channel_name });
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!app) return null;

  async function complete() {
    if (!app) return;
    await supabase
      .from("creator_applications")
      .update({ onboarded_at: new Date().toISOString() })
      .eq("id", app.id);
    setApp(null);
    navigate({ to: "/portal" });
  }

  async function dismiss() {
    if (!app) return;
    await supabase
      .from("creator_applications")
      .update({ onboarded_at: new Date().toISOString() })
      .eq("id", app.id);
    setApp(null);
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-2xl text-center">
        <div className="mx-auto size-14 rounded-full bg-primary/15 grid place-items-center mb-4">
          <Sparkles className="size-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold">You're approved as a Creator 🎉</h2>
        <p className="text-sm text-[color:var(--muted-foreground)] mt-2">
          Congratulations! Your creator account for{" "}
          <span className="font-semibold text-foreground">{app.channel_name}</span> has been approved.
          Complete your channel profile to start publishing.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={dismiss}
            className="h-11 rounded-md border border-border bg-elevated hover:bg-elevated/70 text-sm font-medium"
          >
            Later
          </button>
          <button
            onClick={complete}
            className="h-11 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm"
          >
            Complete Profile
          </button>
        </div>
      </div>
    </div>
  );
}
