import { expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireChannelAccess } from "./channel-access.server";

it("rejects a viewer without channel management access", async () => {
  const client = { rpc: vi.fn().mockResolvedValue({ data: false, error: null }) };
  await expect(requireChannelAccess(client as unknown as SupabaseClient<Database>, "viewer-id", "channel-id")).rejects.toThrow("do not have access");
});
it("allows owner, team or admin access confirmed by the existing permission function", async () => {
  const client = { rpc: vi.fn().mockResolvedValue({ data: true, error: null }) };
  await expect(requireChannelAccess(client as unknown as SupabaseClient<Database>, "manager-id", "channel-id")).resolves.toBeUndefined();
  expect(client.rpc).toHaveBeenCalledWith("can_manage_channel", { _channel_id: "channel-id", _user_id: "manager-id" });
});
it("fails closed when the permission lookup fails", async () => {
  const client = { rpc: vi.fn().mockResolvedValue({ data: true, error: new Error("Offline") }) };
  await expect(requireChannelAccess(client as unknown as SupabaseClient<Database>, "manager-id", "channel-id")).rejects.toThrow("do not have access");
});