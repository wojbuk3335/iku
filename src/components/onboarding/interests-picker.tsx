"use client";

import { useState, useTransition } from "react";
import { completeOnboarding } from "@/app/onboarding/actions";
import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  INTEREST_CATEGORIES,
  MIN_INTERESTS,
} from "@/types/interests";

export function InterestsPicker() {
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canContinue = selected.length >= MIN_INTERESTS;

  function toggleInterest(id: string) {
    setError(null);
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function handleContinue() {
    if (!canContinue) {
      return;
    }

    startTransition(async () => {
      try {
        const path = await completeOnboarding(selected);
        window.location.assign(path);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Nie udało się zapisać wyboru.",
        );
      }
    });
  }

  return (
    <div className="min-h-dvh w-full bg-[radial-gradient(ellipse_at_top,_#2a1845_0%,_#12101a_38%,_#080810_100%)] text-white">
      <div className="flex min-h-dvh w-full flex-col px-4 pb-40 pt-20">
        <div className="mb-2 flex justify-end">
          <SignOutButton className="mt-0" />
        </div>
        <h1 className="text-[2.5rem] font-bold leading-tight text-white">
          Co Cię interesuje?
        </h1>
        <p className="mt-4 text-xl leading-relaxed text-zinc-400">
          Wybierz co najmniej 3 kategorie, aby spersonalizować swój feed
        </p>

        <div className="mt-8 grid w-full grid-cols-2 gap-3">
          {INTEREST_CATEGORIES.map((category) => {
            const isSelected = selected.includes(category.id);

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleInterest(category.id)}
                className={`relative flex h-[142px] w-full flex-col items-center justify-center gap-2.5 rounded-[20px] border transition-all ${
                  isSelected
                    ? "border-violet-500 bg-[#151022]/90 shadow-[0_0_20px_rgba(139,92,246,0.25)]"
                    : "border-[#2a2640]/80 bg-[#101018]/70"
                }`}
              >
                {isSelected && (
                  <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 text-xs font-bold text-white">
                    ✓
                  </span>
                )}
                <span className="text-[3rem] leading-none" aria-hidden>
                  {category.emoji}
                </span>
                <span className="text-lg font-medium text-white">
                  {category.label}
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <p className="mt-4 text-center text-base text-red-300">{error}</p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 w-full bg-[#080810]/90 px-4 pb-8 pt-4 backdrop-blur-md">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue || isPending}
          className={`h-14 w-full rounded-[18px] text-lg font-semibold ${
            canContinue
              ? "bg-violet-600 text-white"
              : "cursor-not-allowed bg-[#141418] text-zinc-500"
          }`}
        >
          {isPending
            ? "Zapisywanie…"
            : `Kontynuuj (${selected.length}/${MIN_INTERESTS})`}
        </button>
      </div>

      <button
        type="button"
        aria-label="Pomoc"
        className="fixed bottom-24 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-base font-medium text-black"
      >
        ?
      </button>
    </div>
  );
}
