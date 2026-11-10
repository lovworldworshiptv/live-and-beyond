import { useEffect } from "react";
import { shouldCollapseControl } from "@/lib/adaptive-control-fit";

/** Keep icon-bearing commands readable without changing their action or accessible name. */
export function AdaptiveControls() {
  useEffect(() => {
    const controls = new Set<HTMLElement>();
    let frame = 0;
    const fit = () => {
      frame = 0;
      for (const control of controls) {
        if (!control.isConnected) { controls.delete(control); resize.unobserve(control); continue; }
        const compact = window.innerWidth < 360;
        control.removeAttribute("data-icon-only");
        if (!compact || !control.clientWidth) continue;
        const style = getComputedStyle(control);
        const nodes = Array.from(control.childNodes).filter((node) => {
          if (node.nodeType === Node.TEXT_NODE) return Boolean(node.textContent?.trim());
          if (!(node instanceof Element)) return false;
          const nodeStyle = getComputedStyle(node);
          return nodeStyle.display !== "none" && nodeStyle.position !== "absolute" && nodeStyle.position !== "fixed";
        });
        const contentWidth = nodes.reduce((sum, node) => {
          if (node instanceof HTMLElement) return sum + node.offsetWidth;
          const range = document.createRange();
          range.selectNode(node);
          return sum + range.getBoundingClientRect().width;
        }, 0);
        const gaps = Math.max(0, nodes.length - 1) * (parseFloat(style.columnGap) || 0);
        const padding = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
        if (shouldCollapseControl(window.innerWidth, contentWidth + gaps + padding, control.clientWidth)) control.setAttribute("data-icon-only", "");
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(fit); };
    const resize = new ResizeObserver(schedule);
    const scan = () => {
      document.querySelectorAll<HTMLElement>("button, a").forEach((control) => {
        if (controls.has(control) || !control.querySelector(":scope > svg")) return;
        if (control.closest('[role="menu"], [role="listbox"], [data-bottom-nav]') || control.querySelector("img, h1, h2, h3, div, input")) return;
        const label = control.textContent?.trim();
        if (!label || label.length > 80) return;
        if (Array.from(control.children).some((child) => child.tagName.toLowerCase() !== "svg" && child.tagName.toLowerCase() !== "span")) return;
        if (!control.hasAttribute("aria-label")) { control.setAttribute("aria-label", label); control.setAttribute("data-auto-label", ""); }
        if (!control.hasAttribute("title")) { control.setAttribute("title", label); control.setAttribute("data-auto-title", ""); }
        control.setAttribute("data-adaptive-control", "");
        controls.add(control);
        resize.observe(control);
      });
      for (const control of controls) {
        const label = control.textContent?.trim() || "";
        if (control.hasAttribute("data-auto-label")) control.setAttribute("aria-label", label);
        if (control.hasAttribute("data-auto-title")) control.setAttribute("title", label);
      }
      schedule();
    };
    const mutations = new MutationObserver(scan);
    mutations.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener("resize", schedule);
    scan();
    return () => { mutations.disconnect(); resize.disconnect(); window.removeEventListener("resize", schedule); cancelAnimationFrame(frame); };
  }, []);
  return null;
}