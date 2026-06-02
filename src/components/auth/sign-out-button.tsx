"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ className = "mt-8" }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
    window.location.assign("/");
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={loading}
      className={`rounded-2xl border border-violet-500/30 px-6 py-3 text-sm font-medium text-violet-200 transition-colors hover:bg-violet-500/10 disabled:opacity-60 ${className}`}
    >
      {loading ? "Wylogowywanie…" : "Wyloguj"}
    </button>
  );
}
