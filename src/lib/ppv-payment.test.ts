import { afterEach, describe, expect, it, vi } from "vitest";
import { confirmSquadOrder } from "./ppv-payment.server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

afterEach(() => vi.unstubAllGlobals());
const order: Database["public"]["Tables"]["ppv_orders"]["Row"] = { id: "order", event_id: "event", user_id: "buyer", provider: "squad", reference: "LF-TEST", sandbox: true, amount_minor: 250005, currency: "NGN", status: "unpaid", verified_at: null, refunded_at: null, access_starts_at: "2026-11-18T00:00:00Z", access_expires_at: "2026-11-19T00:00:00Z", created_at: "2026-11-18T00:00:00Z", commission_bps: 2500, checkout_url: null, checkout_claimed_at: null, checkout_expires_at: "2026-11-18T00:30:00Z", payment_state: "pending" };
function setup(change = {}) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ success: true, data: { transaction_status: "Success", transaction_amount: 250005, currency: "NGN", transaction_ref: "LF-TEST", ...change } })));
  const rpc = vi.fn().mockResolvedValue({ data: "paid", error: null });
  const neq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn().mockReturnValue({ eq: () => ({ neq }) });
  const client = { rpc, from: () => ({ update }) } as unknown as SupabaseClient<Database>;
  return { rpc, update, client };
}
describe("Squad PPV confirmation", () => {
  it("settles only API verified exact amount, reference and environment", async () => {
    const { client, rpc } = setup();
    expect(await confirmSquadOrder(client, order, "fixture")).toEqual({ status: "paid" });
    expect(rpc).toHaveBeenCalledWith("confirm_ppv_payment", { _order_id: "order", _reference: "LF-TEST", _amount: 250005, _currency: "NGN", _sandbox: true });
  });
  it("does not settle an unpaid Squad transaction", async () => {
    const { client, rpc } = setup({ transaction_status: "Pending" });
    expect(await confirmSquadOrder(client, order, "fixture")).toEqual({ status: "unpaid" });
    expect(rpc).not.toHaveBeenCalled();
  });
  it.each([{ transaction_amount: 250004 }, { currency: "USD" }, { transaction_ref: "OTHER" }])("rejects mismatched provider confirmation %j", async change => {
    const { client, rpc } = setup(change);
    await expect(confirmSquadOrder(client, order, "fixture")).rejects.toThrow("mismatch");
    expect(rpc).toHaveBeenCalledWith("review_ppv_payment", { _order_id: "order" });
    expect(rpc).not.toHaveBeenCalledWith("confirm_ppv_payment", expect.anything());
  });
  it("never restores an already refunded order", async () => {
    const { client, rpc } = setup();
    expect(await confirmSquadOrder(client, { ...order, status: "refunded" }, "fixture")).toEqual({ status: "refunded" }); expect(rpc).not.toHaveBeenCalled();
  });
  it("persists provider-reported refund before granting access", async () => {
    const { client, rpc, update } = setup({ transaction_status: "Refunded" });
    expect(await confirmSquadOrder(client, order, "fixture")).toEqual({ status: "refunded" });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: "refunded" })); expect(rpc).not.toHaveBeenCalled();
  });
});