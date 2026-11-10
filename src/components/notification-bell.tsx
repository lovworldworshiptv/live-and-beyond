import { Bell, Smartphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { enablePush } from "@/lib/push";
import { Link } from "@tanstack/react-router";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/lib/notifications";
import { useAuth } from "@/hooks/use-auth";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function NotificationBell() {
  const { user } = useAuth();
  const { items, unread, markAllRead } = useNotifications();
  const [pushBusy, setPushBusy] = useState(false);

  const onEnablePush = async () => {
    setPushBusy(true);
    try {
      const result = await enablePush();
      if (result.status === "registered") toast.success("This device now receives phone alerts.");
      else if (result.status === "open-in-new-tab") toast.info("Open Lettflix in its own browser tab to allow notifications.");
      else if (result.status === "denied") toast.error("Notifications are blocked — allow them in your browser's site settings.");
      else if (result.status === "not-configured") toast.info("Phone alerts are not connected yet; in-app messages still work.");
      else toast.info("This browser does not support notifications.");
    } finally {
      setPushBusy(false);
    }
  };

  if (!user) {
    return (
      <Link
        to="/auth"
        className="size-9 grid place-items-center rounded-md hover:bg-elevated transition"
        aria-label="Notifications"
      >
        <Bell className="size-4" />
      </Link>
    );
  }

  return (
    <DropdownMenu onOpenChange={(open) => { if (open) markAllRead(); }}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative size-9 grid place-items-center rounded-md hover:bg-elevated transition"
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!items.length && (
          <p className="px-3 py-6 text-sm text-[color:var(--muted-foreground)] text-center">
            Nothing yet. Follow channels to hear when they go live.
          </p>
        )}
        {items.map((n) => {
          const body = (
            <div className="px-3 py-2.5 rounded-lg hover:bg-elevated/60 transition">
              <div className="flex items-start gap-2">
                {!n.read_at && <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />}
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{n.title}</div>
                  {n.body && (
                    <div className="text-xs text-[color:var(--muted-foreground)] line-clamp-2">{n.body}</div>
                  )}
                  <div className="mt-0.5 text-[11px] text-[color:var(--muted-foreground)]">
                    {timeAgo(n.created_at)}
                  </div>
                </div>
              </div>
            </div>
          );
          return n.link ? (
            <a key={n.id} href={n.link} className="block">{body}</a>
          ) : (
            <div key={n.id}>{body}</div>
          );
        })}
        <DropdownMenuSeparator />
        <button
          onClick={onEnablePush}
          disabled={pushBusy}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-[color:var(--muted-foreground)] hover:bg-elevated/60 transition"
        >
          <Smartphone className="size-3.5" />
          {pushBusy ? "Enabling…" : "Enable phone alerts on this device"}
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
