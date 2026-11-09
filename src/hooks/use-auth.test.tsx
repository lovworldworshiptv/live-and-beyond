import { act, create } from "react-test-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@supabase/supabase-js";

const mocks = vi.hoisted(() => ({
  listener: undefined as ((event: string, session: unknown) => void) | undefined,
  signOut: vi.fn().mockResolvedValue({}),
  roles: vi.fn().mockResolvedValue({ data: [{ role: "creator" }], error: null }),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  auth: {
    getSession: async () => ({ data: { session: { user: { id: "creator" }, access_token: "initial" } } }),
    onAuthStateChange: (listener: typeof mocks.listener) => { mocks.listener = listener; return { data: { sub: null, subscription: { unsubscribe: vi.fn() } } }; },
    signOut: mocks.signOut,
  },
  from: () => ({ select: () => ({ eq: mocks.roles }) }),
} }));
import { AuthProvider, useAuth } from "./use-auth";

vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); vi.unstubAllGlobals(); vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); });

describe("session continuity", () => {
  it("does not sign out a creator after 31 minutes of inactivity", async () => {
    vi.useFakeTimers();
    // Supplies the browser events used by the previous inactivity timer.
    vi.stubGlobal("window", { addEventListener: vi.fn(), removeEventListener: vi.fn(), location: { href: "/studio" } });
    let current: ReturnType<typeof useAuth> | undefined;
    function Probe() { current = useAuth(); return null; }
    let tree: ReturnType<typeof create> | undefined;
    await act(async () => { tree = create(<AuthProvider><Probe /></AuthProvider>); });
    await act(async () => { await vi.advanceTimersByTimeAsync(31 * 60 * 1000); });
    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(current?.user?.id).toBe("creator");
    await act(async () => tree?.unmount());
  });
  it("keeps the creator workspace mounted during same-user token refresh", async () => {
    vi.useFakeTimers();
    let current: ReturnType<typeof useAuth> | undefined;
    function Probe() { current = useAuth(); return null; }
    let tree: ReturnType<typeof create> | undefined;
    await act(async () => { tree = create(<AuthProvider><Probe /></AuthProvider>); });
    const originalUser = current?.user;
    await act(async () => {
      mocks.listener?.("TOKEN_REFRESHED", { user: { id: "creator" }, access_token: "refreshed" } as Session);
      await vi.runOnlyPendingTimersAsync();
    });
    expect(current?.loading).toBe(false);
    expect(current?.isCreator).toBe(true);
    expect(current?.user).toBe(originalUser);
    expect(current?.session?.access_token).toBe("refreshed");
    expect(mocks.roles).toHaveBeenCalledTimes(1);
    await act(async () => tree?.unmount());
  });
});