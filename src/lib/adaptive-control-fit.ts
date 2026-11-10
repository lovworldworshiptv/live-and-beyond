/** Collapse labels only on slim phones, and only when the command cannot fit. */
export function shouldCollapseControl(viewportWidth: number, contentWidth: number, availableWidth: number) {
  return viewportWidth < 360 && availableWidth > 0 && contentWidth > availableWidth + 1;
}