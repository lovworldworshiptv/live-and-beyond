import { describe, expect, it } from "vitest";
import { countsAsView, createWatchMeter } from "./watch-meter";

describe("watch meter", () => {
  it("counts continuous playback and ignores seeks", () => {
    const out: number[] = [];
    const m = createWatchMeter((s) => out.push(s));
    [0, 5, 10, 15, 300, 305].forEach((t) => m.tick(t)); // jump to 300 is a seek
    m.pause();
    expect(out.reduce((a, b) => a + b, 0)).toBe(20);
  });
  it("needs 30 seconds for a view", () => {
    expect(countsAsView(29)).toBe(false);
    expect(countsAsView(30)).toBe(true);
  });
});
