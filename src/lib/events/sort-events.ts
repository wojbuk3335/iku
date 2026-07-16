import { countCategoryMatches } from "@/lib/events/category-style";
import type { Event, EventCategory } from "@/types/event";

export type UserCoordinates = {
  latitude: number;
  longitude: number;
};

export type SortEventsOptions = {
  interests: EventCategory[];
  userLocation?: UserCoordinates | null;
};

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getDistanceKm(
  event: Pick<Event, "latitude" | "longitude">,
  userLocation?: UserCoordinates | null,
): number {
  if (
    !userLocation ||
    event.latitude == null ||
    event.longitude == null
  ) {
    return Number.POSITIVE_INFINITY;
  }

  return haversineKm(
    userLocation.latitude,
    userLocation.longitude,
    event.latitude,
    event.longitude,
  );
}

export function compareEventsForUser(
  a: Event,
  b: Event,
  options: SortEventsOptions,
): number {
  const matchA = countCategoryMatches(a, options.interests);
  const matchB = countCategoryMatches(b, options.interests);
  if (matchB !== matchA) return matchB - matchA;

  const startsA = new Date(a.starts_at).getTime();
  const startsB = new Date(b.starts_at).getTime();
  if (startsA !== startsB) return startsA - startsB;

  const distA = getDistanceKm(a, options.userLocation);
  const distB = getDistanceKm(b, options.userLocation);
  if (distA !== distB) return distA - distB;

  const createdA = new Date(a.created_at).getTime();
  const createdB = new Date(b.created_at).getTime();
  return createdA - createdB;
}

export function sortEventsForUser(
  events: Event[],
  options: SortEventsOptions,
): Event[] {
  return [...events].sort((a, b) => compareEventsForUser(a, b, options));
}

export function hasInterestMatches(
  events: Event[],
  interests: EventCategory[],
): boolean {
  return events.some((event) => countCategoryMatches(event, interests) > 0);
}
