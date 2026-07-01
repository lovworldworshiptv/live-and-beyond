import { Link } from "@tanstack/react-router";
import { Play, Plus, Check, Info } from "lucide-react";
import { useState, useRef } from "react";
import { useMyList, useProgress } from "@/lib/personal";
import { ShareMenu } from "./share-menu";
import type { Title } from "@/lib/catalog";

/**
 * Netflix-style hover-preview card for on-demand titles.
 * Portrait poster; on hover, expands into a wider preview with metadata
 * and quick actions (Play / My List / Info / Share).
 */
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
  const timer = useRef<number | null>(null);
  const { has, toggle } = useMyList();
  const { items } = useProgress();
  const progress = items.find((i) => i.titleId === t.id);
  const inList = has(t.id);

  const openSoon = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), 350);
  };
  const closeNow = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setOpen(false);
  };

  const widthClass =
    !portrait
      ? size === "lg"
        ? "w-[340px]"
        : "w-[260px]"
      : "";

  return (
    <div
      className={`group relative shrink-0 snap-start ${widthClass}`}
      onMouseEnter={openSoon}
      onMouseLeave={closeNow}
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
          className="pointer-events-none absolute z-30 top-0 left-1/2 -translate-x-1/2 w-[340px]"
          style={{ transform: "translate(-50%, -6%)" }}
        >
          <div
            className="pointer-events-auto rounded-xl overflow-hidden border border-border bg-elevated shadow-[var(--shadow-card)] animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="relative aspect-video">
              <img src={t.hero} alt="" className="size-full object-cover" />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 20%, oklch(0 0 0 / 0.85) 100%)",
                }}
              />
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
