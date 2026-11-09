import { afterEach, expect, it, vi } from "vitest";

const query = vi.hoisted(() => ({
  select: vi.fn(), eq: vi.fn(), is: vi.fn(), maybeSingle: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ from: () => query }) }));
import { resolveRadioNowPlaying } from "./radio-now-playing.server";

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

it("TV song lookup only reads enabled radio on published non-deleted channels", async () => {
  vi.stubEnv("SUPABASE_URL", "https://example.invalid");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "public-test-key");
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.is.mockReturnValue(query);
  query.maybeSingle.mockResolvedValue({ data: null });
  expect(await resolveRadioNowPlaying("channel-a")).toEqual({ title: null, artist: null, artwork: null, listeners: null });
  expect(query.eq).toHaveBeenCalledWith("channel_id", "channel-a");
  expect(query.eq).toHaveBeenCalledWith("is_enabled", true);
  expect(query.eq).toHaveBeenCalledWith("cms_channels.is_published", true);
  expect(query.is).toHaveBeenCalledWith("cms_channels.deleted_at", null);
});