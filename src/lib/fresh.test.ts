import { describe, it, expect } from "vitest";
import { isFresh } from "./fresh";
const now = Date.parse("2026-11-16T00:00:00Z");
const day = 86_400_000;
describe("isFresh", () => {
  it("music published 13 days ago is fresh", () => expect(isFresh({ kind: "Music", publishedAt: new Date(now - 13 * day).toISOString() }, now)).toBe(true));
  it("music published 15 days ago is not fresh", () => expect(isFresh({ kind: "Music", publishedAt: new Date(now - 15 * day).toISOString() }, now)).toBe(false));
  it("non-music is not fresh automatically", () => expect(isFresh({ kind: "Film", publishedAt: new Date(now - day).toISOString() }, now)).toBe(false));
  it("manager can force on", () => expect(isFresh({ kind: "Film", freshOverride: "on" }, now)).toBe(true));
  it("manager can force off", () => expect(isFresh({ kind: "Music", publishedAt: new Date(now - day).toISOString(), freshOverride: "off" }, now)).toBe(false));
});
