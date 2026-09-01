import { useEffect, useRef, useState } from "react";
import { Settings2, Check } from "lucide-react";
import type { HlsController } from "@/hooks/use-hls";

/**
 * Rendition picker for adaptive streams. Only qualities the source actually
 * advertises are listed; Auto is always the default.
 */
export function QualityMenu({ controller, className }: { controller: HlsController; className?: string }) {
  const { levels, selected, active, setLevel, native } = controller;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (native) return null; // Safari/iOS handles ABR natively — no rendition list is exposed.
  if (levels.length < 1) return null;

  const activeLabel = levels.find((l) => l.index === active)?.label;
  const selectedLabel = selected === -1 ? null : levels.find((l) => l.index === selected)?.label;
  const current = selectedLabel ?? (activeLabel ? `Auto · ${activeLabel}` : "Auto");

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-9 px-3 rounded-md bg-black/75 backdrop-blur text-white text-[12px] font-semibold inline-flex items-center gap-1.5 hover:bg-black/90 border border-white/15"
        aria-label="Quality"
        title="Quality"
      >
        <Settings2 className="size-4" />
        <span className="hidden sm:inline">Quality</span>
        <span className="text-white/60 font-medium">{current}</span>
      </button>
      {open && (
        <div className="absolute right-0 bottom-11 min-w-[170px] rounded-lg border border-white/15 bg-black/95 backdrop-blur p-1 shadow-xl z-30">
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-white/45">Quality</div>
          <MenuItem
            label={activeLabel ? `Auto (${activeLabel})` : "Auto"}
            checked={selected === -1}
            onClick={() => { setLevel(-1); setOpen(false); }}
          />
          {levels.map((l) => (
            <MenuItem
              key={l.index}
              label={l.label}
              checked={selected === l.index}
              onClick={() => { setLevel(l.index); setOpen(false); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}


function MenuItem({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 px-3 h-8 rounded text-[12px] text-white/90 hover:bg-white/10"
    >
      {label}
      {checked && <Check className="size-3.5 text-primary" />}
    </button>
  );
}
