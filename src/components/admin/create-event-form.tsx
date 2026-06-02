"use client";

import { useState } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { INTEREST_CATEGORIES } from "@/types/interests";

const fieldClassName =
  "w-full rounded-[20px] border border-[#2a2640]/80 bg-[#101018]/70 px-5 py-4.5 text-lg text-white outline-none placeholder:text-zinc-500 focus:border-violet-500/50";

const labelClassName = "mb-3 block text-base font-medium text-zinc-400";

function ImageIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-10 w-10 text-zinc-500"
      aria-hidden
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-6 w-6 shrink-0 text-zinc-500"
      aria-hidden
    >
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function CreateEventForm() {
  const [category, setCategory] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Formularz działa — zapis eventów dodamy w następnym kroku.");
  }

  return (
    <div className="min-h-dvh w-full bg-[radial-gradient(ellipse_at_top,_#2a1845_0%,_#12101a_38%,_#080810_100%)] text-white">
      <div className="mx-auto flex w-full max-w-2xl flex-col px-4 pb-14 pt-20 sm:px-6">
        <div className="mb-10 flex items-start justify-between gap-4">
          <h1 className="text-[2.5rem] font-bold leading-tight">
            Utwórz wydarzenie
          </h1>
          <SignOutButton className="mt-0 shrink-0" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div>
            <label className={labelClassName}>Event Cover</label>
            <button
              type="button"
              className="flex h-56 w-full flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-[#2a2640] bg-[#101018]/50 transition-colors hover:border-violet-500/40"
            >
              <ImageIcon />
              <span className="text-lg font-medium text-zinc-300">
                Upload cover image
              </span>
              <span className="text-base text-zinc-500">
                Recommended: 1920×1080
              </span>
            </button>
          </div>

          <div>
            <label htmlFor="title" className={labelClassName}>
              Event Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="Neon Pulse Festival"
              className={fieldClassName}
            />
          </div>

          <div>
            <label htmlFor="description" className={labelClassName}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              placeholder="Tell people what your event is about..."
              className={`${fieldClassName} resize-none`}
            />
          </div>

          <div>
            <span className={labelClassName}>Category</span>
            <div className="grid grid-cols-3 gap-3">
              {INTEREST_CATEGORIES.map((item) => {
                const isSelected = category === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id)}
                    className={`flex h-[142px] flex-col items-center justify-center gap-2.5 rounded-[20px] border transition-all ${
                      isSelected
                        ? "border-violet-500 bg-[#151022]/90 shadow-[0_0_20px_rgba(139,92,246,0.25)]"
                        : "border-[#2a2640]/80 bg-[#101018]/70 hover:border-[#3a3650]"
                    }`}
                  >
                    <span className="text-[3rem] leading-none" aria-hidden>
                      {item.emoji}
                    </span>
                    <span className="text-lg font-medium text-white">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className={labelClassName}>
                Date
              </label>
              <input
                id="date"
                name="date"
                type="date"
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="time" className={labelClassName}>
                Time
              </label>
              <input
                id="time"
                name="time"
                type="time"
                className={fieldClassName}
              />
            </div>
          </div>

          <div>
            <label htmlFor="location" className={labelClassName}>
              Location
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2">
                <PinIcon />
              </span>
              <input
                id="location"
                name="location"
                type="text"
                placeholder="Brooklyn Warehouse"
                className={`${fieldClassName} pl-14`}
              />
            </div>
          </div>

          <div>
            <label className={`${labelClassName} flex items-center gap-2`}>
              <span className="text-xl" aria-hidden>
                🏆
              </span>
              Achievements (Optional)
            </label>
            <button
              type="button"
              className="w-full rounded-[20px] border border-[#2a2640]/80 bg-[#101018]/70 px-5 py-4.5 text-left text-lg text-zinc-400 transition-colors hover:border-violet-500/40"
            >
              + Create Achievement
            </button>
          </div>

          <button
            type="submit"
            className="mt-2 h-16 w-full rounded-[20px] bg-gradient-to-r from-blue-500 to-violet-600 text-xl font-semibold text-white shadow-[0_0_24px_rgba(99,102,241,0.35)] transition-opacity hover:opacity-95"
          >
            Create Event
          </button>

          {message && (
            <p className="text-center text-lg text-violet-200/80">{message}</p>
          )}
        </form>
      </div>
    </div>
  );
}
