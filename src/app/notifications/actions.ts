"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type NotificationType =
  | "event_reminder"
  | "friend_attending"
  | "new_event"
  | "badge_unlocked"
  | "event_invitation"
  | "friend_interested"
  | "nearby_event"
  | "friend_badge"
  | "system";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

export async function getNotifications(): Promise<Notification[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, is_read, created_at, metadata")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("getNotifications:", error.message);
    return [];
  }

  return (data ?? []) as Notification[];
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return count ?? 0;
}

export async function markAllRead(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  revalidatePath("/notifications");
}

export async function markOneRead(notificationId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  revalidatePath("/notifications");
}

export async function seedSampleNotifications(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const now = new Date();
  const ago = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();

  const samples = [
    { type: "event_reminder",   title: "Nannowy Pub Festival zaczyna się za 2 godziny 🔔",                         created_at: ago(0.5) },
    { type: "friend_attending", title: "Anna Kowalska i 2 innych znajomych wybiera się na Miejska Dżungla Party",  created_at: ago(1) },
    { type: "new_event",        title: "Electric Dreams otworzyła nowe wydarzenie Techno Fiesta Vol. 3",            created_at: ago(2) },
    { type: "badge_unlocked",   title: "Odblokowano odznakę \"Weekendowy odkrywca\" 🏆",                           created_at: ago(2) },
    { type: "event_invitation", title: "Masz zaproszenie 1 nowe wydarzenie",                                       created_at: ago(3) },
    { type: "friend_interested",title: "5 znajomych jest zainteresowanych wydarzeniem Cicha Dyskoteka",             created_at: ago(12) },
    { type: "nearby_event",     title: "Nowe wydarzenia dla Ciebie w Twojej okolicy 🔴",                           created_at: ago(24) },
    { type: "friend_badge",     title: "Jan zdobył odznakę \"Nocny Imprezowicz\" 🎉",                              created_at: ago(25) },
    { type: "friend_attending", title: "Alex wybrał się na Miejska Dżungla Party",                                 created_at: ago(48) },
    { type: "nearby_event",     title: "Street Food Fest jest popularny w Twojej okolicy 🔴",                      created_at: ago(49) },
  ];

  await supabase.from("notifications").insert(
    samples.map((s) => ({ ...s, user_id: user.id }))
  );

  revalidatePath("/notifications");
}
