"use client";

import { useMemo, useState } from "react";
import { BottomNav } from "@/components/events/bottom-nav";
import { EventCard } from "@/components/events/event-card";
import { HomeHeader } from "@/components/events/home-header";
import { StoriesRow } from "@/components/events/stories-row";
import type { StoryAuthorGroup } from "@/app/stories/actions";
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

  const totalCount = events.length;
  const filteredCount = visibleEvents.length;
  const hasQuery = query.trim().length > 0;
  const showInterestMatches = hasInterestMatches(sortedEvents, interestCategories);

  const interestLabels = interestCategories
    .map((id) => getCategoryMeta(id).label)
    .join(", ");

  return (
    <div className="mx-auto min-h-dvh max-w-2xl bg-[#080810] pb-28 text-white">
      <HomeHeader onSearchClick={() => document.getElementById("event-search")?.focus()} />

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
            placeholder="Szukaj wydarzeń po tytule, miejscu lub kategorii…"
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
        {totalCount === 0 ? (
          <div className="px-2 py-16 text-center">
            <p className="text-lg font-medium text-zinc-300">Brak wydarzeń</p>
            <p className="mt-2 text-sm text-zinc-500">
              Admin może dodać pierwsze wydarzenie w panelu administracyjnym.
            </p>
          </div>
        ) : filteredCount === 0 ? (
          <div className="px-2 py-16 text-center">
            <p className="text-3xl">🔍</p>
            <p className="mt-3 text-lg font-medium text-zinc-300">Brak wyników</p>
            <p className="mt-1 text-sm text-zinc-500">
              Spróbuj innej frazy wyszukiwania.
            </p>
          </div>
        ) : (
          <section>
            <div className="mb-3 px-1">
              <h2 className="text-lg font-bold text-white">
                {hasQuery ? "Wyniki wyszukiwania" : "Dla Ciebie"}
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

            <ScrollableEventFeed eventCount={filteredCount}>
              <EventCards
                events={visibleEvents}
                interests={interestCategories}
                goingCounts={goingCounts}
              />
            </ScrollableEventFeed>
          </section>
        )}
      </main>

      <BottomNav activePage="home" />
    </div>
  );
}
