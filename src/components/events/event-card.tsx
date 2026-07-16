import Link from "next/link";
import { formatEventDateRangeShort } from "@/lib/events/format-event-date";
import { getCategoryMeta, getEventCategories } from "@/lib/events/category-style";
import type { Event } from "@/types/event";

export function EventCard({
  event,
  goingCount = 0,
  matchCount,
}: {
  event: Event;
  goingCount?: number;
  matchCount?: number;
}) {
  const eventCategories = getEventCategories(event);
  const primary = getCategoryMeta(eventCategories[0]);
  const { gradient } = primary;
  const dateLabel = formatEventDateRangeShort(event.starts_at, event.ends_at);

  return (
    <Link
      href={`/events/${event.id}`}
      className="group relative block w-full overflow-hidden rounded-3xl bg-zinc-900"
      style={{ aspectRatio: "4/3" }}
    >
      {event.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.cover_url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <span className="text-7xl opacity-80" aria-hidden>{primary.emoji}</span>
        </div>
      )}

      {/* gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      {/* category badges */}
      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
        {eventCategories.map((cat) => {
          const meta = getCategoryMeta(cat);
          return (
            <span
              key={cat}
              className="rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm"
            >
              {meta.emoji} {meta.label}
            </span>
          );
        })}
      </div>

      {/* top-right badges */}
      {(matchCount !== undefined && matchCount > 0) || goingCount > 0 ? (
        <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
          {matchCount !== undefined && matchCount > 0 && (
            <span className="rounded-full bg-emerald-600/85 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {matchCount === 1 ? "1 dopasowanie" : `${matchCount} dopasowania`}
            </span>
          )}
          {goingCount > 0 && (
            <span className="rounded-full bg-violet-600/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {goingCount === 1 ? "1 idzie" : `${goingCount} os. idzie`}
            </span>
          )}
        </div>
      ) : null}

      {/* info */}
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h2 className="line-clamp-2 text-xl font-bold leading-snug text-white">
          {event.title}
        </h2>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-300/90">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 shrink-0">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {dateLabel}
          <span className="text-zinc-500">·</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 shrink-0">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          {event.location}
        </p>
      </div>
    </Link>
  );
}
