import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { changeAccountPassword } from "./account-actions";

describe("password updates", () => {
  it("does not update a password when the current password fails verification", async () => {
    const auth = { signInWithPassword: vi.fn().mockResolvedValue({ error: new Error("Invalid credentials") }), updateUser: vi.fn() };
    await expect(changeAccountPassword(auth as unknown as SupabaseClient["auth"], "viewer@example.test", "wrong", "new-password-2026", "new-password-2026")).rejects.toThrow("could not be verified");
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it("updates only after verification and propagates save failures", async () => {
    const auth = { signInWithPassword: vi.fn().mockResolvedValue({ error: null }), updateUser: vi.fn().mockResolvedValue({ error: { message: "Save failed" } }) };
    await expect(changeAccountPassword(auth as unknown as SupabaseClient["auth"], "viewer@example.test", "old-password", "new-password-2026", "new-password-2026")).rejects.toThrow("Save failed");
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "new-password-2026" });
  });
});