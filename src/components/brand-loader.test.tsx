import { act, create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { BrandLoader } from "./brand-loader";

vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

function render(node: React.ReactElement) {
  let tree: ReturnType<typeof create> | undefined;
  act(() => {
    tree = create(node);
  });
  return tree!;
}

function classes(tree: ReturnType<typeof create>) {
  return JSON.stringify(tree.toJSON());
}

describe("brand loading state", () => {
  it("announces itself as a live status region using the supplied label", () => {
    const tree = render(<BrandLoader variant="section" label="Finding stations" />);
    const node = tree.root.findByProps({ role: "status" });
    expect(node.props["aria-live"]).toBe("polite");
    expect(node.props["aria-label"]).toBe("Finding stations");
    expect(classes(tree)).toContain("brand-mark");
    act(() => tree.unmount());
  });

  it("keeps the progress pass in the section variant and drops it when inline", () => {
    const section = render(<BrandLoader variant="section" label="Loading" />);
    expect(classes(section)).toContain("brand-progress");
    act(() => section.unmount());

    const inline = render(<BrandLoader variant="inline" label="Loading" />);
    expect(classes(inline)).not.toContain("brand-progress");
    act(() => inline.unmount());
  });

  it("shows the wordmark only in the full-screen splash", () => {
    const full = render(<BrandLoader variant="full" label="Tuning in" />);
    expect(classes(full)).toContain("brand-wordmark");
    act(() => full.unmount());

    const section = render(<BrandLoader variant="section" label="Tuning in" />);
    expect(classes(section)).not.toContain("brand-wordmark");
    act(() => section.unmount());
  });
});
