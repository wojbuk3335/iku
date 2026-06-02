"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getRedirectPathAfterLogin } from "@/lib/auth/get-redirect-path";
import { createClient } from "@/lib/supabase/client";

const inputClassName =
  "w-full rounded-2xl border border-violet-500/20 bg-[#2a1845]/80 px-4 py-4 text-base text-white placeholder:text-violet-200/40 outline-none focus:border-violet-400/50";

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    if (password.length < 6) {
      setMessage("Hasło musi mieć co najmniej 6 znaków.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Hasła nie są identyczne.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Link wygasł. Wyślij reset hasła ponownie ze strony logowania.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const path = await getRedirectPathAfterLogin();
    router.push(path);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 flex w-full max-w-md flex-col gap-3">
      <input
        type="password"
        required
        minLength={6}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Nowe hasło (min. 6 znaków)"
        className={inputClassName}
        autoComplete="new-password"
      />
      <input
        type="password"
        required
        minLength={6}
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        placeholder="Powtórz nowe hasło"
        className={inputClassName}
        autoComplete="new-password"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-4 text-base font-medium text-white disabled:opacity-60"
      >
        {loading ? "Zapisywanie…" : "Ustaw hasło"}
      </button>
      {message && (
        <p className="text-center text-sm text-violet-200/80">{message}</p>
      )}
    </form>
  );
}
