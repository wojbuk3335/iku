"use client";

import { useRef, useState, useTransition } from "react";
import { createEvent } from "@/app/admin/actions";
import { EventDatePicker } from "@/components/admin/event-date-picker";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { uploadEventCover } from "@/lib/events/upload-event-cover";
import { INTEREST_CATEGORIES } from "@/types/interests";
import type { EventCategory } from "@/types/event";

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
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<EventCategory | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCoverChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError(null);

    if (!file) {
      setCoverFile(null);
      setCoverPreview(null);
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function clearCover() {
    setCoverFile(null);
    setCoverPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!category) {
      setError("Wybierz kategorię.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "");
    const description = String(formData.get("description") ?? "");
    const date = String(formData.get("date") ?? "");
    const time = String(formData.get("time") ?? "");
    const location = String(formData.get("location") ?? "");

    if (!date || !time) {
      setError("Podaj datę i godzinę.");
      return;
    }

    const startsAt = new Date(`${date}T${time}`).toISOString();

    startTransition(async () => {
      try {
        let coverUrl: string | undefined;

        if (coverFile) {
          coverUrl = await uploadEventCover(coverFile);
        }

        const { id } = await createEvent({
          title,
          description: description || undefined,
          category,
          starts_at: startsAt,
          location,
          cover_url: coverUrl,
        });

        setMessage(`Wydarzenie utworzone (id: ${id.slice(0, 8)}…).`);
        setCategory(null);
        clearCover();
        formRef.current?.reset();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Nie udało się utworzyć wydarzenia.",
        );
      }
    });
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

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex flex-col gap-8"
        >
          <div>
            <label className={labelClassName} htmlFor="cover">
              Event Cover
            </label>
            <input
              ref={fileInputRef}
              id="cover"
              name="cover"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleCoverChange}
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              className="relative flex h-56 w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-[20px] border border-dashed border-[#2a2640] bg-[#101018]/50 transition-colors hover:border-violet-500/40 disabled:opacity-60"
            >
              {coverPreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverPreview}
                    alt="Podgląd okładki"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40" />
                  <span className="relative text-lg font-medium text-white">
                    Zmień zdjęcie
                  </span>
                </>
              ) : (
                <>
                  <ImageIcon />
                  <span className="text-lg font-medium text-zinc-300">
                    Upload cover image
                  </span>
                  <span className="text-base text-zinc-500">
                    JPG, PNG, WEBP · max 5 MB
                  </span>
                </>
              )}
            </button>
            {coverPreview && (
              <button
                type="button"
                onClick={clearCover}
                disabled={isPending}
                className="mt-2 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
              >
                Usuń zdjęcie
              </button>
            )}
          </div>

          <div>
            <label htmlFor="title" className={labelClassName}>
              Event Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="Neon Pulse Festival"
              className={fieldClassName}
              disabled={isPending}
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
              disabled={isPending}
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
                    disabled={isPending}
                    className={`flex h-[142px] flex-col items-center justify-center gap-2.5 rounded-[20px] border transition-all disabled:opacity-60 ${
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
              <EventDatePicker id="date" name="date" disabled={isPending} />
            </div>
            <div>
              <label htmlFor="time" className={labelClassName}>
                Time
              </label>
              <input
                id="time"
                name="time"
                type="time"
                required
                className={fieldClassName}
                disabled={isPending}
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
                required
                placeholder="Brooklyn Warehouse"
                className={`${fieldClassName} pl-14`}
                disabled={isPending}
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
              disabled={isPending}
            >
              + Create Achievement
            </button>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 h-16 w-full rounded-[20px] bg-gradient-to-r from-blue-500 to-violet-600 text-xl font-semibold text-white shadow-[0_0_24px_rgba(99,102,241,0.35)] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Zapisywanie…" : "Create Event"}
          </button>

          {error && (
            <p className="text-center text-lg text-red-300">{error}</p>
          )}
          {message && (
            <p className="text-center text-lg text-violet-200/80">{message}</p>
          )}
        </form>
      </div>
    </div>
  );
}
