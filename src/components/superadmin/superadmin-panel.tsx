"use client";

import { useState, useTransition } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { blockUser, unblockUser } from "@/app/superadmin/block-actions";
import type { AdminUser } from "@/app/superadmin/page";

type Tab = "users" | "creators" | "admins";

const TABS: { id: Tab; label: string; role: string }[] = [
  { id: "users",    label: "Użytkownicy",     role: "user" },
  { id: "creators", label: "Twórcy",          role: "creator" },
  { id: "admins",   label: "Administratorzy", role: "admin" },
];

function Avatar({ user }: { user: AdminUser }) {
  if (user.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={user.avatar_url} alt={user.full_name ?? ""} className="h-9 w-9 rounded-full object-cover" />
    );
  }
  const initials = (user.full_name ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white">
      {initials}
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Block modal ──────────────────────────────────────────────────────────────
function BlockModal({
  user,
  onConfirm,
  onCancel,
}: {
  user: AdminUser;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f0f1a] p-6">
        <h2 className="mb-1 text-base font-semibold text-white">Zablokuj konto</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Czy na pewno chcesz zablokować konto{" "}
          <span className="text-zinc-300 font-medium">{user.full_name ?? user.id}</span>?
        </p>

        <label className="mb-1 block text-xs text-zinc-400">Powód (opcjonalny)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="np. Naruszenie regulaminu platformy…"
          rows={3}
          className="mb-4 w-full resize-none rounded-xl border border-zinc-800 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500/50"
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason)}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition-colors"
          >
            Zablokuj
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function SuperAdminPanel({
  users,
  currentUserId,
}: {
  users: AdminUser[];
  currentUserId: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [query, setQuery]         = useState("");
  const [blockTarget, setBlockTarget] = useState<AdminUser | null>(null);
  const [isPending, startTransition]  = useTransition();
  const [localUsers, setLocalUsers]   = useState(users);

  const me = localUsers.find((u) => u.id === currentUserId);

  const activeRole = TABS.find((t) => t.id === activeTab)!.role;
  const filtered   = localUsers
    .filter((u) => u.role === activeRole)
    .filter((u) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (u.full_name ?? "").toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
    });

  const counts = {
    users:    localUsers.filter((u) => u.role === "user").length,
    creators: localUsers.filter((u) => u.role === "creator").length,
    admins:   localUsers.filter((u) => u.role === "admin").length,
  };

  function handleBlock(user: AdminUser, reason: string) {
    setBlockTarget(null);
    setLocalUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_blocked: true, blocked_reason: reason || null } : u));
    startTransition(() => { blockUser(user.id, reason || undefined); });
  }

  function handleUnblock(userId: string) {
    setLocalUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_blocked: false, blocked_reason: null } : u));
    startTransition(() => { unblockUser(userId); });
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white">

      {blockTarget && (
        <BlockModal
          user={blockTarget}
          onConfirm={(reason) => handleBlock(blockTarget, reason)}
          onCancel={() => setBlockTarget(null)}
        />
      )}

      {/* Header */}
      <header className="border-b border-white/10 bg-[#0a0a16] px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="h-4 w-4">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="text-sm font-bold">IKU Admin</span>
          </div>

          {/* Logged-in user + sign out */}
          <div className="flex items-center gap-3">
            {me && (
              <div className="flex items-center gap-2.5">
                {me.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={me.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-violet-500/40" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white ring-2 ring-violet-500/40">
                    {(me.full_name ?? "A").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:block">
                  <p className="text-xs font-medium text-white leading-none">{me.full_name ?? "Admin"}</p>
                  <p className="mt-0.5 text-[10px] text-violet-400 leading-none">Administrator</p>
                </div>
              </div>
            )}
            <SignOutButton className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:border-white/20 hover:text-white transition-colors" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="mb-6 text-xl font-bold text-white">Zarządzanie użytkownikami</h1>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-2xl bg-white/5 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setActiveTab(tab.id); setQuery(""); }}
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

        {/* Search */}
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.8" className="h-4 w-4 shrink-0">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj po nazwie lub ID…"
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="text-zinc-600 hover:text-zinc-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="1.5" className="h-10 w-10">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p className="text-sm text-zinc-600">Brak wyników</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10">
            {filtered.map((u, i) => (
              <div
                key={u.id}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/5"
                style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.06)" }}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <Avatar user={u} />
                  {u.is_blocked && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 ring-2 ring-[#080810]">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="h-2 w-2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-white truncate">
                      {u.full_name ?? <span className="text-zinc-600 italic">Brak nazwy</span>}
                    </p>
                    {u.id === currentUserId && (
                      <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-400">Ty</span>
                    )}
                    {u.is_blocked && (
                      <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">Zablokowany</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 truncate">{u.id}</p>
                  {u.is_blocked && u.blocked_reason && (
                    <p className="mt-0.5 text-xs text-zinc-500 truncate">Powód: {u.blocked_reason}</p>
                  )}
                </div>

                {/* Date */}
                <p className="shrink-0 text-xs text-zinc-600">{formatDate(u.created_at)}</p>

                {/* Block / Unblock button */}
                {u.id !== currentUserId && (
                  u.is_blocked ? (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleUnblock(u.id)}
                      className="shrink-0 rounded-xl border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                    >
                      Odblokuj
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setBlockTarget(u)}
                      className="shrink-0 rounded-xl border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      Zablokuj
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
