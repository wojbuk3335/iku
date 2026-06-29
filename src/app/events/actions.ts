"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ParticipationStatus, UserParticipation } from "@/types/participation";

export async function toggleParticipation(
  eventId: string,
  status: ParticipationStatus,
): Promise<UserParticipation> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Musisz być zalogowany.");
  }

  const { data: existing } = await supabase
    .from("event_participants")
    .select("status")
    .eq("user_id", user.id)
    .eq("event_id", eventId)
    .eq("status", status)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("event_participants")
      .delete()
      .eq("user_id", user.id)
      .eq("event_id", eventId)
      .eq("status", status);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase.from("event_participants").insert({
      user_id: user.id,
      event_id: eventId,
      status,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);

  return getUserParticipation(eventId);
}

export async function getUserParticipation(
  eventId: string,
): Promise<UserParticipation> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { going: false, saved: false };
  }

  const { data } = await supabase
    .from("event_participants")
    .select("status")
    .eq("user_id", user.id)
    .eq("event_id", eventId);

  const statuses = (data ?? []).map((row) => row.status);

  return {
    going: statuses.includes("going"),
    saved: statuses.includes("saved"),
  };
}
