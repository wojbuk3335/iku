import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BottomNav } from "@/components/events/bottom-nav";
import { formatEventDate } from "@/lib/events/format-event-date";
import { getCategoryMeta } from "@/lib/events/category-style";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { createClient } from "@/lib/supabase/server";
import type { Event } from "@/types/event";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await getSessionProfile();

  if (!user) {
    redirect("/");
  }

  if (profile?.role === "admin") {
    redirect("/admin");
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select(
      "id, title, description, category, starts_at, location, cover_url, status, created_by, created_at, updated_at",
    )
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (!data) {
    notFound();
  }

  const event = data as Event;
  const { label, emoji, gradient } = getCategoryMeta(event.category);

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-[#080810] pb-28 text-white">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/5 bg-[#080810]/90 px-4 py-4 backdrop-blur-md">
        <Link
          href="/events"
          className="rounded-full p-1 text-zinc-300 transition-colors hover:text-white"
          aria-label="Wróć"
        >
          ←
        </Link>
        <h1 className="truncate text-base font-semibold">{event.title}</h1>
      </header>

      <div
        className={`relative aspect-[4/3] bg-gradient-to-br ${gradient} ${
          event.cover_url ? "" : "flex items-center justify-center"
        }`}
      >
        {event.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.cover_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-6xl" aria-hidden>
            {emoji}
          </span>
        )}
      </div>

      <main className="space-y-4 px-4 py-5">
        <div>
          <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs text-violet-200">
            {label}
          </span>
          <h2 className="mt-3 text-2xl font-bold">{event.title}</h2>
          <p className="mt-2 text-sm text-zinc-400">
            {formatEventDate(event.starts_at)} · {event.location}
          </p>
        </div>

        {event.description && (
          <p className="text-base leading-relaxed text-zinc-300">
            {event.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            className="rounded-2xl bg-violet-600 py-3 text-sm font-semibold"
          >
            Idę
          </button>
          <button
            type="button"
            className="rounded-2xl border border-white/10 py-3 text-sm font-semibold text-zinc-300"
          >
            Zapisz
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
