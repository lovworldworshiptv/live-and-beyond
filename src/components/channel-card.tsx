import { Link } from "@tanstack/react-router";
import { trackAudience } from "@/lib/audience";
import { Play, Calendar, Volume2, VolumeX, Bell, BellRing, CalendarClock } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RemindButton, requestReminderPermission } from "./remind-button";
import { formatSlotTime, nextProgramme, upcomingSlots } from "@/lib/reminder-schedule";
import { ShareMenu } from "./share-menu";
import { useHlsAttach } from "@/hooks/use-hls";
import { useFollowing, useReminders, useSettings } from "@/lib/personal";
import { toast } from "sonner";
import type { Channel } from "@/lib/catalog";
import { ChannelArtwork } from "@/components/channel-artwork";
import { ChannelPlayIndicator } from "@/components/channel-play-indicator";

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
  const next = nextProgramme(c.schedule);
  const upcoming = upcomingSlots(c.schedule);
  const reminderId = next ? `${c.id}::${next.time}::${next.title}` : "";
  const reminderActive = !!reminderId && reminders.has(reminderId);
  const { settings } = useSettings();
  const canPreview = c.streamKind === "video" && c.isLive && !!c.streamUrl && settings.autoplayPreviews;

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const confirmReminder = () => {
    if (!next) { setReminderOpen(false); setScheduleOpen(true); return; }
    reminders.toggle({ id: reminderId, channelId: c.id, time: next.time, title: next.title });
    if (!reminderActive) {
      requestReminderPermission();
      toast.success("Reminder set", { description: `We'll alert you 5 minutes before ${next.title} (${formatSlotTime(next.time)})` });
    } else {
      toast("Reminder removed", { description: next.title });
    }
    setReminderOpen(false);
  };

  const onEnter = () => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setHovering(true), 350);
  };
  const onLeave = () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    setHovering(false);
    setMuted(true);
  };

  const previewSrc = c.streamUrl;
  useHlsAttach(videoRef as React.MutableRefObject<HTMLVideoElement | HTMLAudioElement | null>, previewSrc, hovering && canPreview);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hovering && canPreview) {
      v.muted = muted;
      v.play().catch(() => {});
    } else {
      v.pause();
      try { v.currentTime = 0; } catch { /* ignore */ }
    }
  }, [hovering, muted, canPreview]);

  return (
    <div
      className="group relative flex h-full min-w-0 flex-col"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <Link
        to="/channels/$channelId"
        params={{ channelId: c.id }}
        hash="watch"
        onClick={() => trackAudience({ kind: "click", targetType: "channel", channelId: c.id, service: c.streamKind === "radio" ? "radio" : "tv" })}
        className="flex min-w-0 flex-1 flex-col rounded-xl overflow-hidden border border-border bg-elevated/50 hover:border-primary/40 transition"
      >
        <div className="relative aspect-video overflow-hidden">
          <ChannelArtwork
            channel={c}
            alt={c.name}
            loading="lazy"
            className={`size-full transition-opacity duration-700 ${
              hovering && canPreview ? "opacity-0" : "opacity-100"
            }`}
          />
          {canPreview && (
            <video
              ref={videoRef}
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
          {/* Hover play indicator (only when not previewing) */}
          {!(hovering && canPreview) && (
            <ChannelPlayIndicator />
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

        <div className="flex min-w-0 flex-1 flex-col p-4">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="truncate text-xs font-semibold uppercase tracking-wider text-accent">
              {c.category}
            </div>
            <div className="shrink-0 text-[11px] text-[color:var(--muted-foreground)]">{c.region}</div>
          </div>
          <div className="mt-1.5 font-semibold leading-tight line-clamp-1">{c.nowPlaying.title}</div>
          <div className="mt-0.5 flex items-center justify-between gap-2 min-w-0">
            <div className="min-w-0 truncate text-sm text-[color:var(--muted-foreground)]">{c.name}</div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggle(c.id);
              }}
              className={`shrink-0 text-[11px] px-3 h-11 rounded-full border transition ${
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
        hash="watch"
        onClick={() => trackAudience({ kind: "click", targetType: "channel", channelId: c.id, service: c.streamKind === "radio" ? "radio" : "tv" })}
        className="mt-2 flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition hover:brightness-110"
        style={{
          boxShadow: "0 0 0 2px oklch(0.55 0.22 25 / 0.35), 0 0 18px oklch(0.55 0.22 25 / 0.35), 0 0 40px oklch(0.55 0.22 25 / 0.15)",
        }}
      >
        <Play className="size-[19px] fill-current" strokeWidth={2.5} /> Watch Now
      </Link>

      {/* Action row: Notify · Schedule · Share — Watch Now shape, elevated bg */}
      <div className="mt-2 grid grid-cols-3 gap-2">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                aria-label={reminderActive ? "Reminder set" : "Notify me"}
                onClick={(e) => {
                  stop(e);
                  setReminderOpen(true);
                }}
                className="inline-flex items-center justify-center h-11 rounded-xl bg-elevated/70 border border-border text-foreground font-semibold backdrop-blur transition hover:bg-elevated hover:border-primary/50 hover:scale-[1.03] active:scale-95"
                style={{
                  boxShadow:
                    "0 0 0 2px oklch(0.55 0.22 25 / 0.35), 0 0 18px oklch(0.55 0.22 25 / 0.35), 0 0 40px oklch(0.55 0.22 25 / 0.15)",
                }}
              >
                {reminderActive ? <BellRing className="size-[18px]" strokeWidth={2.5} /> : <Bell className="size-[18px]" strokeWidth={2.5} />}
              </button>
            </TooltipTrigger>
            <TooltipContent>{reminderActive ? "Reminder set" : "Notify me"}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                aria-label="View schedule"
                onClick={(e) => {
                  stop(e);
                  setScheduleOpen(true);
                }}
                className="inline-flex items-center justify-center h-11 rounded-xl bg-elevated/70 border border-border text-foreground font-semibold backdrop-blur transition hover:bg-elevated hover:border-primary/50 hover:scale-[1.03] active:scale-95"
                style={{
                  boxShadow:
                    "0 0 0 2px oklch(0.55 0.22 25 / 0.35), 0 0 18px oklch(0.55 0.22 25 / 0.35), 0 0 40px oklch(0.55 0.22 25 / 0.15)",
                }}
              >
                <CalendarClock className="size-[18px]" strokeWidth={2.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent>View schedule</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                onClick={stop}
                className="[&>div]:w-full [&_button]:!w-full [&_button]:!h-10 sm:[&_button]:!h-11 [&_button]:!rounded-xl [&_button]:!bg-elevated/70 [&_button]:!text-foreground [&_button]:!border [&_button]:!border-border [&_button]:!backdrop-blur [&_button]:!font-semibold [&_button]:hover:!bg-elevated [&_button]:hover:!border-primary/50 [&_button]:hover:!scale-[1.03] [&_button]:active:!scale-95 [&_button]:!transition [&_button]:![box-shadow:0_0_0_2px_oklch(0.55_0.22_25_/_0.35),0_0_18px_oklch(0.55_0.22_25_/_0.35),0_0_40px_oklch(0.55_0.22_25_/_0.15)] [&_button>span]:!hidden [&_button_svg]:!size-[18px]"
              >
                <ShareMenu title={c.name} path={`/channels/${c.id}`} variant="chip" />
              </div>
            </TooltipTrigger>
            <TooltipContent>Share channel</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>


      {/* Reminder dialog — opens in the middle */}
      <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="size-4 text-primary" /> Set a reminder
            </DialogTitle>
            <DialogDescription>
              {next ? `We'll alert you 5 minutes before this programme starts on ${c.name}.` : `${c.name} has no upcoming programmes scheduled yet.`}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border bg-elevated/60 p-4">
            <div className="text-[11px] uppercase tracking-wider text-[color:var(--muted-foreground)]">
              Up next on {c.name}
            </div>
            <div className="mt-1 font-semibold">{next ? next.title : "Nothing scheduled"}</div>
            {next && (
              <div className="text-sm text-[color:var(--muted-foreground)] mt-0.5">
                {formatSlotTime(next.time)}{next.endsAt ? ` – ${formatSlotTime(next.endsAt)}` : ""}
              </div>
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
              {reminderActive ? <BellRing className="size-4" /> : next ? <Bell className="size-4" /> : <CalendarClock className="size-4" />}
              {!next ? "View schedule" : reminderActive ? "Remove reminder" : "Set reminder"}
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
            <SheetDescription>On air now and coming up on {c.name}.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {upcoming.length === 0 && (
                <li className="px-3 py-8 text-center text-sm text-[color:var(--muted-foreground)]">No upcoming programmes scheduled yet.</li>
              )}
              {upcoming.map((s, i) => (
                <li
                  key={i}
                  className={`flex items-center justify-between gap-3 rounded-lg px-3 py-3 ${
                    s.live ? "bg-primary/15 border border-primary/30" : "hover:bg-elevated/60"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-[color:var(--muted-foreground)] uppercase tracking-wider">
                      {s.live ? "On air now" : formatSlotTime(s.time)} · {s.kind}
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
              hash="watch"
              className="flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition"
              style={{
                boxShadow: "0 0 0 2px oklch(0.55 0.22 25 / 0.35), 0 0 18px oklch(0.55 0.22 25 / 0.35), 0 0 40px oklch(0.55 0.22 25 / 0.15)",
              }}
            >
              <Play className="size-[19px] fill-current" strokeWidth={2.5} /> Watch {c.name}
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
