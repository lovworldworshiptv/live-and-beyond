import { describe, it, expect } from "vitest";
import { ppvEnabled, ppvSlideEligible, resolveCommission, splitRevenue, toMinorUnits } from "./ppv";
describe("PPV rules", () => {
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