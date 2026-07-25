"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function StatsIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden
    >
      <path d="M4 19V9M12 19V5M20 19v-7" strokeLinecap="round" />
    </svg>
  );
}

const TABS = [
  {
    href: "/admin",
    label: "Utwórz wydarzenie",
    match: (path: string) => path === "/admin",
  },
  {
    href: "/admin/stats",
    label: "Statystyki",
    icon: true,
    match: (path: string) =>
      path.startsWith("/admin/stats") || path.startsWith("/admin/events"),
  },
];

export function CreatorNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin/settings")) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#080810]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl gap-1 px-4 py-3 sm:px-6">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2.5 text-center text-sm font-medium transition-colors"
              style={{
                background: active ? "rgba(124,58,237,0.3)" : "transparent",
                color: active ? "white" : "#71717a",
              }}
            >
              {"icon" in tab && tab.icon ? (
                <StatsIcon className="h-4 w-4 shrink-0" />
              ) : null}
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
