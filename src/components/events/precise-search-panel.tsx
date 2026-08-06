"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  searchAllUsers,
  searchOrganizers,
  type SuggestedUser,
} from "@/app/profile/znajomi-actions";
import { usernameFromEmail } from "@/lib/profile/username";
import {
  getCategoryMeta,
  getEventCategories,
} from "@/lib/events/category-style";
import type { Event } from "@/types/event";
import type { PreciseSearchMode } from "@/components/events/home-header";

const MODE_META: Record<
  PreciseSearchMode,
  { title: string; placeholder: string; empty: string }
> = {
  user: {
    title: "Wyszukaj użytkownika",
    placeholder: "Imię, @username lub e-mail…",
    empty: "Brak użytkowników dla tej frazy.",
  },
  organizer: {
    title: "Wyszukaj organizatora",
    placeholder: "Nazwa organizatora lub @username…",
    empty: "Brak organizatorów dla tej frazy.",
  },
  event: {
    title: "Wyszukaj wydarzenie",
    placeholder: "Tytuł, miejsce lub kategoria…",
    empty: "Brak wydarzeń dla tej frazy.",
  },
};

function filterEvents(events: Event[], query: string): Event[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return events.filter((event) => {
    const cats = getEventCategories(event)
      .map((c) => getCategoryMeta(c).label)
      .join(" ");

    return (
      event.title.toLowerCase().includes(q) ||
      event.location.toLowerCase().includes(q) ||
      (event.location_name?.toLowerCase().includes(q) ?? false) ||
      cats.toLowerCase().includes(q) ||
      (event.description?.toLowerCase().includes(q) ?? false)
    );
  });
}

function personInitials(user: SuggestedUser): string {
  if (user.full_name?.trim()) {
    const parts = user.full_name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (user.email ?? "?").split("@")[0].slice(0, 2).toUpperCase();
}

function profileHref(user: SuggestedUser): string {
  const username =
    user.username?.trim() || usernameFromEmail(user.email, user.id);
  return `/profile/${encodeURIComponent(username)}`;
}

type PreciseSearchPanelProps = {
  mode: PreciseSearchMode;
  events: Event[];
  onClose: () => void;
};

export function PreciseSearchPanel({
  mode,
  events,
  onClose,
}: PreciseSearchPanelProps) {
  const meta = MODE_META[mode];
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(false);

  const eventResults = useMemo(
    () => (mode === "event" ? filterEvents(events, query) : []),
    [mode, events, query],
  );

  useEffect(() => {
    if (mode === "event") {
      setPeople([]);
      setLoading(false);
      return;
    }

    const q = query.trim();
    if (!q) {
      setPeople([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results =
          mode === "organizer"
            ? await searchOrganizers(q)
            : await searchAllUsers(q);
        setPeople(results);
      } catch {
        setPeople([]);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, mode]);

  const hasQuery = query.trim().length > 0;
  const resultCount =
    mode === "event" ? eventResults.length : people.length;
  const showEmpty = hasQuery && !loading && resultCount === 0;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#080810]">
      <div className="mx-auto flex h-full w-full max-w-md flex-col">
        <header className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij"
            className="rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h2 className="text-sm font-semibold text-white">{meta.title}</h2>
        </header>

        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 rounded-2xl border border-violet-500/30 bg-white/[0.04] px-4 py-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#a78bfa"
              strokeWidth="1.8"
              className="h-4 w-4 shrink-0"
              aria-hidden
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={meta.placeholder}
              autoFocus
              className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Wyczyść"
                className="text-zinc-600 hover:text-zinc-400"
              >
                ✕
              </button>
            )}
          </div>
          {hasQuery && (
            <p className="mt-2 px-1 text-xs text-zinc-500">
              {loading
                ? "Szukam…"
                : `${resultCount} ${
                    resultCount === 1
                      ? mode === "event"
                        ? "wynik"
                        : "osoba"
                      : mode === "event"
                        ? "wyników"
                        : "osób"
                  }`}
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {!hasQuery ? (
            <p className="py-10 text-center text-sm text-zinc-600">
              Zacznij wpisywać, żeby wyszukać.
            </p>
          ) : showEmpty ? (
            <p className="py-10 text-center text-sm text-zinc-600">{meta.empty}</p>
          ) : mode === "event" ? (
            <ul className="space-y-2">
              {eventResults.map((event) => {
                const cats = getEventCategories(event);
                const primary = getCategoryMeta(cats[0]);
                return (
                  <li key={event.id}>
                    <Link
                      href={`/events/${event.id}`}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06]"
                    >
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/10">
                        {event.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={event.cover_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-2xl">
                            {primary.emoji}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {event.title}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {event.location_name || event.location}
                        </p>
                        <p className="mt-0.5 text-[11px] text-zinc-600">
                          {cats.map((c) => getCategoryMeta(c).label).join(" · ")}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className="space-y-2">
              {people.map((person) => {
                const name =
                  person.full_name?.trim() ||
                  person.email?.split("@")[0] ||
                  "Użytkownik";
                const handle =
                  person.username?.trim() ||
                  usernameFromEmail(person.email, person.id);
                return (
                  <li key={person.id}>
                    <Link
                      href={profileHref(person)}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 transition-colors hover:bg-white/[0.06]"
                    >
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white/10">
                        {person.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={person.avatar_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500 to-indigo-700 text-xs font-bold">
                            {personInitials(person)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {name}
                        </p>
                        <p className="truncate text-xs text-zinc-500">@{handle}</p>
                        {mode === "organizer" && (
                          <p className="mt-0.5 text-[11px] text-violet-400/80">
                            Organizator
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
