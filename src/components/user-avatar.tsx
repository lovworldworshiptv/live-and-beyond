import { User } from "lucide-react";
import { cn } from "@/lib/utils";

export function UserAvatar({
  src,
  name,
  className,
}: {
  src: string | null | undefined;
  name?: string | null;
  className?: string;
}) {
  const initial = name?.trim().charAt(0).toUpperCase();
  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-[image:var(--gradient-live)] text-primary-foreground font-semibold",
        className
      )}
    >
      {src ? (
        <img src={src} alt={name ? `${name}'s profile photo` : "Profile photo"} className="size-full object-cover" />
      ) : initial ? (
        <span aria-hidden>{initial}</span>
      ) : (
        <User className="size-1/2" aria-hidden />
      )}
    </span>
  );
}
