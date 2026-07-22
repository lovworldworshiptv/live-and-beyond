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
  const activeIndex = Math.max(
    0,
    items.findIndex((i) => i.match(pathname)),
  );
  const hasActive = items.some((i) => i.match(pathname));

  return (
    <>
      {/* Spacer so page content isn't hidden behind the fixed bar */}
      <div
        aria-hidden
        className="lg:hidden"
        style={{ height: "calc(5rem + max(env(safe-area-inset-bottom), 0.75rem))" }}
      />

      <nav
        aria-label="Primary"
        className="lg:hidden fixed bottom-0 inset-x-0 z-50"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}
      >
        <div className="relative border-t border-border bg-background/80 backdrop-blur-xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.6)]">
          {/* Sliding active indicator */}
          <span
            aria-hidden
            className={`pointer-events-none absolute top-1 h-1 w-8 rounded-full bg-primary/80 shadow-[0_0_12px_var(--primary)] transition-[left,opacity,transform] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              hasActive ? "opacity-100" : "opacity-0"
            }`}
            style={{
              left: `calc(${activeIndex} * 25% + 12.5% - 1rem)`,
            }}
          />

          <ul className="grid grid-cols-4">
            {items.map((item, idx) => {
              const active = idx === activeIndex && hasActive;
              const Icon = item.icon;
              return (
                <li key={item.label} className="flex">
                  <Link
                    to={item.to as never}
                    aria-current={active ? "page" : undefined}
                    className="group relative flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-h-[64px] outline-none"
                  >
                    <span
                      className={`relative grid place-items-center size-10 rounded-xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                        active
                          ? "bg-[image:var(--gradient-live)] text-primary-foreground shadow-[0_10px_25px_-8px_var(--primary)] scale-110 -translate-y-2"
                          : "text-[color:var(--secondary-foreground)] translate-y-0 group-hover:text-foreground group-active:scale-95"
                      }`}
                    >
                      <Icon
                        className={`transition-all duration-300 ${active ? "size-5" : "size-[22px]"}`}
                        strokeWidth={active ? 2.4 : 2}
                      />
                    </span>
                    <span
                      key={active ? "on" : "off"}
                      className={`text-[10.5px] font-semibold leading-none tracking-wide transition-colors duration-300 ${
                        active
                          ? "text-foreground animate-fade-in"
                          : "text-[color:var(--muted-foreground)] group-hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
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
