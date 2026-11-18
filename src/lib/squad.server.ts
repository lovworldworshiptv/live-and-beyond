import { createHmac, timingSafeEqual } from "node:crypto";

export type SquadConfig = { secret: string; sandbox: boolean };
export type SquadVerification = { ok: boolean; amountKobo: number; currency: string; reference: string; status?: string };

export function squadSecretForEnvironment(sandbox: boolean, secrets: { live?: string; sandbox?: string }) {
  // Encyclovia pattern: one SQUAD_SECRET_KEY whose prefix decides the environment.
  // A sandbox_ key on the main secret serves test mode; a dedicated sandbox secret still wins.
  const secret = sandbox ? (secrets.sandbox || (secrets.live?.startsWith("sandbox_") ? secrets.live : undefined)) : secrets.live;
  if (!secret || (!sandbox && secret.startsWith("sandbox_sk_"))) throw new Error("Squad credentials unavailable for this environment");
  return secret;
}

function base(config: SquadConfig) {
  if (!config.secret) throw new Error("Squad is not configured");
  if (!config.sandbox && config.secret.startsWith("sandbox_sk_")) throw new Error("Sandbox credentials cannot be used for live payments");
  return config.sandbox ? "https://sandbox-api-d.squadco.com" : "https://api-d.squadco.com";
}

async function squadRequest(config: SquadConfig, path: string, body?: Record<string, unknown>) {
  const response = await fetch(`${base(config)}${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${config.secret}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
    redirect: "manual",
  });
  if (!response.ok) {
    // Never log a provider body that might echo credentials or customer details.
    throw new Error(`Squad request failed (${response.status})`);
  }
  const result = await response.json() as { success?: boolean; data?: Record<string, unknown> };
  if (result.success === false) throw new Error("Squad could not complete this request");
  return result.data;
}

/** Read-only credential check; never returns merchant balances or credentials. */
export async function checkSquadConnection(config: SquadConfig) {
  await squadRequest(config, "/merchant/balance?currency_id=NGN");
  return { connected: true as const };
}

/** Internal preparation only: call after a persisted order and delivery gate exist. */
export async function initiateSquadTransaction(config: SquadConfig, args: {
  email: string; amountKobo: number; reference: string; callbackUrl: string; customerName: string;
}) {
  if (!Number.isSafeInteger(args.amountKobo) || args.amountKobo <= 0) throw new Error("Invalid payment amount");
  const data = await squadRequest(config, "/transaction/initiate", {
    email: args.email, amount: args.amountKobo, initiate_type: "inline", currency: "NGN",
    transaction_ref: args.reference, callback_url: args.callbackUrl, customer_name: args.customerName,
  });
  const checkoutUrl = data?.checkout_url;
  if (typeof checkoutUrl !== "string" || new URL(checkoutUrl).protocol !== "https:") throw new Error("Squad did not return a secure checkout address");
  return { checkoutUrl };
}

export async function verifySquadTransaction(config: SquadConfig, reference: string): Promise<SquadVerification> {
  const data = await squadRequest(config, `/transaction/verify/${encodeURIComponent(reference)}`);
  const amount = Number(data?.transaction_amount);
  return {
    status: String(data?.transaction_status ?? "").toLowerCase(),
    ok: String(data?.transaction_status ?? "").toLowerCase() === "success" && Number.isSafeInteger(amount) && amount > 0,
    amountKobo: Number.isSafeInteger(amount) ? amount : 0,
    currency: String(data?.currency ?? data?.transaction_currency_id ?? ""),
    reference: String(data?.transaction_ref ?? ""),
  };
}

export function validSquadSignature(secret: string, rawBody: string, signature: string | null) {
  if (!secret || !signature || !/^[a-f0-9]{128}$/i.test(signature)) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest();
  return timingSafeEqual(Buffer.from(signature, "hex"), expected);
}