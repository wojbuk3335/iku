"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { MapEvent } from "@/app/map/actions";
import { BottomNav } from "@/components/events/bottom-nav";

const MapInner = dynamic(
  () => import("./map-inner").then((m) => m.MapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#080810]">
        <div className="flex flex-col items-center gap-3 text-zinc-600">
          <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <span className="text-sm">Ładowanie mapy…</span>
        </div>
      </div>
    ),
  }
);

export function MapView({ events }: { events: MapEvent[] }) {
  const router = useRouter();

  return (
    // fixed: fills the whole viewport regardless of parent constraints
    <div className="bg-[#080810]" style={{ position: "fixed", inset: 0, zIndex: 40 }}>

      {/* ── Map canvas (fills everything behind header & nav) ── */}
      <div style={{ position: "absolute", inset: 0, bottom: "72px" }}>
        {events.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.5" className="h-8 w-8">
                <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/>
                <path d="M15 5.764v15"/><path d="M9 3.236v15"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-zinc-300">Brak wydarzeń z lokalizacją</p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Utwórz wydarzenie i wybierz lokalizację z listy Google Places — wtedy pojawi się pinezka na mapie.
            </p>
          </div>
        ) : (
          <MapInner events={events} />
        )}
      </div>

      {/* ── Floating header ── */}
      <div
        style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1000 }}
        className="flex items-center justify-between px-4 pt-5 pb-6 bg-gradient-to-b from-[#080810cc] to-transparent"
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0f0f1a]/90 text-zinc-400 backdrop-blur hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <h1 className="text-sm font-semibold text-white">Mapa</h1>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0f0f1a]/90 text-zinc-400 backdrop-blur hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>

      {/* ── Bottom nav ── */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 1000 }}>
        <BottomNav activePage="map" />
      </div>
    </div>
  );
}
