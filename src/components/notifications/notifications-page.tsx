"use client";

import { useEffect, useState, useTransition } from "react";
import { markAllRead, markOneRead, seedSampleNotifications } from "@/app/notifications/actions";
import type { Notification, NotificationType } from "@/app/notifications/actions";
import { BottomNav } from "@/components/events/bottom-nav";
import { createClient } from "@/lib/supabase/client";

// ─── Icon per type ────────────────────────────────────────────────────────────
function NotifIcon({ type }: { type: NotificationType }) {
  const base = "flex h-10 w-10 shrink-0 items-center justify-center rounded-full";

  switch (type) {
    case "event_reminder":
      return (
        <span className={`${base} bg-red-500/15`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" className="h-5 w-5">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
          </svg>
        </span>
      );
    case "new_follower":
    case "unfollowed":
    case "friend_attending":
    case "friend_interested":
      return (
        <span className={`${base} bg-blue-500/15`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8" className="h-5 w-5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </span>
      );
    case "new_event":
      return (
        <span className={`${base} bg-violet-500/15`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.8" className="h-5 w-5">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinejoin="round"/>
          </svg>
        </span>
      );
    case "badge_unlocked":
    case "friend_badge":
      return (
        <span className={`${base} bg-amber-500/15`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" className="h-5 w-5">
            <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" strokeLinejoin="round"/>
          </svg>
        </span>
      );
    case "event_invitation":
      return (
        <span className={`${base} bg-emerald-500/15`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" className="h-5 w-5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </span>
      );
    case "nearby_event":
      return (
        <span className={`${base} bg-rose-500/15`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="1.8" className="h-5 w-5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
        </span>
      );
    default:
      return (
        <span className={`${base} bg-zinc-700`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.8" className="h-5 w-5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </span>
      );
  }
}

// ─── Relative time ────────────────────────────────────────────────────────────
function relativeTime(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)           return "teraz";
  if (diff < 3600)         return `${Math.floor(diff / 60)} min temu`;
  if (diff < 86400)        return `${Math.floor(diff / 3600)}h temu`;
  if (diff < 86400 * 7)    return `${Math.floor(diff / 86400)} dni temu`;
  return new Date(dateStr).toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

// ─── Main component ───────────────────────────────────────────────────────────
export function NotificationsPage({
  notifications: initial,
  userId,
}: {
  notifications: Notification[];
  userId: string;
}) {
  const [items, setItems] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function refreshFromServer() {
      const { data } = await supabase
        .from("notifications")
        .select("id, type, title, body, is_read, created_at, metadata")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (cancelled || !data) return;

      setItems((prev) => {
        const same =
          prev.length === data.length &&
          prev.every((n, i) => n.id === data[i].id && n.is_read === data[i].is_read);
        return same ? prev : (data as Notification[]);
      });
    }

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void refreshFromServer();
        },
      )
      .subscribe();

    // Fallback: działa między komputerami nawet bez włączonego Realtime
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshFromServer();
    }, 2500);

    const onFocus = () => void refreshFromServer();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      window.removeEventListener("focus", onFocus);
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const unreadCount = items.filter((n) => !n.is_read).length;

  function handleMarkAll() {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    startTransition(() => { markAllRead(); });
  }

  function handleMarkOne(id: string) {
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    startTransition(() => { markOneRead(id); });
  }

  async function handleSeed() {
    setSeeding(true);
    await seedSampleNotifications();
    window.location.reload();
  }

  return (
    <div className="mx-auto min-h-dvh max-w-2xl bg-[#080810] pb-24 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pb-2 pt-5">
        <h1 className="text-base font-semibold">Powiadomienia</h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={isPending}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
          >
            Oznacz jako przeczytane
          </button>
        )}
      </header>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="flex flex-col items-center gap-4 pt-24 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5" className="h-8 w-8">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-zinc-400">Brak powiadomień</p>
          <p className="text-xs text-zinc-600">Tutaj pojawią się powiadomienia o wydarzeniach, obserwujących i odznakach.</p>
          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding}
            className="mt-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {seeding ? "Ładowanie..." : "Dodaj przykładowe powiadomienia"}
          </button>
        </div>
      )}

      {/* Notification list */}
      {items.length > 0 && (
        <ul className="mt-2 divide-y divide-white/5">
          {items.map((notif) => (
            <li key={notif.id}>
              <button
                type="button"
                onClick={() => !notif.is_read && handleMarkOne(notif.id)}
                className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors ${
                  notif.is_read ? "bg-transparent" : "bg-blue-500/5 hover:bg-blue-500/10"
                }`}
              >
                <NotifIcon type={notif.type} />

                <div className="min-w-0 flex-1">
                  <p className={`text-sm leading-snug ${notif.is_read ? "text-zinc-400" : "text-white font-medium"}`}>
                    {notif.title}
                  </p>
                  {notif.body && (
                    <p className="mt-0.5 text-xs text-zinc-600 line-clamp-2">{notif.body}</p>
                  )}
                  <p className="mt-1 text-xs text-zinc-600">{relativeTime(notif.created_at)}</p>
                </div>

                {!notif.is_read && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <BottomNav activePage="notifications" />
    </div>
  );
}
