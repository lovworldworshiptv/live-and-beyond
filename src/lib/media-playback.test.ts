import { describe, expect, it, vi } from "vitest";
import { pauseAllMedia, pauseOtherMedia, registerMediaElement, startMediaPlayback } from "./media-playback";

describe("one broadcast at a time", () => {
  it("starting a player pauses every other registered player", async () => {
    const tv = { play: vi.fn().mockResolvedValue(undefined), pause: vi.fn(), paused: false, muted: false };
    const radio = { play: vi.fn().mockResolvedValue(undefined), pause: vi.fn(), paused: false, muted: false };
    const unregisterTv = registerMediaElement(tv as unknown as HTMLMediaElement);
    const unregisterRadio = registerMediaElement(radio as unknown as HTMLMediaElement);
    await startMediaPlayback(radio as unknown as HTMLMediaElement);
    expect(tv.pause).toHaveBeenCalledTimes(1);
    expect(radio.pause).not.toHaveBeenCalled();
    unregisterTv(); unregisterRadio();
  });

  it("pauseAllMedia stops everything when an embedded video starts", () => {
    const vod = { pause: vi.fn(), paused: false };
    const unregister = registerMediaElement(vod as unknown as HTMLMediaElement);
    pauseAllMedia();
    expect(vod.pause).toHaveBeenCalledTimes(1);
    unregister();
  });

  it("unregistered players are no longer paused", () => {
    const media = { pause: vi.fn(), paused: false };
    const unregister = registerMediaElement(media as unknown as HTMLMediaElement);
    unregister();
    pauseOtherMedia({} as HTMLMediaElement);
    expect(media.pause).not.toHaveBeenCalled();
  });
});

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