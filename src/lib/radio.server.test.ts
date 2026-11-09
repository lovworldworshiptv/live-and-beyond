import { describe, expect, it } from "vitest";
import { automaticMetadataUrl, parseNowPlaying } from "./radio.server";

describe("live radio song information", () => {
  it("discovers the Lettflix Gospel Icecast feed from its stream", () => {
    expect(automaticMetadataUrl("https://s32.radiolize.com:8040/radio.mp3")).toBe("https://s32.radiolize.com:8040/status-json.xsl");
  });
  it("reads the title supplied by Lettflix Gospel's broadcaster", () => {
    expect(parseNowPlaying("icecast", JSON.stringify({ icestats: { source: { listenurl: "http://s32.radiolize.com:8040/radio.mp3", title: "sweet holy spirit" } } }), "https://s32.radiolize.com:8040/radio.mp3").title).toBe("sweet holy spirit");
  });
  it("selects the playing mount rather than another station's song", () => {
    const body = JSON.stringify({ icestats: { source: [{ listenurl: "https://radio.example.com/other", title: "Other song" }, { listenurl: "https://radio.example.com/radio.mp3", title: "Singer - Current song" }] } });
    expect(parseNowPlaying("icecast", body, "https://radio.example.com/radio.mp3")).toEqual({ title: "Current song", artist: "Singer", listeners: null });
    expect(parseNowPlaying("icecast", body, "https://radio.example.com/missing").title).toBeNull();
  });
  it("does not probe private hosts or HLS manifests", () => {
    expect(automaticMetadataUrl("https://127.0.0.1/radio.mp3")).toBeNull();
    expect(automaticMetadataUrl("https://radio.example.com/live.m3u8")).toBeNull();
  });
});