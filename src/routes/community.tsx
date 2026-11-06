import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MessageCircle,
  Heart,
  Users,
  Sparkles,
  Radio,
  Send,
  Trophy,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Community \u2014 Lettflix" },
      { property: "og:description", content: "Watch parties, live chat, fan clubs and creator meet-ups. Lettflix Community brings the audience together." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Community — Lettflix" },
      {
        name: "description",
        content:
          "Watch parties, live chat, fan clubs and creator meet-ups. Lettflix Community brings the audience together.",
      },
    ],
  }),
  component: CommunityPage,
});

function CommunityPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-[1480px] px-6 lg:px-10 py-16">
        <Users className="size-10 text-accent mb-6" />
        <h1 className="text-4xl font-bold">Lettflix Community</h1>
        <p className="mt-4 text-muted-foreground max-w-xl">Watch parties, fan clubs and community chat are coming soon. No public rooms are available yet.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild><Link to="/channels"><Radio />Browse live channels</Link></Button>
          <Button asChild variant="outline"><Link to="/guide">Programme guide</Link></Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
