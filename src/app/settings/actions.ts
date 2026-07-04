"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateInterests(interests: string[]): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Musisz być zalogowany.");

  const { error } = await supabase
    .from("profiles")
    .update({ interests })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/events");
}
