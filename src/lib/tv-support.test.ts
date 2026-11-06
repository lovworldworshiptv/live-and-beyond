import { describe, expect, it } from "vitest";
import { generateShortCode, isValidShortCode, normalizeDevice, tvCorsHeaders } from "./tv-support";

describe("tv support", () => {
  it("only accepts the tv device", () => {
    expect(normalizeDevice("tv")).toBe("tv");
    expect(normalizeDevice("android")).toBeNull();
    expect(normalizeDevice(undefined)).toBeNull();
  });

  it("generates 6-character codes without 0/O/1/I/L", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateShortCode();
      expect(code).toHaveLength(6);
      expect(code).not.toMatch(/[0O1IL]/);
      expect(isValidShortCode(code)).toBe(true);
    }
  });

  it("allows lettflix origins and env-listed origins only, never *", () => {
    expect(tvCorsHeaders("https://lettflix.com", undefined)["Access-Control-Allow-Origin"]).toBe(
      "https://lettflix.com",
    );
    expect(tvCorsHeaders("http://localhost:8090", undefined)["Access-Control-Allow-Origin"]).toBeUndefined();
    expect(
      tvCorsHeaders("http://localhost:8090", "http://localhost:8090")["Access-Control-Allow-Origin"],
    ).toBe("http://localhost:8090");
    expect(tvCorsHeaders("https://evil.com", "*")["Access-Control-Allow-Origin"]).toBeUndefined();
  });
});
