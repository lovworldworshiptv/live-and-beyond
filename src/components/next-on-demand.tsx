import { useEffect, useRef, useState } from "react";
import { Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovieArtwork } from "@/components/movie-artwork";
import { startNextCountdown } from "@/lib/continuous-playback";
import { titleCase } from "@/lib/title-case";

export type NextOnDemandTitle = { id: string; title: string; cover: string; hero: string };

export function NextOnDemand({ title, onPlay, onCancel }: { title: NextOnDemandTitle; onPlay: () => void; onCancel: () => void }) {
  const [seconds, setSeconds] = useState(5);
  const callbacks = useRef({ onPlay, onCancel });
  callbacks.current = { onPlay, onCancel };
  useEffect(() => {
    const stop = startNextCountdown(setSeconds, () => callbacks.current.onPlay());
    const cancel = () => callbacks.current.onCancel();
    window.addEventListener("lettflix:playback-start", cancel);
    return () => { stop(); window.removeEventListener("lettflix:playback-start", cancel); };
  }, [title.id]);
  return (
    <div className="absolute inset-0 z-30 flex items-end justify-end bg-background/70 p-2 sm:p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-3 sm:p-4">
        <div className="flex min-w-0 items-center gap-3">
          <MovieArtwork src={title.cover} fallbackSrc={title.hero} alt="" className="aspect-video w-20 shrink-0 rounded object-contain sm:w-24" />
          <div className="min-w-0 flex-1">
            <p role="status" aria-live="polite" aria-atomic="true" className="text-xs text-muted-foreground">Up next in <span className="font-bold tabular-nums text-foreground">{seconds}</span></p>
            <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">{titleCase(title.title)}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onCancel}><X className="size-4" /> Cancel</Button>
          <Button size="sm" onClick={onPlay}><Play className="size-4 fill-current" /> Play now</Button>
        </div>
      </div>
    </div>
  );
}