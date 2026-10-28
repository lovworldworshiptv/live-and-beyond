import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Browser-level content protection (Netflix-style deterrents):
 * - Right-click / long-press menus, media dragging and text selection on media are blocked.
 * - Save, print, view-source and developer-tool shortcuts are blocked.
 * - Video goes black when the window loses focus, a screenshot shortcut is used,
 *   or the page is asked to share the screen; it stays black while sharing runs.
 * - Picture-in-picture and casting are disabled so video can't escape the shield.
 * - Native video fullscreen is moved onto the player frame so the account watermark stays visible.
 * Hardware-level capture blocking (black screenshots at OS level) needs DRM from the video provider.
 */
export function ContentProtection() {
  const [shielded, setShielded] = useState(false);

  useEffect(() => {
    let captureActive = false;
    let flashTimer = 0;
    let lastNotice = 0;
    const isEditable = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

    const notify = () => {
      if (Date.now() - lastNotice < 4000) return;
      lastNotice = Date.now();
      toast.error("Screenshots and screen recording aren't allowed on Lettflix.");
    };
    const refresh = () => setShielded(captureActive || document.hidden || !document.hasFocus() || flashTimer !== 0);
    const flash = () => {
      window.clearTimeout(flashTimer);
      flashTimer = window.setTimeout(() => { flashTimer = 0; refresh(); }, 3000);
      setShielded(true);
      notify();
    };

    // Right-click and long-press menus
    const onContext = (e: MouseEvent) => {
      if (!isEditable(e.target)) e.preventDefault();
    };
    const onDrag = (e: DragEvent) => {
      if (!isEditable(e.target)) e.preventDefault();
    };
    const onSelect = (e: Event) => {
      const t = e.target;
      if (t instanceof HTMLImageElement || t instanceof HTMLVideoElement) e.preventDefault();
    };

    // Screenshot and inspection shortcuts
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (k === "printscreen" || k === "snapshot") {
        e.preventDefault();
        navigator.clipboard?.writeText("").catch(() => {});
        flash();
        return;
      }
      // macOS Cmd+Shift+3/4/5/6, Windows Win+Shift+S, Windows Game Bar recording Win+Alt+R
      if ((e.metaKey && e.shiftKey && ["3", "4", "5", "6", "s"].includes(k)) || (e.metaKey && e.altKey && k === "r")) {
        flash();
      }
      const blocked =
        k === "f12" ||
        k === "contextmenu" ||
        (e.shiftKey && k === "f10") ||
        (mod && e.shiftKey && ["i", "j", "c"].includes(k)) ||
        (e.metaKey && e.altKey && ["i", "j", "c", "u"].includes(k)) ||
        (mod && !e.shiftKey && ["s", "p", "u"].includes(k));
      if (blocked) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        navigator.clipboard?.writeText("").catch(() => {});
        flash();
      }
    };

    // Screen-share requests made inside the page keep the video black until sharing stops.
    const media = navigator.mediaDevices as (MediaDevices & { __lettflixGuard?: boolean }) | undefined;
    const originalDisplayMedia = media?.getDisplayMedia?.bind(media);
    if (media && originalDisplayMedia && !media.__lettflixGuard) {
      media.__lettflixGuard = true;
      media.getDisplayMedia = async (options?: DisplayMediaStreamOptions) => {
        captureActive = true;
        refresh();
        notify();
        try {
          const stream = await originalDisplayMedia(options);
          const release = () => {
            if (stream.getTracks().every((t) => t.readyState === "ended")) { captureActive = false; refresh(); }
          };
          stream.getTracks().forEach((t) => t.addEventListener("ended", release));
          return stream;
        } catch (cause) {
          captureActive = false;
          refresh();
          throw cause;
        }
      };
    }

    // Keep every video inside the page: no picture-in-picture or casting.
    const lockVideo = (v: HTMLVideoElement) => {
      v.disablePictureInPicture = true;
      (v as HTMLVideoElement & { disableRemotePlayback: boolean }).disableRemotePlayback = true;
      v.setAttribute("controlsList", "nodownload noplaybackrate noremoteplayback");
    };
    document.querySelectorAll("video").forEach(lockVideo);
    const observer = new MutationObserver((records) => {
      for (const r of records) r.addedNodes.forEach((n) => {
        if (n instanceof HTMLVideoElement) lockVideo(n);
        else if (n instanceof HTMLElement) n.querySelectorAll("video").forEach(lockVideo);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const onPip = () => { document.exitPictureInPicture?.().catch(() => {}); };

    // Native video fullscreen would hide the watermark; move fullscreen onto the player frame.
    const onFullscreen = () => {
      const el = document.fullscreenElement;
      if (!(el instanceof HTMLVideoElement)) return;
      const frame = el.closest<HTMLElement>("[data-protected-player]");
      if (!frame) return;
      document.exitFullscreen().then(() => frame.requestFullscreen()).catch(() => {});
    };

    const onFocusChange = () => refresh();

    document.addEventListener("contextmenu", onContext, true);
    document.addEventListener("dragstart", onDrag, true);
    document.addEventListener("selectstart", onSelect, true);
    document.addEventListener("enterpictureinpicture", onPip, true);
    document.addEventListener("fullscreenchange", onFullscreen);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", onFocusChange);
    window.addEventListener("focus", onFocusChange);
    document.addEventListener("visibilitychange", onFocusChange);
    return () => {
      window.clearTimeout(flashTimer);
      observer.disconnect();
      document.removeEventListener("contextmenu", onContext, true);
      document.removeEventListener("dragstart", onDrag, true);
      document.removeEventListener("selectstart", onSelect, true);
      document.removeEventListener("enterpictureinpicture", onPip, true);
      document.removeEventListener("fullscreenchange", onFullscreen);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("blur", onFocusChange);
      window.removeEventListener("focus", onFocusChange);
      document.removeEventListener("visibilitychange", onFocusChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.toggleAttribute("data-shielded", shielded);
  }, [shielded]);

  return null;
}
