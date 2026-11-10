import { Play } from "lucide-react";

/** Decorative only: the enclosing channel link retains the full tap target. */
export function ChannelPlayIndicator() {
  return (
    <div aria-hidden="true" className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none">
      <span className="channel-play-indicator size-6 shrink-0 rounded-full grid place-items-center">
        <Play className="size-3 shrink-0 text-background fill-current ml-px" />
      </span>
    </div>
  );
}