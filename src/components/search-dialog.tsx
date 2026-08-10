import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Radio, Tv, Film } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useCmsChannels, useCmsTitles } from "@/lib/cms-catalog";

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const { channels } = useCmsChannels();
  const { titles } = useCmsTitles();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const q = query.trim().toLowerCase();

  const channelResults = useMemo(
    () =>
      channels
        .filter(
          (c) =>
            q === "" ||
            c.name.toLowerCase().includes(q) ||
            c.category.toLowerCase().includes(q) ||
            (c.tagline ?? "").toLowerCase().includes(q)
        )
        .slice(0, 6),
    [channels, q]
  );

  const titleResults = useMemo(
    () =>
      titles
        .filter(
          (t) =>
            q === "" ||
            t.title.toLowerCase().includes(q) ||
            (t.category ?? "").toLowerCase().includes(q) ||
            t.kind.toLowerCase().includes(q)
        )
        .slice(0, 6),
    [titles, q]
  );

  function go(to: string) {
    onOpenChange(false);
    navigate({ to: to as never });
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search titles, channels, podcasts…"
      />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>No results found.</CommandEmpty>

        {channelResults.length > 0 && (
          <CommandGroup heading="Channels">
            {channelResults.map((c) => (
              <CommandItem
                key={c.id}
                value={`channel ${c.name} ${c.category}`}
                onSelect={() => go(`/channels/${c.id}`)}
              >
                {c.streamKind === "radio" ? (
                  <Radio className="size-4 shrink-0" />
                ) : (
                  <Tv className="size-4 shrink-0" />
                )}
                <span className="truncate">{c.name}</span>
                <span className="ml-auto shrink-0 text-xs text-[color:var(--muted-foreground)]">
                  {c.category}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {titleResults.length > 0 && (
          <CommandGroup heading="On Demand">
            {titleResults.map((t) => (
              <CommandItem
                key={t.id}
                value={`title ${t.title} ${t.kind}`}
                onSelect={() => go(`/on-demand/${t.id}`)}
              >
                <Film className="size-4 shrink-0" />
                <span className="truncate">{t.title}</span>
                <span className="ml-auto shrink-0 text-xs text-[color:var(--muted-foreground)]">
                  {t.kind}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
