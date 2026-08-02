"use client";

import Link from "next/link";
import { BottomNav } from "@/components/events/bottom-nav";
import { SignOutButton } from "@/components/auth/sign-out-button";

const ITEMS = [
  {
    href: "/settings/profil",
    label: "Edytuj profil",
    description: "Dane, nazwa użytkownika, prywatność",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    href: "/settings/historia",
    label: "Historia",
    description: "Wydarzenia i oś czasu aktywności",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
] as const;

export function SettingsHubPage({ email }: { email: string }) {
  return (
    <div className="mx-auto min-h-dvh max-w-md bg-[#080810] pb-28 text-white">
      <header className="flex items-center justify-between px-4 pb-2 pt-5">
        <Link
          href="/profile"
          className="text-zinc-400 transition-colors hover:text-white"
          aria-label="Wróć do profilu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-6 w-6"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <span className="text-sm font-medium text-zinc-300">Ustawienia</span>
        <div className="w-6" />
      </header>

      <main className="space-y-4 px-4 pt-4">
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Konto
          </p>
          <p className="mt-2 break-all text-sm text-zinc-300">{email}</p>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          {ITEMS.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.05] ${
                index > 0 ? "border-t border-white/10" : ""
              }`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                {item.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">{item.label}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">{item.description}</span>
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-zinc-600">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}
        </section>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
          <SignOutButton className="w-full rounded-xl border border-red-500/20 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10" />
        </div>
      </main>

      <BottomNav activePage="profile" />
    </div>
  );
}
