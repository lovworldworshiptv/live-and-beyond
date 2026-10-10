import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function Row({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    ref.current?.scrollBy({ left: dir * (ref.current.clientWidth * 0.85), behavior: "smooth" });
  };

  return (
    <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="text-xl lg:text-2xl font-semibold tracking-tight">{title}</h2>
          {subtitle && (
            <p className="text-sm text-[color:var(--muted-foreground)] mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {action}
          <div className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="icon"
              onClick={() => scroll(-1)}
              className="size-9 grid place-items-center rounded-full bg-elevated/70 hover:bg-elevated border border-border transition"
              aria-label="Scroll left"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="ghost" size="icon"
              onClick={() => scroll(1)}
              className="size-9 grid place-items-center rounded-full bg-elevated/70 hover:bg-elevated border border-border transition"
              aria-label="Scroll right"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto scrollbar-none media-rail snap-x snap-mandatory scroll-pl-6 lg:scroll-pl-10 -mx-6 lg:-mx-10 px-6 lg:px-10 pb-2"
      >
        {children}
      </div>
    </section>
  );
}
