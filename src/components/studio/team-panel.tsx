import { useCallback, useEffect, useState } from "react";
import { Loader2, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Member = {
  id: string;
  user_id: string;
  role: string;
  invited_email: string | null;
  created_at: string;
};

type Profile = { id: string; display_name: string | null; handle: string | null };

const ROLES = [
  { value: "manager", label: "Manager — full studio access" },
  { value: "editor", label: "Editor — content and schedule" },
] as const;

export function TeamPanel({ channelId }: { channelId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [handle, setHandle] = useState("");
  const [role, setRole] = useState<string>("editor");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("channel_members")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true });
    const rows = (data ?? []) as unknown as Member[];
    setMembers(rows);
    if (rows.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name, handle")
        .in("id", rows.map((m) => m.user_id));
      setProfiles(Object.fromEntries(((profs ?? []) as Profile[]).map((p) => [p.id, p])));
    } else {
      setProfiles({});
    }
    setLoading(false);
  }, [channelId]);

  useEffect(() => { load(); }, [load]);

  async function addMember() {
    const q = handle.trim().replace(/^@/, "");
    if (!q) return;
    setBusy(true);
    try {
      const { data: found } = await supabase
        .from("profiles")
        .select("id, display_name, handle")
        .or(`handle.eq.${q},display_name.eq.${q}`)
        .maybeSingle();
      if (!found) {
        toast.error("No Lettflix profile found with that handle. Ask them to sign up first.");
        return;
      }
      const { error } = await supabase.from("channel_members").insert({
        channel_id: channelId,
        user_id: (found as Profile).id,
        role,
      } as never);
      if (error) throw error;
      setHandle("");
      toast.success("Team member added");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add member");
    } finally { setBusy(false); }
  }

  async function updateRole(id: string, next: string) {
    const { error } = await supabase.from("channel_members").update({ role: next } as never).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Role updated");
    load();
  }

  async function removeMember(id: string) {
    const { error } = await supabase.from("channel_members").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Member removed");
    load();
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <section className="rounded-2xl border border-border bg-elevated/40 p-6">
        <h3 className="text-lg font-bold inline-flex items-center gap-2">
          <Users className="size-5 text-primary" /> Creator team
        </h3>
        <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
          Invite people to run your channel with you. Managers get full studio access; editors manage
          content, playlists and programming.
        </p>

        <div className="mt-5 flex flex-col sm:flex-row gap-2">
          <input
            className="flex-1 h-11 px-3 rounded-md bg-surface border border-border text-sm outline-none focus:border-primary"
            placeholder="Lettflix handle, e.g. @grace"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
          />
          <select
            className="h-11 px-3 rounded-md bg-surface border border-border text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button
            onClick={addMember}
            disabled={busy}
            className="h-11 px-5 rounded-md bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} Add
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-elevated/40 divide-y divide-border">
        {loading && <div className="p-8 grid place-items-center"><Loader2 className="size-5 animate-spin text-primary" /></div>}
        {!loading && !members.length && (
          <p className="p-6 text-sm text-[color:var(--muted-foreground)]">
            No team members yet — you're running this channel solo.
          </p>
        )}
        {members.map((m) => {
          const p = profiles[m.user_id];
          return (
            <div key={m.id} className="flex items-center gap-3 p-4">
              <div className="size-9 rounded-md bg-[image:var(--gradient-live)] grid place-items-center text-primary-foreground text-sm font-bold">
                {(p?.display_name ?? p?.handle ?? "?").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{p?.display_name ?? "Lettflix member"}</div>
                <div className="text-xs text-[color:var(--muted-foreground)] truncate">
                  {p?.handle ? `@${p.handle}` : m.invited_email ?? m.user_id.slice(0, 8)}
                </div>
              </div>
              <select
                className="h-9 px-2 rounded-md bg-surface border border-border text-xs"
                value={m.role}
                onChange={(e) => updateRole(m.id, e.target.value)}
              >
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.value}</option>)}
              </select>
              <button
                onClick={() => removeMember(m.id)}
                aria-label="Remove member"
                className="size-9 grid place-items-center rounded-md border border-border bg-surface text-primary hover:bg-elevated"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          );
        })}
      </section>
    </div>
  );
}
