// Account profile (display name, handle, avatar) stored in the backend `profiles`
// row for the signed-in user. Avatar values are either a preset key
// ("preset:male" / "preset:female") or an uploaded image URL.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import maleAvatar from "@/assets/avatar-male.jpg";
import femaleAvatar from "@/assets/avatar-female.jpg";

export const AVATAR_PRESETS = [
  { key: "preset:male", label: "Male", src: maleAvatar },
  { key: "preset:female", label: "Female", src: femaleAvatar },
] as const;

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export function resolveAvatar(value: string | null | undefined): string | null {
  if (!value) return null;
  const preset = AVATAR_PRESETS.find((p) => p.key === value);
  if (preset) return preset.src;
  return /^https?:\/\//.test(value) ? value : null;
}

export function validateAvatarFile(file: { type: string; size: number }): string | null {
  if (!file.type.startsWith("image/")) return "Please choose an image file.";
  if (file.size > AVATAR_MAX_BYTES) return "Images must be 5 MB or smaller.";
  return null;
}

export type AccountProfile = {
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
  created_at: string | null;
};

const EVENT = "lettflix:account-profile";

export function useAccountProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("display_name, handle, avatar_url, created_at")
      .eq("id", user.id)
      .maybeSingle();
    setProfile(data ?? { display_name: null, handle: null, avatar_url: null, created_at: null });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    void load();
    const handler = () => void load();
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, [load]);

  const update = useCallback(
    async (patch: Partial<Pick<AccountProfile, "display_name" | "handle" | "avatar_url">>) => {
      if (!user) return "Please sign in first.";
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, ...patch }, { onConflict: "id" });
      if (error) return error.message;
      window.dispatchEvent(new CustomEvent(EVENT));
      return null;
    },
    [user]
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!user) return "Please sign in first.";
      const invalid = validateAvatarFile(file);
      if (invalid) return invalid;
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (upErr) return upErr.message;
      const { data, error: sErr } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (sErr || !data) return sErr?.message ?? "Upload failed";
      return update({ avatar_url: data.signedUrl });
    },
    [user, update]
  );

  return { profile, loading, update, uploadAvatar, avatarSrc: resolveAvatar(profile?.avatar_url) };
}
