import type { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

const STORAGE_KEY = "lettflix-query-cache";
const MAX_AGE = 1000 * 60 * 60 * 24; // keep cached data for 24h between visits

/** Browser-only: saves fetched data so return visits render instantly, then refresh in background. */
export function setupQueryPersistence(queryClient: QueryClient) {
  if (typeof window === "undefined") return;
  try {
    const persister = createSyncStoragePersister({ storage: window.localStorage, key: STORAGE_KEY, throttleTime: 2000 });
    persistQueryClient({
      queryClient,
      persister,
      maxAge: MAX_AGE,
      buster: import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "v1",
      dehydrateOptions: { shouldDehydrateQuery: (q) => q.state.status === "success" },
    });
    // Never leave one account's cached data on a shared device after sign-out.
    void import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") {
          window.localStorage.removeItem(STORAGE_KEY);
          queryClient.clear();
        }
      });
    });
  } catch {
    /* storage unavailable (private mode) — app works without persistence */
  }
}
