"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { AchievementIcon } from "@/components/achievements/achievement-icon";
import {
  deleteEventAchievement,
  setEventAchievementStatus,
} from "@/app/admin/events/achievements-actions";
import { unlockTypeLabel } from "@/types/achievement";
import type { EventAchievement } from "@/types/achievement";

export function AchievementsList({
  eventId,
  eventTitle,
  stats,
  achievements,
}: {
  eventId: string;
  eventTitle: string;
  stats: { badges: number; unlocks: number; participants: number };
  achievements: EventAchievement[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggle(id: string, status: "active" | "disabled") {
    startTransition(async () => {
      await setEventAchievementStatus(
        eventId,
        id,
        status === "active" ? "disabled" : "active",
      );
      router.refresh();
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Usunąć odznakę „${name}”?`)) return;
    startTransition(async () => {
      await deleteEventAchievement(eventId, id);
      router.refresh();
    });
  }

  return (
    <div className="min-h-dvh w-full bg-[radial-gradient(ellipse_at_top,_#2a1845_0%,_#12101a_38%,_#080810_100%)] text-white">
      <div className="mx-auto flex w-full max-w-2xl flex-col px-4 pb-14 pt-8 sm:px-6">
        <div className="mb-6">
          <Link
            href={`/admin/events/${eventId}`}
            className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            ← Wróć do wydarzenia
          </Link>
          <h1 className="text-3xl font-bold">{eventTitle}</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Odznaki przypisane do tego wydarzenia — budują zaangażowanie społeczności.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3">
          {[
            { label: "Odznaki", value: stats.badges },
            { label: "Zdobyć", value: stats.unlocks },
            { label: "Uczestnicy", value: stats.participants },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[#2a2640]/80 bg-[#101018]/70 px-3 py-4 text-center"
            >
              <p className="text-2xl font-bold text-white">{item.value}</p>
              <p className="mt-1 text-xs text-zinc-500">{item.label}</p>
            </div>
          ))}
        </div>

        <Link
          href={`/admin/events/${eventId}/achievements/new`}
          className="mb-6 flex h-14 w-full items-center justify-center rounded-[20px] bg-gradient-to-r from-blue-500 to-violet-600 text-base font-semibold text-white shadow-[0_0_24px_rgba(99,102,241,0.35)] transition-opacity hover:opacity-95"
        >
          + Dodaj odznakę
        </Link>

        {achievements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
            <p className="text-4xl" aria-hidden>
              🏆
            </p>
            <p className="mt-4 text-lg font-medium text-zinc-300">
              Brak odznak
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Utwórz pierwszą odznakę w mniej niż minutę.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {achievements.map((item) => (
              <article
                key={item.id}
                className="rounded-[20px] border border-[#2a2640]/80 bg-[#101018]/70 p-5"
              >
                <Link
                  href={`/admin/events/${eventId}/achievements/${item.id}`}
                  className="flex gap-4"
                >
                  <div
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                      background: item.background,
                      boxShadow:
                        item.style === "outline"
                          ? `inset 0 0 0 2px ${item.color}`
                          : undefined,
                    }}
                  >
                    {item.custom_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.custom_image_url}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <AchievementIcon
                        icon={item.icon}
                        size={28}
                        color={item.color}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-lg font-semibold text-white">
                        {item.name}
                      </h2>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          item.status === "active"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-zinc-500/20 text-zinc-400"
                        }`}
                      >
                        {item.status === "active" ? "Aktywna" : "Wyłączona"}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                      {item.description}
                    </p>
                    <p className="mt-2 text-xs text-zinc-400">
                      {unlockTypeLabel(item.unlock_type)}
                      {item.unlock_threshold
                        ? ` · ${item.unlock_threshold}`
                        : ""}
                      {" · "}
                      {item.awards_count ?? 0} zdobyć
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-600">
                      {new Date(item.created_at).toLocaleDateString("pl-PL")}
                    </p>
                  </div>
                </Link>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  <Link
                    href={`/admin/events/${eventId}/achievements/${item.id}`}
                    className="rounded-xl border border-white/10 py-2 text-center text-xs text-zinc-300 transition-colors hover:border-violet-500/40 hover:text-white"
                  >
                    Podejrzyj
                  </Link>
                  <Link
                    href={`/admin/events/${eventId}/achievements/${item.id}/edit`}
                    className="rounded-xl border border-white/10 py-2 text-center text-xs text-zinc-300 transition-colors hover:border-violet-500/40 hover:text-white"
                  >
                    Edytuj
                  </Link>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleToggle(item.id, item.status)}
                    className="rounded-xl border border-white/10 py-2 text-xs text-zinc-300 transition-colors hover:border-amber-500/40 hover:text-amber-200 disabled:opacity-50"
                  >
                    {item.status === "active" ? "Wyłącz" : "Włącz"}
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDelete(item.id, item.name)}
                    className="rounded-xl border border-white/10 py-2 text-xs text-zinc-300 transition-colors hover:border-red-500/40 hover:text-red-300 disabled:opacity-50"
                  >
                    Usuń
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
