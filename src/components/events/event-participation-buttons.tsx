"use client";

import { useState, useTransition } from "react";
import { toggleParticipation } from "@/app/events/actions";
import type { UserParticipation } from "@/types/participation";

type EventParticipationButtonsProps = {
  eventId: string;
  initialParticipation: UserParticipation;
  goingCount: number;
};

export function EventParticipationButtons({
  eventId,
  initialParticipation,
  goingCount: initialGoingCount,
}: EventParticipationButtonsProps) {
  const [participation, setParticipation] =
    useState<UserParticipation>(initialParticipation);
  const [goingCount, setGoingCount] = useState(initialGoingCount);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle(status: "going" | "saved") {
    setError(null);

    startTransition(async () => {
      try {
        const wasGoing = participation.going;
        const next = await toggleParticipation(eventId, status);
        setParticipation(next);

        if (status === "going") {
          if (wasGoing && !next.going) {
            setGoingCount((count) => Math.max(0, count - 1));
          } else if (!wasGoing && next.going) {
            setGoingCount((count) => count + 1);
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Nie udało się zapisać wyboru.",
        );
      }
    });
  }

  return (
    <div className="space-y-3 pt-2">
      <p className="text-sm text-zinc-400">
        {goingCount === 0
          ? "Nikt jeszcze nie idzie"
          : goingCount === 1
            ? "1 osoba idzie"
            : `${goingCount} osób idzie`}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleToggle("going")}
          className={`rounded-2xl py-3 text-sm font-semibold transition-colors disabled:opacity-60 ${
            participation.going
              ? "bg-violet-600 text-white"
              : "border border-white/10 text-zinc-300 hover:border-violet-500/40"
          }`}
        >
          {participation.going ? "✓ Idę" : "Idę"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleToggle("saved")}
          className={`rounded-2xl py-3 text-sm font-semibold transition-colors disabled:opacity-60 ${
            participation.saved
              ? "bg-violet-600/20 text-violet-200 ring-1 ring-violet-500/50"
              : "border border-white/10 text-zinc-300 hover:border-violet-500/40"
          }`}
        >
          {participation.saved ? "✓ Zapisane" : "Zapisz"}
        </button>
      </div>

      {error && <p className="text-center text-sm text-red-300">{error}</p>}
    </div>
  );
}
