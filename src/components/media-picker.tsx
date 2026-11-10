import { useState, useRef } from "react";
import { Upload, Loader2, X, Image as ImageIcon, Film } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Props = {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  accept?: string;
  folder?: string;
  label?: string;
  kind?: "image" | "video";
  previewAspect?: "video";
  onUploadingChange?: (uploading: boolean) => void;
};

export function MediaPicker({
  value,
  onChange,
  accept,
  folder = "uploads",
  label = "Upload or paste URL",
  kind = "image",
  previewAspect,
  onUploadingChange,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const defaultAccept = kind === "video" ? "video/*" : "image/*";

  async function handleFile(file: File) {
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("media")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage
        .from("media")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (sErr) throw sErr;
      onChange(signed.signedUrl);
      toast.success("Uploaded");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const Icon = kind === "video" ? Film : ImageIcon;

  return (
    <div className="min-w-0 space-y-2" aria-busy={uploading}>
      <div className="flex min-w-0 gap-2">
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder={label}
          aria-label={label}
          disabled={uploading}
          className="min-w-0 flex-1 h-10 px-3 rounded-md bg-elevated border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <Button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          aria-label={`Upload ${label}`}
          className="shrink-0 h-10 px-3 text-xs"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {uploading ? "Uploading…" : "Upload"}
        </Button>
        {value && (
          <Button
            type="button"
            onClick={() => onChange(null)}
            variant="ghost"
            size="icon"
            disabled={uploading}
            className="size-10 shrink-0 text-muted-foreground"
            aria-label={`Clear ${label}`}
          >
            <X className="size-4" />
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept ?? defaultAccept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>
      {value && (
        <div className="rounded-md border border-border bg-elevated/40 overflow-hidden">
          {kind === "video" ? (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-[color:var(--muted-foreground)]">
              <Icon className="size-4" /> <span className="truncate">{value}</span>
            </div>
          ) : (
             <img src={value} alt={`${label} preview`} className={`w-full ${previewAspect === "video" ? "aspect-video object-contain" : `max-h-40 ${folder.startsWith("channels/") || folder.startsWith("radio/") ? "object-contain" : "object-cover"}`}`} />
          )}
        </div>
      )}
    </div>
  );
}
