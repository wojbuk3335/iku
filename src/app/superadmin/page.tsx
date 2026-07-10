import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const dynamic = "force-dynamic";

async function getPlatformStats() {
  const supabase = await createClient();
  const [
    { count: usersCount },
    { count: eventsCount },
    { count: creatorsCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "creator"),
  ]);

  return {
    users:    usersCount    ?? 0,
    events:   eventsCount   ?? 0,
    creators: creatorsCount ?? 0,
  };
}

export default async function SuperAdminPage() {
  const { user, profile } = await getSessionProfile();

  if (!user) redirect("/");
  if (profile?.role !== "admin") redirect("/events");

  const stats = await getPlatformStats();

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0a0a16] px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="h-4 w-4">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">IKU Admin</h1>
              <p className="text-xs text-zinc-500">Panel Administracyjny</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-medium text-violet-400">
              {profile?.full_name ?? profile?.email ?? "Admin"}
            </span>
            <SignOutButton className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:border-white/20 hover:text-white transition-colors" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="mt-1 text-sm text-zinc-500">Zarządzaj platformą IKU</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {[
            { label: "Użytkownicy",  value: stats.users,    icon: "👥", color: "blue" },
            { label: "Wydarzenia",   value: stats.events,   icon: "🎉", color: "violet" },
            { label: "Twórcy",       value: stats.creators, icon: "✨", color: "amber" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="mb-3 text-2xl">{stat.icon}</div>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="mt-1 text-sm text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              title: "Użytkownicy",
              desc: "Zarządzaj kontami, rolami i uprawnieniami użytkowników platformy.",
              icon: "👤",
              href: "/superadmin/users",
              badge: "Wkrótce",
            },
            {
              title: "Wydarzenia",
              desc: "Przeglądaj, moderuj i zarządzaj wszystkimi wydarzeniami na platformie.",
              icon: "🎪",
              href: "/superadmin/events",
              badge: "Wkrótce",
            },
            {
              title: "Odznaki",
              desc: "Zarządzaj systemem odznak i przyznawaj je ręcznie użytkownikom.",
              icon: "🏆",
              href: "/superadmin/badges",
              badge: "Wkrótce",
            },
            {
              title: "Ustawienia",
              desc: "Konfiguracja platformy, powiadomień i integracji.",
              icon: "⚙️",
              href: "/superadmin/settings",
              badge: "Wkrótce",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="relative rounded-2xl border border-white/10 bg-white/5 p-5 opacity-70"
            >
              <span className="absolute right-3 top-3 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                {card.badge}
              </span>
              <div className="mb-3 text-2xl">{card.icon}</div>
              <h3 className="text-sm font-semibold text-white">{card.title}</h3>
              <p className="mt-1 text-xs text-zinc-500 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-400">Szybkie akcje</h3>
          <div className="flex flex-wrap gap-3">
            <a
              href="/admin"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-300 hover:border-violet-500/50 hover:text-white transition-colors"
            >
              <span>✨</span> Panel Twórcy
            </a>
            <a
              href="/events"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-300 hover:border-blue-500/50 hover:text-white transition-colors"
            >
              <span>🏠</span> Panel Użytkownika
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
