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
  const [epgOpen, setEpgOpen] = useState(false);
  const hoverTimer = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { has, toggle } = useFollowing();
  const following = has(c.id);
  const canPreview = c.streamKind === "video" && c.isLive;

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

          {/* Bottom-right hover action bar */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
            <RemindButton
              channelId={c.id}
              time={c.nowPlaying.startsAt}
              title={c.nowPlaying.title}
            />
            <Popover open={epgOpen} onOpenChange={setEpgOpen}>
              <PopoverTrigger asChild>
                <button
                  aria-label="Show schedule"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEpgOpen((o) => !o);
                  }}
                  className="size-8 grid place-items-center rounded-full bg-black/60 backdrop-blur border border-white/10 hover:bg-black/80 transition"
                >
                  <Calendar className="size-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                onClick={(e) => e.stopPropagation()}
                className="w-80 p-0"
              >
                <MiniEpg channel={c} />
              </PopoverContent>
            </Popover>
            <ShareMenu title={c.name} path={`/channels/${c.id}`} />
          </div>
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
          <div className="mt-3 flex items-center justify-end text-[color:var(--muted-foreground)]">
            <ArrowRight className="size-4 group-hover:text-foreground group-hover:translate-x-0.5 transition" />
          </div>
        </div>
      </Link>
    </div>
  );
}

function MiniEpg({ channel }: { channel: Channel }) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-[color:var(--muted-foreground)]">
            On {channel.name}
          </div>
          <div className="font-semibold text-sm mt-0.5">Today's schedule</div>
        </div>
        <Link
          to="/channels/$channelId"
          params={{ channelId: channel.id }}
          className="text-[11px] text-accent hover:underline"
        >
          Open channel
        </Link>
      </div>
      <ul className="space-y-1">
        {channel.schedule.slice(0, 6).map((s, i) => (
          <li
            key={i}
            className={`flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm ${
              s.live ? "bg-primary/15" : "hover:bg-elevated/60"
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-[color:var(--muted-foreground)]">
                {s.time} · {s.kind}
              </div>
              <div className="text-sm font-medium truncate flex items-center gap-1.5">
                {s.live && <span className="size-1.5 rounded-full bg-primary animate-pulse" />}
                {s.title}
              </div>
            </div>
            {!s.live && (
              <RemindButton
                channelId={channel.id}
                time={s.time}
                title={s.title}
                variant="icon"
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
