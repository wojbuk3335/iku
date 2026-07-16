"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEvent, updateEvent } from "@/app/admin/actions";
import { AccountMenu } from "@/components/admin/account-menu";
import { EventDatePicker } from "@/components/admin/event-date-picker";
import { LocationPicker } from "@/components/events/location-picker";
import { uploadEventCover } from "@/lib/events/upload-event-cover";
import { getEventCategories } from "@/lib/events/category-style";
import { INTEREST_CATEGORIES } from "@/types/interests";
import { locationFromEvent } from "@/types/location";
import type { EventLocation } from "@/types/location";
import type { Event, EventCategory, EventRecurrence } from "@/types/event";

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
}: {
  userEmail?: string | null;
  event?: Event | null;
}) {
  const router = useRouter();
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

  function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setMessage(null);
    setError(null);

    if (categories.length === 0) {
      setError("Wybierz co najmniej jedną kategorię (maks. 2).");
      return;
    }

    const formData = new FormData(formEvent.currentTarget);
    const title = String(formData.get("title") ?? "");
    const description = String(formData.get("description") ?? "");
    const startDateValue = startDate || String(formData.get("startDate") ?? "");
    const startTimeValue = startTime || String(formData.get("startTime") ?? "");
    const endDateValue = endDate || String(formData.get("endDate") ?? "");
    const endTimeValue = endTime || String(formData.get("endTime") ?? "");

    if (!startDateValue || !startTimeValue || !endDateValue || !endTimeValue) {
      setError("Podaj datę i godzinę rozpoczęcia oraz zakończenia.");
      return;
    }

    if (!selectedLocation) {
      setError("Wybierz lokalizację z listy podpowiedzi Google.");
      return;
    }

    const startsAt = new Date(`${startDateValue}T${startTimeValue}`);
    const endsAt = new Date(`${endDateValue}T${endTimeValue}`);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      setError("Nieprawidłowa data lub godzina.");
      return;
    }

    if (endsAt <= startsAt) {
      setError("Zakończenie musi być późniejsze niż rozpoczęcie.");
      return;
    }

    startTransition(async () => {
      try {
        let coverUrl: string | null | undefined = undefined;

        if (coverFile) {
          coverUrl = await uploadEventCover(coverFile);
        } else if (coverRemoved) {
          coverUrl = null;
        }

        const payload = {
          title,
          description: description || undefined,
          category: categories[0],
          categories,
          recurrence,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          location: selectedLocation.location,
          location_name: selectedLocation.location_name ?? undefined,
          place_id: selectedLocation.place_id ?? undefined,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        };

        if (isEdit && event) {
          await updateEvent({
            ...payload,
            id: event.id,
            cover_url: coverUrl,
          });
          router.push("/admin/events");
          return;
        }

        const { id } = await createEvent({
          ...payload,
          cover_url: typeof coverUrl === "string" ? coverUrl : undefined,
        });

        setMessage(`Wydarzenie utworzone (id: ${id.slice(0, 8)}…).`);
        setCategories([]);
        setRecurrence("one_time");
        setStartDate("");
        setStartTime("");
        setEndDate("");
        setEndTime("");
        setSelectedLocation(null);
        setCoverRemoved(false);
        clearCover();
        formRef.current?.reset();
      } catch (err) {
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
              defaultValue={event?.title ?? ""}
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
              defaultValue={event?.description ?? ""}
              placeholder="Tell people what your event is about..."
              className={`${fieldClassName} resize-none`}
              disabled={isPending}
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className={labelClassName}>Category</span>
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
                <input
                  id="startTime"
                  name="startTime"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={fieldClassName}
                  disabled={isPending}
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
                <input
                  id="endTime"
                  name="endTime"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={fieldClassName}
                  disabled={isPending}
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
            {isPending ? "Zapisywanie…" : isEdit ? "Zapisz zmiany" : "Utwórz wydarzenie"}
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
