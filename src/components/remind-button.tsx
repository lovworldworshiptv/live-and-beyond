import { Bell, BellRing } from "lucide-react";
import { useReminders } from "@/lib/personal";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function RemindButton({
  channelId,
  time,
  title,
  variant = "icon",
}: {
  channelId: string;
  time: string;
  title: string;
  variant?: "icon" | "chip" | "full";
}) {
  const { has, toggle } = useReminders();
  const id = `${channelId}::${time}::${title}`;
  const active = has(id);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle({ id, channelId, time, title });
    if (!active) {
      toast.success("Reminder saved", { description: `Saved on this device · ${title}` });
    } else {
      toast("Reminder removed", { description: title });
    }
  };

  const Icon = active ? BellRing : Bell;
  if (variant === "icon") {
    return (
      <Button variant="ghost"
        aria-label={active ? "Remove reminder" : "Set reminder"}
        onClick={onClick}
        className={`size-11 grid place-items-center rounded-full backdrop-blur border transition ${
          active
            ? "bg-primary/90 border-primary text-primary-foreground"
            : "bg-background/60 border-foreground/10 hover:bg-background/80"
        }`}
      >
        <Icon className="size-3.5" />
      </Button>
    );
  }
  if (variant === "chip") {
    return (
      <Button variant="ghost"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 h-11 px-3 rounded-full backdrop-blur border transition text-xs font-medium ${
          active
            ? "bg-primary/90 border-primary text-primary-foreground"
            : "bg-background/60 border-foreground/10 hover:bg-background/80"
        }`}
      >
        <Icon className="size-3.5" /> {active ? "Reminder set" : "Remind me"}
      </Button>
    );
  }
  return (
    <Button variant="ghost"
      onClick={onClick}
      className={`inline-flex items-center gap-2 h-11 px-4 rounded-md border transition text-sm font-medium ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-elevated border-border hover:bg-elevated/80"
      }`}
    >
      <Icon className="size-4" /> {active ? "Reminder set" : "Remind me"}
    </Button>
  );
}
