import { useRef, useState } from "react";
import { Check, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/user-avatar";
import { AVATAR_PRESETS, resolveAvatar, useAccountProfile } from "@/lib/account-profile";
import { cn } from "@/lib/utils";

/** Inline chooser: male / female presets, upload your own photo, or remove. */
export function AvatarChooser({ onDone }: { onDone?: () => void }) {
  const { profile, update, uploadAvatar } = useAccountProfile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const current = profile?.avatar_url ?? null;
  const isUpload = !!current && !current.startsWith("preset:");

  async function choose(key: string | null) {
    setBusy(key ?? "remove");
    const err = await update({ avatar_url: key });
    setBusy(null);
    if (err) return toast.error(err);
    toast.success(key ? "Avatar updated" : "Avatar removed");
    onDone?.();
  }

  async function onFile(file: File) {
    setBusy("upload");
    const err = await uploadAvatar(file);
    setBusy(null);
    if (inputRef.current) inputRef.current.value = "";
    if (err) return toast.error(err);
    toast.success("Photo uploaded");
    onDone?.();
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-3 gap-3">
        {AVATAR_PRESETS.map((p) => {
          const selected = current === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => void choose(p.key)}
              disabled={!!busy}
              aria-pressed={selected}
              className={cn(
                "group relative flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all duration-200 disabled:opacity-60",
                selected
                  ? "border-accent bg-accent/10"
                  : "border-border bg-surface/60 hover:border-foreground/30 hover:-translate-y-0.5"
              )}
            >
              <span className="relative">
                <img
                  src={p.src}
                  alt={`${p.label} avatar`}
                  loading="lazy"
                  width={384}
                  height={384}
                  className="size-16 sm:size-20 rounded-full object-cover ring-2 ring-border transition group-hover:ring-foreground/30"
                />
                {selected && (
                  <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-accent text-accent-foreground ring-2 ring-background">
                    <Check className="size-3.5" />
                  </span>
                )}
                {busy === p.key && (
                  <span className="absolute inset-0 grid place-items-center rounded-full bg-background/60">
                    <Loader2 className="size-5 animate-spin" />
                  </span>
                )}
              </span>
              <span className="text-sm font-medium">{p.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={!!busy}
          aria-pressed={isUpload}
          className={cn(
            "group relative flex flex-col items-center gap-2 rounded-2xl border border-dashed p-3 transition-all duration-200 disabled:opacity-60",
            isUpload ? "border-accent bg-accent/10" : "border-border hover:border-foreground/40 hover:-translate-y-0.5"
          )}
        >
          <span className="relative grid size-16 sm:size-20 place-items-center overflow-hidden rounded-full bg-elevated text-muted-foreground ring-2 ring-border">
            {isUpload ? (
              <img src={resolveAvatar(current) ?? ""} alt="Your uploaded photo" className="size-full object-cover" />
            ) : (
              <ImagePlus className="size-6" />
            )}
            {busy === "upload" && (
              <span className="absolute inset-0 grid place-items-center bg-background/60">
                <Loader2 className="size-5 animate-spin" />
              </span>
            )}
          </span>
          <span className="text-sm font-medium">{isUpload ? "Change photo" : "Upload photo"}</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">JPG, PNG, WebP or GIF · up to 5 MB</p>
        {current && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!!busy}
            onClick={() => void choose(null)}
            className="text-muted-foreground"
          >
            {busy === "remove" ? <Loader2 className="animate-spin" /> : <Trash2 />} Remove
          </Button>
        )}
      </div>
    </div>
  );
}

export function AvatarPickerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { profile, avatarSrc } = useAccountProfile();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <UserAvatar src={avatarSrc} name={profile?.display_name} className="size-20 text-2xl ring-4 ring-accent/30 mb-2" />
          <DialogTitle>Choose your avatar</DialogTitle>
          <DialogDescription>Pick a male or female avatar, or upload your own photo.</DialogDescription>
        </DialogHeader>
        <AvatarChooser onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
