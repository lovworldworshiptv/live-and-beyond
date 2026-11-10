import { useFeature } from "@/lib/feature-flags";
import { useEffect, useState } from "react";
import {
  Share2, Link as LinkIcon, Twitter, Facebook, MessageCircle, Send, Linkedin, Mail,
  MessageSquare, QrCode, Smartphone, Download, Loader2,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createShareCard } from "@/lib/share-card";

export function ShareMenu(props: Parameters<typeof ShareMenuInner>[0]) {
  return useFeature("share") ? <ShareMenuInner {...props} /> : null;
}

function ShareMenuInner({
  title,
  path,
  image,
  subtitle,
  variant = "icon",
}: {
  title: string;
  path: string;
  image?: string | null;
  subtitle?: string;
  variant?: "icon" | "chip";
}) {
  const [cardOpen, setCardOpen] = useState(false);
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
  const text = `Watch ${title} on Lettflix`;
  const u = encodeURIComponent(shareUrl);
  const t = encodeURIComponent(text);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied", { description: title });
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  const nativeShare = async () => {
    if (!navigator.share) return copyLink();
    try {
      await navigator.share({ title, text, url: shareUrl });
    } catch {
      /* cancelled */
    }
  };

  const links = [
    { label: "WhatsApp", icon: MessageCircle, href: `https://wa.me/?text=${t}%20${u}` },
    { label: "X (Twitter)", icon: Twitter, href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { label: "Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { label: "Telegram", icon: Send, href: `https://t.me/share/url?url=${u}&text=${t}` },
    { label: "LinkedIn", icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { label: "Text message", icon: MessageSquare, href: `sms:?&body=${t}%20${u}` },
    { label: "Email", icon: Mail, href: `mailto:?subject=${encodeURIComponent(title)}&body=${t}%20${u}` },
  ];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button
            aria-label="Share"
            className={
              variant === "icon"
                ? "size-8 grid place-items-center rounded-full bg-background/60 backdrop-blur border border-border hover:bg-background/80 transition"
                : "inline-flex items-center justify-center gap-1.5 h-10 w-full rounded-lg bg-elevated border border-border hover:bg-elevated/80 transition text-xs font-medium"
            }
          >
            <Share2 className="size-3.5" />
            {variant === "chip" && <span>Share</span>}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()} className="w-60 max-h-[70svh] overflow-y-auto">
          <DropdownMenuLabel className="truncate">Share {title}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCardOpen(true)}>
            <QrCode className="size-4" /> Share card &amp; QR code
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setCardOpen(true)}>
            <Smartphone className="size-4" /> Share to stories &amp; status
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={nativeShare}>
            <Share2 className="size-4" /> More apps…
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={copyLink}>
            <LinkIcon className="size-4" /> Copy link
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {links.map(({ label, icon: Icon, href }) => (
            <DropdownMenuItem key={label} asChild>
              <a href={href} target="_blank" rel="noreferrer">
                <Icon className="size-4" /> {label}
              </a>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <ShareCardDialog
        open={cardOpen}
        onOpenChange={setCardOpen}
        title={title}
        subtitle={subtitle}
        url={shareUrl}
        image={image}
      />
    </>
  );
}

function ShareCardDialog({
  open, onOpenChange, title, subtitle, url, image,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  subtitle?: string;
  url: string;
  image?: string | null;
}) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    const build = async () => {
      let b: Blob;
      try {
        b = await createShareCard({ title, subtitle, url, image });
      } catch {
        // Artwork blocked by its host: still produce a branded card with the QR code.
        b = await createShareCard({ title, subtitle, url, image: null });
      }
      if (cancelled) return;
      objectUrl = URL.createObjectURL(b);
      setBlob(b);
      setPreview(objectUrl);
    };
    void build();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setBlob(null);
      setPreview(null);
    };
  }, [open, title, subtitle, url, image]);

  const fileName = `lettflix-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;

  const shareImage = async () => {
    if (!blob) return;
    const file = new File([blob], fileName, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title, text: `Watch ${title} on Lettflix ${url}` });
      } catch {
        /* cancelled */
      }
    } else {
      download();
      toast("Card saved", { description: "Post it to your story or status from your gallery." });
    }
  };

  const download = () => {
    if (!preview) return;
    const a = document.createElement("a");
    a.href = preview;
    a.download = fileName;
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Share card</DialogTitle>
          <DialogDescription>Post to Instagram, WhatsApp or Facebook stories. Friends scan the code to watch.</DialogDescription>
        </DialogHeader>
        <div className="mx-auto aspect-[9/16] w-full max-w-[220px] overflow-hidden rounded-xl border border-border bg-elevated grid place-items-center">
          {preview ? (
            <img src={preview} alt={`Share card for ${title}`} className="size-full object-contain" />
          ) : (
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={shareImage} disabled={!blob}>
            <Smartphone className="size-4" /> Share to story
          </Button>
          <Button variant="outline" onClick={download} disabled={!preview}>
            <Download className="size-4" /> Save image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
