import { createClient } from "@/lib/supabase/server";

export type HistoryEventBucket = "upcoming" | "past" | "saved" | "cancelled";

export type HistoryEventItem = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  location: string;
  coverUrl: string | null;
  organizerName: string | null;
  participationStatus: "going" | "saved";
  eventStatus: string;
  badges: Array<{ id: string; name: string; color: string }>;
  bucket: HistoryEventBucket;
};

export type ActivityItem = {
  id: string;
  type:
    | "joined_event"
    | "saved_event"
    | "followed_user"
    | "created_post"
    | "created_comment"
    | "earned_badge"
    | "earned_event_badge";
  title: string;
  body: string | null;
  createdAt: string;
  href?: string;
};

export type UserHistory = {
  events: {
    upcoming: HistoryEventItem[];
    past: HistoryEventItem[];
    saved: HistoryEventItem[];
    cancelled: HistoryEventItem[];
  };
  activity: ActivityItem[];
};

function bucketForEvent(input: {
  participationStatus: "going" | "saved";
  eventStatus: string;
  startsAt: string;
  endsAt: string;
  now: number;
}): HistoryEventBucket {
  if (input.eventStatus === "cancelled") return "cancelled";
  if (input.participationStatus === "saved") return "saved";
  const end = new Date(input.endsAt || input.startsAt).getTime();
  if (end < input.now) return "past";
  return "upcoming";
}

export async function getUserHistory(userId: string): Promise<UserHistory> {
  const supabase = await createClient();
  const now = Date.now();

  const [
    participantsRes,
    followsRes,
    postsRes,
    commentsRes,
    badgesRes,
    eventAwardsRes,
  ] = await Promise.all([
    supabase
      .from("event_participants")
      .select(
        "status, created_at, events(id, title, starts_at, ends_at, location, cover_url, status, created_by)",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("follows")
      .select("following_id, created_at")
      .eq("follower_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("posts")
      .select("id, content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("post_comments")
      .select("id, content, created_at, post_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("user_badges")
      .select("badge_id, awarded_at, badges(label)")
      .eq("user_id", userId)
      .order("awarded_at", { ascending: false })
      .limit(50),
    supabase
      .from("event_achievement_awards")
      .select(
        "id, awarded_at, event_achievements(id, name, color, event_id, events(title))",
      )
      .eq("user_id", userId)
      .order("awarded_at", { ascending: false })
      .limit(50),
  ]);

  type ParticipantRow = {
    status: "going" | "saved";
    created_at: string;
    events: {
      id: string;
      title: string;
      starts_at: string;
      ends_at: string;
      location: string;
      cover_url: string | null;
      status: string;
      created_by: string | null;
    } | null;
  };

  const participants = (participantsRes.data ?? []) as unknown as ParticipantRow[];
  const eventIds = participants
    .map((p) => p.events?.id)
    .filter((id): id is string => Boolean(id));
  const organizerIds = [
    ...new Set(
      participants
        .map((p) => p.events?.created_by)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const [organizersRes, awardsForEventsRes] = await Promise.all([
    organizerIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, full_name, username, email")
          .in("id", organizerIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null; username: string | null; email: string | null }> }),
    eventIds.length > 0
      ? supabase
          .from("event_achievement_awards")
          .select("event_achievements(id, name, color, event_id)")
          .eq("user_id", userId)
      : Promise.resolve({ data: [] as Array<{ event_achievements: { id: string; name: string; color: string; event_id: string } | null }> }),
  ]);

  const organizerMap = new Map(
    (organizersRes.data ?? []).map((p) => [
      p.id,
      p.full_name?.trim() ||
        (p.username ? `@${p.username}` : null) ||
        p.email?.split("@")[0] ||
        "Organizator",
    ]),
  );

  const badgesByEvent = new Map<string, Array<{ id: string; name: string; color: string }>>();
  for (const row of awardsForEventsRes.data ?? []) {
    const a = (row as { event_achievements: { id: string; name: string; color: string; event_id: string } | null }).event_achievements;
    if (!a?.event_id) continue;
    const list = badgesByEvent.get(a.event_id) ?? [];
    if (!list.some((b) => b.id === a.id)) {
      list.push({ id: a.id, name: a.name, color: a.color });
    }
    badgesByEvent.set(a.event_id, list);
  }

  const events: UserHistory["events"] = {
    upcoming: [],
    past: [],
    saved: [],
    cancelled: [],
  };

  const seenEventKeys = new Set<string>();
  for (const row of participants) {
    const event = row.events;
    if (!event) continue;
    const key = `${event.id}:${row.status}`;
    if (seenEventKeys.has(key)) continue;
    seenEventKeys.add(key);

    const bucket = bucketForEvent({
      participationStatus: row.status,
      eventStatus: event.status,
      startsAt: event.starts_at,
      endsAt: event.ends_at,
      now,
    });

    const item: HistoryEventItem = {
      id: event.id,
      title: event.title,
      startsAt: event.starts_at,
      endsAt: event.ends_at,
      location: event.location,
      coverUrl: event.cover_url,
      organizerName: event.created_by
        ? organizerMap.get(event.created_by) ?? null
        : null,
      participationStatus: row.status,
      eventStatus: event.status,
      badges: badgesByEvent.get(event.id) ?? [],
      bucket,
    };

    events[bucket].push(item);
  }

  for (const key of Object.keys(events) as HistoryEventBucket[]) {
    events[key].sort(
      (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
    );
  }

  const activity: ActivityItem[] = [];

  for (const row of participants) {
    const event = row.events;
    if (!event) continue;
    activity.push({
      id: `part-${event.id}-${row.status}-${row.created_at}`,
      type: row.status === "saved" ? "saved_event" : "joined_event",
      title:
        row.status === "saved"
          ? "Zapisano wydarzenie"
          : "Dołączono do wydarzenia",
      body: event.title,
      createdAt: row.created_at,
      href: `/events/${event.id}`,
    });
  }

  const followIds = (followsRes.data ?? []).map((f) => f.following_id);
  const followProfiles =
    followIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, username")
          .in("id", followIds)
      : { data: [] as Array<{ id: string; full_name: string | null; username: string | null }> };

  const followNameMap = new Map(
    (followProfiles.data ?? []).map((p) => [
      p.id,
      p.full_name?.trim() || (p.username ? `@${p.username}` : "użytkownika"),
    ]),
  );
  const followUsernameMap = new Map(
    (followProfiles.data ?? []).map((p) => [p.id, p.username]),
  );

  for (const row of followsRes.data ?? []) {
    const username = followUsernameMap.get(row.following_id);
    activity.push({
      id: `follow-${row.following_id}-${row.created_at}`,
      type: "followed_user",
      title: "Rozpoczęto obserwowanie użytkownika",
      body: followNameMap.get(row.following_id) ?? null,
      createdAt: row.created_at,
      href: username ? `/profile/${encodeURIComponent(username)}` : undefined,
    });
  }

  for (const row of postsRes.data ?? []) {
    activity.push({
      id: `post-${row.id}`,
      type: "created_post",
      title: "Dodano nowy post",
      body: row.content?.slice(0, 80) || null,
      createdAt: row.created_at,
    });
  }

  for (const row of commentsRes.data ?? []) {
    activity.push({
      id: `comment-${row.id}`,
      type: "created_comment",
      title: "Dodano komentarz",
      body: row.content?.slice(0, 80) || null,
      createdAt: row.created_at,
    });
  }

  for (const row of badgesRes.data ?? []) {
    const badge = row.badges as unknown as { label: string } | null;
    activity.push({
      id: `badge-${row.badge_id}-${row.awarded_at}`,
      type: "earned_badge",
      title: "Zdobyto odznakę",
      body: badge?.label ?? row.badge_id,
      createdAt: row.awarded_at,
    });
  }

  for (const row of eventAwardsRes.data ?? []) {
    const a = row.event_achievements as unknown as {
      id: string;
      name: string;
      event_id: string;
      events: { title: string } | null;
    } | null;
    if (!a) continue;
    activity.push({
      id: `event-badge-${row.id}`,
      type: "earned_event_badge",
      title: "Zdobyto odznakę wydarzenia",
      body: a.events?.title ? `${a.name} · ${a.events.title}` : a.name,
      createdAt: row.awarded_at,
      href: `/events/${a.event_id}`,
    });
  }

  activity.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return {
    events,
    activity: activity.slice(0, 150),
  };
}
