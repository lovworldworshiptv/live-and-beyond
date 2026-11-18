import { describe, expect, it } from "vitest";
import { matchesPpvSearch, ppvAccountReturn, ppvCountdownParts } from "./ppv-discovery";

describe("PPV discovery", () => {
  it("counts down to the exact event second including days", () => {
    expect(ppvCountdownParts("2026-11-20T16:09:05Z", Date.parse("2026-11-18T15:09:00Z"))).toEqual({ days: 2, hours: 1, minutes: 0, seconds: 5 });
    expect(ppvCountdownParts("2026-11-18T15:09:00Z", Date.parse("2026-11-18T15:09:01Z"))).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });
  it("finds events by title, channel and Pay-Per-View category", () => {
    const event = { title: "Celebrity Boxing Match", channel_name: "Nova Works", channel_slug: "nova-works" };
    expect(matchesPpvSearch(event, "boxing", "nova-works")).toBe(true);
    expect(matchesPpvSearch(event, "pay-per-view")).toBe(true);
    expect(matchesPpvSearch(event, "Nova")).toBe(true);
    expect(matchesPpvSearch(event, "boxing", "other-channel")).toBe(false);
    expect(matchesPpvSearch(event, "concert")).toBe(false);
  });
  it("returns ticket buyers to the shared event after account sign-in", () => {
    expect(ppvAccountReturn("f0b62edf-4450-4de6-85da-219f3ec3d16a")).toBe("/ppv/f0b62edf-4450-4de6-85da-219f3ec3d16a");
  });
});