// Client-side personalization store — localStorage-backed hooks for progress,
// my list, reminders and following. Simple, synchronous, SSR-safe.
import { useCallback, useEffect, useRef, useState } from "react";

const KEYS = {
  progress: "lettflix.progress",
  myList: "lettflix.mylist",
  reminders: "lettflix.reminders",
  following: "lettflix.following",
  profile: "lettflix.profile",
  settings: "lettflix.settings",
} as const;

export type ProgressEntry = {
  titleId: string;
  positionPct: number; // 0-100
  updatedAt: number;
};

export type ReminderEntry = {
  id: string; // channelId + '::' + time + '::' + title
  channelId: string;
  time: string;
  title: string;
  createdAt: number;
};

export type ProfileData = {
  displayName: string;
  handle: string;
  avatarSeed: string;
  bio: string;
  location: string;
};

export type SettingsData = {
  emailNotifications: boolean;
  liveAlerts: boolean;
  newReleases: boolean;
  autoplayPreviews: boolean;
  autoplayPlayback: boolean;
  captions: boolean;
  captionLanguage: string;
  audioLanguage: string;
  playbackQuality: "auto" | "hd" | "4k";
  language: string;
  maturity: "all" | "teen" | "kids";
  plan: "essential" | "premium" | "family";
};

const DEFAULT_PROFILE: ProfileData = {
  displayName: "",
  handle: "",
  avatarSeed: "profile",
  bio: "",
  location: "",
};

const DEFAULT_SETTINGS: SettingsData = {
  emailNotifications: true,
  liveAlerts: true,
  newReleases: false,
  autoplayPreviews: true,
  autoplayPlayback: false,
  captions: false,
  captionLanguage: "en",
  audioLanguage: "en",
  playbackQuality: "auto",
  language: "English",
  maturity: "all",
  plan: "premium",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(`lettflix:${key}`));
  } catch {
    /* noop */
  }
}

function useStore<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const current = useRef(value);

  useEffect(() => {
    const handler = () => {
      current.current = read(key, fallback);
      setValue(current.current);
    };
    handler();
    window.addEventListener(`lettflix:${key}`, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(`lettflix:${key}`, handler);
      window.removeEventListener("storage", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setAndPersist = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (p: T) => T)(current.current) : next;
      current.current = resolved;
      write(key, resolved);
      setValue(resolved);
    },
    [key]
  );

  return [value, setAndPersist] as const;
}

// -------- Progress --------
export function useProgress() {
  const [items, setItems] = useStore<ProgressEntry[]>(KEYS.progress, []);

  const setProgress = useCallback(
    (titleId: string, positionPct: number) => {
      setItems((prev) => {
        const rest = prev.filter((i) => i.titleId !== titleId);
        return [{ titleId, positionPct, updatedAt: Date.now() }, ...rest].slice(0, 20);
      });
    },
    [setItems]
  );

  const clear = useCallback(
    (titleId: string) => setItems((prev) => prev.filter((i) => i.titleId !== titleId)),
    [setItems]
  );

  return { items, setProgress, clear };
}

// -------- My List --------
export function useMyList() {
  const [ids, setIds] = useStore<string[]>(KEYS.myList, []);
  const has = useCallback((id: string) => ids.includes(id), [ids]);
  const toggle = useCallback(
    (id: string) => setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev])),
    [setIds]
  );
  return { ids, has, toggle };
}

// -------- Reminders --------
export function useReminders() {
  const [items, setItems] = useStore<ReminderEntry[]>(KEYS.reminders, []);
  const has = useCallback((id: string) => items.some((r) => r.id === id), [items]);
  const toggle = useCallback(
    (entry: Omit<ReminderEntry, "createdAt">) =>
      setItems((prev) =>
        prev.some((r) => r.id === entry.id)
          ? prev.filter((r) => r.id !== entry.id)
          : [{ ...entry, createdAt: Date.now() }, ...prev]
      ),
    [setItems]
  );
  return { items, has, toggle };
}

// -------- Following (channels) --------
export function useFollowing() {
  const [ids, setIds] = useStore<string[]>(KEYS.following, []);
  const has = useCallback((id: string) => ids.includes(id), [ids]);
  const toggle = useCallback(
    (id: string) => setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev])),
    [setIds]
  );
  return { ids, has, toggle };
}

// -------- Profile --------
export function useProfile() {
  const [profile, setProfile] = useStore<ProfileData>(KEYS.profile, DEFAULT_PROFILE);
  return { profile, setProfile };
}

// -------- Settings --------
export function useSettings() {
  const [stored, setSettings] = useStore<SettingsData>(KEYS.settings, DEFAULT_SETTINGS);
  // Merge defaults so settings saved before new preferences existed stay complete.
  const settings = { ...DEFAULT_SETTINGS, ...stored };
  return { settings, setSettings };
}

export const PLAYBACK_LANGUAGES = [
  { code: "en", label: "English" }, { code: "fr", label: "French" }, { code: "es", label: "Spanish" },
  { code: "pt", label: "Portuguese" }, { code: "de", label: "German" }, { code: "yo", label: "Yoruba" },
  { code: "ig", label: "Igbo" }, { code: "ha", label: "Hausa" }, { code: "sw", label: "Swahili" },
] as const;
