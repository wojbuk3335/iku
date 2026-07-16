export type EventLocation = {
  location: string;
  location_name?: string | null;
  latitude: number;
  longitude: number;
  place_id?: string | null;
};

export function formatPlaceDisplay(
  name: string | undefined | null,
  formattedAddress: string | undefined | null,
): string {
  const address = formattedAddress?.trim() ?? "";
  const placeName = name?.trim() ?? "";

  if (placeName && address) {
    if (address.toLowerCase().startsWith(placeName.toLowerCase())) {
      return address;
    }
    return `${placeName}, ${address}`;
  }

  return placeName || address;
}

export function locationFromEvent(event: {
  location: string;
  location_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  place_id?: string | null;
}): EventLocation | null {
  if (event.latitude == null || event.longitude == null) {
    return null;
  }

  return {
    location: event.location,
    location_name: event.location_name ?? null,
    latitude: event.latitude,
    longitude: event.longitude,
    place_id: event.place_id ?? null,
  };
}
