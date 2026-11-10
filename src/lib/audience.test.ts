import { describe, expect, it } from "vitest";
import { summarizeAudience, type AudienceRow } from "./audience";

const row = (p: Partial<AudienceRow>): AudienceRow => ({ kind: "visit", service: null, country: "NG", city: "Lagos", channel_id: null, session_id: "a", created_at: "", ...p });

describe("summarizeAudience", () => {
  it("separates live clicks, live streams and on-demand views", () => {
    const s = summarizeAudience([
      row({ kind: "click", service: "tv" }), row({ kind: "click", service: "radio" }),
      row({ kind: "stream", service: "tv" }), row({ kind: "stream", service: "vod" }), row({ kind: "stream", service: "podcast" }),
    ]);
    expect(s.liveClicks).toBe(2);
    expect(s.liveStreams).toBe(1);
    expect(s.vodViews).toBe(2);
  });
  it("counts visits and unique visitors and ranks city locations", () => {
    const s = summarizeAudience([row({}), row({}), row({ session_id: "b", city: "Accra", country: "GH" })]);
    expect(s.visits).toBe(3);
    expect(s.uniqueVisitors).toBe(2);
    expect(s.locations[0]).toEqual({ place: "Lagos, NG", count: 2 });
  });
});
