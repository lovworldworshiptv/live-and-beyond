import { expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { reconcilePpvOrders } from "./ppv-reconcile.server";
it("checks only pending orders older than five minutes in a bounded batch", async () => {
  const chain = { eq: vi.fn(), lt: vi.fn(), gt: vi.fn(), order: vi.fn(), limit: vi.fn().mockResolvedValue({ data: [], error: null }) };
  chain.eq.mockReturnValue(chain); chain.lt.mockReturnValue(chain); chain.gt.mockReturnValue(chain); chain.order.mockReturnValue(chain);
  const client = { from: () => ({ select: () => chain }) } as unknown as SupabaseClient<Database>;
  expect(await reconcilePpvOrders(client, {})).toEqual({ checked: 0, confirmed: 0, deferred: 0 });
  expect(chain.eq).toHaveBeenCalledWith("payment_state", "pending");
  expect(chain.limit).toHaveBeenCalledWith(25);
  const cutoff = Date.parse(chain.lt.mock.calls[0]?.[1]);
  expect(Date.now() - cutoff).toBeGreaterThanOrEqual(300000);
  expect(Date.now() - cutoff).toBeLessThan(301000);
});