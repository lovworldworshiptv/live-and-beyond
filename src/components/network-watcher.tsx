import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

const RETURN_KEY = "lettflix.offline.return";

/** Sends viewers to /offline when the connection drops, and back to their page when it returns. */
export function NetworkWatcher() {
  const router = useRouter();
  useEffect(() => {
    // Preload the offline page so it can render without a network.
    void router.preloadRoute({ to: "/offline" }).catch(() => {});
    const current = () => router.state.location.href;
    const goOffline = () => {
      if (router.state.location.pathname === "/offline") return;
      sessionStorage.setItem(RETURN_KEY, current());
      void router.navigate({ to: "/offline" });
    };
    const goOnline = () => {
      if (router.state.location.pathname !== "/offline") return;
      const back = sessionStorage.getItem(RETURN_KEY) || "/";
      sessionStorage.removeItem(RETURN_KEY);
      toast.success("You're back online");
      void router.navigate({ href: back, replace: true });
    };
    if (!navigator.onLine) goOffline();
    else goOnline();
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, [router]);
  return null;
}
