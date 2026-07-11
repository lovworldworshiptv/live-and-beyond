import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Bell, LogOut, ShieldCheck, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import logoHorizontal from "@/assets/lettflix-horizontal.png.asset.json";
import { useProfile } from "@/lib/personal";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const navItems = [
  { label: "Home", to: "/" as const },
  { label: "Channels", to: "/channels" as const },
  { label: "Guide", to: "/guide" as const },
  { label: "On Demand", to: "/on-demand" as const },
  { label: "Pricing", to: "/pricing" as const },
];

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile } = useProfile();
  const { user, isAdmin, isCreator, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = user?.user_metadata?.display_name ?? user?.email?.split("@")[0] ?? profile.displayName;
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
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-10 h-16 flex items-center gap-4 lg:gap-8">
        {/* Mobile hamburger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button
              className="lg:hidden size-9 grid place-items-center rounded-md hover:bg-elevated transition"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-background border-border">
            <SheetHeader className="p-5 border-b border-border">
              <SheetTitle className="text-left">
                <img src={logoHorizontal.url} alt="Lettflix" className="h-9 w-auto object-contain" />
              </SheetTitle>
            </SheetHeader>
            <nav className="p-3 flex flex-col">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-3 rounded-md text-sm transition-colors ${
                    isActive(item.to)
                      ? "text-foreground bg-elevated/60 font-semibold"
                      : "text-[color:var(--secondary-foreground)] hover:text-foreground hover:bg-elevated/40"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {(isCreator || isAdmin) && (
                <>
                  <div className="mt-3 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                    Workspace
                  </div>
                  {isCreator && (
                    <Link
                      to="/portal"
                      onClick={() => setMobileOpen(false)}
                      className="px-3 py-3 rounded-md text-sm text-[color:var(--secondary-foreground)] hover:text-foreground hover:bg-elevated/40"
                    >
                      Creator Portal
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="px-3 py-3 rounded-md text-sm text-[color:var(--secondary-foreground)] hover:text-foreground hover:bg-elevated/40"
                    >
                      CMS Admin
                    </Link>
                  )}
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex items-center group">
          <img src={logoHorizontal.url} alt="Lettflix" className="h-10 lg:h-11 w-auto object-contain" />
        </Link>

        <nav className="hidden lg:flex items-center gap-1 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`px-3 py-2 rounded-md transition-colors ${
                isActive(item.to)
                  ? "text-foreground bg-elevated/60"
                  : "text-[color:var(--secondary-foreground)] hover:text-foreground hover:bg-elevated/40"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button className="hidden md:flex items-center gap-2 px-3 h-9 rounded-md bg-surface border border-border text-sm text-[color:var(--secondary-foreground)] hover:text-foreground hover:bg-elevated transition w-56 xl:w-64 overflow-hidden">
            <Search className="size-4 shrink-0" />
            <span className="truncate whitespace-nowrap">Search titles, channels, podcasts…</span>
          </button>
          <button className="md:hidden size-9 grid place-items-center rounded-md hover:bg-elevated transition" aria-label="Search">
            <Search className="size-4" />
          </button>
          <button className="size-9 grid place-items-center rounded-md hover:bg-elevated transition" aria-label="Notifications">
            <Bell className="size-4" />
          </button>

          {!user ? (
            <Link
              to="/auth"
              className="h-9 px-3 sm:px-4 inline-flex items-center rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition"
            >
              Sign in
            </Link>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="size-9 rounded-md bg-[image:var(--gradient-live)] grid place-items-center text-primary-foreground text-sm font-bold"
                  aria-label="Profile"
                >
                  {initial}
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
                    <Link to="/portal">Creator Portal</Link>
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
  );
}
