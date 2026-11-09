import { describe, expect, it } from "vitest";
import { studioSearch } from "./studio-navigation";

describe("Studio return location", () => {
  it("retains the radio section and selected creator workspace", () => {
    expect(studioSearch({ channel: "creator-channel", section: "radio" })).toEqual({ channel: "creator-channel", section: "radio" });
  });
  it("retains the content library section on return", () => {
    expect(studioSearch({ section: "content" })).toEqual({ section: "content" });
  });
  it("rejects unknown sections", () => {
    expect(studioSearch({ section: "unknown" })).toEqual({});
  });
});