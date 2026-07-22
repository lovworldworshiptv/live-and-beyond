import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Tv, Film, User } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type NavItem = {
  to: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  exact?: boolean;
};

const TABS: NavItem[] = [
  { to: "/", label: "Home", Icon: Home, exact: true },
  { to: "/channels", label: "Channels", Icon: Tv },
  { to: "/on-demand", label: "Movies", Icon: Film },
  { to: "/profile", label: "Profile", Icon: User },
];

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      {/* Spacer so page content isn't hidden behind the fixed bar */}
      <div aria-hidden className="lg:hidden h-16 pb-[env(safe-area-inset-bottom)]" />

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
      >
        <div className="border-t border-border/60 bg-background/70 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
          <ul className="mx-auto grid max-w-xl grid-cols-4">
            {TABS.map(({ to, label, Icon, exact }) => {
              const active = exact
                ? pathname === to
                : pathname === to || pathname.startsWith(`${to}/`);
              return (
                <li key={to}>
                  <Link
                    to={to as "/"}
                    aria-current={active ? "page" : undefined}
                    className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium tracking-wide transition-colors ${
                      active
                        ? "text-primary"
                        : "text-[color:var(--muted-foreground)] hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`grid h-9 w-12 place-items-center rounded-full transition-all ${
                        active
                          ? "bg-primary/15 shadow-[var(--shadow-glow)]"
                          : ""
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
                    </span>
                    <span>{label}</span>
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
