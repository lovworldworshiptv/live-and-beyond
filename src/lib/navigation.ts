/** Resolve legacy CMS links without changing intentionally configured external links. */
export function resolveFooterHref(href: string, label: string) {
  const name = label.toLowerCase();
  if (href === "/channels" && name === "radio") return "/radio";
  if (!href.startsWith("/on-demand")) return href;
  if (name.includes("podcast")) return "/podcasts";
  if (name.includes("series")) return "/series";
  if (name.includes("documentar")) return "/documentaries";
  return "/movies";
}