import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { expect, it } from "vitest";
import { resolveVideoSource } from "./video-source";

it("keeps TV provider links identical to web resolution", () => {
  const window: Record<string, any> = {};
  runInNewContext(readFileSync("public/tv/js/video-source.js", "utf8"), { window, URL });
  for (const url of ["https://youtu.be/dQw4w9WgXcQ?t=90", "https://youtube.com/shorts/dQw4w9WgXcQ", "https://drive.google.com/file/d/cloud123/view", "https://vimeo.com/123456/abc123", "https://dropbox.com/s/video/file.mp4?dl=0", "https://cdn.example.com/video.m3u8?token=abc%2F123", "javascript:alert(1)"]) {
    expect(window.VideoSource.resolve(url)).toEqual(resolveVideoSource(url));
  }
  expect(window.VideoSource.isHls("https://cdn.example.com/a.m3u8#live")).toBe(true);
});