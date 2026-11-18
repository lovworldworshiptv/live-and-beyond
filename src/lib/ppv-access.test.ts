import { afterEach, describe, expect, it, vi } from "vitest";
import { authorizePpvPlayback, signPremiumStream, type PlaybackOrder } from "./ppv-access.server";

afterEach(() => vi.unstubAllGlobals());

function fixture() {
  const now = Date.now();
  const order: PlaybackOrder = { id: "order", user_id: "buyer", provider: "squad", reference: "LF-PAID", sandbox: true, amount_minor: 250005, currency: "NGN", status: "paid", verified_at: new Date(now - 1000).toISOString(), refunded_at: null, access_starts_at: new Date(now - 1000).toISOString(), access_expires_at: new Date(now + 3600000).toISOString() };
  const gate = { stream_uid: "a".repeat(32), sandbox: true, access_expires_at: order.access_expires_at };
  const deps = { verify: vi.fn().mockResolvedValue({ ok: true, reference: "LF-PAID", amountKobo: 250005, currency: "NGN" }), gate: vi.fn().mockResolvedValue(gate), sign: vi.fn().mockResolvedValue("header.payload.signature") };
  return { order, gate, deps };
}

describe("PPV server playback access", () => {
  it("grants signed playback only after exact verified Squad payment", async () => {
    const { order, deps } = fixture();
    const result = await authorizePpvPlayback(order, "buyer", deps);
    expect(deps.verify).toHaveBeenCalledWith("LF-PAID");
    expect(deps.sign).toHaveBeenCalledOnce();
    expect(result.playbackUrl).toBe("https://videodelivery.net/header.payload.signature/manifest/video.m3u8");
    expect(Date.parse(result.expiresAt) - Date.now()).toBeLessThanOrEqual(60000);
  });
  it("denies unpaid orders without verifying or signing", async () => {
    const { order, deps } = fixture();
    await expect(authorizePpvPlayback({ ...order, status: "unpaid" }, "buyer", deps)).rejects.toThrow();
    expect(deps.verify).not.toHaveBeenCalled(); expect(deps.sign).not.toHaveBeenCalled();
  });
  it("denies refunded orders even if Squad still reports success", async () => {
    const { order, deps } = fixture();
    await expect(authorizePpvPlayback({ ...order, status: "refunded", refunded_at: new Date().toISOString() }, "buyer", deps)).rejects.toThrow();
    expect(deps.sign).not.toHaveBeenCalled();
  });
  it("denies another buyer's order", async () => {
    const { order, deps } = fixture();
    await expect(authorizePpvPlayback(order, "other-buyer", deps)).rejects.toThrow();
    expect(deps.sign).not.toHaveBeenCalled();
  });
  it("denies paid state without recorded verification", async () => {
    const { order, deps } = fixture();
    await expect(authorizePpvPlayback({ ...order, verified_at: null }, "buyer", deps)).rejects.toThrow();
    expect(deps.sign).not.toHaveBeenCalled();
  });
  it.each([{ ok: false }, { reference: "OTHER" }, { amountKobo: 250004 }, { currency: "USD" }])("denies provider failure or mismatched payment %j", async (change) => {
    const { order, deps } = fixture();
    deps.verify.mockResolvedValue({ ok: true, reference: order.reference, amountKobo: order.amount_minor, currency: "NGN", ...change });
    await expect(authorizePpvPlayback(order, "buyer", deps)).rejects.toThrow(); expect(deps.sign).not.toHaveBeenCalled();
  });
  it("fails closed when Squad cannot be reached", async () => {
    const { order, deps } = fixture(); deps.verify.mockRejectedValue(new Error("Offline"));
    await expect(authorizePpvPlayback(order, "buyer", deps)).rejects.toThrow(); expect(deps.sign).not.toHaveBeenCalled();
  });
  it("denies an expired purchase", async () => {
    const { order, deps } = fixture();
    await expect(authorizePpvPlayback({ ...order, access_expires_at: new Date(Date.now() - 1000).toISOString() }, "buyer", deps)).rejects.toThrow(); expect(deps.sign).not.toHaveBeenCalled();
  });
  it("denies disabled or unapproved events via durable gate", async () => {
    const { order, deps } = fixture(); deps.gate.mockResolvedValue(null);
    await expect(authorizePpvPlayback(order, "buyer", deps)).rejects.toThrow(); expect(deps.sign).not.toHaveBeenCalled();
  });
  it("denies sandbox orders for live assets", async () => {
    const { order, gate, deps } = fixture(); deps.gate.mockResolvedValue({ ...gate, sandbox: false });
    await expect(authorizePpvPlayback(order, "buyer", deps)).rejects.toThrow(); expect(deps.sign).not.toHaveBeenCalled();
  });
  it("refund during provider verification prevents signing", async () => {
    const { order, gate, deps } = fixture(); deps.gate.mockResolvedValueOnce(gate).mockResolvedValue(null);
    await expect(authorizePpvPlayback(order, "buyer", deps)).rejects.toThrow(); expect(deps.sign).not.toHaveBeenCalled();
  });
  it("refund during signing prevents returning the credential", async () => {
    const { order, gate, deps } = fixture(); deps.gate.mockResolvedValueOnce(gate).mockResolvedValueOnce(gate).mockResolvedValue(null);
    await expect(authorizePpvPlayback(order, "buyer", deps)).rejects.toThrow("revoked");
  });
  it("refuses to issue tokens for a publicly playable video", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ success: true, result: { uid: "a".repeat(32), requireSignedURLs: false } })); vi.stubGlobal("fetch", fetcher);
    await expect(signPremiumStream({ accountId: "fixture", apiToken: "fixture" }, "a".repeat(32), 123)).rejects.toThrow("protection");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});