import { describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { isFeatureEnabled, isPathEnabled } from "./feature-flags";

describe("feature flags", () => {
  it("features are on unless an admin switched them off", () => {
    expect(isFeatureEnabled({}, "games")).toBe(true);
    expect(isFeatureEnabled({ games: false }, "games")).toBe(false);
  });
  it("switching a section off hides its pages, including sub-pages", () => {
    expect(isPathEnabled({ movies: false }, "/movies/favour-123")).toBe(false);
    expect(isPathEnabled({ movies: false }, "/channels")).toBe(true);
  });
  it("admin pages can never be switched off", () => {
    expect(isPathEnabled({ movies: false, games: false }, "/admin")).toBe(true);
  });
});
