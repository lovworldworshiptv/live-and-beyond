import { expect, it, vi } from "vitest";
import { nextOnDemand, startNextCountdown } from "./continuous-playback";

it("announces 5, 4, 3, 2, 1 then starts exactly once after five seconds", () => {
  vi.useFakeTimers();
  const count = vi.fn(), complete = vi.fn();
  startNextCountdown(count, complete);
  vi.advanceTimersByTime(4999);
  expect(count.mock.calls.flat()).toEqual([5, 4, 3, 2, 1]);
  expect(complete).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(complete).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(5000);
  expect(complete).toHaveBeenCalledTimes(1);
  vi.useRealTimers();
});
it("cancelling prevents automatic continuation", () => {
  vi.useFakeTimers();
  const complete = vi.fn();
  const cancel = startNextCountdown(vi.fn(), complete);
  vi.advanceTimersByTime(2000); cancel(); vi.advanceTimersByTime(5000);
  expect(complete).not.toHaveBeenCalled();
  vi.useRealTimers();
});
it("chooses a different playable published title, preferring the same category", () => {
  const current = { id: "a", category: "Music", streamUrl: "ok" };
  const next = { id: "c", category: "Music", streamUrl: "ok" };
  expect(nextOnDemand(current, [current, { id: "b", category: "Music", streamUrl: "bad" }, next], (url) => url === "ok")).toEqual(next);
  expect(nextOnDemand(current, [current], () => true)).toBeUndefined();
});