import { createClient } from "@/lib/supabase/server";

export type Badge = {
  id: string;
  label: string;
  emoji: string;
  description: string;
  awarded_at: string;
};

export async function getUserBadges(userId: string): Promise<Badge[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_badges")
    .select("awarded_at, badges(id, label, emoji, description)")
    .eq("user_id", userId)
    .order("awarded_at", { ascending: true });

  if (error) {
    console.error("getUserBadges:", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => {
      const badge = row.badges as { id: string; label: string; emoji: string; description: string } | null;
      if (!badge) return null;
      return { ...badge, awarded_at: row.awarded_at };
    })
    .filter((b): b is Badge => b !== null);
}

export async function checkAndAwardBadges(userId: string): Promise<void> {
  const supabase = await createClient();

  // Pobierz statystyki usera
  const [goingRes, savedRes, profileRes, userCountRes] = await Promise.all([
    supabase
      .from("event_participants")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "going"),
    supabase
      .from("event_participants")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "saved"),
    supabase
      .from("profiles")
      .select("created_at")
      .eq("id", userId)
      .single(),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true }),
  ]);

  const goingCount = goingRes.count ?? 0;
  const savedCount = savedRes.count ?? 0;
  const totalUsers = userCountRes.count ?? 999;

  // Pobierz już przyznane odznaki
  const { data: existingBadges } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);

  const awarded = new Set((existingBadges ?? []).map((b) => b.badge_id));

  const toAward: string[] = [];

  if (goingCount >= 1 && !awarded.has("first_event")) {
    toAward.push("first_event");
  }
  if (totalUsers <= 100 && !awarded.has("early_bird")) {
    toAward.push("early_bird");
  }
  if (savedCount >= 3 && !awarded.has("collector")) {
    toAward.push("collector");
  }
  if (goingCount >= 3 && !awarded.has("active")) {
    toAward.push("active");
  }

  if (toAward.length === 0) return;

  await supabase.from("user_badges").insert(
    toAward.map((badge_id) => ({ user_id: userId, badge_id })),
  );
}
