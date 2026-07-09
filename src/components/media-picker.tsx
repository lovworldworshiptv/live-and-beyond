import { useState, useRef } from "react";
import { Upload, Loader2, X, Image as ImageIcon, Film } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  accept?: string;
  folder?: string;
  label?: string;
  kind?: "image" | "video";
};

export function MediaPicker({
  value,
  onChange,
  accept,
  folder = "uploads",
  label = "Upload or paste URL",
  kind = "image",
}: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const defaultAccept = kind === "video" ? "video/*" : "image/*";

  async function handleFile(file: File) {
    setUploading(true);
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
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const Icon = kind === "video" ? Film : ImageIcon;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder={label}
          className="flex-1 h-10 px-3 rounded-md bg-elevated border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 h-10 px-3 rounded-md bg-primary/15 hover:bg-primary/25 text-primary text-xs font-semibold disabled:opacity-60"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {uploading ? "Uploading…" : "Upload"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="size-10 grid place-items-center rounded-md hover:bg-elevated text-[color:var(--muted-foreground)]"
            aria-label="Clear"
          >
            <X className="size-4" />
          </button>
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
            <img src={value} alt="preview" className="w-full max-h-40 object-cover" />
          )}
        </div>
      )}
    </div>
  );
}
