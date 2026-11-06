import { describe, expect, it, vi } from "vitest";
import { saveChannelConfiguration } from "./channel-configuration";

describe("combined channel saves", () => {
  it("keeps TV, movies, videos and radio enabled together on the same channel", async () => {
    const actions = { saveChannel: vi.fn().mockResolvedValue("creator-channel"), saveServices: vi.fn().mockResolvedValue(undefined), saveRadio: vi.fn().mockResolvedValue(undefined) };
    await saveChannelConfiguration(["tv", "movies", "videos", "radio"], " https://station.example.test/live.mp3 ", actions);
    expect(actions.saveServices).toHaveBeenCalledWith("creator-channel", ["tv", "movies", "videos", "radio"]);
    expect(actions.saveRadio).toHaveBeenCalledWith("creator-channel", { stream_url: "https://station.example.test/live.mp3", is_enabled: true });
  });
  it("does not write services or radio when the channel save is refused", async () => {
    const actions = { saveChannel: vi.fn().mockRejectedValue(new Error("Save refused")), saveServices: vi.fn(), saveRadio: vi.fn() };
    await expect(saveChannelConfiguration(["tv", "radio"], "", actions)).rejects.toThrow("Save refused");
    expect(actions.saveServices).not.toHaveBeenCalled();
    expect(actions.saveRadio).not.toHaveBeenCalled();
  });
  it("propagates service failures instead of reporting a completed save", async () => {
    const actions = { saveChannel: vi.fn().mockResolvedValue("creator-channel"), saveServices: vi.fn().mockRejectedValue(new Error("Services refused")), saveRadio: vi.fn() };
    await expect(saveChannelConfiguration(["tv"], "", actions)).rejects.toThrow("Services refused");
    expect(actions.saveRadio).not.toHaveBeenCalled();
  });
  it("disables the radio station when radio is deselected even without a stream URL", async () => {
    const actions = { saveChannel: vi.fn().mockResolvedValue("creator-channel"), saveServices: vi.fn().mockResolvedValue(undefined), saveRadio: vi.fn().mockResolvedValue(undefined) };
    await saveChannelConfiguration(["tv", "movies"], "", actions);
    expect(actions.saveRadio).toHaveBeenCalledWith("creator-channel", { stream_url: null, is_enabled: false });
  });
});