"use client";

import { useState, useTransition } from "react";
import { followUser, unfollowUser } from "@/app/profile/znajomi-actions";

type FollowCreatorCardProps = {
  creatorId: string;
  name: string;
  avatarUrl: string | null;
  initiallyFollowing: boolean;
};

export function FollowCreatorCard({
  creatorId,
  name,
  avatarUrl,
  initiallyFollowing,
}: FollowCreatorCardProps) {
  const [following, setFollowing] = useState(initiallyFollowing);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const initial = name.trim().slice(0, 1).toUpperCase() || "?";

  function handleToggle() {
    setError(null);
    startTransition(async () => {
      try {
        if (following) {
          await unfollowUser(creatorId);
          setFollowing(false);
        } else {
          await followUser(creatorId);
          setFollowing(true);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Nie udało się zapisać.",
        );
      }
    });
  }

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[#12121a] p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
        Twórca wydarzenia
      </p>
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="h-12 w-12 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-base font-semibold text-violet-200">
            {initial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{name}</p>
          <p className="truncate text-xs text-zinc-500">Organizator</p>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={handleToggle}
          className={`shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
            following
              ? "border border-white/15 bg-white/5 text-zinc-300 hover:border-red-500/40 hover:text-red-300"
              : "bg-violet-600 text-white hover:bg-violet-500"
          }`}
        >
          {isPending
            ? "…"
            : following
              ? "Obserwujesz"
              : "Obserwuj"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </section>
  );
}
