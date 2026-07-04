import { createClient } from "@/lib/supabase/server";

export type Rarity = "Powszechna" | "Rzadka" | "Epicka" | "Legendarna";

export type Badge = {
  id: string;
  label: string;
  emoji: string;
  description: string;
  rarity: Rarity;
  awarded_at: string;
};

export type BadgeWithProgress = {
  id: string;
  label: string;
  emoji: string;
  description: string;
  rarity: Rarity;
  current: number;
  max: number;
  unlocked: boolean;
  awarded_at?: string;
};

// Maps each badge id to which user stat to compare and the required target
const BADGE_CRITERIA: Record<string, { statKey: "going" | "saved" | "following" | "early"; target: number }> = {
  first_event:          { statKey: "going",     target: 1  },
  early_bird:           { statKey: "early",     target: 1  },
  collector:            { statKey: "saved",     target: 3  },
  active:               { statKey: "going",     target: 3  },
  regular_participant:  { statKey: "going",     target: 5  },
  event_veteran:        { statKey: "going",     target: 20 },
  community_ambassador: { statKey: "following", target: 10 },
  trendsetter:          { statKey: "saved",     target: 1  },
  night_player:         { statKey: "going",     target: 10 },
  explorer:             { statKey: "going",     target: 5  },
  weekend_explorer:     { statKey: "going",     target: 3  },
  top_participant:      { statKey: "going",     target: 20 },
};

// Preferred display order for badges tab
const BADGE_ORDER = [
  "first_event",
  "early_bird",
  "regular_participant",
  "active",
  "collector",
  "event_veteran",
  "top_participant",
  "community_ambassador",
  "trendsetter",
  "night_player",
  "explorer",
  "weekend_explorer",
];

// Static fallback definitions — always shown even if DB is missing some rows
const STATIC_BADGE_DEFS: Array<{ id: string; label: string; emoji: string; description: string; rarity: Rarity }> = [
  { id: "first_event",         label: "Pierwsze wydarzenie",   emoji: "🎟️", description: "Poszedłeś na swoje pierwsze wydarzenie",         rarity: "Powszechna" },
  { id: "early_bird",          label: "Wczesny ptak",          emoji: "🌅", description: "Jeden z pierwszych 100 użytkowników aplikacji",   rarity: "Rzadka"     },
  { id: "collector",           label: "Kolekcjoner",           emoji: "🔖", description: "Zapisałeś 3 lub więcej wydarzeń",                 rarity: "Rzadka"     },
  { id: "active",              label: "Aktywny",               emoji: "🎯", description: "Idziesz na 3 lub więcej wydarzeń",                rarity: "Rzadka"     },
  { id: "regular_participant", label: "Stały Uczestnik",       emoji: "📅", description: "Udział w 5 wydarzeniach",                         rarity: "Powszechna" },
  { id: "event_veteran",       label: "Weteran Wydarzeń",      emoji: "🏆", description: "Udział w 20 wydarzeniach",                        rarity: "Epicka"     },
  { id: "community_ambassador",label: "Ambasador Społeczności",emoji: "💎", description: "Obserwuj 10 osób na IKU",                         rarity: "Legendarna" },
  { id: "trendsetter",         label: "Trendsetter",           emoji: "⚡", description: "Pierwszy zapis na popularne wydarzenie",          rarity: "Rzadka"     },
  { id: "night_player",        label: "Nocny Gracz",           emoji: "🌙", description: "Udział w 10 wydarzeniach nocnych",                rarity: "Rzadka"     },
  { id: "explorer",            label: "Eksplorator",           emoji: "🧭", description: "Uczestnik wydarzeń z 5 różnych kategorii",        rarity: "Rzadka"     },
  { id: "weekend_explorer",    label: "Weekendowy Odkrywca",   emoji: "🗺️", description: "Uczestnik 3 wydarzeń w jeden weekend",            rarity: "Powszechna" },
  { id: "top_participant",     label: "Top uczestnik",         emoji: "🥇", description: "Udział w 20 wydarzeniach",                        rarity: "Epicka"     },
];

export async function getAllBadgesWithProgress(userId: string): Promise<BadgeWithProgress[]> {
  const supabase = await createClient();

  const [allBadgesRes, earnedRes, goingRes, savedRes, followingRes, totalUsersRes] = await Promise.all([
    supabase.from("badges").select("*"),
    supabase.from("user_badges").select("badge_id, awarded_at").eq("user_id", userId),
    supabase.from("event_participants").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "going"),
    supabase.from("event_participants").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "saved"),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);

  if (allBadgesRes.error) {
    console.error("getAllBadgesWithProgress [badges]:", allBadgesRes.error.message);
  }
  if (earnedRes.error) {
    console.error("getAllBadgesWithProgress [user_badges]:", earnedRes.error.message);
  }

  const earnedMap = new Map(
    (earnedRes.data ?? []).map((e) => [e.badge_id, e.awarded_at as string])
  );

  const stats = {
    going:     goingRes.count ?? 0,
    saved:     savedRes.count ?? 0,
    following: followingRes.count ?? 0,
    early:     (totalUsersRes.count ?? 999) <= 100 ? 1 : 0,
  };

  // Merge DB rows with static fallback so UI is never empty
  const dbMap = new Map((allBadgesRes.data ?? []).map((b) => [b.id, b]));
  const defsToUse = STATIC_BADGE_DEFS.map((def) => {
    const db = dbMap.get(def.id);
    return {
      id:          def.id,
      label:       db?.label       ?? def.label,
      emoji:       db?.emoji       ?? def.emoji,
      description: db?.description ?? def.description,
      rarity:      ((db as Record<string, unknown>)?.rarity ?? def.rarity) as Rarity,
    };
  });

  const badges = defsToUse.map((def) => {
    const criteria = BADGE_CRITERIA[def.id];
    const isUnlocked = earnedMap.has(def.id);
    const max = criteria?.target ?? 1;
    const rawStat = criteria ? stats[criteria.statKey] : 0;
    const current = isUnlocked ? max : Math.min(rawStat, max);

    return {
      ...def,
      current,
      max,
      unlocked:   isUnlocked,
      awarded_at: earnedMap.get(def.id),
    };
  });

  // Sort by preferred order
  badges.sort((a, b) => {
    const ia = BADGE_ORDER.indexOf(a.id);
    const ib = BADGE_ORDER.indexOf(b.id);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return badges;
}

export async function checkAndAwardBadges(userId: string): Promise<void> {
  const supabase = await createClient();

  const [goingRes, savedRes, followingRes, totalUsersRes] = await Promise.all([
    supabase.from("event_participants").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "going"),
    supabase.from("event_participants").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "saved"),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);

  const going     = goingRes.count ?? 0;
  const saved     = savedRes.count ?? 0;
  const following = followingRes.count ?? 0;
  const isEarly   = (totalUsersRes.count ?? 999) <= 100;

  const { data: existingBadges } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);

  const awarded = new Set((existingBadges ?? []).map((b) => b.badge_id));

  const toAward: string[] = [];

  if (going >= 1  && !awarded.has("first_event"))          toAward.push("first_event");
  if (isEarly     && !awarded.has("early_bird"))            toAward.push("early_bird");
  if (saved >= 3  && !awarded.has("collector"))             toAward.push("collector");
  if (going >= 3  && !awarded.has("active"))                toAward.push("active");
  if (going >= 5  && !awarded.has("regular_participant"))   toAward.push("regular_participant");
  if (going >= 20 && !awarded.has("event_veteran"))         toAward.push("event_veteran");
  if (going >= 20 && !awarded.has("top_participant"))       toAward.push("top_participant");
  if (following >= 10 && !awarded.has("community_ambassador")) toAward.push("community_ambassador");
  if (saved >= 1  && !awarded.has("trendsetter"))           toAward.push("trendsetter");
  if (going >= 10 && !awarded.has("night_player"))          toAward.push("night_player");
  if (going >= 5  && !awarded.has("explorer"))              toAward.push("explorer");
  if (going >= 3  && !awarded.has("weekend_explorer"))      toAward.push("weekend_explorer");

  if (toAward.length === 0) return;

  await supabase.from("user_badges").insert(
    toAward.map((badge_id) => ({ user_id: userId, badge_id }))
  );
}
