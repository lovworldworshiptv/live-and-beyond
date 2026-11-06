import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import logoHorizontal from "@/assets/lettflix-horizontal.png.asset.json";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth } from "@/hooks/use-auth";
import { useAccountProfile } from "@/lib/account-profile";
import { MAX_PROFILES, useViewerProfiles } from "@/lib/viewer-profiles";

export const Route = createFileRoute("/profiles")({
  head: () => ({
    meta: [
      { title: "Who's watching? — Lettflix" },
      { name: "description", content: "Choose who's watching on this device, or add a profile for someone in your home." },
      { property: "og:title", content: "Who's watching? — Lettflix" },
      { property: "og:description", content: "Pick a viewing profile on Lettflix." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilesPage,
});

function ProfilesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile: account, avatarSrc } = useAccountProfile();
  const { profiles, select, add, rename, remove } = useViewerProfiles();
  const [manage, setManage] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [kids, setKids] = useState(false);
  const owner = account?.display_name || user?.email?.split("@")[0] || "You";

  const pick = (id: string | null) => {
    if (manage) return;
    if (id) select(id);
    navigate({ to: "/" });
  };

  const tile = "size-28 sm:size-36 rounded-lg overflow-hidden transition ring-offset-4 ring-offset-background group-hover:ring-2 group-hover:ring-foreground group-focus-visible:ring-2 group-focus-visible:ring-foreground";

  return (
    <div className="min-h-screen text-foreground" style={{ background: "radial-gradient(120% 80% at 50% 0%, color-mix(in oklab, var(--primary) 45%, var(--background)) 0%, var(--background) 70%)" }}>
      <header className="px-6 lg:px-12 py-5"><Link to="/"><img src={logoHorizontal.url} alt="Lettflix" className="h-8" /></Link></header>
      <main className="mx-auto max-w-4xl px-6 py-16 sm:py-24 text-center">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">{manage ? "Manage profiles" : "Who's watching?"}</h1>
        <ul className="mt-10 flex flex-wrap justify-center gap-6 sm:gap-8">
          <li>
            <button type="button" onClick={() => pick(null)} className="group grid gap-3 justify-items-center focus:outline-none">
              <div className={tile}><UserAvatar src={avatarSrc} name={owner} className="size-full rounded-none text-5xl" /></div>
              <span className="text-muted-foreground group-hover:text-foreground">{owner}</span>
            </button>
          </li>
          {profiles.map((p) => (
            <li key={p.id} className="relative">
              <button type="button" onClick={() => pick(p.id)} className="group grid gap-3 justify-items-center focus:outline-none">
                <div className={`${tile} grid place-items-center text-5xl font-bold`} style={p.kids ? { background: "linear-gradient(90deg,#14946B,#E0A100,#E0193F,#7A3BFF,#1E5EFF)" } : { background: p.color }}>
                  {p.kids ? <span className="text-3xl sm:text-4xl font-black text-foreground drop-shadow">kids</span> : p.name.charAt(0).toUpperCase()}
                </div>
                {manage ? (
                  <input aria-label={`Rename ${p.name}`} defaultValue={p.name} onBlur={(e) => e.target.value.trim() && rename(p.id, e.target.value)} className="w-32 rounded bg-elevated border border-border px-2 py-1 text-center text-sm" />
                ) : <span className="text-muted-foreground group-hover:text-foreground">{p.name}</span>}
              </button>
              {manage && <button type="button" aria-label={`Delete ${p.name}`} onClick={() => remove(p.id)} className="absolute -top-2 -right-2 size-9 grid place-items-center rounded-full bg-background border border-border hover:text-primary"><Trash2 className="size-4" /></button>}
            </li>
          ))}
          {profiles.length < MAX_PROFILES - 1 && !manage && (
            <li>
              <button type="button" onClick={() => setAdding(true)} className="group grid gap-3 justify-items-center focus:outline-none">
                <div className={`${tile} grid place-items-center bg-foreground/10`}><Plus className="size-12 text-muted-foreground group-hover:text-foreground" /></div>
                <span className="text-muted-foreground group-hover:text-foreground">Add profile</span>
              </button>
            </li>
          )}
        </ul>

        {adding && (
          <form className="mx-auto mt-10 max-w-sm grid gap-3 text-left rounded-xl border border-border bg-elevated/80 p-5" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { add(name, kids); setName(""); setKids(false); setAdding(false); } }}>
            <label className="text-sm font-medium" htmlFor="pname">Profile name</label>
            <input id="pname" autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={24} className="h-11 rounded-md bg-background border border-border px-3" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={kids} onChange={(e) => setKids(e.target.checked)} className="size-4" />Kids profile</label>
            <div className="flex gap-2 justify-end"><button type="button" onClick={() => setAdding(false)} className="h-10 px-4 rounded-md border border-border">Cancel</button><button className="h-10 px-4 rounded-md bg-foreground text-background font-semibold">Add profile</button></div>
          </form>
        )}

        <button type="button" onClick={() => setManage((m) => !m)} className="mt-12 inline-flex items-center gap-2 h-11 px-5 rounded-full border border-foreground/40 bg-background/60 font-semibold hover:border-foreground">
          {manage ? <><Check className="size-4" />Done</> : <><Pencil className="size-4" />Manage profiles</>}
        </button>
        <p className="mt-4 text-xs text-muted-foreground">Profiles are saved on this device.</p>
      </main>
    </div>
  );
}
