import { Link } from "@tanstack/react-router";
import logo from "@/assets/lettflix-logo.png.asset.json";
import { useCmsSetting } from "@/lib/cms-catalog";
import { defaultFooter, type FooterConfig } from "@/lib/homepage-defaults";

/** Placeholder hrefs ("#", empty) lead nowhere, so they are not rendered. */
const isRealHref = (href?: string) => !!href && href.trim() !== "" && href.trim() !== "#";

/** The old /on-demand hub was replaced by per-kind catalogue pages; route saved links there. */
function resolveHref(href: string, label: string) {
  if (!href.startsWith("/on-demand")) return href;
  const l = label.toLowerCase();
  if (l.includes("podcast")) return "/podcasts";
  if (l.includes("series")) return "/series";
  if (l.includes("documentar")) return "/documentaries";
  return "/movies";
}

const LEGAL_LINKS = [
  { label: "Privacy", to: "/privacy" },
  { label: "Terms", to: "/terms" },
  { label: "Cookies", to: "/cookies" },
] as const;

export function SiteFooter() {
  const { value: footer } = useCmsSetting<FooterConfig>("footer", defaultFooter);
  const columns = (footer.columns ?? [])
    .map((col) => ({ ...col, items: (col.items ?? []).filter((i) => isRealHref(i.href)) }))
    .filter((col) => col.items.length > 0);

  return (
    <footer data-site-footer className="site-footer mt-20 lg:mt-24 border-t border-border bg-surface/40">
      <div className="mx-auto max-w-[1480px] px-6 lg:px-10 pt-12 pb-10 lg:py-14 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-5">
        <div className="col-span-2 sm:col-span-3 md:col-span-2 min-w-0">
          <img
            src={logo.url}
            alt="Lettflix — LoveWorld Entertainment Flix"
            width={180}
            height={140}
            className="h-16 lg:h-24 w-auto object-contain"
          />
          {footer.tagline && (
            <p className="mt-4 text-sm leading-relaxed text-[color:var(--muted-foreground)] max-w-sm">{footer.tagline}</p>
          )}
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title} className="min-w-0">
            <div className="text-sm font-semibold mb-3">{col.title}</div>
            <ul className="space-y-1 text-sm text-[color:var(--muted-foreground)]">
              {col.items.map((item) => (
                <li key={`${item.label}-${item.href}`}>
                  <a className="inline-block py-1 hover:text-foreground transition-colors" href={item.href}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-[1480px] px-6 lg:px-10 py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-[color:var(--muted-foreground)]">
          <div>© {new Date().getFullYear()} {footer.copyright}</div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="hover:text-foreground transition-colors">
                {l.label}
              </Link>
            ))}
            {footer.note && <span className="hidden md:inline">{footer.note}</span>}
          </div>
        </div>
      </div>
    </footer>
  );
}
