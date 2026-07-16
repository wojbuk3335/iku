"use client";

import { useEffect, useState } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";

export function AccountMenu({ userEmail }: { userEmail?: string | null }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (!(e.target as Element).closest("[data-account-menu]")) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative flex shrink-0 items-center gap-2" data-account-menu="">
      {userEmail && (
        <p className="text-sm text-zinc-400">{userEmail}</p>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
        title="Ustawienia konta"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#13111f] shadow-xl">
          {userEmail && (
            <div className="border-b border-white/10 px-4 py-3">
              <p className="text-xs text-zinc-500">Zalogowany jako</p>
              <p className="mt-0.5 break-all text-sm font-medium text-white">{userEmail}</p>
            </div>
          )}

          <div className="py-1.5">
            <button
              type="button"
              onClick={() => { setOpen(false); window.location.href = "/admin/settings/profile"; }}
              className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-zinc-500">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Edytuj profil
            </button>

            <button
              type="button"
              onClick={() => { setOpen(false); window.location.href = "/admin/settings/subscriptions"; }}
              className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-zinc-500">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
              Zarządzaj subskrypcjami
            </button>
          </div>

          <div className="border-t border-white/10 px-3 py-2">
            <SignOutButton className="w-full rounded-xl border border-red-500/20 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors" />
          </div>
        </div>
      )}
    </div>
  );
}
