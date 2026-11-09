import { expect, it, vi } from "vitest";
import { createOnDemandStartTracker } from "./on-demand-start";

it("records nothing before media plays and counts pause/resume only once", () => {
  const record = vi.fn();
  const onPlaying = createOnDemandStartTracker(record);
  expect(record).not.toHaveBeenCalled();
  onPlaying();
  onPlaying();
  onPlaying();
  expect(record).toHaveBeenCalledTimes(1);
});
it("counts playback of another loaded title independently", () => {
  const record = vi.fn();
  createOnDemandStartTracker(record)();
  createOnDemandStartTracker(record)();
  expect(record).toHaveBeenCalledTimes(2);
});