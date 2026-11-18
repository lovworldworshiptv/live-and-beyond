import { expect, it } from "vitest";
import { remainingPpvWait, formatPpvCountdown } from "./ppv-waiting";
it("uses server time and reaches zero exactly when access starts", () => {
  expect(remainingPpvWait("2026-11-18T10:00:00Z", "2026-11-18T09:59:55Z", 4000)).toBe(1000);
  expect(remainingPpvWait("2026-11-18T10:00:00Z", "2026-11-18T09:59:55Z", 5000)).toBe(0);
  expect(formatPpvCountdown(5000)).toBe("00:00:05");
});