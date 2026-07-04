"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CustomBadgeInput = {
  name: string;
  short_description: string;
  full_description?: string;
  icon: string;
  icon_scale: number;
  rarity: string;
  unlock_condition: string;
  visibility: string;
  reward_type: string;
};

export async function createCustomBadge(input: CustomBadgeInput): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Musisz być zalogowany.");

  const { data, error } = await supabase
    .from("custom_badges")
    .insert({
      created_by:        user.id,
      name:              input.name,
      short_description: input.short_description,
      full_description:  input.full_description ?? null,
      icon:              input.icon,
      icon_scale:        input.icon_scale,
      rarity:            input.rarity,
      unlock_condition:  input.unlock_condition,
      visibility:        input.visibility,
      reward_type:       input.reward_type,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/profile");
  return data.id;
}
