import { Link } from "@tanstack/react-router";
import { Play, Plus, Check, Info, Volume2, VolumeX } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMyList, useProgress } from "@/lib/personal";
import { useHlsAttach } from "@/hooks/use-hls";
import { ShareMenu } from "./share-menu";
import type { Title } from "@/lib/catalog";

const PREVIEW_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

const PREVIEW_WIDTH = 340;

export function TitleCard({
  t,
  rank,
  portrait = true,
  size = "md",
  preview = true,
}: {
  t: Title;
  rank?: number;
  portrait?: boolean;
  size?: "sm" | "md" | "lg";
  preview?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { has, toggle } = useMyList();
  const { items, setProgress } = useProgress();
  const progress = items.find((i) => i.titleId === t.id);
  const inList = has(t.id);

  const clearTimers = () => {
    if (openTimer.current) window.clearTimeout(openTimer.current);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  };
  const openSoon = () => {
    clearTimers();
    openTimer.current = window.setTimeout(() => setOpen(true), 320);
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

  // Compute fixed position for the preview based on card rect
  useLayoutEffect(() => {
    if (!open || !cardRef.current) return;
    const compute = () => {
      const rect = cardRef.current!.getBoundingClientRect();
      const vw = window.innerWidth;
      const gutter = 12;
      let left = rect.left + rect.width / 2 - PREVIEW_WIDTH / 2;
      if (left < gutter) left = gutter;
      if (left + PREVIEW_WIDTH > vw - gutter) left = vw - gutter - PREVIEW_WIDTH;
      // Preview roughly 360px tall; try to open upward slightly overlapping the card
      const previewHeight = 380;
      let top = rect.top - 24;
      if (top < gutter) top = rect.top + rect.height + 8;
      if (top + previewHeight > window.innerHeight - gutter) {
        top = Math.max(gutter, window.innerHeight - gutter - previewHeight);
      }
      setPos({ left, top });
    };
    compute();
    window.addEventListener("scroll", compute, true);
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute, true);
      window.removeEventListener("resize", compute);
    };
  }, [open]);

  const previewSrc = t.streamUrl || PREVIEW_VIDEO;
  useHlsAttach(videoRef as React.MutableRefObject<HTMLVideoElement | HTMLAudioElement | null>, previewSrc, open);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (open) {
      v.muted = muted;
      v.play().catch(() => {});
    } else {
      v.pause();
      try { v.currentTime = 0; } catch { /* ignore */ }
    }
  }, [open, muted]);

  const widthClass = !portrait ? (size === "lg" ? "w-[340px]" : "w-[260px]") : "";

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
        onClick={() => setProgress(t.id, Math.max(progress?.positionPct ?? 0, 8))}
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
                <div className="h-full bg-primary" style={{ width: `${Math.max(4, progress.positionPct)}%` }} />
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

      {/* Hover preview — portaled + fixed so it never gets clipped by scroll rows */}
      {open && pos && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed z-[100]"
            style={{ left: pos.left, top: pos.top, width: PREVIEW_WIDTH }}
            onMouseEnter={cancelClose}
            onMouseLeave={closeSoon}
          >
            <div className="rounded-xl overflow-hidden border border-border bg-elevated shadow-[var(--shadow-card)] animate-in fade-in zoom-in-95 duration-150">
              <div className="relative aspect-video">
                <img src={t.hero} alt="" className="size-full object-cover" />
                <video
                  ref={videoRef}
                  loop
                  playsInline
                  muted
                  className="absolute inset-0 size-full object-cover"
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(180deg, transparent 20%, oklch(0 0 0 / 0.85) 100%)" }}
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
                      onClick={() => setProgress(t.id, Math.max(progress?.positionPct ?? 0, 12))}
                      className="size-11 grid place-items-center rounded-full bg-white text-background hover:bg-white/90 transition"
                      style={{
                        boxShadow: "0 0 0 3px oklch(0.55 0.22 25 / 0.3), 0 0 20px oklch(0.55 0.22 25 / 0.4), 0 0 45px oklch(0.55 0.22 25 / 0.18)",
                      }}
                      aria-label="Play"
                    >
                      <Play className="size-5 fill-current ml-0.5" />
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggle(t.id);
                      }}
                      className={`size-9 grid place-items-center rounded-full border transition ${
                        inList ? "bg-primary/90 border-primary" : "bg-black/60 border-white/20 hover:bg-black/80"
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
                <p className="mt-2 text-xs text-[color:var(--secondary-foreground)] line-clamp-3">{t.synopsis}</p>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
