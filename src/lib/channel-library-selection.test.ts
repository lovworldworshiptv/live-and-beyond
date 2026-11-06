import { expect, it } from "vitest";
import { selectChannelLibrary } from "./channel-library-selection";

const movie = { id: "movie-1", slug: "new-movie", channel_id: "channel-1", is_published: true };
it("includes a published channel movie without manual slug linkage", () => {
  expect(selectChannelLibrary([movie], "channel-1", []).map((t) => t.slug)).toEqual(["new-movie"]);
});
it("never exposes unpublished, deleted or unrelated movies", () => {
  expect(selectChannelLibrary([{ ...movie, is_published: false }, { ...movie, id: "deleted", deleted_at: "2026-11-06" }, { ...movie, id: "other", channel_id: "channel-2" }], "channel-1", [])).toEqual([]);
});
it("preserves curated links without duplicating a directly uploaded movie", () => {
  const curated = { ...movie, id: "curated", slug: "curated-movie", channel_id: null };
  expect(selectChannelLibrary([movie, movie, curated], "channel-1", [movie.slug, curated.slug]).map((t) => t.id)).toEqual(["movie-1", "curated"]);
});