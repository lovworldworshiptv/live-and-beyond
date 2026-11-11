import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLoader } from "@/components/brand-loader";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount } from "@/lib/account-deletion.functions";

const DESC = "Permanently delete your Lettflix account and personal data.";
export const Route = createFileRoute("/delete-account")({
  head: () => ({
    meta: [
      { title: "Delete your account — Lettflix" },
      { name: "description", content: DESC },
      { property: "og:title", content: "Delete your account — Lettflix" },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DeleteAccountPage,
});

const DELETED = [
  "Your profile, name and profile picture",
  "Your roles and creator applications",
  "Channels you follow and your alert settings",
  "Your notifications and phone alert registrations",
  "Your sign-in history and linked KingsChat sign-in",
  "Your sign-in details — you won't be able to sign in again",
];

function DeleteAccountPage() {
  const { user, loading } = useAuth();
  const remove = useServerFn(deleteMyAccount);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onDelete() {
    setBusy(true); setError(null);
    try {
      const res = await remove({ data: { confirm } });
      if (res.ok) { await supabase.auth.signOut().catch(() => {}); setDone(true); }
      else setError(res.message);
    } catch (e) { setError(e instanceof Error ? e.message : "Deletion failed. Nothing was deleted."); }
    finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-[680px] px-6 py-10 lg:py-16">
        <h1 className="text-3xl font-bold tracking-tight">Delete your account</h1>
        {done ? (
          <div className="mt-8 rounded-xl border border-border p-6 flex gap-3" role="status">
            <CheckCircle2 className="size-6 text-accent shrink-0" />
            <div><p className="font-semibold">Your account has been deleted.</p><p className="text-sm text-muted-foreground mt-1">You've been signed out. Thank you for being part of Lettflix.</p><Button asChild className="mt-4"><Link to="/">Go to home</Link></Button></div>
          </div>
        ) : (<>
          <p className="text-muted-foreground mt-3">Deleting your account is permanent and can't be undone. This removes:</p>
          <ul className="mt-4 space-y-2 list-disc pl-5 text-sm">{DELETED.map((d) => <li key={d}>{d}</li>)}</ul>
          <p className="text-sm text-muted-foreground mt-4">Anonymous viewing statistics are kept without any link to you. If you own a published channel, transfer or delete it in Studio first.</p>
          {loading ? <BrandLoader variant="section" label="Checking your account" /> : !user ? (
            <div className="mt-8 rounded-xl border border-border p-6">
              <p className="font-semibold">Sign in to delete your account</p>
              <p className="text-sm text-muted-foreground mt-1">We need to confirm it's you. You'll come back here after signing in.</p>
              <Button asChild className="mt-4 h-11"><Link to="/auth" search={{ redirect: "/delete-account" }}>Sign in</Link></Button>
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-primary/40 bg-primary/5 p-6">
              <div className="flex gap-3"><AlertTriangle className="size-5 text-primary shrink-0 mt-0.5" /><p className="text-sm">Signed in as <strong data-allow-copy>{user.email}</strong></p></div>
              <label htmlFor="confirm-delete" className="block text-sm font-medium mt-5">Type DELETE to confirm</label>
              <Input id="confirm-delete" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" className="mt-2 h-11" />
              {error && <p className="text-sm text-destructive mt-3" role="alert">{error}</p>}
              <Button variant="destructive" className="mt-4 h-11" disabled={confirm !== "DELETE" || busy} onClick={onDelete}>{busy ? "Deleting…" : "Delete my account"}</Button>
            </div>
          )}
        </>)}
        <p className="text-sm text-muted-foreground mt-8">Can't sign in? Email <a className="underline" href="mailto:support@lettflix.com">support@lettflix.com</a> from your account's email address to request deletion.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
