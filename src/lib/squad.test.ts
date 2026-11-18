import { afterEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { initiateSquadTransaction, validSquadSignature, verifySquadTransaction, squadSecretForEnvironment } from "./squad.server";

afterEach(() => vi.unstubAllGlobals());

describe("Squad payment preparation", () => {
  it("never sends the live credential to sandbox or sandbox credentials to live", () => {
    expect(() => squadSecretForEnvironment(true, { live: "live-fixture" })).toThrow();
    expect(squadSecretForEnvironment(true, { live: "live-fixture", sandbox: "sandbox-fixture" })).toBe("sandbox-fixture");
    expect(() => squadSecretForEnvironment(false, { live: "sandbox_sk_fixture" })).toThrow();
    expect(squadSecretForEnvironment(true, { live: "sandbox_sk_fixture" })).toBe("sandbox_sk_fixture");
  });
  it("sends exact kobo amounts without a second conversion", async () => {
    const mock = vi.fn().mockResolvedValue(Response.json({ success: true, data: { checkout_url: "https://checkout.squadco.com/test" } }));
    vi.stubGlobal("fetch", mock);
    await initiateSquadTransaction({ secret: "test-fixture", sandbox: true }, { email: "buyer@example.test", amountKobo: 250005, reference: "LF-TEST", callbackUrl: "https://lettflix.com/", customerName: "Buyer" });
    expect(mock.mock.calls[0]?.[0]).toBe("https://sandbox-api-d.squadco.com/transaction/initiate");
    expect(JSON.parse(mock.mock.calls[0]?.[1].body).amount).toBe(250005);
  });
  it("does not assume missing currency is NGN", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data: { transaction_status: "success", transaction_amount: 250005, transaction_ref: "LF-TEST" } })));
    const result = await verifySquadTransaction({ secret: "test-fixture", sandbox: true }, "LF-TEST");
    expect(result.currency).toBe("");
    expect(result.reference).toBe("LF-TEST");
    expect(result.amountKobo).toBe(250005);
  });
  it("rejects altered signed payloads", () => {
    const payload = '{"transaction_ref":"LF-TEST"}';
    const signature = createHmac("sha512", "test-fixture").update(payload).digest("hex");
    expect(validSquadSignature("test-fixture", payload, signature)).toBe(true);
    expect(validSquadSignature("test-fixture", payload + " ", signature)).toBe(false);
    expect(validSquadSignature("test-fixture", payload, "invalid")).toBe(false);
  });
});