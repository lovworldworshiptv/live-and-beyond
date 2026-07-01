import { Link, useRouterState } from "@tanstack/react-router";
import { Search, Bell, User } from "lucide-react";
import logoIcon from "@/assets/lettflix-icon.png.asset.json";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Channels", to: "/channels" },
  { label: "On Demand", to: "/on-demand" },
  { label: "Guide", to: "/channels" },
  { label: "Pricing", to: "/" },
];

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="mx-auto max-w-[1480px] px-6 lg:px-10 h-16 flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src={logoIcon.url}
            alt="Lettflix"
            width={36}
            height={36}
            className="size-9 object-contain drop-shadow-[0_4px_16px_rgba(156,21,51,0.45)]"
          />
          <span className="font-display font-extrabold tracking-tight text-lg hidden sm:inline">
            LETT<span className="text-primary">FLIX</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 text-sm">
          {navItems.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`px-3 py-2 rounded-md transition-colors ${
                  active
                    ? "text-foreground bg-elevated/60"
                    : "text-[color:var(--secondary-foreground)] hover:text-foreground hover:bg-elevated/40"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button className="hidden md:flex items-center gap-2 px-3 h-9 rounded-md bg-surface border border-border text-sm text-[color:var(--secondary-foreground)] hover:text-foreground hover:bg-elevated transition w-64">
            <Search className="size-4" />
            <span>Search channels, shows, podcasts…</span>
          </button>
          <button className="size-9 grid place-items-center rounded-md hover:bg-elevated transition" aria-label="Notifications">
            <Bell className="size-4" />
          </button>
          <button className="size-9 grid place-items-center rounded-md bg-[image:var(--gradient-live)]" aria-label="Profile">
            <User className="size-4 text-primary-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
}
