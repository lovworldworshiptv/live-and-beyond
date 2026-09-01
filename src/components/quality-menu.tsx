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
  if (levels.length < 2) return null;

  const activeLabel = levels.find((l) => l.index === active)?.label;
  const current =
    selected === -1 ? (activeLabel ? `Auto · ${activeLabel}` : "Auto") : levels.find((l) => l.index === selected)?.label ?? "Auto";

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-8 px-3 rounded-md bg-black/70 backdrop-blur text-white text-[11px] font-semibold inline-flex items-center gap-1.5 hover:bg-black/85"
        aria-label="Video quality"
      >
        <Settings2 className="size-3.5" /> {current}
      </button>
      {open && (
        <div className="absolute right-0 bottom-10 min-w-[150px] rounded-lg border border-white/15 bg-black/90 backdrop-blur p-1 shadow-xl">
          <MenuItem label="Auto" checked={selected === -1} onClick={() => { setLevel(-1); setOpen(false); }} />
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
