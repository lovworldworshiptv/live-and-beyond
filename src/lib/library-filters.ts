import type { Title } from "./catalog";

export type LibraryFilterMode = "categories" | "genres";
export function libraryFilterOptions(titles: Title[], mode: LibraryFilterMode): string[] {
  return ["All", ...Array.from(new Set(titles.map((title) => mode === "genres" ? title.category.trim() : title.kind).filter(Boolean))).sort((a, b) => a.localeCompare(b))];
}
export function matchesLibraryFilter(title: Title, mode: LibraryFilterMode, value: string): boolean {
  return value === "All" || (mode === "genres" ? title.category.trim() : title.kind) === value;
}