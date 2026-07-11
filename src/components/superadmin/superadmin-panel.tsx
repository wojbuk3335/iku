"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { blockUser, unblockUser }      from "@/app/superadmin/block-actions";
import { updateOwnAdminProfile, deleteOwnAdminAccount, createAdmin } from "@/app/superadmin/admin-actions";
import type { AdminUser } from "@/app/superadmin/page";

type Tab = "users" | "creators" | "admins";

const TABS: { id: Tab; label: string; role: string }[] = [
  { id: "users",    label: "Użytkownicy",     role: "user" },
  { id: "creators", label: "Twórcy",          role: "creator" },
  { id: "admins",   label: "Administratorzy", role: "admin" },
];

// ─── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ user, size = 9 }: { user: AdminUser; size?: number }) {
  if (user.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatar_url}
        alt={user.full_name ?? ""}
        className={`h-${size} w-${size} rounded-full object-cover`}
      />
    );
  }
  const initials = (user.full_name ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className={`flex h-${size} w-${size} items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white`}>
      {initials}
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Modal base ───────────────────────────────────────────────────────────────
function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f0f1a] p-6">
        {children}
      </div>
    </div>
  );
}

// ─── Block modal ──────────────────────────────────────────────────────────────
function BlockModal({ user, onConfirm, onCancel }: {
  user: AdminUser;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <Modal>
      <h2 className="mb-1 text-base font-semibold text-white">Zablokuj konto</h2>
      <p className="mb-4 text-sm text-zinc-500">
        Czy na pewno chcesz zablokować konto{" "}
        <span className="font-medium text-zinc-300">{user.full_name ?? user.id}</span>?
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
        <button type="button" onClick={onCancel}
          className="flex-1 cursor-pointer rounded-xl border border-white/10 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors">
          Anuluj
        </button>
        <button type="button" onClick={() => onConfirm(reason)}
          className="flex-1 cursor-pointer rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition-colors">
          Zablokuj
        </button>
      </div>
    </Modal>
  );
}

// ─── Edit admin modal ─────────────────────────────────────────────────────────
function EditAdminModal({ me, onClose }: { me: AdminUser; onClose: () => void }) {
  const [fullName,    setFullName]    = useState(me.full_name ?? "");
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [error,       setError]       = useState<string | null>(null);
  const [isPending,   startTransition] = useTransition();

  function handleSave() {
    setError(null);
    if (password && password !== confirm) {
      setError("Hasła nie są identyczne.");
      return;
    }
    if (password && password.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków.");
      return;
    }
    startTransition(async () => {
      const result = await updateOwnAdminProfile(fullName, password);
      if (result.error) { setError(result.error); return; }
      onClose();
    });
  }

  return (
    <Modal>
      <h2 className="mb-4 text-base font-semibold text-white">Edytuj swój profil</h2>

      <label className="mb-1 block text-xs text-zinc-400">Imię i nazwisko</label>
      <input
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Jan Kowalski"
        className="mb-4 w-full rounded-xl border border-zinc-800 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500/50"
      />

      <label className="mb-1 block text-xs text-zinc-400">Nowe hasło <span className="text-zinc-600">(zostaw puste jeśli nie zmieniasz)</span></label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        className="mb-3 w-full rounded-xl border border-zinc-800 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500/50"
      />

      <label className="mb-1 block text-xs text-zinc-400">Powtórz nowe hasło</label>
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="••••••••"
        className="mb-3 w-full rounded-xl border border-zinc-800 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500/50"
      />

      {error && <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={onClose} disabled={isPending}
          className="flex-1 cursor-pointer rounded-xl border border-white/10 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors disabled:opacity-50">
          Anuluj
        </button>
        <button type="button" onClick={handleSave} disabled={isPending}
          className="flex-1 cursor-pointer rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition-colors disabled:opacity-50">
          {isPending ? "Zapisuję…" : "Zapisz"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Delete own account modal ─────────────────────────────────────────────────
function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError]            = useState<string | null>(null);
  const router                       = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteOwnAdminAccount();
      if (result.error) { setError(result.error); return; }
      router.push("/");
    });
  }

  return (
    <Modal>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="h-6 w-6">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      </div>
      <h2 className="mb-1 text-base font-semibold text-white">Usuń swoje konto</h2>
      <p className="mb-4 text-sm text-zinc-500">
        Ta operacja jest <span className="text-red-400 font-medium">nieodwracalna</span>. Twoje konto administratora zostanie trwale usunięte.
      </p>

      {error && <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={onClose} disabled={isPending}
          className="flex-1 cursor-pointer rounded-xl border border-white/10 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors disabled:opacity-50">
          Anuluj
        </button>
        <button type="button" onClick={handleDelete} disabled={isPending}
          className="flex-1 cursor-pointer rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-50">
          {isPending ? "Usuwam…" : "Tak, usuń konto"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Create admin modal ───────────────────────────────────────────────────────
function CreateAdminModal({ onCreated, onClose }: { onCreated: () => void; onClose: () => void }) {
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [fullName,  setFullName]  = useState("");
  const [error,     setError]     = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Email i hasło są wymagane.");
      return;
    }
    if (password.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków.");
      return;
    }
    if (password !== confirm) {
      setError("Hasła nie są identyczne.");
      return;
    }
    startTransition(async () => {
      const result = await createAdmin(email, password, fullName);
      if (result.error) { setError(result.error); return; }
      onCreated();
      onClose();
    });
  }

  return (
    <Modal>
      <h2 className="mb-4 text-base font-semibold text-white">Dodaj nowego administratora</h2>

      <label className="mb-1 block text-xs text-zinc-400">Imię i nazwisko <span className="text-zinc-600">(opcjonalne)</span></label>
      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
        placeholder="Jan Kowalski"
        className="mb-3 w-full rounded-xl border border-zinc-800 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500/50"
      />

      <label className="mb-1 block text-xs text-zinc-400">Adres e-mail</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="admin@iku.pl"
        className="mb-3 w-full rounded-xl border border-zinc-800 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500/50"
      />

      <label className="mb-1 block text-xs text-zinc-400">Hasło</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
        placeholder="Min. 6 znaków"
        className="mb-3 w-full rounded-xl border border-zinc-800 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500/50"
      />

      <label className="mb-1 block text-xs text-zinc-400">Powtórz hasło</label>
      <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
        placeholder="••••••••"
        className="mb-4 w-full rounded-xl border border-zinc-800 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500/50"
      />

      {error && <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={onClose} disabled={isPending}
          className="flex-1 cursor-pointer rounded-xl border border-white/10 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors disabled:opacity-50">
          Anuluj
        </button>
        <button type="button" onClick={handleCreate} disabled={isPending}
          className="flex-1 cursor-pointer rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition-colors disabled:opacity-50">
          {isPending ? "Tworzę…" : "Utwórz administratora"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export function SuperAdminPanel({ users, currentUserId }: {
  users: AdminUser[];
  currentUserId: string;
}) {
  const [activeTab,    setActiveTab]    = useState<Tab>("users");
  const [query,        setQuery]        = useState("");
  const [localUsers,   setLocalUsers]   = useState(users);
  const [blockTarget,  setBlockTarget]  = useState<AdminUser | null>(null);
  const [showEdit,     setShowEdit]     = useState(false);
  const [showDelete,   setShowDelete]   = useState(false);
  const [showCreate,   setShowCreate]   = useState(false);
  const [isPending,    startTransition] = useTransition();

  const me         = localUsers.find((u) => u.id === currentUserId);
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

  function handleEditClose() {
    setShowEdit(false);
    // Refresh to get updated name from server
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white">

      {/* Modals */}
      {blockTarget && (
        <BlockModal
          user={blockTarget}
          onConfirm={(reason) => handleBlock(blockTarget, reason)}
          onCancel={() => setBlockTarget(null)}
        />
      )}
      {showEdit  && me && <EditAdminModal   me={me}    onClose={handleEditClose} />}
      {showDelete      && <DeleteAccountModal           onClose={() => setShowDelete(false)} />}
      {showCreate      && (
        <CreateAdminModal
          onClose={() => setShowCreate(false)}
          onCreated={() => window.location.reload()}
        />
      )}

      {/* Header */}
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

        {/* Admins tab: "Add admin" button above search */}
        {activeTab === "admins" && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs text-zinc-500">Edycja i usunięcie dostępne tylko dla własnego konta.</p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Dodaj administratora
            </button>
          </div>
        )}

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
            <button type="button" onClick={() => setQuery("")} className="cursor-pointer text-zinc-600 hover:text-zinc-400 transition-colors">
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
            {filtered.map((u, i) => {
              const isMe    = u.id === currentUserId;
              const isAdmin = activeTab === "admins";

              return (
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
                        {u.full_name ?? <span className="italic text-zinc-600">Brak nazwy</span>}
                      </p>
                      {isMe && (
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

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    {/* Admin tab: edit + delete only for own row */}
                    {isAdmin && isMe && (
                      <>
                        <button
                          type="button"
                          title="Edytuj swój profil"
                          onClick={() => setShowEdit(true)}
                          className="cursor-pointer rounded-lg border border-violet-500/30 p-1.5 text-violet-400 hover:bg-violet-500/10 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          type="button"
                          title="Usuń swoje konto"
                          onClick={() => setShowDelete(true)}
                          className="cursor-pointer rounded-lg border border-red-500/30 p-1.5 text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6"/><path d="M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      </>
                    )}

                    {/* Non-admin tabs: block / unblock for others only */}
                    {!isAdmin && !isMe && (
                      u.is_blocked ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleUnblock(u.id)}
                          className="cursor-pointer rounded-xl border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                        >
                          Odblokuj
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => setBlockTarget(u)}
                          className="cursor-pointer rounded-xl border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          Zablokuj
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
