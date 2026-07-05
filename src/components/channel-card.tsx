import { Link } from "@tanstack/react-router";
import { Play, Users, Calendar, Volume2, VolumeX, Bell, BellRing, CalendarClock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RemindButton } from "./remind-button";
import { ShareMenu } from "./share-menu";
import { useFollowing, useReminders } from "@/lib/personal";
import { toast } from "sonner";
import type { Channel } from "@/lib/catalog";

const PREVIEW_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

export function ChannelCard({ c }: { c: Channel }) {
  const [hovering, setHovering] = useState(false);
  const [muted, setMuted] = useState(true);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const hoverTimer = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { has, toggle } = useFollowing();
  const following = has(c.id);
  const reminders = useReminders();
  const reminderId = `${c.id}::${c.nowPlaying.startsAt}::${c.nowPlaying.title}`;
  const reminderActive = reminders.has(reminderId);
  const canPreview = c.streamKind === "video" && c.isLive;

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const confirmReminder = () => {
    reminders.toggle({
      id: reminderId,
      channelId: c.id,
      time: c.nowPlaying.startsAt,
      title: c.nowPlaying.title,
    });
    if (!reminderActive) {
      toast.success("Reminder set", {
        description: `${c.nowPlaying.title} · ${c.nowPlaying.startsAt}`,
      });
    } else {
      toast("Reminder removed", { description: c.nowPlaying.title });
    }
    setReminderOpen(false);
  };

  const onEnter = () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setHovering(true), 350);
  };
  const onLeave = () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    setHovering(false);
    setMuted(true);
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hovering && canPreview) {
      v.muted = muted;
      v.play().catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [hovering, muted, canPreview]);

  return (
    <div
      className="group relative"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <Link
        to="/channels/$channelId"
        params={{ channelId: c.id }}
        className="block rounded-2xl overflow-hidden border border-border bg-elevated/50 hover:border-primary/50 transition"
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={c.banner}
            alt={c.name}
            loading="lazy"
            className={`size-full object-cover transition duration-700 ${
              hovering && canPreview ? "opacity-0" : "group-hover:scale-105"
            }`}
          />
          {canPreview && (
            <video
              ref={videoRef}
              src={PREVIEW_VIDEO}
              loop
              playsInline
              muted
              className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${
                hovering ? "opacity-100" : "opacity-0"
              }`}
            />
          )}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--gradient-card)" }} />
          {c.isLive && (
            <span className="absolute top-3 left-3 inline-flex items-center px-2 py-1 rounded text-[11px] font-bold bg-[image:var(--gradient-live)] text-primary-foreground live-pulse">
              LIVE
            </span>
          )}
          <span className="absolute top-3 right-3 text-[11px] px-2 py-1 rounded bg-black/60 backdrop-blur inline-flex items-center gap-1">
            <Users className="size-3" /> {c.viewers}
          </span>

          {/* Hover play indicator (only when not previewing) */}
          {!(hovering && canPreview) && (
            <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition pointer-events-none">
              <div className="size-14 rounded-full bg-white/95 grid place-items-center shadow-[var(--shadow-card)]">
                <Play className="size-5 text-background fill-current ml-0.5" />
              </div>
            </div>
          )}

          {/* Unmute button while preview is playing */}
          {hovering && canPreview && (
            <button
              aria-label={muted ? "Unmute preview" : "Mute preview"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMuted((m) => !m);
              }}
              className="absolute bottom-3 left-3 size-9 grid place-items-center rounded-full bg-black/70 backdrop-blur border border-white/10 hover:bg-black/90 transition"
            >
              {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
          )}

        </div>

        <div className="p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-accent font-semibold uppercase tracking-wider">
              {c.category}
            </div>
            <div className="text-[11px] text-[color:var(--muted-foreground)]">{c.region}</div>
          </div>
          <div className="mt-1.5 font-semibold text-lg leading-tight">{c.name}</div>
          <div className="text-sm text-[color:var(--muted-foreground)] mt-1 line-clamp-1">
            {c.tagline}
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="text-[color:var(--secondary-foreground)] line-clamp-1">
              <span className="text-foreground font-medium">Now:</span> {c.nowPlaying.title}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggle(c.id);
              }}
              className={`text-[11px] px-2 h-6 rounded-full border transition ${
                following
                  ? "bg-accent/20 border-accent/40 text-accent"
                  : "bg-elevated border-border text-[color:var(--secondary-foreground)] hover:text-foreground"
              }`}
            >
              {following ? "Following" : "Follow"}
            </button>
          </div>
        </div>
      </Link>

      {/* Watch Now CTA stripe */}
      <Link
        to="/channels/$channelId"
        params={{ channelId: c.id }}
        className="mt-2 flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-[var(--shadow-card)] hover:brightness-110 transition"
      >
        <Play className="size-4 fill-current" /> Watch Now
      </Link>

      {/* Action row: Reminder · Schedule · Share */}
      <div className="mt-2 grid grid-cols-3 gap-2">
        <button
          onClick={(e) => {
            stop(e);
            setReminderOpen(true);
          }}
          className={`inline-flex items-center justify-center gap-1.5 h-10 rounded-lg border text-xs font-medium transition ${
            reminderActive
              ? "bg-primary/15 border-primary/40 text-primary"
              : "bg-elevated border-border hover:bg-elevated/80"
          }`}
        >
          {reminderActive ? <BellRing className="size-3.5" /> : <Bell className="size-3.5" />}
          Reminder
        </button>
        <button
          onClick={(e) => {
            stop(e);
            setScheduleOpen(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 h-10 rounded-lg border border-border bg-elevated hover:bg-elevated/80 text-xs font-medium transition"
        >
          <CalendarClock className="size-3.5" />
          Schedule
        </button>
        <div onClick={stop} className="[&>div]:w-full">
          <ShareMenu title={c.name} path={`/channels/${c.id}`} variant="chip" />
        </div>
      </div>

      {/* Reminder dialog — opens in the middle */}
      <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="size-4 text-primary" /> Set a reminder
            </DialogTitle>
            <DialogDescription>
              We'll notify you when this programme is about to start on {c.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border bg-elevated/60 p-4">
            <div className="text-[11px] uppercase tracking-wider text-[color:var(--muted-foreground)]">
              Now / Next on {c.name}
            </div>
            <div className="mt-1 font-semibold">{c.nowPlaying.title}</div>
            <div className="text-sm text-[color:var(--muted-foreground)] mt-0.5">
              {c.nowPlaying.startsAt} – {c.nowPlaying.endsAt}
            </div>
            {c.nowPlaying.description && (
              <p className="text-sm text-[color:var(--secondary-foreground)] mt-3 line-clamp-3">
                {c.nowPlaying.description}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              onClick={() => setReminderOpen(false)}
              className="inline-flex items-center justify-center h-10 px-4 rounded-md border border-border bg-elevated hover:bg-elevated/80 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={confirmReminder}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:brightness-110"
            >
              {reminderActive ? <BellRing className="size-4" /> : <Bell className="size-4" />}
              {reminderActive ? "Remove reminder" : "Set reminder"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule sheet — slides in from the right */}
      <Sheet open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="p-6 pb-4 border-b border-border">
            <div className="text-xs uppercase tracking-wider text-accent font-semibold">
              {c.category}
            </div>
            <SheetTitle className="flex items-center gap-2">
              <Calendar className="size-4" /> {c.name} · Schedule
            </SheetTitle>
            <SheetDescription>Today's programming on {c.name}.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {c.schedule.map((s, i) => (
                <li
                  key={i}
                  className={`flex items-center justify-between gap-3 rounded-lg px-3 py-3 ${
                    s.live ? "bg-primary/15 border border-primary/30" : "hover:bg-elevated/60"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-[color:var(--muted-foreground)] uppercase tracking-wider">
                      {s.time} · {s.kind}
                    </div>
                    <div className="text-sm font-medium truncate flex items-center gap-1.5 mt-0.5">
                      {s.live && (
                        <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                      {s.title}
                    </div>
                  </div>
                  {!s.live && (
                    <RemindButton
                      channelId={c.id}
                      time={s.time}
                      title={s.title}
                      variant="icon"
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 border-t border-border">
            <Link
              to="/channels/$channelId"
              params={{ channelId: c.id }}
              onClick={() => setScheduleOpen(false)}
              className="flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition"
            >
              <Play className="size-4 fill-current" /> Watch {c.name}
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
