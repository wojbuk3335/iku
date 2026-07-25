"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteEvent } from "@/app/admin/actions";
import type { CreatorEventBadge } from "@/app/admin/actions";
import { AccountMenu } from "@/components/admin/account-menu";
import { AchievementIcon } from "@/components/achievements/achievement-icon";
import { formatEventDateRangeShort } from "@/lib/events/format-event-date";
import { getCategoryMeta, getEventCategories } from "@/lib/events/category-style";
import type { Event } from "@/types/event";

function DeleteEventModal({
  event,
  isPending,
  error,
  onCancel,
  onConfirm,
}: {
  event: Event;
  isPending: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isPending) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPending, onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-event-title"
      onClick={() => {
        if (!isPending) onCancel();
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-[#2a2640] bg-[#101018] p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-6 w-6"
            aria-hidden
          >
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        </div>

        <h2 id="delete-event-title" className="text-xl font-semibold text-white">
          Usunąć wydarzenie?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Usuniesz{" "}
          <span className="font-medium text-zinc-200">„{event.title}”</span>
          {" "}oraz powiązane odznaki. Tej operacji nie da się cofnąć.
        </p>

        {error && (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 rounded-2xl border border-white/10 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
          >
            {isPending ? "Usuwanie…" : "Usuń wydarzenie"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CreatorEventsList({
  events,
  badgesByEvent = {},
  userEmail,
  embedded = false,
}: {
  events: Event[];
  badgesByEvent?: Record<string, CreatorEventBadge[]>;
  userEmail?: string | null;
  /** Bez pełnego layoutu strony — do wbudowania w panel Statystyk (Moje Events). */
  embedded?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;

    return events.filter((event) => {
      const cats = getEventCategories(event)
        .map((c) => getCategoryMeta(c).label)
        .join(" ");
      const badges = (badgesByEvent[event.id] ?? [])
        .map((b) => b.name)
        .join(" ");
      return (
        event.title.toLowerCase().includes(q) ||
        event.location.toLowerCase().includes(q) ||
        cats.toLowerCase().includes(q) ||
        badges.toLowerCase().includes(q)
      );
    });
  }, [events, badgesByEvent, query]);

  function confirmDelete() {
    if (!eventToDelete) return;

    setError(null);
    const id = eventToDelete.id;
    startTransition(async () => {
      try {
        await deleteEvent(id);
        setEventToDelete(null);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Nie udało się usunąć wydarzenia.",
        );
      }
    });
  }

  const listBody = (
    <>
      <div className="mb-6 flex items-center gap-2 rounded-2xl border border-[#2a2640]/80 bg-[#101018]/70 px-4 py-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#52525b"
          strokeWidth="1.8"
          className="h-4 w-4 shrink-0"
          aria-hidden
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj po tytule, lokalizacji, kategorii lub odznace…"
          className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="cursor-pointer text-zinc-600 transition-colors hover:text-zinc-400"
          >
            ✕
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-16 text-center">
          <p className="text-lg font-medium text-zinc-300">
            {events.length === 0 ? "Nie masz jeszcze żadnych wydarzeń" : "Brak wyników"}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            {events.length === 0
              ? "Utwórz pierwsze wydarzenie w zakładce „Utwórz wydarzenie”."
              : "Spróbuj innej frazy wyszukiwania."}
          </p>
          {events.length === 0 && (
            <Link
              href="/admin"
              className="mt-6 inline-block rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
            >
              Utwórz wydarzenie
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((event) => {
            const cats = getEventCategories(event);
            const badges = badgesByEvent[event.id] ?? [];

            return (
              <div
                key={event.id}
                className="rounded-2xl border border-[#2a2640]/80 bg-[#101018]/70 p-4 transition-colors hover:border-violet-500/40 hover:bg-[#151022]/90"
              >
                <Link
                  href={`/admin/events/${event.id}`}
                  className="group flex cursor-pointer gap-4"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                    {event.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={event.cover_url}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">
                        {getCategoryMeta(cats[0]).emoji}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-semibold text-white transition-colors group-hover:text-violet-200">
                      {event.title}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      {formatEventDateRangeShort(event.starts_at, event.ends_at)} ·{" "}
                      {event.location}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {cats.map((cat) => {
                        const meta = getCategoryMeta(cat);
                        return (
                          <span
                            key={cat}
                            className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-300"
                          >
                            {meta.emoji} {meta.label}
                          </span>
                        );
                      })}
                      {badges.map((badge) => (
                        <span
                          key={badge.id}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            background: `${badge.color}22`,
                            color: badge.color,
                          }}
                          title={badge.name}
                        >
                          <AchievementIcon
                            icon={badge.icon}
                            size={10}
                            color={badge.color}
                          />
                          {badge.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="mt-2 h-5 w-5 shrink-0 text-zinc-600 transition-colors group-hover:text-violet-400"
                    aria-hidden
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/admin/events/${event.id}/achievements`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300 transition-colors hover:bg-violet-500/20"
                  >
                    🏆 {badges.length > 0 ? "Zarządzaj odznakami" : "Dodaj odznakę"}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setEventToDelete(event);
                    }}
                    disabled={isPending}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                  >
                    Usuń
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {eventToDelete && (
        <DeleteEventModal
          event={eventToDelete}
          isPending={isPending}
          error={error}
          onCancel={() => {
            if (isPending) return;
            setEventToDelete(null);
            setError(null);
          }}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );

  if (embedded) {
    return <div className="w-full text-white">{listBody}</div>;
  }

  return (
    <div className="min-h-dvh w-full bg-[radial-gradient(ellipse_at_top,_#2a1845_0%,_#12101a_38%,_#080810_100%)] text-white">
      <div className="mx-auto flex w-full max-w-2xl flex-col px-4 pb-14 pt-8 sm:px-6">
        <div className="mb-8 flex items-start justify-between gap-4">
          <h1 className="text-[2.5rem] font-bold leading-tight">
            Utworzone wydarzenia
          </h1>
          <AccountMenu userEmail={userEmail} />
        </div>
        {listBody}
      </div>
    </div>
  );
}
