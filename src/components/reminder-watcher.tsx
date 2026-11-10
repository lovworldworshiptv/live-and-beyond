import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useReminders } from "@/lib/personal";
import { isReminderDue } from "@/lib/reminder-schedule";

const FIRED_KEY = "lettflix:reminders-fired";

/** Alerts the viewer when a programme they set a reminder for is about to start. */
export function ReminderWatcher() {
  const { items } = useReminders();
  const navigate = useNavigate();

  useEffect(() => {
    if (!items.length) return;
    const check = () => {
      let fired: string[] = [];
      try { fired = JSON.parse(localStorage.getItem(FIRED_KEY) || "[]"); } catch { /* ignore */ }
      const due = items.filter((r) => !fired.includes(r.id) && isReminderDue(r.time));
      if (!due.length) return;
      for (const r of due) {
        const open = () => void navigate({ to: "/channels/$channelId", params: { channelId: r.channelId } });
        toast(`Starting soon: ${r.title}`, { description: "Your reminder", duration: 15000, action: { label: "Watch", onClick: open } });
        if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.visibilityState !== "visible") {
          try {
            const n = new Notification(`Starting soon: ${r.title}`, { body: "Tap to watch on Lettflix", icon: "/favicon.png" });
            n.onclick = () => { window.focus(); open(); };
          } catch { /* some browsers only allow service-worker notifications */ }
        }
      }
      localStorage.setItem(FIRED_KEY, JSON.stringify([...fired, ...due.map((r) => r.id)].slice(-200)));
    };
    check();
    const t = window.setInterval(check, 30_000);
    return () => window.clearInterval(t);
  }, [items, navigate]);

  return null;
}
