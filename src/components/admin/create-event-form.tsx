"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { createEvent, updateEvent } from "@/app/admin/actions";
import { AccountMenu } from "@/components/admin/account-menu";
import { EventDatePicker } from "@/components/admin/event-date-picker";
import { EventTimePicker } from "@/components/admin/event-time-picker";
import { AchievementIcon } from "@/components/achievements/achievement-icon";
import { LocationPicker } from "@/components/events/location-picker";
import { uploadEventCover } from "@/lib/events/upload-event-cover";
import { getEventCategories } from "@/lib/events/category-style";
import { INTEREST_CATEGORIES } from "@/types/interests";
import { locationFromEvent } from "@/types/location";
import type { EventLocation } from "@/types/location";
import type { Event, EventCategory, EventRecurrence } from "@/types/event";
import type { EventAchievement } from "@/types/achievement";

function splitDateTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function defaultEndFromStart(startIso: string) {
  const end = new Date(startIso);
  end.setHours(end.getHours() + 2);
  return splitDateTime(end.toISOString());
}

function getInitialSchedule(existing?: Event | null) {
  if (!existing) {
    return {
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
    };
  }

  const start = splitDateTime(existing.starts_at);
  const end = existing.ends_at
    ? splitDateTime(existing.ends_at)
    : defaultEndFromStart(existing.starts_at);

  return {
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
  };
}

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

export function CreateEventForm({
  userEmail,
  event,
  achievements = [],
}: {
  userEmail?: string | null;
  event?: Event | null;
  achievements?: EventAchievement[];
}) {
  const isEdit = !!event;
  const initialSchedule = getInitialSchedule(event);

  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<EventCategory[]>(
    event ? getEventCategories(event) : [],
  );
  const [recurrence, setRecurrence] = useState<EventRecurrence>(
    event?.recurrence ?? "one_time",
  );
  const [startDate, setStartDate] = useState(initialSchedule.startDate);
  const [startTime, setStartTime] = useState(initialSchedule.startTime);
  const [endDate, setEndDate] = useState(initialSchedule.endDate);
  const [endTime, setEndTime] = useState(initialSchedule.endTime);
  const [selectedLocation, setSelectedLocation] = useState<EventLocation | null>(
    event ? locationFromEvent(event) : null,
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(event?.cover_url ?? null);
  const [coverRemoved, setCoverRemoved] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"save" | "badge" | null>(
    null,
  );
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
    setCoverRemoved(false);
  }

  function clearCover() {
    setCoverFile(null);
    setCoverPreview(null);
    setCoverRemoved(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function toggleCategory(id: EventCategory) {
    setCategories((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }

  function readFormFields(form: HTMLFormElement) {
    const formData = new FormData(form);
    return {
      title: String(formData.get("title") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      startDateValue: startDate || String(formData.get("startDate") ?? ""),
      startTimeValue: startTime || String(formData.get("startTime") ?? ""),
      endDateValue: endDate || String(formData.get("endDate") ?? ""),
      endTimeValue: endTime || String(formData.get("endTime") ?? ""),
    };
  }

  function validateBeforeSave(fields: ReturnType<typeof readFormFields>) {
    if (categories.length === 0) {
      return "Wybierz co najmniej jedną kategorię (maks. 2).";
    }
    if (!fields.title) {
      return "Podaj tytuł wydarzenia.";
    }
    if (
      !fields.startDateValue ||
      !fields.startTimeValue ||
      !fields.endDateValue ||
      !fields.endTimeValue
    ) {
      return "Podaj datę i godzinę rozpoczęcia oraz zakończenia.";
    }
    if (!selectedLocation) {
      return "Wybierz lokalizację z listy podpowiedzi Google.";
    }

    const startsAt = new Date(`${fields.startDateValue}T${fields.startTimeValue}`);
    const endsAt = new Date(`${fields.endDateValue}T${fields.endTimeValue}`);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      return "Nieprawidłowa data lub godzina.";
    }
    if (endsAt <= startsAt) {
      return "Zakończenie musi być późniejsze niż rozpoczęcie.";
    }

    return null;
  }

  async function persistEvent(form: HTMLFormElement) {
    const fields = readFormFields(form);
    const validationError = validateBeforeSave(fields);
    if (validationError) throw new Error(validationError);

    let coverUrl: string | null | undefined = undefined;
    if (coverFile) {
      coverUrl = await uploadEventCover(coverFile);
    } else if (coverRemoved) {
      coverUrl = null;
    }

    const startsAt = new Date(`${fields.startDateValue}T${fields.startTimeValue}`);
    const endsAt = new Date(`${fields.endDateValue}T${fields.endTimeValue}`);

    const payload = {
      title: fields.title,
      description: fields.description || undefined,
      category: categories[0],
      categories,
      recurrence,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      location: selectedLocation!.location,
      location_name: selectedLocation!.location_name ?? undefined,
      place_id: selectedLocation!.place_id ?? undefined,
      latitude: selectedLocation!.latitude,
      longitude: selectedLocation!.longitude,
    };

    if (isEdit && event) {
      await updateEvent({
        ...payload,
        id: event.id,
        cover_url: coverUrl,
      });
      return event.id;
    }

    const { id } = await createEvent({
      ...payload,
      cover_url: typeof coverUrl === "string" ? coverUrl : undefined,
    });
    return id;
  }

  function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setMessage(null);
    setError(null);
    setPendingAction("save");

    const form = formEvent.currentTarget;
    startTransition(async () => {
      try {
        await persistEvent(form);
        // Hard navigation avoids stuck "Zapisywanie…" on Vercel soft nav
        window.location.href = "/admin/events";
      } catch (err) {
        setPendingAction(null);
        setError(
          err instanceof Error
            ? err.message
            : isEdit
              ? "Nie udało się zapisać zmian."
              : "Nie udało się utworzyć wydarzenia.",
        );
      }
    });
  }

  function handleAddBadge() {
    setMessage(null);
    setError(null);
    setPendingAction("badge");

    const form = formRef.current;
    if (!form) return;

    startTransition(async () => {
      try {
        const id = await persistEvent(form);
        window.location.href = `/admin/events/${id}/achievements/new?returnTo=event`;
      } catch (err) {
        setPendingAction(null);
        setError(
          err instanceof Error
            ? err.message
            : "Uzupełnij wydarzenie, zanim dodasz odznakę.",
        );
      }
    });
  }

  return (
    <div className="min-h-dvh w-full bg-[radial-gradient(ellipse_at_top,_#2a1845_0%,_#12101a_38%,_#080810_100%)] text-white">
      <div className="mx-auto flex w-full max-w-2xl flex-col px-4 pb-14 pt-8 sm:px-6">
        <div className="mb-10 flex items-start justify-between gap-4">
          <h1 className="text-[2.5rem] font-bold leading-tight">
            {isEdit ? "Edytuj wydarzenie" : "Utwórz wydarzenie"}
          </h1>
          <AccountMenu userEmail={userEmail} />
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex flex-col gap-8"
        >
          <div>
            <label className={labelClassName} htmlFor="cover">
              Okładka wydarzenia
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
                    Dodaj zdjęcie okładki
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
              Tytuł wydarzenia
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              defaultValue={event?.title ?? ""}
              placeholder="np. Neon Pulse Festival"
              className={fieldClassName}
              disabled={isPending}
            />
          </div>

          <div>
            <label htmlFor="description" className={labelClassName}>
              Opis
            </label>
            <p className="mb-3 text-sm text-zinc-500">
              Napisz, o czym jest wydarzenie — kto powinien przyjść i czego się spodziewać.
            </p>
            <textarea
              id="description"
              name="description"
              rows={5}
              defaultValue={event?.description ?? ""}
              placeholder="np. Keynote dla developerów, live dema i networking…"
              className={`${fieldClassName} resize-none`}
              disabled={isPending}
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className={labelClassName}>Kategoria</span>
              <span className="text-sm text-zinc-500">
                {categories.length}/2 wybrane
              </span>
            </div>
            <p className="mb-3 text-sm text-zinc-500">
              Wybierz 1 lub 2 kategorie. Kliknij ponownie, aby odznaczyć.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {INTEREST_CATEGORIES.map((item) => {
                const isSelected = categories.includes(item.id);
                const isDisabled = !isSelected && categories.length >= 2;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleCategory(item.id)}
                    disabled={isPending || isDisabled}
                    className={`relative flex h-[142px] flex-col items-center justify-center gap-2.5 rounded-[20px] border transition-all disabled:opacity-40 ${
                      isSelected
                        ? "border-violet-500 bg-[#151022]/90 shadow-[0_0_20px_rgba(139,92,246,0.25)]"
                        : "border-[#2a2640]/80 bg-[#101018]/70 hover:border-[#3a3650]"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 text-xs font-bold text-white">
                        {categories.indexOf(item.id) + 1}
                      </span>
                    )}
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

          <div>
            <span className={labelClassName}>Typ wydarzenia</span>
            <p className="mb-3 text-sm text-zinc-500">
              Jednorazowe — pojedyncze wydarzenie. Cykliczne — powtarzające się regularnie.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRecurrence("one_time")}
                disabled={isPending}
                className={`flex h-[120px] flex-col items-center justify-center gap-2 rounded-[20px] border transition-all ${
                  recurrence === "one_time"
                    ? "border-violet-500 bg-[#151022]/90 shadow-[0_0_20px_rgba(139,92,246,0.25)]"
                    : "border-[#2a2640]/80 bg-[#101018]/70 hover:border-[#3a3650]"
                }`}
              >
                <span className="text-4xl leading-none" aria-hidden>
                  📅
                </span>
                <span className="text-lg font-medium text-white">Jednorazowe</span>
              </button>
              <button
                type="button"
                onClick={() => setRecurrence("recurring")}
                disabled={isPending}
                className={`flex h-[120px] flex-col items-center justify-center gap-2 rounded-[20px] border transition-all ${
                  recurrence === "recurring"
                    ? "border-violet-500 bg-[#151022]/90 shadow-[0_0_20px_rgba(139,92,246,0.25)]"
                    : "border-[#2a2640]/80 bg-[#101018]/70 hover:border-[#3a3650]"
                }`}
              >
                <span className="text-4xl leading-none" aria-hidden>
                  🔁
                </span>
                <span className="text-lg font-medium text-white">Cykliczne</span>
              </button>
            </div>
          </div>

          <div>
            <span className={labelClassName}>Termin wydarzenia</span>
            <p className="mb-4 text-sm text-zinc-500">
              Podaj, od kiedy do kiedy trwa wydarzenie.
            </p>

            <p className="mb-2 text-sm font-semibold text-zinc-300">Od</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="mb-2 block text-sm text-zinc-500">
                  Data
                </label>
                <EventDatePicker
                  id="startDate"
                  name="startDate"
                  disabled={isPending}
                  value={startDate}
                  onChange={setStartDate}
                />
              </div>
              <div>
                <label htmlFor="startTime" className="mb-2 block text-sm text-zinc-500">
                  Godzina
                </label>
                <EventTimePicker
                  id="startTime"
                  name="startTime"
                  disabled={isPending}
                  value={startTime}
                  onChange={setStartTime}
                />
              </div>
            </div>

            <p className="mb-2 mt-5 text-sm font-semibold text-zinc-300">Do</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="endDate" className="mb-2 block text-sm text-zinc-500">
                  Data
                </label>
                <EventDatePicker
                  id="endDate"
                  name="endDate"
                  disabled={isPending}
                  value={endDate}
                  onChange={setEndDate}
                />
              </div>
              <div>
                <label htmlFor="endTime" className="mb-2 block text-sm text-zinc-500">
                  Godzina
                </label>
                <EventTimePicker
                  id="endTime"
                  name="endTime"
                  disabled={isPending}
                  value={endTime}
                  onChange={setEndTime}
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="location" className={labelClassName}>
              Lokalizacja
            </label>
            <p className="mb-3 text-sm text-zinc-500">
              Wpisz nazwę miejsca, adres, plac lub budynek i wybierz z listy Google.
            </p>
            <LocationPicker
              value={selectedLocation}
              onChange={setSelectedLocation}
              disabled={isPending}
              initialLabel={event?.location}
              variant="admin"
            />
          </div>

          <div>
            <label className={`${labelClassName} flex items-center gap-2`}>
              <span className="text-xl" aria-hidden>
                🏆
              </span>
              Odznaki (opcjonalne)
            </label>
            <p className="mb-3 text-sm text-zinc-500">
              {isEdit
                ? achievements.length > 0
                  ? "Przypisane odznaki poniżej. Możesz dodać kolejną albo otworzyć listę."
                  : "Otwórz kreator odznaki — po zapisaniu wrócisz tutaj i zobaczysz ją na liście."
                : "Wypełnij wydarzenie, potem Dodaj odznakę. Przejdziesz do kreatora i wrócisz z odznaką na liście."}
            </p>

            {isEdit && event && achievements.length > 0 ? (
              <ul className="mb-4 space-y-2">
                {achievements.map((badge) => (
                  <li key={badge.id}>
                    <Link
                      href={`/admin/events/${event.id}/achievements/${badge.id}`}
                      className="flex items-center gap-3 rounded-2xl border border-[#2a2640]/80 bg-[#0c0c14] px-4 py-3 transition-colors hover:border-violet-500/40"
                    >
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          background: badge.background,
                          boxShadow: `0 0 12px ${badge.color}33`,
                        }}
                      >
                        <AchievementIcon
                          icon={badge.icon}
                          size={22}
                          color={badge.color}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-white">
                          {badge.name}
                        </span>
                        <span className="mt-0.5 block truncate text-sm text-zinc-500">
                          {badge.description}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          badge.status === "active"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-zinc-500/20 text-zinc-400"
                        }`}
                      >
                        {badge.status === "active" ? "Aktywna" : "Wyłączona"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleAddBadge}
                disabled={isPending}
                className="flex-1 rounded-[20px] border border-violet-500/40 bg-violet-500/15 px-5 py-4.5 text-left text-lg font-medium text-violet-200 transition-colors hover:bg-violet-500/25 disabled:opacity-60"
              >
                {pendingAction === "badge"
                  ? "Przechodzę do kreatora…"
                  : "+ Dodaj odznakę"}
              </button>
              {isEdit && event ? (
                <Link
                  href={`/admin/events/${event.id}/achievements`}
                  className="flex-1 rounded-[20px] border border-[#2a2640]/80 bg-[#101018]/70 px-5 py-4.5 text-left text-lg text-zinc-300 transition-colors hover:border-violet-500/40 hover:text-white"
                >
                  {achievements.length > 0
                    ? `Zarządzaj (${achievements.length})`
                    : "Lista odznak"}
                </Link>
              ) : null}
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 h-16 w-full rounded-[20px] bg-gradient-to-r from-blue-500 to-violet-600 text-xl font-semibold text-white shadow-[0_0_24px_rgba(99,102,241,0.35)] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending
              ? pendingAction === "badge"
                ? "Zapisuję i otwieram kreator…"
                : "Zapisywanie…"
              : isEdit
                ? "Zapisz zmiany"
                : "Utwórz wydarzenie"}
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
