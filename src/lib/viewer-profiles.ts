import { useSyncExternalStore } from "react";

/** Device-saved viewing profiles ("Who's watching?"). */
export type ViewerProfile = { id: string; name: string; color: string; kids?: boolean };

const KEY = "lettflix.viewer-profiles";
const ACTIVE = "lettflix.viewer-active";
const EVT = "lettflix:viewer-profiles";

export const PROFILE_COLORS = ["#1E5EFF", "#9C1533", "#E0A100", "#14946B", "#7A3BFF", "#E0193F"];
export const MAX_PROFILES = 5;

type State = { profiles: ViewerProfile[]; activeId: string | null };
let cache: State | null = null;
const EMPTY: State = { profiles: [], activeId: null };

function read(): State {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    const profiles = JSON.parse(localStorage.getItem(KEY) || "[]") as ViewerProfile[];
    cache = { profiles, activeId: localStorage.getItem(ACTIVE) };
  } catch {
    cache = { profiles: [], activeId: null };
  }
  return cache;
}

function write(next: State) {
  localStorage.setItem(KEY, JSON.stringify(next.profiles));
  if (next.activeId) localStorage.setItem(ACTIVE, next.activeId);
  else localStorage.removeItem(ACTIVE);
  cache = next;
  window.dispatchEvent(new Event(EVT));
}

function subscribe(cb: () => void) {
  const on = () => { cache = null; cb(); };
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", on);
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener("storage", on); };
}

export function useViewerProfiles() {
  const state = useSyncExternalStore(subscribe, read, () => EMPTY);
  const active = state.profiles.find((p) => p.id === state.activeId) ?? null;
  return {
    profiles: state.profiles,
    active,
    select: (id: string) => write({ ...read(), activeId: id }),
    add: (name: string, kids = false) => {
      const s = read();
      if (s.profiles.length >= MAX_PROFILES) return null;
      const p: ViewerProfile = { id: crypto.randomUUID(), name: name.trim().slice(0, 24), kids, color: PROFILE_COLORS[s.profiles.length % PROFILE_COLORS.length] };
      write({ ...s, profiles: [...s.profiles, p] });
      return p;
    },
    rename: (id: string, name: string) => {
      const s = read();
      write({ ...s, profiles: s.profiles.map((p) => (p.id === id ? { ...p, name: name.trim().slice(0, 24) } : p)) });
    },
    remove: (id: string) => {
      const s = read();
      write({ profiles: s.profiles.filter((p) => p.id !== id), activeId: s.activeId === id ? null : s.activeId });
    },
  };
}
