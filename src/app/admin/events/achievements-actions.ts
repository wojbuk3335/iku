"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  EventAchievement,
  EventAchievementInput,
} from "@/types/achievement";

async function requireEventOwner(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Musisz być zalogowany.");

  const { data: event } = await supabase
    .from("events")
    .select("id, title, created_by")
    .eq("id", eventId)
    .single();

  if (!event || event.created_by !== user.id) {
    throw new Error("Brak uprawnień do tego wydarzenia.");
  }

  return { supabase, userId: user.id, event };
}

function validateInput(input: EventAchievementInput) {
  const name = input.name.trim();
  const description = input.description.trim();

  if (!name) throw new Error("Podaj nazwę odznaki.");
  if (name.length > 100) throw new Error("Nazwa jest za długa.");
  if (!description) throw new Error("Podaj opis odznaki.");
  if (description.length > 500) throw new Error("Opis jest za długi.");

  const needsThreshold =
    input.unlock_type === "event_count" ||
    input.unlock_type === "recurring_count";

  if (needsThreshold) {
    const t = input.unlock_threshold;
    if (!t || t < 1) throw new Error("Podaj liczbę wymaganą do zdobycia odznaki.");
  }

  if (input.has_reward && !input.reward_label?.trim()) {
    throw new Error("Podaj opis nagrody lub wyłącz nagrodę.");
  }

  return {
    name,
    description,
    unlock_threshold: needsThreshold ? input.unlock_threshold ?? null : null,
    reward_label: input.has_reward ? input.reward_label?.trim() ?? null : null,
  };
}

export async function getEventAchievements(
  eventId: string,
): Promise<EventAchievement[]> {
  const { supabase } = await requireEventOwner(eventId);

  const { data, error } = await supabase
    .from("event_achievements")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const achievements = (data ?? []) as EventAchievement[];
  if (achievements.length === 0) return [];

  const ids = achievements.map((a) => a.id);
  const { data: awards } = await supabase
    .from("event_achievement_awards")
    .select("achievement_id")
    .in("achievement_id", ids);

  const counts = new Map<string, number>();
  for (const row of awards ?? []) {
    counts.set(row.achievement_id, (counts.get(row.achievement_id) ?? 0) + 1);
  }

  return achievements.map((a) => ({
    ...a,
    awards_count: counts.get(a.id) ?? 0,
  }));
}

export async function getEventAchievement(
  eventId: string,
  achievementId: string,
): Promise<EventAchievement | null> {
  const { supabase } = await requireEventOwner(eventId);

  const { data, error } = await supabase
    .from("event_achievements")
    .select("*")
    .eq("id", achievementId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (error || !data) return null;
  return data as EventAchievement;
}

export async function getPublishedEventAchievements(
  eventId: string,
): Promise<EventAchievement[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("event_achievements")
    .select("*")
    .eq("event_id", eventId)
    .eq("status", "active")
    .in("visibility", ["visible", "after_unlock"])
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getPublishedEventAchievements:", error.message);
    return [];
  }

  return (data ?? []) as EventAchievement[];
}

export async function createEventAchievement(
  input: EventAchievementInput,
): Promise<string> {
  const validated = validateInput(input);
  const { supabase, userId } = await requireEventOwner(input.event_id);

  const { data, error } = await supabase
    .from("event_achievements")
    .insert({
      event_id: input.event_id,
      created_by: userId,
      name: validated.name,
      description: validated.description,
      icon: input.icon,
      color: input.color,
      background: input.background,
      style: input.style,
      custom_image_url: input.custom_image_url ?? null,
      unlock_type: input.unlock_type,
      unlock_threshold: validated.unlock_threshold,
      has_reward: input.has_reward,
      reward_label: validated.reward_label,
      visibility: input.visibility,
      status: input.status ?? "active",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/events/${input.event_id}/achievements`);
  revalidatePath(`/events/${input.event_id}`);
  return data.id;
}

export async function updateEventAchievement(
  achievementId: string,
  input: EventAchievementInput,
): Promise<void> {
  const validated = validateInput(input);
  const { supabase } = await requireEventOwner(input.event_id);

  const { error } = await supabase
    .from("event_achievements")
    .update({
      name: validated.name,
      description: validated.description,
      icon: input.icon,
      color: input.color,
      background: input.background,
      style: input.style,
      custom_image_url: input.custom_image_url ?? null,
      unlock_type: input.unlock_type,
      unlock_threshold: validated.unlock_threshold,
      has_reward: input.has_reward,
      reward_label: validated.reward_label,
      visibility: input.visibility,
      status: input.status ?? "active",
    })
    .eq("id", achievementId)
    .eq("event_id", input.event_id);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/events/${input.event_id}/achievements`);
  revalidatePath(`/admin/events/${input.event_id}/achievements/${achievementId}`);
  revalidatePath(`/events/${input.event_id}`);
}

export async function setEventAchievementStatus(
  eventId: string,
  achievementId: string,
  status: "active" | "disabled",
): Promise<void> {
  const { supabase } = await requireEventOwner(eventId);

  const { error } = await supabase
    .from("event_achievements")
    .update({ status })
    .eq("id", achievementId)
    .eq("event_id", eventId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/events/${eventId}/achievements`);
  revalidatePath(`/events/${eventId}`);
}

export async function deleteEventAchievement(
  eventId: string,
  achievementId: string,
): Promise<void> {
  const { supabase } = await requireEventOwner(eventId);

  const { error } = await supabase
    .from("event_achievements")
    .delete()
    .eq("id", achievementId)
    .eq("event_id", eventId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/events/${eventId}/achievements`);
  revalidatePath(`/events/${eventId}`);
}

export async function getEventAchievementStats(eventId: string): Promise<{
  badges: number;
  unlocks: number;
  participants: number;
}> {
  const { supabase } = await requireEventOwner(eventId);

  const { data: achievements } = await supabase
    .from("event_achievements")
    .select("id")
    .eq("event_id", eventId);

  const ids = (achievements ?? []).map((a) => a.id);
  let unlocks = 0;
  if (ids.length > 0) {
    const { count } = await supabase
      .from("event_achievement_awards")
      .select("*", { count: "exact", head: true })
      .in("achievement_id", ids);
    unlocks = count ?? 0;
  }

  const { count: participants } = await supabase
    .from("event_participants")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "going");

  return {
    badges: ids.length,
    unlocks,
    participants: participants ?? 0,
  };
}
