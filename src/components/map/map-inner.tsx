"use client";

// leaflet CSS is imported globally in globals.css (required for Vercel production)
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { MapEvent } from "@/app/map/actions";

// ─── Category colour ──────────────────────────────────────────────────────────
function catColor(category: string): string {
  const map: Record<string, string> = {
    muzyka:   "#7c3aed",
    sport:    "#2563eb",
    kultura:  "#db2777",
    jedzenie: "#d97706",
    tech:     "#0891b2",
    kluby:    "#7c3aed",
    dzieci:   "#16a34a",
    seniorzy: "#9333ea",
  };
  return map[category] ?? "#7c3aed";
}

// ─── Build custom DivIcon HTML ────────────────────────────────────────────────
function buildMarkerHtml(event: MapEvent): string {
  const color = catColor(event.category);
  const img = event.cover_url
    ? `<img src="${event.cover_url}" alt="" style="width:100%;height:56px;object-fit:cover;border-radius:8px 8px 0 0;display:block;" />`
    : `<div style="width:100%;height:56px;background:${color}22;border-radius:8px 8px 0 0;display:flex;align-items:center;justify-content:center;">
         <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='${color}' stroke-width='1.5'>
           <rect x='3' y='3' width='18' height='18' rx='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/>
         </svg>
       </div>`;

  const title = event.title.length > 22 ? event.title.slice(0, 21) + "…" : event.title;
  const loc   = event.location.length > 24 ? event.location.slice(0, 23) + "…" : event.location;

  return `
<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
  <!-- pin -->
  <div style="width:28px;height:28px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px ${color}88;border:2px solid white;">
    <svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='white' style='transform:rotate(45deg)'>
      <path d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'/><circle cx='12' cy='10' r='3' fill='${color}'/>
    </svg>
  </div>
  <!-- card -->
  <div style="width:136px;background:#0f0f1a;border:1px solid rgba(255,255,255,0.1);border-radius:10px;margin-top:4px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.5);">
    ${img}
    <div style="padding:6px 8px 8px;">
      <div style="font-size:11px;font-weight:600;color:#fff;line-height:1.3;margin-bottom:2px;">${title}</div>
      <div style="font-size:10px;color:#71717a;line-height:1.3;">${loc}</div>
    </div>
  </div>
</div>`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function MapInner({ events }: { events: MapEvent[] }) {
  const mapRef    = useRef<HTMLDivElement>(null);
  const lmapRef   = useRef<import("leaflet").Map | null>(null);
  const router    = useRouter();

  useEffect(() => {
    if (!mapRef.current) return;

    // cancelled flag prevents double-init in React Strict Mode:
    // cleanup sets it to true before the Promise resolves the second time
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current) return;

      const center: [number, number] =
        events.length > 0
          ? [
              events.reduce((s, e) => s + e.latitude, 0)  / events.length,
              events.reduce((s, e) => s + e.longitude, 0) / events.length,
            ]
          : [52.2297, 21.0122]; // Warsaw fallback

      const map = L.map(mapRef.current, {
        center,
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      lmapRef.current = map;

      // CartoDB dark tiles — free, no API key
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19 }
      ).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      events.forEach((event) => {
        const icon = L.divIcon({
          html: buildMarkerHtml(event),
          className: "",
          iconSize:   [136, 120],
          iconAnchor: [68, 28],
        });

        const marker = L.marker([event.latitude, event.longitude], { icon }).addTo(map);
        marker.on("click", () => router.push(`/events/${event.id}`));
      });
    });

    return () => {
      cancelled = true;
      lmapRef.current?.remove();
      lmapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mapRef} style={{ width: "100%", height: "100%", minHeight: "300px" }} />;
}
