"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateBio(bio: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Musisz być zalogowany.");

  const { error } = await supabase
    .from("profiles")
    .update({ bio: bio.trim() || null })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/profile");
}

export async function updateFullName(fullName: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Musisz być zalogowany.");

  const trimmed = fullName.trim();
  if (!trimmed) throw new Error("Imię nie może być puste.");
  if (trimmed.length > 50) throw new Error("Imię może mieć maksymalnie 50 znaków.");

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: trimmed })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/profile");
}

export async function updateAvatarUrl(avatarUrl: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Musisz być zalogowany.");

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/profile");
}
