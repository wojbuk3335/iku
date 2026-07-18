"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AccountMenu } from "@/components/admin/account-menu";
import { formatEventDateRangeShort } from "@/lib/events/format-event-date";
import { getCategoryMeta, getEventCategories } from "@/lib/events/category-style";
import type { Event } from "@/types/event";

export function CreatorAchievementsHub({
  events,
  userEmail,
}: {
  events: Event[];
  userEmail?: string | null;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;

    return events.filter(
      (event) =>
        event.title.toLowerCase().includes(q) ||
        event.location.toLowerCase().includes(q),
    );
  }, [events, query]);

  return (
    <div className="min-h-dvh w-full bg-[radial-gradient(ellipse_at_top,_#2a1845_0%,_#12101a_38%,_#080810_100%)] text-white">
      <div className="mx-auto flex w-full max-w-2xl flex-col px-4 pb-14 pt-8 sm:px-6">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[2.5rem] font-bold leading-tight">Odznaki</h1>
            <p className="mt-2 text-sm text-zinc-500">
              Wybierz wydarzenie, potem dodaj lub edytuj odznaki.
            </p>
          </div>
          <AccountMenu userEmail={userEmail} />
        </div>

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
            placeholder="Szukaj wydarzenia…"
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-16 text-center">
            <p className="text-lg font-medium text-zinc-300">
              {events.length === 0
                ? "Najpierw utwórz wydarzenie"
                : "Brak wyników"}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              {events.length === 0
                ? "Odznaki są przypisane do konkretnego wydarzenia."
                : "Spróbuj innej frazy."}
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
              return (
                <div
                  key={event.id}
                  className="rounded-2xl border border-[#2a2640]/80 bg-[#101018]/70 p-4"
                >
                  <div className="flex gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                      {event.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={event.cover_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl">
                          {getCategoryMeta(cats[0]).emoji}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-base font-semibold text-white">
                        {event.title}
                      </h2>
                      <p className="mt-1 text-sm text-zinc-500">
                        {formatEventDateRangeShort(event.starts_at, event.ends_at)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/admin/events/${event.id}/achievements/new`}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 sm:flex-none"
                    >
                      + Nowa odznaka
                    </Link>
                    <Link
                      href={`/admin/events/${event.id}/achievements`}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-violet-500/25 bg-violet-500/10 px-3 py-2.5 text-sm font-medium text-violet-200 transition-colors hover:bg-violet-500/20 sm:flex-none"
                    >
                      Lista odznak
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
