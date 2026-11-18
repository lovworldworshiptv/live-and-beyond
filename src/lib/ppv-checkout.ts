export const PAYMENT_POLL_INTERVAL_MS = 3000;
export const PAYMENT_POLL_TIMEOUT_MS = 120000;
export const CHECKOUT_LIFETIME_MS = 30 * 60 * 1000;

export function checkoutExpired(createdAt: string, now = Date.now()) {
  return now >= Date.parse(createdAt) + CHECKOUT_LIFETIME_MS;
}

export function paymentReturnReference(search: Record<string, unknown>) {
  // Squad may append its own reference, producing duplicate keys (arrays) or "ref?reference=ref".
  for (const key of ["reference", "transaction_ref", "TransactionRef", "ref", "trans_ref"]) {
    const raw = search[key];
    for (const item of Array.isArray(raw) ? raw : [raw]) {
      const value = typeof item === "string" ? item.split("?")[0].split("&")[0].trim() : undefined;
      if (value && /^[A-Za-z0-9_-]{1,128}$/.test(value)) return value;
    }
  }
  return undefined;
}

export function canPollPayment(startedAt: number, now: number) {
  return now - startedAt < PAYMENT_POLL_TIMEOUT_MS;
}