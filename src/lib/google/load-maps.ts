import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

let loadPromise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return Promise.reject(
      new Error("Brak NEXT_PUBLIC_GOOGLE_MAPS_API_KEY w konfiguracji."),
    );
  }

  if (!loadPromise) {
    setOptions({
      key: apiKey,
      language: "pl",
      region: "PL",
    });

    loadPromise = Promise.all([
      importLibrary("maps"),
      importLibrary("places"),
    ]).then(() => undefined);
  }

  return loadPromise;
}

export function isGoogleMapsConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
}
