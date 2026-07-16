"use client";

import { useEffect, useRef, useState } from "react";
import { isGoogleMapsConfigured, loadGoogleMaps } from "@/lib/google/load-maps";
import { formatPlaceDisplay } from "@/types/location";
import type { EventLocation } from "@/types/location";

type LocationPickerProps = {
  value: EventLocation | null;
  onChange: (location: EventLocation | null) => void;
  disabled?: boolean;
  placeholder?: string;
  variant?: "admin" | "compact";
  initialLabel?: string;
};

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden
    >
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function LocationPicker({
  value,
  onChange,
  disabled = false,
  placeholder = "Wpisz nazwę miejsca, adres, plac lub budynek…",
  variant = "admin",
  initialLabel,
}: LocationPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const onChangeRef = useRef(onChange);

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState(
    initialLabel ?? value?.location ?? "",
  );

  onChangeRef.current = onChange;

  useEffect(() => {
    if (!isGoogleMapsConfigured()) {
      setLoadError("Dodaj NEXT_PUBLIC_GOOGLE_MAPS_API_KEY do .env.local");
      return;
    }

    loadGoogleMaps()
      .then(() => setReady(true))
      .catch((err) => {
        setLoadError(
          err instanceof Error ? err.message : "Nie udało się załadować Google Maps.",
        );
      });
  }, []);

  useEffect(() => {
    setInputValue(initialLabel ?? value?.location ?? "");
  }, [initialLabel, value?.location]);

  useEffect(() => {
    if (!ready || !inputRef.current || autocompleteRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: ["pl"] },
      fields: ["place_id", "formatted_address", "geometry", "name"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const lat = place.geometry?.location?.lat();
      const lng = place.geometry?.location?.lng();

      if (lat == null || lng == null) return;

      const display = formatPlaceDisplay(place.name, place.formatted_address);

      onChangeRef.current({
        location: display,
        location_name: place.name ?? null,
        latitude: lat,
        longitude: lng,
        place_id: place.place_id ?? null,
      });
      setInputValue(display);
    });

    autocompleteRef.current = autocomplete;

    return () => {
      google.maps.event.clearInstanceListeners(autocomplete);
      autocompleteRef.current = null;
    };
  }, [ready]);

  const inputClassName =
    variant === "admin"
      ? "w-full rounded-[20px] border border-[#2a2640]/80 bg-[#101018]/70 py-4.5 pl-14 pr-5 text-lg text-white outline-none placeholder:text-zinc-500 focus:border-violet-500/50 disabled:opacity-60"
      : "w-full rounded-xl border border-zinc-800 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder-zinc-600 focus:border-blue-500 transition-colors disabled:opacity-60";

  return (
    <div>
      <div className="relative">
        <span
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-zinc-500 ${
            variant === "admin" ? "left-5" : "left-3.5"
          }`}
        >
          <PinIcon className={variant === "admin" ? "h-6 w-6" : "h-4 w-4"} />
        </span>
        <input
          ref={inputRef}
          id="location"
          name="location"
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (value) onChange(null);
          }}
          placeholder={placeholder}
          className={inputClassName}
          disabled={disabled || !ready || !!loadError}
          autoComplete="off"
        />
      </div>

      {loadError && (
        <p className="mt-2 text-sm text-amber-300">{loadError}</p>
      )}

      {!loadError && !ready && (
        <p className="mt-2 text-sm text-zinc-500">Ładowanie podpowiedzi miejsc…</p>
      )}

      {value && (
        <p className="mt-2 text-sm text-emerald-400/90">
          ✓ Lokalizacja wybrana — pin pojawi się na mapie
        </p>
      )}

      {!value && ready && !loadError && inputValue.trim().length > 0 && (
        <p className="mt-2 text-sm text-zinc-500">
          Wybierz miejsce z listy podpowiedzi Google.
        </p>
      )}
    </div>
  );
}
