import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ATTEMPT_KEY = "kc_oauth_attempt";

type PollResult = {
  status?: "pending" | "ready" | "failed" | "unknown";
  session?: { access_token: string; refresh_token: string };
  return_path?: string;
  error?: string;
};

async function pollAttempt(pollSecret: string): Promise<PollResult | null> {
  const res = await fetch("/api/public/kingschat/poll", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ poll_secret: pollSecret }),
  });
  if (!res.ok) return null;
  return (await res.json()) as PollResult;
}

/**
 * KingsChat sign-in via a popup window. The popup completes the OAuth exchange
 * on the server, which parks the finished session against a poll secret that
 * this hook polls until the session is ready.
 */
export function useKingsChatLogin(onSuccess?: (returnPath: string) => void) {
  const [loading, setLoading] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const unmounted = useRef(false);

  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
      window.clearTimeout(timer.current);
    };
  }, []);

  const finish = useCallback(
    async (result: PollResult, fallbackPath: string) => {
      await supabase.auth.setSession({
        access_token: result.session!.access_token,
        refresh_token: result.session!.refresh_token,
      });
      setWaiting(false);
      setLoading(false);
      onSuccess?.(result.return_path || fallbackPath || "/");
    },
    [onSuccess],
  );

  const beginPolling = useCallback(
    (pollSecret: string, returnPath: string, popup: Window | null) => {
      setWaiting(true);
      const deadline = Date.now() + 5 * 60_000;

      const tick = async () => {
        if (unmounted.current) return;
        const result = await pollAttempt(pollSecret).catch(() => null);

        if (result?.status === "ready" && result.session) {
          sessionStorage.removeItem(ATTEMPT_KEY);
          try {
            popup?.close();
          } catch {
            /* popup may already be closed */
          }
          await finish(result, returnPath);
          return;
        }

        if (result?.status === "failed" || result?.status === "unknown" || Date.now() > deadline) {
          sessionStorage.removeItem(ATTEMPT_KEY);
          try {
            popup?.close();
          } catch {
            /* popup may already be closed */
          }
          setWaiting(false);
          setLoading(false);
          setError(
            result?.status === "failed"
              ? (result.error ?? "KingsChat sign-in failed")
              : Date.now() > deadline
                ? "KingsChat sign-in timed out, please try again"
                : "KingsChat sign-in failed",
          );
          return;
        }

        timer.current = window.setTimeout(tick, 1500);
      };

      void tick();
    },
    [finish],
  );

  const startLogin = useCallback(
    async (returnPath?: string) => {
      setLoading(true);
      setError(null);

      // Open synchronously so the browser attributes the popup to the click.
      let popup: Window | null = null;
      try {
        popup = window.open("about:blank", "kingschat_login", "width=520,height=700");
      } catch {
        popup = null;
      }

      try {
        const raw = returnPath ?? `${window.location.pathname}${window.location.search}`;
        const res = await fetch("/api/public/kingschat/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ return_path: raw === "/auth" ? "/" : raw }),
        });
        const data = (await res.json()) as {
          auth_url?: string;
          poll_secret?: string;
          return_path?: string;
          error?: string;
        };
        if (!res.ok || !data.auth_url || !data.poll_secret) {
          throw new Error(data.error || "Could not start KingsChat login");
        }

        sessionStorage.setItem(
          ATTEMPT_KEY,
          JSON.stringify({ poll_secret: data.poll_secret, return_path: data.return_path }),
        );

        if (popup && !popup.closed) {
          popup.location.href = data.auth_url;
          beginPolling(data.poll_secret, data.return_path ?? "/", popup);
        } else {
          // Popup blocked — fall back to a full-page redirect.
          window.location.href = data.auth_url;
        }
      } catch (err) {
        try {
          popup?.close();
        } catch {
          /* noop */
        }
        setError(err instanceof Error ? err.message : "KingsChat login failed");
        setLoading(false);
      }
    },
    [beginPolling],
  );

  // Resume an attempt that was interrupted (redirect fallback / page reload).
  useEffect(() => {
    const raw = sessionStorage.getItem(ATTEMPT_KEY);
    if (!raw) return;
    let parsed: { poll_secret?: string; return_path?: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      sessionStorage.removeItem(ATTEMPT_KEY);
      return;
    }
    if (!parsed.poll_secret) {
      sessionStorage.removeItem(ATTEMPT_KEY);
      return;
    }
    beginPolling(parsed.poll_secret, parsed.return_path || "/", null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { startLogin, loading, waiting, error };
}
