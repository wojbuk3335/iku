"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/events/bottom-nav";
import { EventCard } from "@/components/events/event-card";
import { HomeHeader, type PreciseSearchMode } from "@/components/events/home-header";
import { PreciseSearchPanel } from "@/components/events/precise-search-panel";
import { StoriesRow } from "@/components/events/stories-row";
import type { StoryAuthorGroup } from "@/app/stories/actions";
import { searchAllUsers, type SuggestedUser } from "@/app/profile/znajomi-actions";
import { usernameFromEmail } from "@/lib/profile/username";
import {
  countCategoryMatches,
  getCategoryMeta,
  getEventCategories,
} from "@/lib/events/category-style";
import { hasInterestMatches, sortEventsForUser } from "@/lib/events/sort-events";
import type { Event, EventCategory } from "@/types/event";

type HomeFeedProps = {
  events: Event[];
  interests: string[];
  goingCounts: Record<string, number>;
  storyGroups: StoryAuthorGroup[];
  currentUserId: string;
};

const VISIBLE_CARDS = 3;

const SCROLL_LIST_CLASS =
  "flex flex-col gap-4 overscroll-contain pr-1 [scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:#52525b_#18181b] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-zinc-900 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-500";

const SCROLL_LIST_HEIGHT = "calc((min(42rem, 100vw) - 2rem) * 9 / 4 + 2rem)";

function filterEvents(events: Event[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return events;

  return events.filter((event) => {
    const cats = getEventCategories(event)
      .map((c) => getCategoryMeta(c).label)
      .join(" ");

    return (
      event.title.toLowerCase().includes(q) ||
      event.location.toLowerCase().includes(q) ||
      cats.toLowerCase().includes(q) ||
      (event.description?.toLowerCase().includes(q) ?? false)
    );
  });
}

function userInitials(user: SuggestedUser): string {
  if (user.full_name?.trim()) {
    const parts = user.full_name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  const local = (user.email ?? "?").split("@")[0];
  return local.slice(0, 2).toUpperCase();
}

function profileHref(user: SuggestedUser): string {
  const username =
    user.username?.trim() ||
    usernameFromEmail(user.email, user.id);
  return `/profile/${encodeURIComponent(username)}`;
}

function ScrollableEventFeed({
  eventCount,
  children,
}: {
  eventCount: number;
  children: React.ReactNode;
}) {
  const needsScroll = eventCount > VISIBLE_CARDS;

  return (
    <div
      className={`${SCROLL_LIST_CLASS} ${needsScroll ? "overflow-y-scroll" : ""}`}
      style={needsScroll ? { maxHeight: SCROLL_LIST_HEIGHT } : undefined}
    >
      {children}
    </div>
  );
}

function EventCards({
  events,
  interests,
  goingCounts,
}: {
  events: Event[];
  interests: EventCategory[];
  goingCounts: Record<string, number>;
}) {
  return events.map((event) => (
    <EventCard
      key={event.id}
      event={event}
      goingCount={goingCounts[event.id] ?? 0}
      matchCount={
        interests.length > 0
          ? countCategoryMatches(event, interests)
          : undefined
      }
    />
  ));
}

export function HomeFeed({ events, interests, goingCounts, storyGroups, currentUserId }: HomeFeedProps) {
  const [query, setQuery] = useState("");
  const [userResults, setUserResults] = useState<SuggestedUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [preciseMode, setPreciseMode] = useState<PreciseSearchMode | null>(null);
  const interestCategories = interests as EventCategory[];

  const sortedEvents = useMemo(
    () =>
      sortEventsForUser(events, {
        interests: interestCategories,
        userLocation: null,
      }),
    [events, interestCategories],
  );

  const visibleEvents = useMemo(
    () => filterEvents(sortedEvents, query),
    [sortedEvents, query],
  );

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setUserResults([]);
      setSearchingUsers(false);
      return;
    }

    setSearchingUsers(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchAllUsers(q);
        setUserResults(results);
      } catch {
        setUserResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  const totalCount = events.length;
  const filteredCount = visibleEvents.length;
  const hasQuery = query.trim().length > 0;
  const showInterestMatches = hasInterestMatches(sortedEvents, interestCategories);
  const hasUserResults = userResults.length > 0;
  const hasAnyResults = filteredCount > 0 || hasUserResults || searchingUsers;

  const interestLabels = interestCategories
    .map((id) => getCategoryMeta(id).label)
    .join(", ");

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-[#080810] pb-28 text-white">
      <HomeHeader onPreciseSearch={setPreciseMode} />

      {preciseMode && (
        <PreciseSearchPanel
          mode={preciseMode}
          events={events}
          onClose={() => setPreciseMode(null)}
        />
      )}

      <div className="px-4 pt-3">
        <StoriesRow initialGroups={storyGroups} currentUserId={currentUserId} />
      </div>

      <div className="px-4 pt-4">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#71717a"
            strokeWidth="1.8"
            className="h-4 w-4 shrink-0"
            aria-hidden
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            id="event-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj wydarzeń i użytkowników…"
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Wyczyść wyszukiwanie"
              className="text-zinc-600 transition-colors hover:text-zinc-400"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <main className="px-4 pt-4">
        {!hasQuery && totalCount === 0 ? (
          <div className="px-2 py-16 text-center">
            <p className="text-lg font-medium text-zinc-300">Brak wydarzeń</p>
            <p className="mt-2 text-sm text-zinc-500">
              Admin może dodać pierwsze wydarzenie w panelu administracyjnym.
            </p>
          </div>
        ) : hasQuery && !hasAnyResults ? (
          <div className="px-2 py-16 text-center">
            <p className="text-lg font-medium text-zinc-300">Brak wyników</p>
            <p className="mt-1 text-sm text-zinc-500">
              Spróbuj innej frazy — wydarzenia lub użytkownicy.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {hasQuery && (hasUserResults || searchingUsers) && (
              <section>
                <div className="mb-3 px-1">
                  <h2 className="text-lg font-bold text-white">Użytkownicy</h2>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {searchingUsers
                      ? "Szukam…"
                      : `${userResults.length} ${userResults.length === 1 ? "osoba" : "osób"}`}
                  </p>
                </div>
                <ul className="space-y-2">
                  {userResults.map((person) => {
                    const name =
                      person.full_name?.trim() ||
                      person.email?.split("@")[0] ||
                      "Użytkownik";
                    const handle =
                      person.username?.trim() ||
                      usernameFromEmail(person.email, person.id);
                    return (
                      <li key={person.id}>
                        <Link
                          href={profileHref(person)}
                          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 transition-colors hover:bg-white/[0.06]"
                        >
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white/10">
                            {person.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={person.avatar_url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500 to-indigo-700 text-xs font-bold">
                                {userInitials(person)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">{name}</p>
                            <p className="truncate text-xs text-zinc-500">@{handle}</p>
                          </div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="h-4 w-4 shrink-0 text-zinc-600"
                            aria-hidden
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {(filteredCount > 0 || !hasQuery) && totalCount > 0 && (
              <section>
                <div className="mb-3 px-1">
                  <h2 className="text-lg font-bold text-white">
                    {hasQuery ? "Wydarzenia" : "Dla Ciebie"}
                  </h2>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {hasQuery
                      ? `${filteredCount} ${filteredCount === 1 ? "wydarzenie" : "wydarzeń"}`
                      : interestLabels
                        ? `Twoje zainteresowania: ${interestLabels}`
                        : "Posortowane według daty wydarzenia"}
                  </p>
                </div>

                {!hasQuery && !showInterestMatches && totalCount > 0 && (
                  <div className="mb-4 rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-200/90">
                    Brak wydarzeń w Twoich kategoriach — poniżej inne propozycje.
                  </div>
                )}

                {filteredCount === 0 && hasQuery ? (
                  <p className="px-1 py-4 text-sm text-zinc-600">Brak pasujących wydarzeń.</p>
                ) : (
                  <ScrollableEventFeed eventCount={filteredCount}>
                    <EventCards
                      events={visibleEvents}
                      interests={interestCategories}
                      goingCounts={goingCounts}
                    />
                  </ScrollableEventFeed>
                )}
              </section>
            )}
          </div>
        )}
      </main>

      <BottomNav activePage="home" />
    </div>
  );
}
