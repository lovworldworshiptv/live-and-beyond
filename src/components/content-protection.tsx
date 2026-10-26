import { useEffect, useState } from "react";

/**
 * Deterrent-level content protection: blocks right-click, dragging media,
 * save/print/view-source/devtools shortcuts, and blanks video when the
 * window loses focus or a screenshot key is pressed. Real capture blocking
 * requires DRM from the video provider.
 */
export function ContentProtection() {
  const [shielded, setShielded] = useState(false);

  useEffect(() => {
    const isEditable = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

    const onContext = (e: MouseEvent) => {
      if (!isEditable(e.target)) e.preventDefault();
    };
    const onDrag = (e: DragEvent) => {
      if (e.target instanceof HTMLImageElement || e.target instanceof HTMLVideoElement) e.preventDefault();
    };
    const flash = () => {
      setShielded(true);
      window.setTimeout(() => setShielded(false), 1500);
    };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (k === "printscreen") {
        flash();
        navigator.clipboard?.writeText("").catch(() => {});
        e.preventDefault();
        return;
      }
      if (e.metaKey && e.shiftKey && ["3", "4", "5", "s"].includes(k)) flash();
      const blocked =
        k === "f12" ||
        (mod && e.shiftKey && ["i", "j", "c"].includes(k)) ||
        (e.metaKey && e.altKey && ["i", "j", "c", "u"].includes(k)) ||
        (mod && !e.shiftKey && ["s", "p", "u"].includes(k));
      if (blocked) e.preventDefault();
    };
    const onBlur = () => setShielded(true);
    const onFocus = () => setShielded(false);
    const onVis = () => setShielded(document.hidden);

    document.addEventListener("contextmenu", onContext);
    document.addEventListener("dragstart", onDrag);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("keyup", (e) => e.key === "PrintScreen" && flash());
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("dragstart", onDrag);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    document.documentElement.toggleAttribute("data-shielded", shielded);
  }, [shielded]);

  return null;
}
