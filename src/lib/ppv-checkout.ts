export const PAYMENT_POLL_INTERVAL_MS = 3000;
export const PAYMENT_POLL_TIMEOUT_MS = 120000;
export const CHECKOUT_LIFETIME_MS = 30 * 60 * 1000;

export function checkoutExpired(createdAt: string, now = Date.now()) {
  return now >= Date.parse(createdAt) + CHECKOUT_LIFETIME_MS;
}

export function paymentReturnReference(search: Record<string, unknown>) {
  const value = search.reference ?? search.transaction_ref ?? search.TransactionRef;
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value) ? value : undefined;
}

export function canPollPayment(startedAt: number, now: number) {
  return now - startedAt < PAYMENT_POLL_TIMEOUT_MS;
}