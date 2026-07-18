"use client";

import Link from "next/link";
import { AchievementIcon } from "@/components/achievements/achievement-icon";
import { unlockTypeLabel } from "@/types/achievement";
import type { EventAchievement } from "@/types/achievement";

export function AchievementDetail({
  eventId,
  eventTitle,
  achievement,
}: {
  eventId: string;
  eventTitle: string;
  achievement: EventAchievement;
}) {
  return (
    <div className="min-h-dvh w-full bg-[radial-gradient(ellipse_at_top,_#2a1845_0%,_#12101a_38%,_#080810_100%)] text-white">
      <div className="mx-auto flex w-full max-w-2xl flex-col px-4 pb-14 pt-8 sm:px-6">
        <Link
          href={`/admin/events/${eventId}/achievements`}
          className="mb-4 inline-flex text-sm text-zinc-400 transition-colors hover:text-white"
        >
          ← Lista odznak
        </Link>

        <div className="flex flex-col items-center text-center">
          <div
            className="flex h-32 w-32 items-center justify-center rounded-[28px]"
            style={{
              background:
                achievement.style === "gradient"
                  ? `linear-gradient(135deg, ${achievement.background}, ${achievement.color}55)`
                  : achievement.background,
              boxShadow:
                achievement.style === "outline"
                  ? `inset 0 0 0 2px ${achievement.color}`
                  : `0 0 32px ${achievement.color}40`,
            }}
          >
            <AchievementIcon
              icon={achievement.icon}
              size={56}
              color={achievement.color}
            />
          </div>
          <h1 className="mt-6 text-3xl font-bold">{achievement.name}</h1>
          <p className="mt-2 text-sm text-zinc-500">{eventTitle}</p>
        </div>

        <div className="mt-8 space-y-4 rounded-[20px] border border-[#2a2640]/80 bg-[#101018]/70 p-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-600">Opis</p>
            <p className="mt-1 text-sm text-zinc-300">{achievement.description}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-600">
              Warunek zdobycia
            </p>
            <p className="mt-1 text-sm text-zinc-300">
              {unlockTypeLabel(achievement.unlock_type)}
              {achievement.unlock_threshold
                ? ` · ${achievement.unlock_threshold}`
                : ""}
            </p>
          </div>
          {achievement.has_reward && achievement.reward_label && (
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-600">
                Nagroda
              </p>
              <p className="mt-1 text-sm text-zinc-300">
                {achievement.reward_label}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-2xl bg-white/5 px-3 py-3">
              <p className="text-xs text-zinc-600">Status</p>
              <p className="mt-1 text-sm font-medium">
                {achievement.status === "active" ? "Aktywna" : "Wyłączona"}
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 px-3 py-3">
              <p className="text-xs text-zinc-600">Utworzono</p>
              <p className="mt-1 text-sm font-medium">
                {new Date(achievement.created_at).toLocaleDateString("pl-PL")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link
            href={`/admin/events/${eventId}/achievements/${achievement.id}/edit`}
            className="flex h-12 items-center justify-center rounded-2xl bg-violet-600 text-sm font-semibold text-white hover:bg-violet-500"
          >
            Edytuj
          </Link>
          <Link
            href={`/admin/events/${eventId}/achievements`}
            className="flex h-12 items-center justify-center rounded-2xl border border-white/10 text-sm font-medium text-zinc-300"
          >
            Wróć
          </Link>
        </div>
      </div>
    </div>
  );
}
