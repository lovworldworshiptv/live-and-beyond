import { BrandLoader } from "@/components/brand-loader";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Send, CheckCircle, XCircle, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MediaPicker } from "@/components/media-picker";
import { listAdminNotifications, sendAdminNotification } from "@/lib/admin-notifications.functions";
import { enablePush } from "@/lib/push";

type Campaign = {
  id: string;
  title: string;
  body: string;
  segment: string;
  status: string;
  recipient_count: number;
  push_count: number;
  created_at: string;
};

export function NotificationsCms() {
  const queryClient = useQueryClient();
  const fetchHistory = useServerFn(listAdminNotifications);
  const send = useServerFn(sendAdminNotification);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [link, setLink] = useState("");
  const [segment, setSegment] = useState("all");
  const [sending, setSending] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  const { data: history, isLoading } = useQuery({
    queryKey: ["admin-notification-campaigns"],
    queryFn: async () => (await fetchHistory()) as unknown as Campaign[],
  });

  const onSend = async () => {
    setSending(true);
    try {
      const result = (await send({
        data: { title, body, imageUrl, link, segment: segment as "all" | "creators" | "viewers" },
      })) as { recipients: number; pushed: number };
      toast.success(`Sent to ${result.recipients} people${result.pushed ? `, ${result.pushed} phone alerts` : ""}.`);
      setTitle(""); setBody(""); setImageUrl(""); setLink(""); setSegment("all");
      queryClient.invalidateQueries({ queryKey: ["admin-notification-campaigns"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the notification");
    } finally {
      setSending(false);
    }
  };

  const onEnablePush = async () => {
    setPushBusy(true);
    try {
      const result = await enablePush();
      if (result.status === "registered") toast.success("This device now receives phone alerts.");
      else if (result.status === "open-in-new-tab") toast.info("Open Lettflix in its own browser tab to allow notifications.");
      else if (result.status === "denied") toast.error("Notifications are blocked — allow them in your browser's site settings.");
      else if (result.status === "not-configured") toast.info("Phone alerts are not connected yet. In-app messages still work.");
      else toast.info("This browser does not support notifications.");
    } finally {
      setPushBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Send a notification</h2>
        </div>
        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
        <Textarea placeholder="Message" value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={500} />
        <MediaPicker label="Notification image (optional)" value={imageUrl} onChange={(url) => setImageUrl(url ?? "")} previewAspect="video" />
        <Input placeholder="Link (optional, e.g. /movies)" value={link} onChange={(e) => setLink(e.target.value)} />
        <div>
          <label className="mb-1 block text-sm text-[color:var(--muted-foreground)]">Audience</label>
          <Select value={segment} onValueChange={setSegment}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everyone</SelectItem>
              <SelectItem value="creators">Creators</SelectItem>
              <SelectItem value="viewers">Viewers</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onSend} disabled={!title.trim() || !body.trim() || sending} className="w-full">
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Send now
        </Button>
        <div className="rounded-lg border border-dashed border-border p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-[color:var(--muted-foreground)]">
              Phone alerts use this device's permission. Enable it here to test, and viewers can enable it from the bell menu.
            </p>
            <Button variant="outline" size="sm" onClick={onEnablePush} disabled={pushBusy}>
              {pushBusy ? <Loader2 className="size-4 animate-spin" /> : <Smartphone className="size-4" />}
              Enable
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold mb-4">History</h2>
        {isLoading ? (
          <BrandLoader variant="section" label="Loading history" />
        ) : !history?.length ? (
          <p className="py-10 text-center text-sm text-[color:var(--muted-foreground)]">No notifications sent yet.</p>
        ) : (
          <ul className="space-y-3">
            {history.map((n) => (
              <li key={n.id} className="flex items-start gap-3 rounded-lg bg-elevated/50 p-3">
                {n.status === "sent"
                  ? <CheckCircle className="mt-0.5 size-4 text-emerald-500 shrink-0" />
                  : <XCircle className="mt-0.5 size-4 text-destructive shrink-0" />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    <Badge variant="outline" className="text-[10px]">{n.segment}</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[color:var(--muted-foreground)]">{n.body}</p>
                  <p className="mt-1 text-[11px] text-[color:var(--muted-foreground)]">
                    {new Date(n.created_at).toLocaleString()} · {n.recipient_count} in-app · {n.push_count} phone
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
