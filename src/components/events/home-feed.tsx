import { BottomNav } from "@/components/events/bottom-nav";
import { EventCard } from "@/components/events/event-card";
import { HomeHeader } from "@/components/events/home-header";
import { StoriesRow } from "@/components/events/stories-row";
import type { PersonalizedFeed } from "@/lib/events/personalize-feed";
import type { Event } from "@/types/event";

type HomeFeedProps = {
  feed: PersonalizedFeed;
  goingCounts: Record<string, number>;
};

function EventGrid({
  events,
  goingCounts,
}: {
  events: Event[];
  goingCounts: Record<string, number>;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          goingCount={goingCounts[event.id] ?? 0}
        />
      ))}
    </div>
  );
}

function FeedSection({
  title,
  subtitle,
  events,
  goingCounts,
}: {
  title: string;
  subtitle?: string;
  events: Event[];
  goingCounts: Record<string, number>;
}) {
  if (events.length === 0) {
    return null;
  }

  return (
    <section className="mb-6">
      <div className="mb-3 px-1">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>
        )}
      </div>
      <EventGrid events={events} goingCounts={goingCounts} />
    </section>
  );
}

export function HomeFeed({ feed, goingCounts }: HomeFeedProps) {
  const totalCount = feed.forYou.length + feed.other.length;

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-[#080810] pb-28 text-white">
      <HomeHeader />
      <StoriesRow />

      <main className="px-2.5 pt-3">
        {totalCount === 0 ? (
          <div className="px-2 py-16 text-center">
            <p className="text-lg font-medium text-zinc-300">
              Brak wydarzeń
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Admin może dodać pierwsze wydarzenie w panelu administracyjnym.
            </p>
          </div>
        ) : (
          <>
            <FeedSection
              title="Dla Ciebie"
              subtitle="Dopasowane do Twoich zainteresowań"
              events={feed.forYou}
              goingCounts={goingCounts}
            />

            {feed.forYou.length === 0 && feed.other.length > 0 && (
              <div className="mb-4 rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-200/90">
                Brak wydarzeń w Twoich kategoriach — zobacz inne poniżej.
              </div>
            )}

            <FeedSection
              title={feed.forYou.length > 0 ? "Odkryj więcej" : "Wszystkie wydarzenia"}
              subtitle={
                feed.forYou.length > 0
                  ? "Poza wybranymi kategoriami"
                  : undefined
              }
              events={feed.other}
              goingCounts={goingCounts}
            />
          </>
        )}
      </main>

      <BottomNav activePage="home" />
    </div>
  );
}
