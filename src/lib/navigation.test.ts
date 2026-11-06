import { expect, it } from "vitest";
import { resolveFooterHref } from "./navigation";
it("resolves outdated catalogue links to their working pages", () => {
  expect(resolveFooterHref("/on-demand", "On Demand")).toBe("/movies");
  expect(resolveFooterHref("/on-demand", "Podcasts")).toBe("/podcasts");
  expect(resolveFooterHref("/channels", "Radio")).toBe("/radio");
  expect(resolveFooterHref("/channels", "Channels")).toBe("/channels");
});