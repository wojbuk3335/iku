"use client";

import { useState } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/events/bottom-nav";
import type {
  ActivityItem,
  HistoryEventBucket,
  HistoryEventItem,
  UserHistory,
} from "@/lib/profile/get-history";

const EVENT_TABS: Array<{ key: HistoryEventBucket; label: string }> = [
  { key: "upcoming", label: "Nadchodzące" },
  { key: "past", label: "Odbyte" },
  { key: "saved", label: "Zapisane" },
  { key: "cancelled", label: "Anulowane" },
];

const MONTHS = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return `${fmtDate(iso)}, ${d.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function activityIcon(type: ActivityItem["type"]) {
  switch (type) {
    case "joined_event":
      return "🎫";
    case "saved_event":
      return "🔖";
    case "followed_user":
      return "👤";
    case "created_post":
      return "✏️";
    case "created_comment":
      return "💬";
    case "earned_badge":
    case "earned_event_badge":
      return "🏅";
    default:
      return "•";
  }
}

function EventCard({ event }: { event: HistoryEventItem }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06]"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/10">
        {event.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.coverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xl">🎪</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{event.title}</p>
        <p className="mt-0.5 text-xs text-amber-400">{fmtDate(event.startsAt)}</p>
        {event.organizerName && (
          <p className="mt-0.5 truncate text-xs text-zinc-500">
            Org. {event.organizerName}
          </p>
        )}
        <p className="mt-0.5 truncate text-xs text-blue-400">{event.location}</p>
        {event.badges.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {event.badges.map((b) => (
              <span
                key={b.id}
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  background: `${b.color}22`,
                  color: b.color,
                }}
              >
                {b.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export function HistoriaPage({ history }: { history: UserHistory }) {
  const [mainTab, setMainTab] = useState<"events" | "activity">("events");
  const [eventTab, setEventTab] = useState<HistoryEventBucket>("upcoming");

  const eventList = history.events[eventTab];

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-[#080810] pb-28 text-white">
      <header className="flex items-center justify-between px-4 pb-2 pt-5">
        <Link
          href="/settings"
          className="text-zinc-400 transition-colors hover:text-white"
          aria-label="Wróć do ustawień"
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
        <span className="text-sm font-medium text-zinc-300">Historia</span>
        <div className="w-6" />
      </header>

      <div className="mx-4 mt-3 flex gap-1 rounded-[14px] border border-white/10 p-1">
        {(
          [
            { key: "events" as const, label: "Wydarzenia" },
            { key: "activity" as const, label: "Aktywność" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setMainTab(tab.key)}
            className={`flex-1 cursor-pointer rounded-[10px] py-2 text-xs font-semibold transition-colors ${
              mainTab === tab.key
                ? "bg-violet-600 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <main className="px-4 pt-4">
        {mainTab === "events" ? (
          <div className="space-y-4">
            <p className="text-xs leading-relaxed text-zinc-500">
              Archiwum Twoich wydarzeń — nadchodzące, odbyte, zapisane i anulowane.
            </p>

            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {EVENT_TABS.map((tab) => {
                const count = history.events[tab.key].length;
                const active = eventTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setEventTab(tab.key)}
                    className={`shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "border-violet-500/60 bg-violet-500/20 text-violet-200"
                        : "border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {tab.label} ({count})
                  </button>
                );
              })}
            </div>

            {eventList.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-12 text-center">
                <p className="text-sm text-zinc-500">Brak wydarzeń w tej sekcji.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {eventList.map((event) => (
                  <EventCard key={`${event.bucket}-${event.id}-${event.participationStatus}`} event={event} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs leading-relaxed text-zinc-500">
              Chronologiczna oś czasu Twojej aktywności na IKU.
            </p>

            {history.activity.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-12 text-center">
                <p className="text-sm text-zinc-500">Brak aktywności.</p>
              </div>
            ) : (
              <ol className="relative space-y-0 border-l border-white/10 pl-5">
                {history.activity.map((item) => {
                  const content = (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06]">
                      <div className="flex items-start gap-2">
                        <span className="text-base leading-none" aria-hidden>
                          {activityIcon(item.type)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white">{item.title}</p>
                          {item.body && (
                            <p className="mt-0.5 truncate text-xs text-zinc-400">{item.body}</p>
                          )}
                          <p className="mt-1 text-[11px] text-zinc-600">
                            {fmtDateTime(item.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );

                  return (
                    <li key={item.id} className="relative pb-3">
                      <span className="absolute -left-[1.4rem] top-4 h-2.5 w-2.5 rounded-full border-2 border-[#080810] bg-violet-500" />
                      {item.href ? (
                        <Link href={item.href} className="block">
                          {content}
                        </Link>
                      ) : (
                        content
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        )}
      </main>

      <BottomNav activePage="profile" />
    </div>
  );
}
