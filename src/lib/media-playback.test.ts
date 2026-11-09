import { describe, expect, it, vi } from "vitest";
import { startMediaPlayback } from "./media-playback";

describe("media starts", () => {
  it("starts with sound when permitted", async () => {
    const media = { play: vi.fn().mockResolvedValue(undefined), muted: false };
    await startMediaPlayback(media as unknown as HTMLMediaElement);
    expect(media.play).toHaveBeenCalledTimes(1);
    expect(media.muted).toBe(false);
  });
  it("retries muted only when autoplay is blocked", async () => {
    const media = { play: vi.fn().mockRejectedValueOnce(Object.assign(new Error(), { name: "NotAllowedError" })).mockResolvedValue(undefined), muted: false };
    await startMediaPlayback(media as unknown as HTMLMediaElement);
    expect(media.play).toHaveBeenCalledTimes(2);
    expect(media.muted).toBe(true);
  });
  it("reports an unavailable source rather than hiding it with muted retries", async () => {
    const error = Object.assign(new Error("Unavailable"), { name: "NotSupportedError" });
    const media = { play: vi.fn().mockRejectedValue(error), muted: false };
    await expect(startMediaPlayback(media as unknown as HTMLMediaElement)).rejects.toBe(error);
    expect(media.play).toHaveBeenCalledTimes(1);
  });
});