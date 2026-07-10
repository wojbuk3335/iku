import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const dynamic = "force-dynamic";

export default async function BlockedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let reason: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("blocked_reason")
      .eq("id", user.id)
      .single();
    reason = profile?.blocked_reason ?? null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#080810] px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" className="h-8 w-8">
          <circle cx="12" cy="12" r="10"/>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
      </div>

      <h1 className="text-xl font-bold text-white mb-2">Konto zablokowane</h1>
      <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
        Twoje konto zostało tymczasowo zablokowane przez administratora platformy IKU.
      </p>

      {reason && (
        <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 px-5 py-3 max-w-sm">
          <p className="text-xs text-zinc-400 mb-1 font-medium">Powód:</p>
          <p className="text-sm text-red-300">{reason}</p>
        </div>
      )}

      <p className="mt-6 text-xs text-zinc-600 max-w-xs leading-relaxed">
        Jeśli uważasz, że to pomyłka, skontaktuj się z nami pod adresem{" "}
        <span className="text-zinc-500">support@iku.app</span>
      </p>

      <SignOutButton className="mt-8 rounded-2xl border border-white/10 px-6 py-3 text-sm text-zinc-400 hover:text-white transition-colors" />
    </div>
  );
}
