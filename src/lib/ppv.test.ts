import { describe, it, expect } from "vitest";
import { ppvDraftSchema, ppvEnabled, ppvSlideEligible, resolveCommission, splitRevenue, toMinorUnits } from "./ppv";
describe("PPV rules", () => {
  it("keeps ticket-sales start distinct from event start and rejects sales starting later", () => {
    const draft = { channel_id: "65d4b93b-aa01-4b7b-8497-cc3d33563f4e", title: "Scheduled event", description: "", poster_url: null, event_type: "live", sales_starts_at: "2026-11-19T10:00:00Z", starts_at: "2026-11-20T18:00:00Z", duration_minutes: 120, replay_hours: 48, rental_start_days: 30, price_ngn_minor: 150000, price_usd_minor: 100, status: "draft" };
    expect(ppvDraftSchema.parse(draft).sales_starts_at).toBe("2026-11-19T10:00:00Z");
    expect(ppvDraftSchema.safeParse({ ...draft, sales_starts_at: draft.starts_at }).success).toBe(true);
    expect(ppvDraftSchema.safeParse({ ...draft, sales_starts_at: "2026-11-20T18:00:01Z" }).success).toBe(false);
  });
  it("hides a spotlight when PPV is disabled or approval removed", () => {
    expect(ppvSlideEligible("event-1", [])).toBe(false);
    expect(ppvSlideEligible("event-1", ["event-1"])).toBe(true);
    expect(ppvSlideEligible(undefined, [])).toBe(true);
  });
  it("allocates 25% to platform and 75% to channel by default", () => {
    expect(resolveCommission(null, null)).toBe(2500);
    expect(splitRevenue(10000, 2500)).toEqual({ platform: 2500, channel: 7500 });
  });
  it("gives event overrides precedence over channel and platform", () => {
    expect(resolveCommission(1000, 2000, 2500)).toBe(1000);
    expect(resolveCommission(null, 2000, 2500)).toBe(2000);
  });
  it("requires both the platform and channel switch", () => {
    expect(ppvEnabled(false, true)).toBe(false);
    expect(ppvEnabled(true, false)).toBe(false);
    expect(ppvEnabled(true, true)).toBe(true);
  });
  it("keeps fractional-cent splits balanced", () => {
    expect(splitRevenue(101, 2500)).toEqual({ platform: 25, channel: 76 });
  });
  it("converts NGN and USD prices exactly without accepting fractional cents", () => {
    expect(toMinorUnits("2500.05")).toBe(250005);
    expect(() => toMinorUnits("1.001")).toThrow();
  });
});