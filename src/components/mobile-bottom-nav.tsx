import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Tv, Film, User } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type NavItem = {
  label: string;
  to: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  match: (path: string) => boolean;
};

const items: NavItem[] = [
  { label: "Home", to: "/", icon: Home, match: (p) => p === "/" },
  { label: "Channels", to: "/channels", icon: Tv, match: (p) => p.startsWith("/channels") },
  { label: "Movies", to: "/on-demand", icon: Film, match: (p) => p.startsWith("/on-demand") },
  { label: "Profile", to: "/profile", icon: User, match: (p) => p.startsWith("/profile") || p.startsWith("/account") },
];

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      {/* Spacer so page content isn't hidden behind the fixed bar */}
      <div aria-hidden className="lg:hidden h-[calc(4.75rem+env(safe-area-inset-bottom))]" />

      <nav
        aria-label="Primary"
        className="lg:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[min(94vw,520px)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="relative rounded-2xl border border-border bg-background/70 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]">
          <ul className="grid grid-cols-4">
            {items.map((item) => {
              const active = item.match(pathname);
              const Icon = item.icon;
              return (
                <li key={item.label} className="flex">
                  <Link
                    to={item.to as never}
                    aria-current={active ? "page" : undefined}
                    className="group relative flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-h-[64px] outline-none"
                  >
                    <span
                      className={`relative grid place-items-center size-10 rounded-xl transition-all duration-300 ${
                        active
                          ? "bg-[image:var(--gradient-live)] text-primary-foreground shadow-[0_10px_25px_-8px_var(--primary)] scale-110 -translate-y-2"
                          : "text-[color:var(--secondary-foreground)] group-hover:text-foreground group-active:scale-95"
                      }`}
                    >
                      <Icon className={`transition-transform ${active ? "size-5" : "size-[22px]"}`} strokeWidth={active ? 2.4 : 2} />
                    </span>
                    <span
                      className={`text-[10.5px] font-semibold leading-none tracking-wide transition-colors ${
                        active ? "text-foreground" : "text-[color:var(--muted-foreground)] group-hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                    {active && (
                      <span
                        aria-hidden
                        className="absolute top-1 h-1 w-8 rounded-full bg-primary/80 shadow-[0_0_12px_var(--primary)]"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </>
  );
}
