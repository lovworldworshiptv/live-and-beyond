import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { featureForPath, isFeatureEnabled, useFeatureFlags } from "@/lib/feature-flags";
import { useAuth } from "@/hooks/use-auth";

/** Blocks direct visits to sections an admin has switched off. Admins keep access to preview. */
export function FeatureGate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { flags } = useFeatureFlags();
  const { isAdmin } = useAuth();
  const key = featureForPath(pathname);
  if (!key || isFeatureEnabled(flags, key) || isAdmin) return <>{children}</>;
  return (
    <main className="min-h-[70dvh] grid place-items-center px-6 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-semibold">Temporarily unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">This part of Lettflix is switched off right now. Please check back later.</p>
        <Link to="/" className="mt-6 inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground">Back to home</Link>
      </div>
    </main>
  );
}
