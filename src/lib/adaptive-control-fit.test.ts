import { describe, expect, it } from "vitest";
import { shouldCollapseControl } from "./adaptive-control-fit";

describe("slim-phone icon fallback", () => {
  it("keeps labels on ordinary phones, tablets and desktop even with temporary overflow", () => {
    for (const width of [360, 394, 614, 768, 1280]) {
      expect(shouldCollapseControl(width, 250, 180)).toBe(false);
    }
  });
  it("collapses overflowing commands on slim phones only", () => {
    expect(shouldCollapseControl(280, 250, 180)).toBe(true);
    expect(shouldCollapseControl(359, 250, 180)).toBe(true);
    expect(shouldCollapseControl(280, 180, 250)).toBe(false);
    expect(shouldCollapseControl(280, 250, 0)).toBe(false);
  });
});