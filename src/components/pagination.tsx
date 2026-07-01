import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages: (number | "…")[] = [];
  const window = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= window) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page === 1}
        className="size-9 grid place-items-center rounded-md bg-elevated/70 border border-border hover:bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition"
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-[color:var(--muted-foreground)]">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`min-w-9 h-9 px-3 rounded-md text-sm font-medium border transition ${
              p === page
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-elevated/70 border-border text-[color:var(--secondary-foreground)] hover:text-foreground hover:bg-elevated"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPage(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="size-9 grid place-items-center rounded-md bg-elevated/70 border border-border hover:bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition"
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
