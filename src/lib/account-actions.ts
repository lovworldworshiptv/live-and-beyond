import type { SupabaseClient } from "@supabase/supabase-js";

export async function changeAccountPassword(
  auth: SupabaseClient["auth"],
  email: string,
  current: string,
  next: string,
  confirm: string,
) {
  if (!email || !current || !next) throw new Error("Fill in all password fields.");
  if (next.length < 12) throw new Error("Password must be at least 12 characters.");
  if (next !== confirm) throw new Error("Passwords do not match.");
  const verified = await auth.signInWithPassword({ email, password: current });
  if (verified.error) throw new Error("Your current password could not be verified.");
  const result = await auth.updateUser({ password: next });
  if (result.error) throw new Error(result.error.message);
}