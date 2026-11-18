import { z } from "zod";

export const DEFAULT_COMMISSION_BPS = 2500;
export function resolveCommission(event: number | null, channel: number | null, platform = DEFAULT_COMMISSION_BPS) {
  const rate = event ?? channel ?? platform;
  if (!Number.isInteger(rate) || rate < 0 || rate > 10000) throw new Error("Invalid commission");
  return rate;
}
export function splitRevenue(netMinor: number, commissionBps: number) {
  if (!Number.isSafeInteger(netMinor) || netMinor < 0) throw new Error("Invalid amount");
  const platform = Math.round(netMinor * resolveCommission(null, null, commissionBps) / 10000);
  return { platform, channel: netMinor - platform };
}
export function ppvEnabled(platform: boolean, channel: boolean) { return platform && channel; }
export function ppvSlideEligible(eventId: string | undefined, eligibleIds: string[]) { return !eventId || eligibleIds.includes(eventId); }
export function toMinorUnits(value: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) throw new Error("Enter a price with up to two decimal places");
  const [whole, fraction = ""] = value.split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(amount) || amount < 100) throw new Error("Price must be at least 1");
  return amount;
}
export const ppvDraftSchema = z.object({
  id: z.string().uuid().optional(), channel_id: z.string().uuid(),
  title: z.string().trim().min(1).max(160), description: z.string().max(4000),
  poster_url: z.string().url().max(2000).nullable(),
  event_type: z.enum(["live", "live_replay", "vod"]),
  sales_starts_at: z.string().datetime(),
  starts_at: z.string().datetime(), duration_minutes: z.number().int().min(1).max(1440),
  replay_hours: z.number().int().min(1).max(720), rental_start_days: z.number().int().min(1).max(365),
  price_ngn_minor: z.number().int().min(100).max(1000000000),
  price_usd_minor: z.number().int().min(100).max(100000000),
  status: z.enum(["draft", "pending"]),
}).refine(event => Date.parse(event.sales_starts_at) <= Date.parse(event.starts_at), { path: ["sales_starts_at"], message: "Ticket sales must start before or at the event start time" });
export type PpvDraft = z.infer<typeof ppvDraftSchema>;