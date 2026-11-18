import { expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { recordSquadWebhook } from "./ppv-webhook.server";

it("acknowledges completed duplicate webhook events but retries unfinished ones", async () => {
  const single = vi.fn().mockResolvedValue({ data: { processed_at: "2026-11-18T09:00:00Z" }, error: null });
  const chain = { eq: vi.fn(), single };
  chain.eq.mockReturnValue(chain);
  const client = { from: () => ({ insert: async () => ({ error: { code: "23505" } }), select: () => chain }) } as unknown as SupabaseClient<Database>;
  expect(await recordSquadWebhook(client, "LF-1", "charge_successful", "{}")).toBe(true);
  single.mockResolvedValue({ data: { processed_at: null }, error: null });
  expect(await recordSquadWebhook(client, "LF-1", "charge_successful", "{}")).toBe(false);
});