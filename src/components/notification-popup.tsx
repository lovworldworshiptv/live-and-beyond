import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Megaphone } from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  image_url: string | null;
};

/** Shows the latest unread admin announcement as an in-app pop-up, once per message. */
export function NotificationPopup() {
  const { user } = useAuth();
  const [current, setCurrent] = useState<Announcement | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;

    const show = (n: Announcement) => {
      if (!active) return;
      const seenKey = `lettflix-announcement:${n.id}`;
      if (sessionStorage.getItem(seenKey)) return;
      sessionStorage.setItem(seenKey, "1");
      setCurrent(n);
    };

    // Latest unread announcement on load.
    supabase
      .from("notifications")
      .select("id, title, body, link, image_url")
      .eq("kind", "announcement")
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        const row = data?.[0] as unknown as Announcement | undefined;
        if (row) show(row);
      });

    // Live announcements while the app is open.
    const channel = supabase
      .channel(`announcements:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as unknown as Announcement & { kind: string };
          if (row.kind === "announcement") show(row);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!current) return null;

  const dismiss = async () => {
    const id = current.id;
    setCurrent(null);
    await supabase.from("notifications").update({ read_at: new Date().toISOString() } as never).eq("id", id);
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) dismiss(); }}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        {current.image_url && (
          <img src={current.image_url} alt="" className="aspect-video w-full object-cover" />
        )}
        <div className="p-6">
          <DialogHeader>
            <div className="mb-2 size-10 rounded-lg bg-primary/10 grid place-items-center">
              <Megaphone className="size-5 text-primary" />
            </div>
            <DialogTitle>{current.title}</DialogTitle>
            {current.body && <DialogDescription className="whitespace-pre-line">{current.body}</DialogDescription>}
          </DialogHeader>
          <DialogFooter className="mt-5 gap-2">
            {current.link && (
              <Button asChild>
                <a href={current.link} onClick={dismiss}>Open</a>
              </Button>
            )}
            <Button variant="outline" onClick={dismiss}>Dismiss</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
