"use client";

import { useState } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { AdminUser } from "@/app/superadmin/page";

type Tab = "users" | "creators" | "admins";

const TABS: { id: Tab; label: string; role: string }[] = [
  { id: "users",    label: "Użytkownicy",    role: "user" },
  { id: "creators", label: "Twórcy",         role: "creator" },
  { id: "admins",   label: "Administratorzy", role: "admin" },
];

function Avatar({ user }: { user: AdminUser }) {
  if (user.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatar_url}
        alt={user.full_name ?? ""}
        className="h-9 w-9 rounded-full object-cover"
      />
    );
  }

  const initials = (user.full_name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white">
      {initials}
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function SuperAdminPanel({
  users,
  currentUserId,
}: {
  users: AdminUser[];
  currentUserId: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("users");

  const activeRole = TABS.find((t) => t.id === activeTab)!.role;
  const filtered   = users.filter((u) => u.role === activeRole);

  const counts = {
    users:    users.filter((u) => u.role === "user").length,
    creators: users.filter((u) => u.role === "creator").length,
    admins:   users.filter((u) => u.role === "admin").length,
  };

  return (
    <div className="min-h-screen bg-[#080810] text-white">

      {/* ── Header ── */}
      <header className="border-b border-white/10 bg-[#0a0a16] px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="h-4 w-4">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="text-sm font-bold">IKU Admin</span>
          </div>
          <SignOutButton className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:border-white/20 hover:text-white transition-colors" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">

        {/* ── Title ── */}
        <h1 className="mb-6 text-xl font-bold text-white">Zarządzanie użytkownikami</h1>

        {/* ── Tabs ── */}
        <div className="mb-6 flex gap-1 rounded-2xl bg-white/5 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors"
              style={{
                background: activeTab === tab.id ? "rgba(124,58,237,0.3)" : "transparent",
                color:      activeTab === tab.id ? "white" : "#71717a",
              }}
            >
              {tab.label}
              <span
                className="rounded-full px-2 py-0.5 text-xs"
                style={{
                  background: activeTab === tab.id ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.08)",
                  color:      activeTab === tab.id ? "#e9d5ff" : "#52525b",
                }}
              >
                {counts[tab.id]}
              </span>
            </button>
          ))}
        </div>

        {/* ── List ── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="1.5" className="h-10 w-10">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p className="text-sm text-zinc-600">Brak {TABS.find((t) => t.id === activeTab)!.label.toLowerCase()}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10">
            {filtered.map((u, i) => (
              <div
                key={u.id}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/5"
                style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.06)" }}
              >
                <Avatar user={u} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {u.full_name ?? <span className="text-zinc-600 italic">Brak nazwy</span>}
                    {u.id === currentUserId && (
                      <span className="ml-2 rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-400">Ty</span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-600 truncate">{u.id}</p>
                </div>

                <p className="shrink-0 text-xs text-zinc-600">{formatDate(u.created_at)}</p>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
