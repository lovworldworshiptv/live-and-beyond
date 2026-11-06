import { describe, expect, it } from "vitest";
import { bottomNavIcon, bottomNavIcons } from "./bottom-nav-icons";
import { defaultBottomNav } from "./homepage-defaults";

describe("bottom nav icons", () => {
  it("resolves the games tab to the game console icon", () => {
    const games = defaultBottomNav.items.find((i) => i.to === "/games");
    expect(games?.icon).toBe("gamepad");
    expect(bottomNavIcon("gamepad")).toBeTruthy();
    expect(bottomNavIcons).toContain("gamepad");
  });

  it("falls back to the home icon for an unknown key", () => {
    expect(bottomNavIcon("not-a-real-icon")).toBe(bottomNavIcon("home"));
  });

  it("never resolves to undefined for a selectable key", () => {
    for (const key of bottomNavIcons) {
      expect(bottomNavIcon(key)).toBeTruthy();
    }
  });
});
