import { expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { checkPpvSession, enforcePpvLimit } from "./ppv-security.server";

it("fails closed on exhausted payment limits and database errors", async () => {
  const rpc = vi.fn().mockResolvedValue({ data: false, error: null });
  const client = { rpc } as unknown as SupabaseClient<Database>;
  await expect(enforcePpvLimit(client, "buyer", "checkout")).rejects.toThrow("Too many");
  expect(rpc).toHaveBeenCalledWith("consume_ppv_request", { _user_id: "buyer", _action: "checkout" });
  rpc.mockResolvedValue({ data: true, error: { message: "offline" } });
  await expect(enforcePpvLimit(client, "buyer", "confirm")).rejects.toThrow();
});
it("denies ended sessions instead of silently taking back playback", async () => {
  const rpc = vi.fn().mockResolvedValue({ data: false, error: null });
  const client = { rpc } as unknown as SupabaseClient<Database>;
  await expect(checkPpvSession(client, { orderId: "order", userId: "buyer", sessionId: "old", country: "NG", start: false })).rejects.toThrow("another device");
  expect(rpc).toHaveBeenCalledWith("acquire_ppv_session", { _order_id: "order", _user_id: "buyer", _session_id: "old", _country: "NG", _start: false });
});