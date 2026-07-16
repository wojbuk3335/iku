"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Utwórz wydarzenie", match: (path: string) => path === "/admin" },
  {
    href: "/admin/events",
    label: "Utworzone wydarzenia",
    match: (path: string) => path.startsWith("/admin/events"),
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
              className="flex-1 cursor-pointer rounded-xl py-2.5 text-center text-sm font-medium transition-colors"
              style={{
                background: active ? "rgba(124,58,237,0.3)" : "transparent",
                color: active ? "white" : "#71717a",
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
