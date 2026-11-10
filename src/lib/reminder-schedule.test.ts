import { describe, expect, it } from "vitest";
import { isReminderDue, nextProgramme, upcomingSlots } from "./reminder-schedule";

const now = new Date("2026-11-10T10:00:00Z").getTime();
const slots = [
  { time: "2026-11-10T08:00:00Z", endsAt: "2026-11-10T09:00:00Z", title: "Past", kind: "x" },
  { time: "2026-11-10T09:30:00Z", endsAt: "2026-11-10T10:30:00Z", title: "On air", kind: "x" },
  { time: "2026-11-10T11:00:00Z", endsAt: "2026-11-10T12:00:00Z", title: "Next", kind: "x" },
];

describe("channel schedule and reminders", () => {
  it("schedule hides finished programmes", () => {
    expect(upcomingSlots(slots, now).map((s) => s.title)).toEqual(["On air", "Next"]);
  });
  it("Notify me targets the next programme that hasn't started", () => {
    expect(nextProgramme(slots, now)?.title).toBe("Next");
    expect(nextProgramme(slots.slice(0, 2), now)).toBeNull();
  });
  it("a reminder fires within 5 minutes of the start", () => {
    expect(isReminderDue("2026-11-10T10:04:00Z", now)).toBe(true);
    expect(isReminderDue("2026-11-10T10:10:00Z", now)).toBe(false);
  });
});
