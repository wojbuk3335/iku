import { BottomNav } from "@/components/events/bottom-nav";
import { EventCard } from "@/components/events/event-card";
import { HomeHeader } from "@/components/events/home-header";
import { StoriesRow } from "@/components/events/stories-row";
import type { Event } from "@/types/event";

type HomeFeedProps = {
  events: Event[];
};

export function HomeFeed({ events }: HomeFeedProps) {
  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-[#080810] pb-28 text-white">
      <HomeHeader />
      <StoriesRow />

      <main className="px-2.5 pt-3">
        {events.length === 0 ? (
          <div className="px-2 py-16 text-center">
            <p className="text-lg font-medium text-zinc-300">
              Brak wydarzeń
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Admin może dodać pierwsze wydarzenie w panelu administracyjnym.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
