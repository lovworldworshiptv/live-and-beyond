import { Share2, Link as LinkIcon, Twitter, Facebook, MessageCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function ShareMenu({
  title,
  path,
  variant = "icon",
}: {
  title: string;
  path: string;
  variant?: "icon" | "chip";
}) {
  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

  const copyLink = async (e: Event) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied", { description: title });
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <button
          aria-label="Share"
          className={
            variant === "icon"
              ? "size-8 grid place-items-center rounded-full bg-black/60 backdrop-blur border border-white/10 hover:bg-black/80 transition"
              : "inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-black/60 backdrop-blur border border-white/10 hover:bg-black/80 transition text-xs font-medium"
          }
        >
          <Share2 className="size-3.5" />
          {variant === "chip" && <span>Share</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onClick={(e) => e.stopPropagation()}
        className="w-56"
      >
        <DropdownMenuLabel className="truncate">Share {title}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={copyLink}>
          <LinkIcon className="size-4" /> Copy link
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`}
            target="_blank"
            rel="noreferrer"
          >
            <Twitter className="size-4" /> Post to X
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noreferrer"
          >
            <Facebook className="size-4" /> Share to Facebook
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(title + " " + shareUrl)}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle className="size-4" /> WhatsApp
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
