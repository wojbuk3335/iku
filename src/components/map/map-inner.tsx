"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MapEvent } from "@/app/map/actions";
import { isGoogleMapsConfigured, loadGoogleMaps } from "@/lib/google/load-maps";

const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0b0b14" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b0b14" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a8a29e" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#71717a" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#12121c" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#52525b" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1c1c28" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#12121c" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8b8b96" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#2a2640" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a1628" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a1a1aa" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#16161f" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#71717a" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#080810" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3f3f46" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#080810" }],
  },
];

function catColor(category: string): string {
  const map: Record<string, string> = {
    muzyka: "#7c3aed",
    sport: "#2563eb",
    kultura: "#db2777",
    jedzenie: "#d97706",
    tech: "#0891b2",
    kluby: "#7c3aed",
    dzieci: "#16a34a",
    seniorzy: "#9333ea",
  };
  return map[category] ?? "#7c3aed";
}

function buildMarkerHtml(event: MapEvent): string {
  const color = catColor(event.category);
  const title =
    event.title.length > 22 ? `${event.title.slice(0, 21)}…` : event.title;
  const loc =
    event.location.length > 24
      ? `${event.location.slice(0, 23)}…`
      : event.location;

  const img = event.cover_url
    ? `<img src="${event.cover_url}" alt="" style="width:100%;height:56px;object-fit:cover;border-radius:8px 8px 0 0;display:block;" />`
    : `<div style="width:100%;height:56px;background:${color}22;border-radius:8px 8px 0 0;display:flex;align-items:center;justify-content:center;">
         <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='${color}' stroke-width='1.5'>
           <rect x='3' y='3' width='18' height='18' rx='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/>
         </svg>
       </div>`;

  return `
    <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;width:136px;">
      <div style="width:28px;height:28px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px ${color}88;border:2px solid white;">
        <svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='white' style='transform:rotate(45deg)'>
          <path d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'/><circle cx='12' cy='10' r='3' fill='${color}'/>
        </svg>
      </div>
      <div style="width:136px;background:#0f0f1a;border:1px solid rgba(255,255,255,0.1);border-radius:10px;margin-top:4px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.5);">
        ${img}
        <div style="padding:6px 8px 8px;">
          <div style="font-size:11px;font-weight:600;color:#fff;line-height:1.3;margin-bottom:2px;">${title}</div>
          <div style="font-size:10px;color:#71717a;line-height:1.3;">${loc}</div>
        </div>
      </div>
    </div>
  `;
}

function createEventOverlay(
  map: google.maps.Map,
  event: MapEvent,
  onClick: () => void,
): google.maps.OverlayView {
  class EventOverlay extends google.maps.OverlayView {
    private div: HTMLDivElement | null = null;
    private position = new google.maps.LatLng(event.latitude, event.longitude);

    onAdd() {
      this.div = document.createElement("div");
      this.div.style.position = "absolute";
      this.div.style.transform = "translate(-50%, -100%)";
      this.div.style.zIndex = "10";
      this.div.innerHTML = buildMarkerHtml(event);
      this.div.addEventListener("click", (e) => {
        e.stopPropagation();
        onClick();
      });
      this.getPanes()?.overlayMouseTarget.appendChild(this.div);
    }

    draw() {
      if (!this.div) return;
      const projection = this.getProjection();
      if (!projection) return;
      const point = projection.fromLatLngToDivPixel(this.position);
      if (!point) return;
      this.div.style.left = `${point.x}px`;
      this.div.style.top = `${point.y}px`;
    }

    onRemove() {
      this.div?.remove();
      this.div = null;
    }
  }

  const overlay = new EventOverlay();
  overlay.setMap(map);
  return overlay;
}

export function MapInner({ events }: { events: MapEvent[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const overlaysRef = useRef<google.maps.OverlayView[]>([]);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mapRef.current) return;

    let cancelled = false;

    async function init() {
      if (!isGoogleMapsConfigured()) {
        setError("Dodaj NEXT_PUBLIC_GOOGLE_MAPS_API_KEY do .env.local");
        setLoading(false);
        return;
      }

      try {
        await loadGoogleMaps();
        if (cancelled || !mapRef.current) return;

        const center =
          events.length > 0
            ? {
                lat:
                  events.reduce((sum, e) => sum + e.latitude, 0) / events.length,
                lng:
                  events.reduce((sum, e) => sum + e.longitude, 0) /
                  events.length,
              }
            : { lat: 52.2297, lng: 21.0122 };

        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom: events.length === 1 ? 14 : 12,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM,
          },
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          styles: DARK_MAP_STYLES,
          backgroundColor: "#080810",
        });

        mapInstanceRef.current = map;

        const bounds = new google.maps.LatLngBounds();

        events.forEach((event) => {
          bounds.extend({ lat: event.latitude, lng: event.longitude });
          const overlay = createEventOverlay(map, event, () => {
            router.push(`/events/${event.id}`);
          });
          overlaysRef.current.push(overlay);
        });

        if (events.length > 1) {
          map.fitBounds(bounds, 80);
        }

        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Nie udało się załadować Google Maps.",
        );
        setLoading(false);
      }
    }

    void init();

    return () => {
      cancelled = true;
      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      overlaysRef.current = [];
      mapInstanceRef.current = null;
    };
  }, [events, router]);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-sm font-medium text-amber-300">{error}</p>
        <p className="text-xs text-zinc-500">
          Upewnij się, że Maps JavaScript API jest włączone w Google Cloud.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full min-h-[300px]">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#080810]">
          <div className="flex flex-col items-center gap-3 text-zinc-600">
            <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            <span className="text-sm">Ładowanie Google Maps…</span>
          </div>
        </div>
      )}
      <div ref={mapRef} className="h-full w-full min-h-[300px]" />
    </div>
  );
}
