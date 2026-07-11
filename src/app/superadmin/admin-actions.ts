"use server";

import { revalidatePath } from "next/cache";
import { createClient }       from "@/lib/supabase/server";
import { createAdminClient }  from "@/lib/supabase/admin-client";

// ── helpers ─────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak autoryzacji.");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (me?.role !== "admin") throw new Error("Brak uprawnień.");
  return { supabase, userId: user.id };
}

// ── update own profile (name + password) ────────────────────────────────────

export async function updateOwnAdminProfile(
  fullName: string,
  newPassword: string,
): Promise<{ error?: string }> {
  try {
    const { supabase, userId } = await requireAdmin();

    // update display name in profiles table
    if (fullName.trim()) {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() })
        .eq("id", userId);
      if (error) return { error: error.message };
    }

    // update password (regular user client — only works for own session)
    if (newPassword.trim()) {
      const { error } = await supabase.auth.updateUser({ password: newPassword.trim() });
      if (error) return { error: error.message };
    }

    revalidatePath("/superadmin");
    return {};
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Nieznany błąd." };
  }
}

// ── delete own account ───────────────────────────────────────────────────────

export async function deleteOwnAdminAccount(): Promise<{ error?: string }> {
  try {
    const { userId } = await requireAdmin();
    const admin      = createAdminClient();

    // Deleting from auth.users cascades to profiles (FK on delete cascade)
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) return { error: error.message };

    // No revalidatePath needed — user will be signed out automatically
    return {};
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Nieznany błąd." };
  }
}

// ── create new admin ─────────────────────────────────────────────────────────

export async function createAdmin(
  email: string,
  password: string,
  fullName: string,
): Promise<{ error?: string }> {
  try {
    await requireAdmin(); // caller must be admin
    const admin = createAdminClient();

    // Create the auth user
    const { data, error: createError } = await admin.auth.admin.createUser({
      email:           email.trim(),
      password:        password.trim(),
      email_confirm:   true,
    });
    if (createError) return { error: createError.message };

    const newUserId = data.user?.id;
    if (!newUserId) return { error: "Nie udało się uzyskać ID nowego użytkownika." };

    // Upsert profile with admin role
    const { error: profileError } = await admin
      .from("profiles")
      .upsert({
        id:                   newUserId,
        full_name:            fullName.trim() || null,
        role:                 "admin",
        onboarding_completed: true,
      });
    if (profileError) return { error: profileError.message };

    revalidatePath("/superadmin");
    return {};
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Nieznany błąd." };
  }
}
