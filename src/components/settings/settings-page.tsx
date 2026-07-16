"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { updateInterests } from "@/app/settings/actions";
import { INTEREST_CATEGORIES } from "@/types/interests";
import { BottomNav } from "@/components/events/bottom-nav";

type SettingsPageProps = {
  email: string;
  interests: string[];
};

export function SettingsPage({ email, interests }: SettingsPageProps) {
  const [selected, setSelected] = useState<string[]>(interests);
  const [savingInterests, setSavingInterests] = useState(false);
  const [interestsSaved, setInterestsSaved] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function toggleInterest(id: string) {
    setInterestsSaved(false);
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  async function handleSaveInterests() {
    setSavingInterests(true);
    try {
      await updateInterests(selected);
      setInterestsSaved(true);
      setTimeout(() => setInterestsSaved(false), 2000);
    } catch {
      alert("Nie udało się zapisać zainteresowań.");
    } finally {
      setSavingInterests(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
    window.location.assign("/");
  }

  return (
    <div className="mx-auto min-h-dvh max-w-2xl bg-[#080810] pb-28 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pb-2 pt-5">
        <Link href="/profile" className="text-zinc-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <span className="text-sm font-medium text-zinc-300">Ustawienia</span>
        <div className="w-6" />
      </header>

      <div className="space-y-6 px-4 pt-4">

        {/* Account info */}
        <section className="rounded-2xl bg-white/5 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Konto</p>
          <p className="mt-2 text-sm text-zinc-300">{email}</p>
        </section>

        {/* Interests */}
        <section>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Zainteresowania</p>
          <div className="flex flex-wrap gap-2">
            {INTEREST_CATEGORIES.map((cat) => {
              const isSelected = selected.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleInterest(cat.id)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-violet-600 text-white"
                      : "bg-white/8 text-zinc-400 hover:bg-white/12"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  {cat.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={handleSaveInterests}
            disabled={savingInterests}
            className="mt-4 w-full rounded-2xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
          >
            {savingInterests ? "Zapisywanie…" : interestsSaved ? "✓ Zapisano!" : "Zapisz zainteresowania"}
          </button>
        </section>

        {/* Divider */}
        <div className="h-px bg-white/5" />

        {/* Sign out */}
        <section>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Sesja</p>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full rounded-2xl border border-white/10 py-3 text-sm font-medium text-zinc-400 transition-colors hover:border-red-500/30 hover:text-red-400 disabled:opacity-40"
          >
            {signingOut ? "Wylogowywanie…" : "Wyloguj się"}
          </button>
        </section>

        {/* Danger zone */}
        <section>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-red-500/70">Strefa niebezpieczna</p>
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full rounded-2xl border border-red-500/20 py-3 text-sm font-medium text-red-500/70 transition-colors hover:border-red-500/50 hover:text-red-400"
            >
              Usuń konto
            </button>
          ) : (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
              <p className="text-sm text-red-400">Czy na pewno chcesz usunąć konto? Tej operacji nie można cofnąć.</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-xl bg-white/10 py-2 text-sm text-zinc-300"
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={() => alert("Funkcja usuwania konta wkrótce.")}
                  className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-500"
                >
                  Usuń
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <BottomNav activePage="profile" />
    </div>
  );
}
