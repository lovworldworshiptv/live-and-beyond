import { describe, expect, it } from "vitest";
import { libraryFilterOptions, matchesLibraryFilter } from "./library-filters";
import type { Title } from "./catalog";
const titles = [{ id: "worship", kind: "Music", category: "Worship" }, { id: "gospel", kind: "Music", category: "Gospel" }, { id: "film", kind: "Film", category: "Drama" }] as Title[];
describe("channel library browsing", () => {
  it("music channels browse by the uploaded genres", () => {
    expect(libraryFilterOptions(titles, "genres")).toEqual(["All", "Drama", "Gospel", "Worship"]);
    expect(matchesLibraryFilter(titles[0], "genres", "Worship")).toBe(true);
    expect(matchesLibraryFilter(titles[1], "genres", "Worship")).toBe(false);
  });
  it("other channels browse by content categories", () => {
    expect(libraryFilterOptions(titles, "categories")).toEqual(["All", "Film", "Music"]);
    expect(matchesLibraryFilter(titles[2], "categories", "Film")).toBe(true);
    expect(matchesLibraryFilter(titles[0], "categories", "Film")).toBe(false);
  });
  it("empty libraries have no invented filters", () => {
    expect(libraryFilterOptions([], "genres")).toEqual(["All"]);
  });
});