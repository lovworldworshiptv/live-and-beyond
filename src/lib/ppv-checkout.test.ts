import { describe, expect, it } from "vitest";
import { canPollPayment, checkoutExpired, paymentReturnReference, PAYMENT_POLL_INTERVAL_MS } from "./ppv-checkout";

describe("PPV checkout timing and return", () => {
  it("expires an unpaid checkout at exactly 30 minutes", () => {
    const start = Date.parse("2026-11-18T09:00:00Z");
    expect(checkoutExpired("2026-11-18T09:00:00Z", start + 1799999)).toBe(false);
    expect(checkoutExpired("2026-11-18T09:00:00Z", start + 1800000)).toBe(true);
  });
  it("polls every three seconds for no longer than two minutes", () => {
    expect(PAYMENT_POLL_INTERVAL_MS).toBe(3000);
    expect(canPollPayment(1000, 120999)).toBe(true);
    expect(canPollPayment(1000, 121000)).toBe(false);
  });
  it("accepts only a bounded reference, never URL status or amount as proof", () => {
    expect(paymentReturnReference({ transaction_ref: "LF-abc", status: "paid", amount: 1 })).toBe("LF-abc");
    expect(paymentReturnReference({ status: "paid", amount: 1 })).toBeUndefined();
    expect(paymentReturnReference({ reference: "x".repeat(129) })).toBeUndefined();
  });
});
import { paymentReturnReference as readRef } from "./ppv-checkout";
import { describe as d2, it as i2, expect as e2 } from "vitest";
d2("Squad return reference", () => {
  i2("accepts duplicated reference keys", () => { e2(readRef({ reference: ["LF-abc", "LF-abc"] })).toBe("LF-abc"); });
  i2("strips an appended query", () => { e2(readRef({ reference: "LF-abc?reference=LF-abc" })).toBe("LF-abc"); });
});
