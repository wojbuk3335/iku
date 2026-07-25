"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAgeFromBirthDate } from "@/lib/profile/birth-date";
import { INTEREST_CATEGORIES } from "@/types/interests";
import type { CreateEventInput, Event, EventCategory, EventRecurrence } from "@/types/event";

const VALID_CATEGORIES = new Set<EventCategory>(
  INTEREST_CATEGORIES.map((item) => item.id),
);

const VALID_RECURRENCE = new Set<EventRecurrence>(["one_time", "recurring"]);

export type UpdateEventInput = Omit<CreateEventInput, "cover_url"> & {
  id: string;
  cover_url?: string | null;
};

async function requireEventManager() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Musisz być zalogowany.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "creator") {
    throw new Error("Brak uprawnień.");
  }

  return { supabase, userId: user.id, role: profile?.role as string };
}

const EVENT_COLUMNS =
  "id, title, description, category, categories, recurrence, starts_at, ends_at, location, location_name, place_id, latitude, longitude, cover_url, status, created_by, created_at, updated_at";

function validateEventInput(input: Omit<CreateEventInput, "cover_url">) {
  const title = input.title.trim();
  const location = input.location.trim();

  if (!title) throw new Error("Podaj tytuł wydarzenia.");
  if (!location) throw new Error("Podaj lokalizację.");

  if (
    typeof input.latitude !== "number" ||
    typeof input.longitude !== "number" ||
    Number.isNaN(input.latitude) ||
    Number.isNaN(input.longitude)
  ) {
    throw new Error("Wybierz lokalizację z listy podpowiedzi Google.");
  }

  if (input.categories.length === 0) {
    throw new Error("Wybierz co najmniej jedną kategorię.");
  }
  if (input.categories.length > 2) {
    throw new Error("Możesz wybrać maksymalnie 2 kategorie.");
  }

  const invalidCat = input.categories.find((c) => !VALID_CATEGORIES.has(c));
  if (invalidCat) throw new Error(`Nieprawidłowa kategoria: ${invalidCat}`);

  if (!input.starts_at) throw new Error("Podaj datę i godzinę rozpoczęcia.");
  if (!input.ends_at) throw new Error("Podaj datę i godzinę zakończenia.");

  const startsAt = new Date(input.starts_at);
  const endsAt = new Date(input.ends_at);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    throw new Error("Nieprawidłowa data lub godzina.");
  }
  if (endsAt <= startsAt) {
    throw new Error("Zakończenie musi być późniejsze niż rozpoczęcie.");
  }

  const recurrence = input.recurrence ?? "one_time";
  if (!VALID_RECURRENCE.has(recurrence)) {
    throw new Error("Nieprawidłowy typ wydarzenia.");
  }

  return {
    title,
    location,
    description: input.description?.trim() ?? null,
    primaryCategory: input.categories[0],
    startsAt,
    endsAt,
    recurrence,
    location_name: input.location_name?.trim() ?? null,
    place_id: input.place_id ?? null,
    latitude: input.latitude,
    longitude: input.longitude,
  };
}

export async function getCreatorEvents(): Promise<Event[]> {
  const { supabase, userId } = await requireEventManager();

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("created_by", userId)
    .order("starts_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Event[];
}

export type CreatorEventBadge = {
  id: string;
  event_id: string;
  name: string;
  icon: string;
  color: string;
};

/** Odznaki twórcy pogrupowane po event_id — do listy „Utworzone wydarzenia”. */
export async function getCreatorEventBadges(): Promise<
  Record<string, CreatorEventBadge[]>
> {
  const { supabase, userId } = await requireEventManager();

  const { data, error } = await supabase
    .from("event_achievements")
    .select("id, event_id, name, icon, color, status")
    .eq("created_by", userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const map: Record<string, CreatorEventBadge[]> = {};
  for (const row of data ?? []) {
    const badge: CreatorEventBadge = {
      id: row.id,
      event_id: row.event_id,
      name: row.name,
      icon: row.icon,
      color: row.color,
    };
    if (!map[row.event_id]) map[row.event_id] = [];
    map[row.event_id].push(badge);
  }
  return map;
}

export async function getCreatorEvent(id: string): Promise<Event | null> {
  const { supabase, userId } = await requireEventManager();

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("id", id)
    .eq("created_by", userId)
    .single();

  if (error) return null;
  return data as Event;
}

export async function createEvent(
  input: CreateEventInput,
): Promise<{ id: string }> {
  const validated = validateEventInput(input);
  const { supabase, userId } = await requireEventManager();

  const { data, error } = await supabase
    .from("events")
    .insert({
      title:       validated.title,
      description: validated.description,
      category:    validated.primaryCategory,
      categories:  input.categories,
      recurrence:  validated.recurrence,
      starts_at:   validated.startsAt.toISOString(),
      ends_at:     validated.endsAt.toISOString(),
      location:    validated.location,
      location_name: validated.location_name,
      place_id:    validated.place_id,
      latitude:    validated.latitude,
      longitude:   validated.longitude,
      cover_url:   input.cover_url ?? null,
      status:      input.status ?? "published",
      created_by:  userId,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { id: data.id };
}

export async function updateEvent(input: UpdateEventInput): Promise<void> {
  const validated = validateEventInput(input);
  const { supabase, userId } = await requireEventManager();

  const payload: Record<string, unknown> = {
    title:       validated.title,
    description: validated.description,
    category:    validated.primaryCategory,
    categories:  input.categories,
    recurrence:  validated.recurrence,
    starts_at:   validated.startsAt.toISOString(),
    ends_at:     validated.endsAt.toISOString(),
    location:    validated.location,
    location_name: validated.location_name,
    place_id:    validated.place_id,
    latitude:    validated.latitude,
    longitude:   validated.longitude,
  };

  if (input.cover_url !== undefined) {
    payload.cover_url = input.cover_url;
  }

  if (!input.id) {
    throw new Error("Brak ID wydarzenia.");
  }

  const { error } = await supabase
    .from("events")
    .update(payload)
    .eq("id", input.id)
    .eq("created_by", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/events");
  revalidatePath("/admin/stats");
  revalidatePath(`/admin/events/${input.id}`);
  revalidatePath("/events");
  revalidatePath(`/events/${input.id}`);
}

export async function deleteEvent(id: string): Promise<void> {
  if (!id) throw new Error("Brak ID wydarzenia.");

  const { supabase, userId } = await requireEventManager();

  const { data, error } = await supabase
    .from("events")
    .delete()
    .eq("id", id)
    .eq("created_by", userId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error("Nie możesz usunąć tego wydarzenia — nie jesteś jego twórcą.");
  }

  revalidatePath("/admin/events");
  revalidatePath("/admin/stats");
  revalidatePath("/admin/achievements");
  revalidatePath("/events");
  revalidatePath("/map");
}

export type CreatorViewStats = {
  total: number;
  last7Days: number;
  prev7Days: number;
  /** Liczba wyświetleń na każdy z ostatnich 7 dni (od najstarszego). */
  seriesLast7Days: number[];
};

export type CreatorParticipantStats = {
  total: number;
  last7Days: number;
  prev7Days: number;
  seriesLast7Days: number[];
};

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function emptyMetricStats() {
  return {
    total: 0,
    last7Days: 0,
    prev7Days: 0,
    seriesLast7Days: [0, 0, 0, 0, 0, 0, 0],
  };
}

function aggregateByDayWindows(
  rows: { created_at: string }[],
): Omit<CreatorViewStats, "total"> {
  const now = new Date();
  const todayStart = startOfLocalDay(now);
  const last7Start = new Date(todayStart);
  last7Start.setDate(last7Start.getDate() - 6);
  const prev7Start = new Date(todayStart);
  prev7Start.setDate(prev7Start.getDate() - 13);
  const prev7End = new Date(todayStart);
  prev7End.setDate(prev7End.getDate() - 6);

  const seriesLast7Days = [0, 0, 0, 0, 0, 0, 0];
  let last7Days = 0;
  let prev7Days = 0;

  for (const row of rows) {
    const ts = new Date(row.created_at);
    if (Number.isNaN(ts.getTime())) continue;

    if (ts >= last7Start) {
      last7Days += 1;
      const dayIndex = Math.floor(
        (startOfLocalDay(ts).getTime() - last7Start.getTime()) /
          (24 * 60 * 60 * 1000),
      );
      if (dayIndex >= 0 && dayIndex < 7) {
        seriesLast7Days[dayIndex] += 1;
      }
    } else if (ts >= prev7Start && ts < prev7End) {
      prev7Days += 1;
    }
  }

  return { last7Days, prev7Days, seriesLast7Days };
}

async function getCreatorEventIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("events")
    .select("id")
    .eq("created_by", userId);

  if (error || !data?.length) return [];
  return data.map((e) => e.id);
}

/** Agregaty wyświetleń dla wydarzeń zalogowanego twórcy. */
export async function getCreatorViewStats(): Promise<CreatorViewStats> {
  const empty = emptyMetricStats();
  const { supabase, userId } = await requireEventManager();
  const eventIds = await getCreatorEventIds(supabase, userId);
  if (!eventIds.length) return empty;

  const { count: total, error: totalError } = await supabase
    .from("event_views")
    .select("id", { count: "exact", head: true })
    .in("event_id", eventIds);

  if (totalError) {
    console.error("getCreatorViewStats total:", totalError.message);
    return empty;
  }

  const now = new Date();
  const todayStart = startOfLocalDay(now);
  const prev7Start = new Date(todayStart);
  prev7Start.setDate(prev7Start.getDate() - 13);

  const { data: recentRows, error: recentError } = await supabase
    .from("event_views")
    .select("created_at")
    .in("event_id", eventIds)
    .gte("created_at", prev7Start.toISOString());

  if (recentError) {
    console.error("getCreatorViewStats recent:", recentError.message);
    return { ...empty, total: total ?? 0 };
  }

  return {
    total: total ?? 0,
    ...aggregateByDayWindows(
      (recentRows ?? []).map((r) => ({
        created_at: r.created_at as string,
      })),
    ),
  };
}

/** Agregaty „Idę” (going) dla wydarzeń zalogowanego twórcy. */
export async function getCreatorParticipantStats(): Promise<CreatorParticipantStats> {
  const empty = emptyMetricStats();
  const { supabase, userId } = await requireEventManager();
  const eventIds = await getCreatorEventIds(supabase, userId);
  if (!eventIds.length) return empty;

  const { count: total, error: totalError } = await supabase
    .from("event_participants")
    .select("user_id", { count: "exact", head: true })
    .in("event_id", eventIds)
    .eq("status", "going");

  if (totalError) {
    console.error("getCreatorParticipantStats total:", totalError.message);
    return empty;
  }

  const now = new Date();
  const todayStart = startOfLocalDay(now);
  const prev7Start = new Date(todayStart);
  prev7Start.setDate(prev7Start.getDate() - 13);

  const { data: recentRows, error: recentError } = await supabase
    .from("event_participants")
    .select("created_at")
    .in("event_id", eventIds)
    .eq("status", "going")
    .gte("created_at", prev7Start.toISOString());

  if (recentError) {
    console.error("getCreatorParticipantStats recent:", recentError.message);
    return { ...empty, total: total ?? 0 };
  }

  return {
    total: total ?? 0,
    ...aggregateByDayWindows(
      (recentRows ?? []).map((r) => ({
        created_at: r.created_at as string,
      })),
    ),
  };
}

export type CreatorFollowerStats = {
  total: number;
  last7Days: number;
  prev7Days: number;
};

export type CreatorFollowerRow = {
  id: string;
  name: string;
  detail: string;
  badge: "VIP" | "Fan";
  avatar: string | null;
};

/** Liczba osób obserwujących twórcę + trend 7 dni. */
export async function getCreatorFollowerStats(): Promise<CreatorFollowerStats> {
  const empty = { total: 0, last7Days: 0, prev7Days: 0 };
  const { supabase, userId } = await requireEventManager();

  const { count: total, error: totalError } = await supabase
    .from("follows")
    .select("follower_id", { count: "exact", head: true })
    .eq("following_id", userId);

  if (totalError) {
    console.error("getCreatorFollowerStats total:", totalError.message);
    return empty;
  }

  const now = new Date();
  const todayStart = startOfLocalDay(now);
  const last7Start = new Date(todayStart);
  last7Start.setDate(last7Start.getDate() - 6);
  const prev7Start = new Date(todayStart);
  prev7Start.setDate(prev7Start.getDate() - 13);
  const prev7End = new Date(todayStart);
  prev7End.setDate(prev7End.getDate() - 6);

  const { data: recentRows, error: recentError } = await supabase
    .from("follows")
    .select("created_at")
    .eq("following_id", userId)
    .gte("created_at", prev7Start.toISOString());

  if (recentError) {
    console.error("getCreatorFollowerStats recent:", recentError.message);
    return { ...empty, total: total ?? 0 };
  }

  let last7Days = 0;
  let prev7Days = 0;

  for (const row of recentRows ?? []) {
    const ts = new Date(row.created_at as string);
    if (Number.isNaN(ts.getTime())) continue;
    if (ts >= last7Start) last7Days += 1;
    else if (ts >= prev7Start && ts < prev7End) prev7Days += 1;
  }

  return { total: total ?? 0, last7Days, prev7Days };
}

/** Lista osób obserwujących twórcę (do zakładki Widownia). */
export async function getCreatorFollowersList(): Promise<CreatorFollowerRow[]> {
  const { supabase, userId } = await requireEventManager();

  const { data: followRows, error: followError } = await supabase
    .from("follows")
    .select("follower_id, created_at")
    .eq("following_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (followError || !followRows?.length) {
    if (followError) {
      console.error("getCreatorFollowersList:", followError.message);
    }
    return [];
  }

  const followerIds = followRows.map((r) => r.follower_id);

  const [{ data: profiles }, eventIds] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", followerIds),
    getCreatorEventIds(supabase, userId),
  ]);

  const goingByUser = new Map<string, number>();
  if (eventIds.length > 0) {
    const { data: goingRows } = await supabase
      .from("event_participants")
      .select("user_id")
      .in("event_id", eventIds)
      .eq("status", "going")
      .in("user_id", followerIds);

    for (const row of goingRows ?? []) {
      goingByUser.set(
        row.user_id as string,
        (goingByUser.get(row.user_id as string) ?? 0) + 1,
      );
    }
  }

  const profileById = new Map(
    (profiles ?? []).map((p) => [p.id as string, p]),
  );

  return followRows.map((row) => {
    const profile = profileById.get(row.follower_id as string);
    const goingCount = goingByUser.get(row.follower_id as string) ?? 0;
    const name =
      (profile?.full_name as string | null)?.trim() || "Użytkownik";

    let detail = "Obserwuje Twój profil";
    if (goingCount === 1) detail = "Był/a na 1 wydarzeniu";
    else if (goingCount > 1) detail = `Był/a na ${goingCount} wydarzeniach`;

    return {
      id: row.follower_id as string,
      name,
      detail,
      badge: goingCount >= 3 ? ("VIP" as const) : ("Fan" as const),
      avatar: (profile?.avatar_url as string | null) ?? null,
    };
  });
}

export type CreatorDemographicRow = {
  label: string;
  value: number;
  color: string;
  count: number;
};

export type CreatorDemographics = {
  rows: CreatorDemographicRow[];
  sampleSize: number;
  unknownAge: number;
};

const DEMOGRAPHIC_BUCKETS = [
  { label: "18–24 lat", color: "#a855f7", min: 18, max: 24 },
  { label: "25–34 lat", color: "#22d3ee", min: 25, max: 34 },
  { label: "35–44 lat", color: "#fb923c", min: 35, max: 44 },
  { label: "45+", color: "#f472b6", min: 45, max: 120 },
] as const;

/** Wiek widowni twórcy (obserwujący + uczestnicy + wyświetlenia) z birth_date. */
export async function getCreatorDemographics(): Promise<CreatorDemographics> {
  const emptyRows: CreatorDemographicRow[] = DEMOGRAPHIC_BUCKETS.map((b) => ({
    label: b.label,
    value: 0,
    color: b.color,
    count: 0,
  }));
  const empty: CreatorDemographics = {
    rows: emptyRows,
    sampleSize: 0,
    unknownAge: 0,
  };

  const { supabase, userId } = await requireEventManager();
  const eventIds = await getCreatorEventIds(supabase, userId);
  const audienceIds = new Set<string>();

  const { data: followRows } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("following_id", userId);

  for (const row of followRows ?? []) {
    if (row.follower_id && row.follower_id !== userId) {
      audienceIds.add(row.follower_id as string);
    }
  }

  if (eventIds.length > 0) {
    const [{ data: goingRows }, { data: viewRows }] = await Promise.all([
      supabase
        .from("event_participants")
        .select("user_id")
        .in("event_id", eventIds)
        .eq("status", "going"),
      supabase
        .from("event_views")
        .select("viewer_id")
        .in("event_id", eventIds),
    ]);

    for (const row of goingRows ?? []) {
      if (row.user_id && row.user_id !== userId) {
        audienceIds.add(row.user_id as string);
      }
    }
    for (const row of viewRows ?? []) {
      if (row.viewer_id && row.viewer_id !== userId) {
        audienceIds.add(row.viewer_id as string);
      }
    }
  }

  const ids = [...audienceIds];
  if (ids.length === 0) return empty;

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, birth_date")
    .in("id", ids);

  if (error) {
    console.error("getCreatorDemographics:", error.message);
    return empty;
  }

  const counts = DEMOGRAPHIC_BUCKETS.map(() => 0);
  let sampleSize = 0;
  let unknownAge = 0;

  for (const profile of profiles ?? []) {
    const birth = profile.birth_date as string | null;
    if (!birth) {
      unknownAge += 1;
      continue;
    }
    const age = getAgeFromBirthDate(birth);
    if (age === null || age < 18) {
      unknownAge += 1;
      continue;
    }

    const bucketIndex = DEMOGRAPHIC_BUCKETS.findIndex(
      (b) => age >= b.min && age <= b.max,
    );
    if (bucketIndex < 0) {
      unknownAge += 1;
      continue;
    }

    counts[bucketIndex] += 1;
    sampleSize += 1;
  }

  const rows = DEMOGRAPHIC_BUCKETS.map((b, i) => ({
    label: b.label,
    color: b.color,
    count: counts[i],
    value:
      sampleSize > 0 ? Math.round((counts[i] / sampleSize) * 100) : 0,
  }));

  return { rows, sampleSize, unknownAge };
}
