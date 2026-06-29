"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BottomNav } from "@/components/events/bottom-nav";
import { EventCard } from "@/components/events/event-card";
import { updateBio } from "@/app/profile/actions";
import type { Event } from "@/types/event";

type ProfilePageProps = {
  email: string;
  bio: string | null;
  goingEvents: Event[];
  savedEvents: Event[];
};

function getInitials(email: string): string {
  const name = email.split("@")[0];
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(email: string): string {
  const colors = [
    "from-violet-500 to-purple-700",
    "from-blue-500 to-indigo-700",
    "from-emerald-500 to-teal-700",
    "from-rose-500 to-pink-700",
    "from-orange-500 to-amber-700",
    "from-cyan-500 to-blue-700",
  ];
  const index =
    email.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) %
    colors.length;
  return colors[index];
}

type Tab = "going" | "saved";

export function ProfilePage({ email, bio, goingEvents, savedEvents }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("going");
  const [signingOut, setSigningOut] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState(bio ?? "");
  const [savingBio, setSavingBio] = useState(false);

  const initials = getInitials(email);
  const avatarGradient = getAvatarColor(email);
  const displayName = email.split("@")[0].replace(/[._-]/g, " ");

  const events = activeTab === "going" ? goingEvents : savedEvents;

  async function handleSaveBio() {
    setSavingBio(true);
    try {
      await updateBio(bioValue);
      setEditingBio(false);
    } finally {
      setSavingBio(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
    window.location.assign("/");
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-[#080810] pb-28 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pb-2 pt-5">
        <Link href="/events" className="text-zinc-400 hover:text-white">
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
        <span className="text-sm font-medium text-zinc-300">
          @{email.split("@")[0]}
        </span>
        <div className="w-6" />
      </header>

      {/* Avatar + name */}
      <div className="flex flex-col items-center px-4 py-6">
        <div
          className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient} text-2xl font-bold shadow-lg`}
        >
          {initials}
        </div>
        <h1 className="mt-3 text-lg font-bold capitalize">{displayName}</h1>
        <p className="mt-0.5 text-sm text-zinc-500">{email}</p>

        {/* Bio */}
        {editingBio ? (
          <div className="mt-3 w-full max-w-xs">
            <textarea
              value={bioValue}
              onChange={(e) => setBioValue(e.target.value)}
              maxLength={120}
              rows={2}
              placeholder="Napisz coś o sobie…"
              className="w-full resize-none rounded-xl bg-white/10 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-violet-500"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={handleSaveBio}
                disabled={savingBio}
                className="flex-1 rounded-xl bg-violet-600 py-1.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {savingBio ? "Zapisywanie…" : "Zapisz"}
              </button>
              <button
                type="button"
                onClick={() => { setEditingBio(false); setBioValue(bio ?? ""); }}
                className="flex-1 rounded-xl bg-white/10 py-1.5 text-sm text-zinc-300"
              >
                Anuluj
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingBio(true)}
            className="mt-2 max-w-xs text-center text-sm text-zinc-400 hover:text-zinc-200"
          >
            {bioValue ? bioValue : (
              <span className="text-zinc-600 underline-offset-2 hover:underline">
                + Dodaj bio
              </span>
            )}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="mx-4 flex divide-x divide-white/10 rounded-2xl bg-white/5 py-4">
        <div className="flex flex-1 flex-col items-center gap-0.5">
          <span className="text-lg font-bold">{goingEvents.length}</span>
          <span className="text-xs text-zinc-500">Idę</span>
        </div>
        <div className="flex flex-1 flex-col items-center gap-0.5">
          <span className="text-lg font-bold">{savedEvents.length}</span>
          <span className="text-xs text-zinc-500">Zapisane</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-4 mt-5 flex rounded-xl bg-white/5 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("going")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            activeTab === "going"
              ? "bg-white text-black"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Idę ({goingEvents.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("saved")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            activeTab === "saved"
              ? "bg-white text-black"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Zapisane ({savedEvents.length})
        </button>
      </div>

      {/* Events grid */}
      <main className="px-2.5 pt-4">
        {events.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-3xl">
              {activeTab === "going" ? "🎟️" : "🔖"}
            </p>
            <p className="mt-3 text-sm font-medium text-zinc-300">
              {activeTab === "going"
                ? "Nie idziesz jeszcze na żadne wydarzenie"
                : "Nie masz zapisanych wydarzeń"}
            </p>
            <Link
              href="/events"
              className="mt-3 inline-block text-sm text-violet-400 underline-offset-2 hover:underline"
            >
              Przeglądaj wydarzenia →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>

      {/* Sign out */}
      <div className="px-4 pt-8">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full rounded-2xl border border-white/10 py-3 text-sm font-medium text-zinc-400 transition-colors hover:border-red-500/30 hover:text-red-400 disabled:opacity-40"
        >
          {signingOut ? "Wylogowywanie…" : "Wyloguj się"}
        </button>
      </div>

      <BottomNav activePage="profile" />
    </div>
  );
}
