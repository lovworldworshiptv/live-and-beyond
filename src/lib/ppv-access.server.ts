import type { SquadVerification } from "./squad.server";

export type PlaybackOrder = {
  id: string; user_id: string; provider: string; reference: string; sandbox: boolean;
  amount_minor: number; currency: string; status: string; verified_at: string | null;
  refunded_at: string | null; access_starts_at: string; access_expires_at: string;
};
export type PlaybackGate = { stream_uid: string; sandbox: boolean; access_expires_at: string };
type Dependencies = {
  verify: (reference: string) => Promise<SquadVerification>;
  gate: () => Promise<PlaybackGate | null>;
  sign: (uid: string, expires: number) => Promise<string>;
};

/** No client claims, stored success alone, or manager/admin bypass grant playback. */
export async function authorizePpvPlayback(order: PlaybackOrder | null, userId: string, deps: Dependencies, now = Date.now()) {
  if (!order || order.user_id !== userId || order.provider !== "squad" || order.status !== "paid" ||
    !order.verified_at || !Number.isFinite(Date.parse(order.verified_at)) || order.refunded_at ||
    !Number.isSafeInteger(order.amount_minor) || order.amount_minor <= 0 || order.currency !== "NGN" ||
    !(Date.parse(order.access_starts_at) <= now && Date.parse(order.access_expires_at) > now)) {
    throw new Error("A verified, active PPV purchase is required");
  }
  const initial = await deps.gate();
  if (!initial || initial.sandbox !== order.sandbox) throw new Error("PPV playback is unavailable");
  const verified = await deps.verify(order.reference);
  if (!verified.ok || verified.reference !== order.reference || verified.amountKobo !== order.amount_minor || verified.currency !== order.currency) {
    throw new Error("Payment verification did not grant playback");
  }
  // Re-read durable state after provider I/O: a concurrent refund must win.
  const current = await deps.gate();
  if (!current || current.stream_uid !== initial.stream_uid || current.sandbox !== order.sandbox) throw new Error("PPV access was revoked");
  const expires = Math.min(Math.floor(Date.parse(current.access_expires_at) / 1000), Math.floor(Date.parse(order.access_expires_at) / 1000), Math.floor(Date.now() / 1000) + 60);
  if (!(expires > Math.floor(Date.now() / 1000))) throw new Error("PPV access expired");
  const token = await deps.sign(current.stream_uid, expires);
  const final = await deps.gate();
  if (!final || final.stream_uid !== current.stream_uid || final.sandbox !== current.sandbox || Date.parse(final.access_expires_at) < expires * 1000) throw new Error("PPV access was revoked");
  return { playbackUrl: `https://videodelivery.net/${token}/manifest/video.m3u8`, expiresAt: new Date(expires * 1000).toISOString() };
}

/** Never sign a public source or enable protection silently on a free channel. */
export async function signPremiumStream(config: { accountId: string; apiToken: string }, uid: string, expires: number) {
  if (!/^[a-f0-9]{32}$/.test(uid)) throw new Error("Invalid premium asset");
  const base = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(config.accountId)}/stream/${uid}`;
  const headers = { Authorization: `Bearer ${config.apiToken}`, "Content-Type": "application/json" };
  const response = await fetch(base, { headers, signal: AbortSignal.timeout(15000), redirect: "manual" });
  const asset = await response.json() as { success?: boolean; result?: { uid?: string; requireSignedURLs?: boolean } };
  if (!response.ok || asset.success !== true || asset.result?.uid !== uid || asset.result.requireSignedURLs !== true) throw new Error("Premium delivery protection is required");
  const signed = await fetch(`${base}/token`, { method: "POST", headers, body: JSON.stringify({ exp: expires, downloadable: false }), signal: AbortSignal.timeout(15000), redirect: "manual" });
  const result = await signed.json() as { success?: boolean; result?: { token?: string } };
  const token = result.result?.token;
  if (!signed.ok || result.success !== true || !token || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) throw new Error("Protected playback is unavailable");
  return token;
}