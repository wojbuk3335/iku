"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function blockUser(userId: string, reason?: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak autoryzacji.");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (me?.role !== "admin") throw new Error("Brak uprawnień.");
  if (userId === user.id)   throw new Error("Nie możesz zablokować własnego konta.");

  await supabase
    .from("profiles")
    .update({
      is_blocked:     true,
      blocked_reason: reason ?? null,
      blocked_at:     new Date().toISOString(),
    })
    .eq("id", userId);

  revalidatePath("/superadmin");
}

export async function unblockUser(userId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak autoryzacji.");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (me?.role !== "admin") throw new Error("Brak uprawnień.");

  await supabase
    .from("profiles")
    .update({
      is_blocked:     false,
      blocked_reason: null,
      blocked_at:     null,
    })
    .eq("id", userId);

  revalidatePath("/superadmin");
}
