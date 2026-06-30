import { Link, Github, Twitter, Youtube } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-surface/40">
      <div className="mx-auto max-w-[1480px] px-6 lg:px-10 py-14 grid gap-10 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="font-display font-extrabold text-xl">
            LETT<span className="text-primary">FLIX</span>
          </div>
          <p className="mt-3 text-sm text-[color:var(--muted-foreground)] max-w-sm">
            The future of digital broadcasting. Live channels, radio, podcasts and on-demand
            entertainment — one subscription, one ecosystem.
          </p>
          <div className="flex gap-2 mt-5">
            {[Twitter, Youtube, Github, Link].map((Icon, i) => (
              <button key={i} className="size-9 grid place-items-center rounded-md bg-elevated hover:bg-elevated/70 transition">
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </div>
        {[
          { title: "Platform", items: ["Channels", "On Demand", "Radio", "Podcasts", "Live Guide"] },
          { title: "Creators", items: ["Become a Partner", "Creator Portal", "Channel Portal", "Analytics"] },
          { title: "Company", items: ["About", "Careers", "Press", "Contact", "Privacy"] },
        ].map((col) => (
          <div key={col.title}>
            <div className="text-sm font-semibold mb-3">{col.title}</div>
            <ul className="space-y-2 text-sm text-[color:var(--muted-foreground)]">
              {col.items.map((i) => (
                <li key={i}><a className="hover:text-foreground transition" href="#">{i}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-[1480px] px-6 lg:px-10 py-5 flex flex-wrap items-center justify-between text-xs text-[color:var(--muted-foreground)]">
          <div>© {new Date().getFullYear()} LoveWorld Entertainment Flix. All rights reserved.</div>
          <div>Made for a borderless broadcast future.</div>
        </div>
      </div>
    </footer>
  );
}
