export type Slot = { time: string; endsAt?: string; title: string; kind: string; live?: boolean };

const ts = (v?: string) => (v ? new Date(v).getTime() : NaN);

/** Programmes still on air or upcoming, in start order. */
export function upcomingSlots(slots: Slot[], now = Date.now()): Slot[] {
  return slots
    .filter((s) => {
      const end = ts(s.endsAt);
      const start = ts(s.time);
      return Number.isFinite(end) ? end > now : Number.isFinite(start) && start > now;
    })
    .sort((a, b) => ts(a.time) - ts(b.time));
}

/** The next programme that hasn't started yet. */
export function nextProgramme(slots: Slot[], now = Date.now()): Slot | null {
  return upcomingSlots(slots, now).find((s) => ts(s.time) > now) ?? null;
}

/** Reminders are due from 5 minutes before start until the programme starts (+1 min grace). */
export function isReminderDue(time: string, now = Date.now()): boolean {
  const start = ts(time);
  if (!Number.isFinite(start)) return false;
  return now >= start - 5 * 60_000 && now <= start + 60_000;
}

export function formatSlotTime(time: string): string {
  const d = new Date(time);
  if (Number.isNaN(d.getTime())) return time;
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const t = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return sameDay ? t : `${d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })} · ${t}`;
}
