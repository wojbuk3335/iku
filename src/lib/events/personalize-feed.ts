import {
  hasInterestMatches,
  sortEventsForUser,
  type UserCoordinates,
} from "@/lib/events/sort-events";
import type { Event, EventCategory } from "@/types/event";

export type PersonalizedFeed = {
  events: Event[];
  hasInterestMatches: boolean;
};

export function personalizeFeed(
  events: Event[],
  interests: string[],
  userLocation?: UserCoordinates | null,
): PersonalizedFeed {
  const interestCategories = interests as EventCategory[];
  const sorted = sortEventsForUser(events, {
    interests: interestCategories,
    userLocation,
  });

  return {
    events: sorted,
    hasInterestMatches: hasInterestMatches(sorted, interestCategories),
  };
}
