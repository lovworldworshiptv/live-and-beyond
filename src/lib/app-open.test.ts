import { describe, expect, it } from "vitest";
import { androidIntentUrl, appDeepLink } from "./app-open";
const links = { playStoreUrl: "https://play.google.com/store/apps/details?id=com.lettflix.app", loveworldAppStoreUrl: "", androidPackage: "com.lettflix.app", appScheme: "lettflix" };
describe("app open links", () => {
  it("opens the exact shared account inside the app", () => {
    expect(appDeepLink(links, "channel", "abc")).toBe("lettflix://open/channel/abc");
  });
  it("falls back to the Play Store when the app is missing", () => {
    const url = androidIntentUrl(links, "creator", "u1", "https://lettflix.com/channels");
    expect(url).toContain("package=com.lettflix.app");
    expect(url).toContain(`S.browser_fallback_url=${encodeURIComponent(links.playStoreUrl)}`);
  });
});
