import type { Event, EventCategory } from "@/types/event";

export type PersonalizedFeed = {
  forYou: Event[];
  other: Event[];
};

export function personalizeFeed(
  events: Event[],
  interests: string[],
): PersonalizedFeed {
  if (interests.length === 0) {
    return { forYou: [], other: events };
  }

  const interestSet = new Set(interests as EventCategory[]);

  const forYou = events.filter((event) => interestSet.has(event.category));
  const other = events.filter((event) => !interestSet.has(event.category));

  return { forYou, other };
}
