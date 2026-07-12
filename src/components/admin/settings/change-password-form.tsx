"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const inputCls = "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500/50 transition-colors";

const PASSWORD_RULES = [
  { id: "length",  label: "Min. 5 znaków",       test: (p: string) => p.length >= 5 },
  { id: "upper",   label: "Jedna wielka litera",  test: (p: string) => /[A-Z]/.test(p) },
  { id: "digit",   label: "Jedna cyfra",          test: (p: string) => /[0-9]/.test(p) },
  { id: "special", label: "Jeden znak specjalny", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const STRENGTH_COLORS = ["", "#ef4444", "#f97316", "#eab308", "#22c55e"];
const STRENGTH_LABELS = ["", "Słabe", "Słabe", "Średnie", "Silne"];

function getStrength(p: string) {
  return PASSWORD_RULES.filter((r) => r.test(p)).length;
}

export function ChangePasswordForm({ userEmail }: { userEmail?: string | null }) {
  const router   = useRouter();
  const supabase = createClient();

  const [current,  setCurrent]  = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState(false);
  const [isPending, startTransition] = useTransition();

  const strength      = getStrength(password);
  const passwordValid = strength === 4;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!passwordValid)       { setError("Hasło nie spełnia wymagań bezpieczeństwa."); return; }
    if (password !== confirm) { setError("Hasła nie są identyczne."); return; }

    startTransition(async () => {
      // Re-authenticate with current password first
      if (current) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email:    userEmail ?? "",
          password: current,
        });
        if (signInError) { setError("Obecne hasło jest nieprawidłowe."); return; }
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) { setError(updateError.message); return; }

      setSuccess(true);
      setCurrent(""); setPassword(""); setConfirm("");
    });
  }

  return (
    <div className="min-h-dvh bg-[#080810] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-lg items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="cursor-pointer rounded-full p-1.5 text-zinc-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h1 className="text-base font-semibold">Zmień hasło</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-6 py-8">
        {userEmail && (
          <p className="mb-6 text-sm text-zinc-500">Konto: <span className="text-zinc-300">{userEmail}</span></p>
        )}

        {success ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-10 text-center">
            <span className="text-4xl">✅</span>
            <p className="text-base font-semibold text-white">Hasło zostało zmienione!</p>
            <p className="text-sm text-zinc-500">Możesz teraz zalogować się nowym hasłem.</p>
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="cursor-pointer rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
            >
              Wróć do panelu
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Current password */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Obecne hasło</label>
              <input
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="••••••••"
                className={inputCls}
                autoComplete="current-password"
              />
            </div>

            {/* New password + strength */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Nowe hasło</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputCls}
                autoComplete="new-password"
              />
              {password.length > 0 && (
                <div className="mt-2 flex flex-col gap-1.5">
                  {/* Strength bar */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${(strength / 4) * 100}%`, background: STRENGTH_COLORS[strength] || "transparent" }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: STRENGTH_COLORS[strength] }}>{STRENGTH_LABELS[strength]}</span>
                    <span className="text-xs text-zinc-600">{strength}/4</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                    {PASSWORD_RULES.map((rule) => {
                      const ok = rule.test(password);
                      return (
                        <div key={rule.id} className="flex items-center gap-1.5">
                          <span className="text-[10px]" style={{ color: ok ? "#22c55e" : "#52525b" }}>{ok ? "✓" : "○"}</span>
                          <span className="text-[10px]" style={{ color: ok ? "#86efac" : "#52525b" }}>{rule.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Powtórz nowe hasło</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className={inputCls + (confirm && confirm !== password ? " border-red-500/50" : confirm && confirm === password ? " border-emerald-500/40" : "")}
                autoComplete="new-password"
              />
              {confirm && confirm !== password && <p className="mt-1 text-xs text-red-400">Hasła nie są identyczne</p>}
              {confirm && confirm === password   && <p className="mt-1 text-xs text-emerald-400">✓ Hasła są zgodne</p>}
            </div>

            {error && <p className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={isPending || !passwordValid || (!!confirm && confirm !== password)}
              className="cursor-pointer rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
            >
              {isPending ? "Zapisuję…" : "Zmień hasło"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
