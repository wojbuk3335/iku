"use client";

import { useRouter } from "next/navigation";

const PLANS = [
  {
    id: "free",
    name: "Darmowy",
    price: "0 zł / mies.",
    features: ["Do 3 wydarzeń miesięcznie", "Podstawowe statystyki", "Wsparcie email"],
    current: true,
    color: "border-white/10",
    badge: null,
  },
  {
    id: "pro",
    name: "Pro",
    price: "49 zł / mies.",
    features: ["Nielimitowane wydarzenia", "Zaawansowane statystyki", "Priorytetowe wsparcie", "Własny branding"],
    current: false,
    color: "border-violet-500/50",
    badge: "Popularny",
  },
  {
    id: "business",
    name: "Business",
    price: "199 zł / mies.",
    features: ["Wszystko z Pro", "API dostęp", "Dedykowany opiekun", "SLA 99.9%", "Faktury VAT"],
    current: false,
    color: "border-blue-500/30",
    badge: null,
  },
];

export function SubscriptionsPage({ userEmail }: { userEmail?: string | null }) {
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-[#080810] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="cursor-pointer rounded-full p-1.5 text-zinc-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h1 className="text-base font-semibold">Zarządzaj subskrypcjami</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {userEmail && (
          <p className="mb-6 text-sm text-zinc-500">Konto: <span className="text-zinc-300">{userEmail}</span></p>
        )}

        {/* Current plan banner */}
        <div className="mb-8 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-sm font-semibold text-white">Aktualny plan: <span className="text-emerald-400">Darmowy</span></p>
            <p className="text-xs text-zinc-500">Odnawia się automatycznie · Następne odnowienie: bezpłatny</p>
          </div>
        </div>

        {/* Plans */}
        <div className="grid gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-5 ${plan.color} ${plan.current ? "bg-violet-500/5" : "bg-white/[0.02]"}`}
            >
              {plan.badge && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-0.5 text-[10px] font-bold text-white">
                  {plan.badge}
                </span>
              )}
              {plan.current && (
                <span className="mb-3 w-fit rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                  Aktywny
                </span>
              )}
              <p className="text-base font-bold text-white">{plan.name}</p>
              <p className="mt-1 text-lg font-semibold text-violet-300">{plan.price}</p>
              <ul className="mt-4 flex flex-col gap-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-zinc-400">
                    <span className="mt-0.5 text-emerald-400">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={plan.current}
                className={`mt-6 cursor-pointer rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:cursor-default ${
                  plan.current
                    ? "border border-white/10 text-zinc-600"
                    : "bg-violet-600 text-white hover:bg-violet-500"
                }`}
              >
                {plan.current ? "Aktualny plan" : "Wybierz"}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-zinc-600">
          Masz pytania? Napisz do nas na <span className="text-violet-400">support@iku.pl</span>
        </p>
      </main>
    </div>
  );
}
