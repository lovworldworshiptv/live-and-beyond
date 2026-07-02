import { Link } from "@tanstack/react-router";
import { Play, Plus, Check, Info, Volume2, VolumeX } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useMyList, useProgress } from "@/lib/personal";
import { ShareMenu } from "./share-menu";
import type { Title } from "@/lib/catalog";

const PREVIEW_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

type Align = "left" | "center" | "right";

export function TitleCard({
  t,
  rank,
  portrait = true,
  size = "md",
}: {
  t: Title;
  rank?: number;
  portrait?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const [align, setAlign] = useState<Align>("center");
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { has, toggle } = useMyList();
  const { items } = useProgress();
  const progress = items.find((i) => i.titleId === t.id);
  const inList = has(t.id);

  const clearTimers = () => {
    if (openTimer.current) window.clearTimeout(openTimer.current);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  };

  const openSoon = () => {
    clearTimers();
    openTimer.current = window.setTimeout(() => setOpen(true), 350);
  };
  const closeSoon = () => {
    clearTimers();
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      setMuted(true);
    }, 120);
  };
  const cancelClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  };

  // Edge-aware alignment
  useLayoutEffect(() => {
    if (!open || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const previewWidth = 340;
    const vw = window.innerWidth;
    const cardCenter = rect.left + rect.width / 2;
    if (cardCenter - previewWidth / 2 < 16) setAlign("left");
    else if (cardCenter + previewWidth / 2 > vw - 16) setAlign("right");
    else setAlign("center");
  }, [open]);

  // Video playback
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (open) {
      v.muted = muted;
      v.play().catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [open, muted]);

  const widthClass =
    !portrait
      ? size === "lg"
        ? "w-[340px]"
        : "w-[260px]"
      : "";

  const previewPositionClass =
    align === "left"
      ? "left-0"
      : align === "right"
        ? "right-0"
        : "left-1/2 -translate-x-1/2";

  return (
    <div
      ref={cardRef}
      className={`group relative shrink-0 snap-start ${widthClass}`}
      onMouseEnter={openSoon}
      onMouseLeave={closeSoon}
    >
      <Link
        to="/on-demand/$titleId"
        params={{ titleId: t.id }}
        className="block"
      >
        <div
          className={`relative rounded-xl overflow-hidden border border-border bg-elevated/50 transition ${
            portrait ? "aspect-[2/3]" : "aspect-video"
          }`}
        >
          <img
            src={t.cover}
            alt={t.title}
            loading="lazy"
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0" style={{ background: "var(--gradient-card)" }} />

          {rank && (
            <span className="absolute top-3 left-3 text-[11px] font-bold px-2 py-1 rounded bg-black/60 backdrop-blur">
              #{rank}
            </span>
          )}
          <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-black/60 backdrop-blur text-white/90">
            {t.kind}
          </span>

          {progress && progress.positionPct < 98 && (
            <div className="absolute inset-x-3 bottom-3">
              <div className="h-1 bg-white/20 rounded overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.max(4, progress.positionPct)}%` }}
                />
              </div>
            </div>
          )}

          {!progress && (
            <div className="absolute inset-x-0 bottom-0 p-3">
              <div className="text-sm font-semibold leading-tight line-clamp-2">{t.title}</div>
            </div>
          )}
        </div>
      </Link>

      {/* Hover preview */}
      {open && (
        <div
          className={`absolute z-30 top-0 w-[340px] ${previewPositionClass}`}
          style={{ transform: `translateY(-6%) ${align === "center" ? "translateX(-50%)" : ""}`.trim() }}
          onMouseEnter={cancelClose}
          onMouseLeave={closeSoon}
        >
          {/* offset trick for center */}
          <div
            className="rounded-xl overflow-hidden border border-border bg-elevated shadow-[var(--shadow-card)] animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="relative aspect-video">
              <img src={t.hero} alt="" className="size-full object-cover" />
              <video
                ref={videoRef}
                src={PREVIEW_VIDEO}
                loop
                playsInline
                muted
                className="absolute inset-0 size-full object-cover"
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 20%, oklch(0 0 0 / 0.85) 100%)",
                }}
              />
              <button
                aria-label={muted ? "Unmute preview" : "Mute preview"}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMuted((m) => !m);
                }}
                className="absolute top-3 right-3 size-8 grid place-items-center rounded-full bg-black/70 backdrop-blur border border-white/10 hover:bg-black/90 transition"
              >
                {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
              </button>
              <div className="absolute inset-x-3 bottom-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Link
                    to="/on-demand/$titleId"
                    params={{ titleId: t.id }}
                    className="size-9 grid place-items-center rounded-full bg-white text-background hover:bg-white/90 transition"
                    aria-label="Play"
                  >
                    <Play className="size-4 fill-current ml-0.5" />
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggle(t.id);
                    }}
                    className={`size-9 grid place-items-center rounded-full border transition ${
                      inList
                        ? "bg-primary/90 border-primary"
                        : "bg-black/60 border-white/20 hover:bg-black/80"
                    }`}
                    aria-label={inList ? "Remove from My List" : "Add to My List"}
                  >
                    {inList ? <Check className="size-4" /> : <Plus className="size-4" />}
                  </button>
                  <ShareMenu title={t.title} path={`/on-demand/${t.id}`} />
                </div>
                <Link
                  to="/on-demand/$titleId"
                  params={{ titleId: t.id }}
                  className="size-9 grid place-items-center rounded-full bg-black/60 border border-white/20 hover:bg-black/80 transition"
                  aria-label="More info"
                >
                  <Info className="size-4" />
                </Link>
              </div>
            </div>
            <div className="p-3">
              <div className="text-sm font-semibold leading-tight line-clamp-1">{t.title}</div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-[color:var(--muted-foreground)]">
                <span className="px-1.5 py-0.5 rounded border border-border">{t.rating}</span>
                <span>{t.year}</span>
                <span>·</span>
                <span>{t.duration}</span>
              </div>
              <p className="mt-2 text-xs text-[color:var(--secondary-foreground)] line-clamp-3">
                {t.synopsis}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
