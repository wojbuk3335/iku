import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUserParticipation } from "@/app/events/actions";
import { getPublishedEventAchievements } from "@/app/admin/events/achievements-actions";
import { BottomNav } from "@/components/events/bottom-nav";
import { EventParticipationButtons } from "@/components/events/event-participation-buttons";
import { EventAchievementsSection } from "@/components/achievements/event-achievements-section";
import { FollowCreatorCard } from "@/components/events/follow-creator-card";
import { TrackEventView } from "@/components/events/track-event-view";
import { formatEventDateRange } from "@/lib/events/format-event-date";
import { getCategoryMeta, getEventCategories } from "@/lib/events/category-style";
import { getGoingCount } from "@/lib/events/get-going-counts";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { createClient } from "@/lib/supabase/server";
import type { Event } from "@/types/event";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await getSessionProfile();

  if (!user) {
    redirect("/");
  }

  if (profile?.role === "admin") {
    redirect("/admin");
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select(
      "id, title, description, category, categories, recurrence, starts_at, ends_at, location, location_name, place_id, latitude, longitude, cover_url, status, created_by, created_at, updated_at",
    )
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (!data) {
    notFound();
  }

  const event = data as Event;
  const eventCategories = getEventCategories(event);
  const primary = getCategoryMeta(eventCategories[0]);
  const { emoji, gradient } = primary;

  const isOwnEvent = event.created_by === user.id;

  const [participation, goingCount, achievements, creatorRes, followRes] =
    await Promise.all([
      getUserParticipation(event.id),
      getGoingCount(event.id),
      getPublishedEventAchievements(event.id),
      supabase
        .from("profiles")
        .select("id, full_name, avatar_url, email")
        .eq("id", event.created_by)
        .maybeSingle(),
      isOwnEvent
        ? Promise.resolve({ data: null })
        : supabase
            .from("follows")
            .select("follower_id")
            .eq("follower_id", user.id)
            .eq("following_id", event.created_by)
            .maybeSingle(),
    ]);

  const creator = creatorRes.data;
  const creatorName =
    creator?.full_name?.trim() ||
    creator?.email?.split("@")[0] ||
    "Twórca";
  const initiallyFollowing = Boolean(followRes.data);

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-[#080810] pb-28 text-white">
      <TrackEventView eventId={event.id} />
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/5 bg-[#080810]/90 px-4 py-4 backdrop-blur-md">
        <Link
          href="/events"
          className="rounded-full p-1 text-zinc-300 transition-colors hover:text-white"
          aria-label="Wróć"
        >
          ←
        </Link>
        <h1 className="truncate text-base font-semibold">{event.title}</h1>
      </header>

      <div
        className={`relative aspect-[4/3] bg-gradient-to-br ${gradient} ${
          event.cover_url ? "" : "flex items-center justify-center"
        }`}
      >
        {event.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.cover_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-6xl" aria-hidden>
            {emoji}
          </span>
        )}
      </div>

      <main className="space-y-4 px-4 py-5">
        <div>
          <div className="flex flex-wrap gap-2">
            {eventCategories.map((cat) => {
              const meta = getCategoryMeta(cat);
              return (
                <span
                  key={cat}
                  className="rounded-full bg-violet-500/20 px-3 py-1 text-xs text-violet-200"
                >
                  {meta.emoji} {meta.label}
                </span>
              );
            })}
          </div>
          <h2 className="mt-3 text-2xl font-bold">{event.title}</h2>
          <p className="mt-2 text-sm text-zinc-400">
            {formatEventDateRange(event.starts_at, event.ends_at)}
          </p>
          <p className="mt-1 text-sm text-zinc-400">{event.location}</p>
          {event.latitude != null && event.longitude != null && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-violet-300 transition-colors hover:text-violet-200"
            >
              Otwórz w Google Maps →
            </a>
          )}
        </div>

        {event.description && (
          <p className="text-base leading-relaxed text-zinc-300">
            {event.description}
          </p>
        )}

        {!isOwnEvent && creator && (
          <FollowCreatorCard
            creatorId={creator.id}
            name={creatorName}
            avatarUrl={creator.avatar_url ?? null}
            initiallyFollowing={initiallyFollowing}
          />
        )}

        <EventParticipationButtons
          eventId={event.id}
          initialParticipation={participation}
          goingCount={goingCount}
        />

        <EventAchievementsSection achievements={achievements} />
      </main>

      <BottomNav />
    </div>
  );
}
