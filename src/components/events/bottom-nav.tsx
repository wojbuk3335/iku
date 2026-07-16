"use client";

import Link from "next/link";

export type ActivePage = "home" | "explore" | "map" | "notifications" | "profile";

function MapIconActive() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden>
      <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" />
    </svg>
  );
}

function HomeIcon({ active }: { active?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
      aria-hidden
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function CompassIcon({ active }: { active?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? "2.2" : "1.8"}
      className="h-6 w-6"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
      aria-hidden
    >
      <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" />
      <path d="M15 5.764v15" />
      <path d="M9 3.236v15" />
    </svg>
  );
}

function BellIcon({ active }: { active?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={active ? "0" : "1.8"}
      className="h-6 w-6"
      aria-hidden
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
      aria-hidden
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function BottomNav({ activePage = "home" }: { activePage?: ActivePage }) {

  const activeClass = "text-blue-500";
  const inactiveClass = "text-zinc-500";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/5 bg-[#080810]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-end justify-around px-2 pb-5 pt-2">

        {/* Home */}
        <Link
          href="/events"
          className={`flex min-w-14 flex-col items-center gap-1 ${activePage === "home" ? activeClass : inactiveClass}`}
          aria-current={activePage === "home" ? "page" : undefined}
        >
          <HomeIcon active={activePage === "home"} />
          <span className="text-[11px] font-medium">Home</span>
        </Link>

        {/* Explore */}
        <Link
          href="/explore"
          className={`flex min-w-14 flex-col items-center gap-1 ${activePage === "explore" ? activeClass : inactiveClass}`}
          aria-current={activePage === "explore" ? "page" : undefined}
        >
          <CompassIcon active={activePage === "explore"} />
          <span className="text-[11px] font-medium">Odkryj</span>
        </Link>

        {/* Map */}
        <Link
          href="/map"
          className={`flex min-w-14 flex-col items-center gap-1 ${activePage === "map" ? activeClass : inactiveClass}`}
          aria-current={activePage === "map" ? "page" : undefined}
        >
          {activePage === "map" ? <MapIconActive /> : <MapIcon />}
          <span className="text-[11px] font-medium">Mapa</span>
        </Link>

        {/* Notifications */}
        <Link
          href="/notifications"
          className={`relative flex min-w-14 flex-col items-center gap-1 ${activePage === "notifications" ? activeClass : inactiveClass}`}
          aria-current={activePage === "notifications" ? "page" : undefined}
        >
          <BellIcon active={activePage === "notifications"} />
          <span className="text-[11px] font-medium">Powiadomienia</span>
        </Link>

        {/* Profile */}
        <Link
          href="/profile"
          className={`flex min-w-14 flex-col items-center gap-1 ${activePage === "profile" ? activeClass : inactiveClass}`}
          aria-current={activePage === "profile" ? "page" : undefined}
        >
          <UserIcon />
          <span className="text-[11px] font-medium">Profil</span>
        </Link>

      </div>
    </nav>
  );
}
