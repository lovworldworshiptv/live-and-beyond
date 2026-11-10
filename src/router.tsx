import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { BrandLoader } from "./components/brand-loader";
import { setupQueryPersistence } from "./lib/query-persist";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        ...(typeof window !== "undefined" ? { gcTime: 1000 * 60 * 60 * 24 } : {}),
        refetchOnWindowFocus: false,
      },
    },
  });
  setupQueryPersistence(queryClient);

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: () => <BrandLoader variant="full" />,
    defaultPendingMs: 150,
    defaultPendingMinMs: 0,
  });

  return router;
};
