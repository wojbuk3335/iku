"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AccountMenu } from "@/components/admin/account-menu";
import { formatEventDateRangeShort } from "@/lib/events/format-event-date";
import { getCategoryMeta, getEventCategories } from "@/lib/events/category-style";
import type { Event } from "@/types/event";

export function CreatorEventsList({
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

    return events.filter((event) => {
      const cats = getEventCategories(event)
        .map((c) => getCategoryMeta(c).label)
        .join(" ");
      return (
        event.title.toLowerCase().includes(q) ||
        event.location.toLowerCase().includes(q) ||
        cats.toLowerCase().includes(q)
      );
    });
  }, [events, query]);

  return (
    <div className="min-h-dvh w-full bg-[radial-gradient(ellipse_at_top,_#2a1845_0%,_#12101a_38%,_#080810_100%)] text-white">
      <div className="mx-auto flex w-full max-w-2xl flex-col px-4 pb-14 pt-8 sm:px-6">
        <div className="mb-8 flex items-start justify-between gap-4">
          <h1 className="text-[2.5rem] font-bold leading-tight">
            Utworzone wydarzenia
          </h1>
          <AccountMenu userEmail={userEmail} />
        </div>

        {/* Search */}
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-[#2a2640]/80 bg-[#101018]/70 px-4 py-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.8" className="h-4 w-4 shrink-0">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj po tytule, lokalizacji lub kategorii…"
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="cursor-pointer text-zinc-600 hover:text-zinc-400 transition-colors"
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
                className="mt-6 inline-block rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
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
                <Link
                  key={event.id}
                  href={`/admin/events/${event.id}`}
                  className="group flex cursor-pointer gap-4 rounded-2xl border border-[#2a2640]/80 bg-[#101018]/70 p-4 transition-colors hover:border-violet-500/40 hover:bg-[#151022]/90"
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
                    <h2 className="truncate text-base font-semibold text-white group-hover:text-violet-200 transition-colors">
                      {event.title}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      {formatEventDateRangeShort(event.starts_at, event.ends_at)} · {event.location}
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
                    </div>
                  </div>

                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-2 h-5 w-5 shrink-0 text-zinc-600 group-hover:text-violet-400 transition-colors">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
