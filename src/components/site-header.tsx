import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, LogOut, ShieldCheck, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoHorizontal from "@/assets/lettflix-horizontal.png.asset.json";
import { useProfile } from "@/lib/personal";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { useCmsSetting } from "@/lib/cms-catalog";
import { defaultNav, type NavConfig } from "@/lib/homepage-defaults";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { SearchDialog } from "@/components/search-dialog";
import { NotificationBell } from "@/components/notification-bell";
import { UserAvatar } from "@/components/user-avatar";
import { useAccountProfile } from "@/lib/account-profile";


export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const { value: nav } = useCmsSetting<NavConfig>("nav", defaultNav);
  const navItems = nav.items;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!overlay) return;
    const onScroll = () => setScrolled(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile } = useProfile();
  const { user, isAdmin, isCreator, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);


  const { profile: account, avatarSrc } = useAccountProfile();
  const displayName = account?.display_name || (user?.user_metadata?.display_name ?? user?.email?.split("@")[0] ?? profile.displayName);
  const handle = user?.email ?? profile.handle;
  const initial = (displayName as string).charAt(0).toUpperCase();

  async function onSignOut() {
    await signOut();
    toast("Signed out");
    navigate({ to: "/" });
  }

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/");

  return (
    <>
      <header
        className={
          overlay
            ? `fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
                scrolled
                  ? "backdrop-blur-xl bg-background/70 border-b border-border"
                  : "bg-transparent border-b border-transparent"
              }`
            : "sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border"
        }
      >
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-10 h-16 flex items-center gap-4 lg:gap-8">

        <Link to="/" className="flex items-center group">
          <img src={logoHorizontal.url} alt="Lettflix" className="h-10 lg:h-11 w-auto object-contain" />
        </Link>

        <nav className="hidden lg:flex items-center gap-1 text-sm">
          {navItems.map((item) => {
            const children = item.children?.filter((c) => c.label && c.to) ?? [];
            const active = isActive(item.to) || children.some((c) => isActive(c.to));
            return (
              <div key={item.label} className="relative group">
                <Link
                  to={item.to as never}
                  className={`inline-flex items-center gap-1 px-3 py-2 rounded-md transition-colors ${
                    active
                      ? "text-foreground bg-elevated/60"
                      : "text-[color:var(--secondary-foreground)] hover:text-foreground hover:bg-elevated/40"
                  }`}
                >
                  {item.label}
                  {children.length > 0 && (
                    <ChevronDown className="size-3.5 transition-transform duration-200 group-hover:rotate-180" />
                  )}
                </Link>
                {children.length > 0 && (
                  <div className="absolute left-0 top-full pt-2 opacity-0 invisible translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0">
                    <div className="min-w-48 rounded-xl border border-border bg-background/95 backdrop-blur-xl p-1.5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
                      {children.map((c) => (
                        <Link
                          key={c.label}
                          to={c.to as never}
                          className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive(c.to)
                              ? "text-foreground bg-elevated/70"
                              : "text-[color:var(--secondary-foreground)] hover:text-foreground hover:bg-elevated/50"
                          }`}
                        >
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>


        <div className="ml-auto flex min-w-0 items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex min-w-0 flex-1 items-center gap-2 px-3 h-9 rounded-md bg-surface border border-border text-sm text-[color:var(--secondary-foreground)] hover:text-foreground hover:bg-elevated transition md:w-44 lg:w-56 xl:w-64 overflow-hidden"
            aria-label="Search"
          >
            <Search className="size-4 shrink-0" />
            <span className="truncate whitespace-nowrap">Search titles, channels, podcasts…</span>
            <kbd className="ml-auto hidden xl:inline-flex shrink-0 items-center rounded border border-border px-1.5 py-0.5 text-[10px] text-[color:var(--muted-foreground)]">
              ⌘K
            </kbd>
          </button>
          <button
            onClick={() => setSearchOpen(true)}
            className="md:hidden size-9 shrink-0 grid place-items-center rounded-md hover:bg-elevated transition"
            aria-label="Search"
          >
            <Search className="size-4" />
          </button>

          <NotificationBell />

          {!user ? (
            <Link
              to="/auth"
              className="h-9 px-5 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-semibold leading-none hover:bg-primary/90 transition whitespace-nowrap"
            >
              Sign in
            </Link>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="size-9 rounded-full overflow-hidden ring-2 ring-border hover:ring-foreground/40 transition grid place-items-center text-primary-foreground text-sm font-bold"
                  aria-label="Profile"
                >
                  <UserAvatar src={avatarSrc} name={initial} className="size-full text-sm" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-semibold">{displayName}</div>
                  <div className="text-xs text-[color:var(--muted-foreground)] font-normal truncate">
                    {handle}
                  </div>
                  {isAdmin && (
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-semibold text-primary">
                      <ShieldCheck className="size-3" /> Admin
                    </div>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">My Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account">Account & Settings</Link>
                </DropdownMenuItem>
                {(isCreator || isAdmin) && <DropdownMenuSeparator />}
                {isCreator && (
                  <DropdownMenuItem asChild>
                    <Link to="/studio">Creator Studio</Link>
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">CMS Admin</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onSignOut} className="text-destructive">
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      </header>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <MobileBottomNav />

    </>
  );
}
