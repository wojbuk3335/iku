"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { updateInterests, updateUserProfile } from "@/app/settings/actions";
import {
  INTEREST_CATEGORIES,
  MAX_INTERESTS,
  MIN_INTERESTS,
} from "@/types/interests";
import {
  birthDateInputBounds,
  isValidBirthDate,
} from "@/lib/profile/birth-date";
import { BottomNav } from "@/components/events/bottom-nav";

const inputCls =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500/50 transition-colors [color-scheme:dark]";

const PASSWORD_RULES = [
  { id: "length", label: "Min. 5 znaków", test: (p: string) => p.length >= 5 },
  {
    id: "upper",
    label: "Jedna wielka litera",
    test: (p: string) => /[A-Z]/.test(p),
  },
  { id: "digit", label: "Jedna cyfra", test: (p: string) => /[0-9]/.test(p) },
  {
    id: "special",
    label: "Jeden znak specjalny",
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
];

const STRENGTH_COLORS = ["", "#ef4444", "#f97316", "#eab308", "#22c55e"];
const STRENGTH_LABELS = ["", "Słabe", "Słabe", "Średnie", "Silne"];

function getStrength(p: string) {
  return PASSWORD_RULES.filter((r) => r.test(p)).length;
}

type SettingsPageProps = {
  email: string;
  fullName: string | null;
  birthDate: string | null;
  interests: string[];
};

export function SettingsPage({
  email,
  fullName,
  birthDate,
  interests,
}: SettingsPageProps) {
  const supabase = createClient();
  const dateBounds = birthDateInputBounds();

  const [name, setName] = useState(fullName ?? "");
  const [birth, setBirth] = useState(birthDate ?? "");
  const [profileMsg, setProfileMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [profilePending, startProfileTransition] = useTransition();

  const [selected, setSelected] = useState<string[]>(
    interests.slice(0, MAX_INTERESTS),
  );
  const [savingInterests, setSavingInterests] = useState(false);
  const [interestsSaved, setInterestsSaved] = useState(false);
  const [interestsError, setInterestsError] = useState<string | null>(null);

  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passMsg, setPassMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [passPending, startPassTransition] = useTransition();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const strength = getStrength(password);
  const passwordValid = strength === 4;

  function toggleInterest(id: string) {
    setInterestsSaved(false);
    setInterestsError(null);
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= MAX_INTERESTS) {
        setInterestsError(`Możesz wybrać maksymalnie ${MAX_INTERESTS} zainteresowania.`);
        return prev;
      }
      return [...prev, id];
    });
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);

    if (!name.trim()) {
      setProfileMsg({ type: "err", text: "Podaj imię i nazwisko." });
      return;
    }
    if (!birth || !isValidBirthDate(birth)) {
      setProfileMsg({
        type: "err",
        text: "Podaj poprawną datę urodzenia (min. 13 lat).",
      });
      return;
    }

    startProfileTransition(async () => {
      try {
        await updateUserProfile({
          fullName: name.trim(),
          birthDate: birth,
        });
        setProfileMsg({ type: "ok", text: "Profil zapisany!" });
      } catch (err) {
        setProfileMsg({
          type: "err",
          text: err instanceof Error ? err.message : "Nie udało się zapisać.",
        });
      }
    });
  }

  async function handleSaveInterests() {
    setInterestsError(null);
    if (selected.length !== MAX_INTERESTS) {
      setInterestsError(`Wybierz dokładnie ${MAX_INTERESTS} zainteresowania.`);
      return;
    }
    setSavingInterests(true);
    try {
      await updateInterests(selected);
      setInterestsSaved(true);
      setTimeout(() => setInterestsSaved(false), 2000);
    } catch {
      setInterestsError("Nie udało się zapisać zainteresowań.");
    } finally {
      setSavingInterests(false);
    }
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPassMsg(null);

    if (!passwordValid) {
      setPassMsg({ type: "err", text: "Hasło nie spełnia wymagań." });
      return;
    }
    if (password !== confirm) {
      setPassMsg({ type: "err", text: "Hasła nie są identyczne." });
      return;
    }

    startPassTransition(async () => {
      if (current && email) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: current,
        });
        if (signInError) {
          setPassMsg({
            type: "err",
            text: "Obecne hasło jest nieprawidłowe.",
          });
          return;
        }
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setPassMsg({ type: "err", text: error.message });
        return;
      }

      setCurrent("");
      setPassword("");
      setConfirm("");
      setPassMsg({ type: "ok", text: "Hasło zostało zmienione!" });
    });
  }

  return (
    <div className="mx-auto min-h-dvh max-w-2xl bg-[#080810] pb-28 text-white">
      <header className="flex items-center justify-between px-4 pb-2 pt-5">
        <Link
          href="/profile"
          className="text-zinc-400 transition-colors hover:text-white"
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
        <span className="text-sm font-medium text-zinc-300">Edytuj profil</span>
        <div className="w-6" />
      </header>

      <div className="space-y-6 px-4 pt-4">
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Konto
          </p>
          <p className="mt-2 text-sm text-zinc-300">{email}</p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <h2 className="mb-4 text-sm font-semibold text-zinc-300">
            Dane profilu
          </h2>
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Imię i nazwisko
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Twoje imię i nazwisko"
                className={inputCls}
                autoComplete="name"
                maxLength={80}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Data urodzenia
              </label>
              <input
                type="date"
                required
                value={birth}
                min={dateBounds.min}
                max={dateBounds.max}
                onChange={(e) => setBirth(e.target.value)}
                className={inputCls}
              />
            </div>

            {profileMsg && (
              <p
                className={`rounded-xl px-4 py-2.5 text-sm ${
                  profileMsg.type === "ok"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {profileMsg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={profilePending}
              className="cursor-pointer rounded-2xl bg-violet-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
            >
              {profilePending ? "Zapisuję…" : "Zapisz profil"}
            </button>
          </form>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Zainteresowania
            </p>
            <p className="text-xs text-zinc-600">
              {selected.length}/{MAX_INTERESTS}
            </p>
          </div>
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
          {interestsError && (
            <p className="mt-2 text-xs text-red-400">{interestsError}</p>
          )}
          <button
            type="button"
            onClick={handleSaveInterests}
            disabled={savingInterests || selected.length !== MIN_INTERESTS}
            className="mt-4 w-full rounded-2xl bg-violet-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            {savingInterests
              ? "Zapisywanie…"
              : interestsSaved
                ? "✓ Zapisano!"
                : "Zapisz zainteresowania"}
          </button>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <h2 className="mb-4 text-sm font-semibold text-zinc-300">
            Zmiana hasła
          </h2>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Obecne hasło
              </label>
              <input
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="••••••••"
                className={inputCls}
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Nowe hasło
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputCls}
                autoComplete="new-password"
              />
              {password.length > 0 && (
                <div className="mt-2 flex flex-col gap-1.5">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(strength / 4) * 100}%`,
                        background: STRENGTH_COLORS[strength] || "transparent",
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs"
                      style={{ color: STRENGTH_COLORS[strength] }}
                    >
                      {STRENGTH_LABELS[strength]}
                    </span>
                    <span className="text-xs text-zinc-600">{strength}/4</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                    {PASSWORD_RULES.map((rule) => {
                      const ok = rule.test(password);
                      return (
                        <div key={rule.id} className="flex items-center gap-1.5">
                          <span
                            className="text-[10px]"
                            style={{ color: ok ? "#22c55e" : "#52525b" }}
                          >
                            {ok ? "✓" : "○"}
                          </span>
                          <span
                            className="text-[10px]"
                            style={{ color: ok ? "#86efac" : "#52525b" }}
                          >
                            {rule.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Powtórz nowe hasło
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className={
                  inputCls +
                  (confirm && confirm !== password
                    ? " border-red-500/50"
                    : confirm && confirm === password
                      ? " border-emerald-500/40"
                      : "")
                }
                autoComplete="new-password"
              />
            </div>

            {passMsg && (
              <p
                className={`rounded-xl px-4 py-2.5 text-sm ${
                  passMsg.type === "ok"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {passMsg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={
                passPending ||
                !passwordValid ||
                (!!confirm && confirm !== password)
              }
              className="cursor-pointer rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            >
              {passPending ? "Zapisuję…" : "Zmień hasło"}
            </button>
          </form>
        </section>

        <section>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-red-500/70">
            Strefa niebezpieczna
          </p>
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
              <p className="text-sm text-red-400">
                Czy na pewno chcesz usunąć konto? Tej operacji nie można
                cofnąć.
              </p>
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
