import Link from "next/link";
import { formatEventDate } from "@/lib/events/format-event-date";
import { getCategoryMeta } from "@/lib/events/category-style";
import type { Event } from "@/types/event";

export function EventCard({
  event,
  goingCount = 0,
}: {
  event: Event;
  goingCount?: number;
}) {
  const { emoji, gradient } = getCategoryMeta(event.category);
  const dateLabel = formatEventDate(event.starts_at);

  return (
    <Link
      href={`/events/${event.id}`}
      className="group relative block aspect-[3/4] overflow-hidden rounded-2xl bg-zinc-900"
    >
      {event.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.cover_url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}
        >
          <span className="text-4xl opacity-80" aria-hidden>
            {emoji}
          </span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10" />

      {goingCount > 0 && (
        <div className="absolute inset-x-2 bottom-[3.25rem]">
          <span className="inline-block rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-violet-200 backdrop-blur-sm">
            {goingCount === 1 ? "1 idzie" : `${goingCount} os. idzie`}
          </span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <h2 className="line-clamp-2 text-[11px] font-bold leading-tight text-white">
          {event.title}
        </h2>
        <p className="mt-1 truncate text-[10px] text-zinc-300/90">
          {dateLabel} · {event.location}
        </p>
      </div>
    </Link>
  );
}
