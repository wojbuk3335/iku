"use client";

import { useState } from "react";
import { BottomNav } from "@/components/events/bottom-nav";
import { EventCard } from "@/components/events/event-card";
import { INTEREST_CATEGORIES } from "@/types/interests";
import { eventHasCategory } from "@/lib/events/category-style";
import type { Event, EventCategory } from "@/types/event";

type ExploreFeedProps = {
  events: Event[];
  goingCounts: Record<string, number>;
};

export function ExploreFeed({ events, goingCounts }: ExploreFeedProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered =
    activeCategory === null
      ? events
      : events.filter((e) => eventHasCategory(e, activeCategory as EventCategory));

  return (
    <div className="mx-auto min-h-dvh max-w-2xl bg-[#080810] pb-28 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#080810]/95 backdrop-blur-md">
        <div className="px-4 pb-3 pt-5">
          <h1 className="text-xl font-bold">Odkryj</h1>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 pl-4">
          {/* Trailing padding trick — last chip gets right spacing */}
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === null
                ? "bg-white text-black"
                : "bg-white/10 text-zinc-300 hover:bg-white/15"
            }`}
          >
            Wszystkie
          </button>

          {INTEREST_CATEGORIES.map((cat, i) => (
            <button
              key={cat.id}
              type="button"
              onClick={() =>
                setActiveCategory(activeCategory === cat.id ? null : cat.id)
              }
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                i === INTEREST_CATEGORIES.length - 1 ? "mr-4" : ""
              } ${
                activeCategory === cat.id
                  ? "bg-white text-black"
                  : "bg-white/10 text-zinc-300 hover:bg-white/15"
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </header>

      {/* Results */}
      <main className="px-2.5 pt-3">
        {filtered.length === 0 ? (
          <div className="px-2 py-16 text-center">
            <p className="text-3xl">🔍</p>
            <p className="mt-3 text-lg font-medium text-zinc-300">
              Brak wydarzeń
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              W tej kategorii nie ma jeszcze żadnych wydarzeń.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-3 px-1 text-xs text-zinc-500">
              {filtered.length === 1
                ? "1 wydarzenie"
                : `${filtered.length} wydarzeń`}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {filtered.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  goingCount={goingCounts[event.id] ?? 0}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <BottomNav activePage="explore" />
    </div>
  );
}
