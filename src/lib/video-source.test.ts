import { describe, expect, it } from "vitest";
import { resolveVideoSource, isHlsSource } from "./video-source";

describe("on-demand video links", () => {
  it("plays YouTube watch, short, live and embed links with the official player", () => {
    for (const url of ["https://youtube.com/watch?v=dQw4w9WgXcQ", "https://youtu.be/dQw4w9WgXcQ", "https://youtube.com/shorts/dQw4w9WgXcQ", "https://youtube.com/live/dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"]) {
      expect(resolveVideoSource(url)).toMatchObject({ type: "youtube", id: "dQw4w9WgXcQ" });
    }
    expect(resolveVideoSource("https://youtu.be/dQw4w9WgXcQ?t=1m30s").start).toBe(90);
  });
  it("retains signed cloud and HLS links without changing their signatures", () => {
    const url = "https://cdn.example.com/video.m3u8?token=abc%2F123&expires=42";
    expect(resolveVideoSource(url)).toEqual({ type: "media", url });
    expect(isHlsSource(url)).toBe(true);
    expect(isHlsSource("https://cdn.example.com/manifest?format=hls")).toBe(true);
  });
  it("uses cloud sharing players and Dropbox raw media", () => {
    expect(resolveVideoSource("https://drive.google.com/file/d/cloud_123/view")).toEqual({ type: "embed", url: "https://drive.google.com/file/d/cloud_123/preview" });
    expect(resolveVideoSource("https://dropbox.com/s/video/file.mp4?dl=0").url).toBe("https://dropbox.com/s/video/file.mp4?raw=1");
    expect(resolveVideoSource("https://vimeo.com/123456/abc123").url).toBe("https://player.vimeo.com/video/123456?h=abc123");
  });
  it("rejects unsafe links and malformed YouTube IDs", () => {
    expect(resolveVideoSource("javascript:alert(1)").type).toBe("invalid");
    expect(resolveVideoSource("https://youtube.com/watch?v=bad").type).toBe("invalid");
    expect(resolveVideoSource("https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ").type).toBe("media");
  });
});