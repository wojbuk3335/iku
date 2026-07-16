"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createEvent } from "@/app/events/actions";
import { LocationPicker } from "@/components/events/location-picker";
import { INTEREST_CATEGORIES } from "@/types/interests";
import type { EventLocation } from "@/types/location";
import type { EventCategory } from "@/types/event";

export function CreateEventForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<EventLocation | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function toggleCategory(id: EventCategory) {
    setCategories((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }

  async function handleSubmit() {
    if (!title.trim() || categories.length === 0 || !date || !time || !endDate || !endTime) {
      setError("Wypełnij wszystkie wymagane pola i wybierz 1–2 kategorie.");
      return;
    }

    if (!selectedLocation) {
      setError("Wybierz lokalizację z listy podpowiedzi Google.");
      return;
    }

    const startsAt = new Date(`${date}T${time}:00`);
    const endsAt = new Date(`${endDate}T${endTime}:00`);
    if (endsAt <= startsAt) {
      setError("Zakończenie musi być późniejsze niż rozpoczęcie.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      let cover_url: string | undefined;

      if (coverFile) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const ext = coverFile.name.split(".").pop();
          const path = `${user.id}/${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("event-covers")
            .upload(path, coverFile, { upsert: true });
          if (!upErr) {
            const { data: urlData } = supabase.storage
              .from("event-covers")
              .getPublicUrl(path);
            cover_url = urlData.publicUrl;
          }
        }
      }

      const starts_at = startsAt.toISOString();
      const ends_at = endsAt.toISOString();
      const eventId = await createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        category: categories[0],
        categories,
        starts_at,
        ends_at,
        location: selectedLocation.location,
        location_name: selectedLocation.location_name ?? undefined,
        place_id: selectedLocation.place_id ?? undefined,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        cover_url,
      });

      router.push(`/events/${eventId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się utworzyć wydarzenia.");
    } finally {
      setSubmitting(false);
    }
  }

  const isValid = title.trim() && categories.length > 0 && date && time && endDate && endTime && selectedLocation;

  return (
    <div className="mx-auto min-h-dvh max-w-2xl bg-[#080810] pb-10 text-white">
      {/* Header */}
      <header className="flex items-center px-4 pb-2 pt-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="mr-4 rounded-full p-1.5 text-zinc-400 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 className="flex-1 text-center text-base font-semibold">Utwórz wydarzenie</h1>
        <div className="w-8" />
      </header>

      <div className="space-y-5 px-4 pt-4">

        {/* Cover image */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Event Cover</label>
          <label className="relative block cursor-pointer overflow-hidden rounded-2xl border border-dashed border-zinc-700 bg-white/5 hover:border-zinc-500 transition-colors">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleCoverChange}
            />
            {coverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverPreview} alt="Cover" className="h-44 w-full object-cover" />
            ) : (
              <div className="flex h-44 flex-col items-center justify-center gap-2 text-zinc-600">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <p className="text-sm">Upload cover image</p>
                <p className="text-xs text-zinc-700">Recommended: 1920×080</p>
              </div>
            )}
          </label>
        </div>

        {/* Title */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Event Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Neon Pulse Festival"
            maxLength={100}
            className="w-full rounded-xl border border-zinc-800 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell people what your event is about..."
            maxLength={1000}
            rows={4}
            className="w-full resize-none rounded-xl border border-zinc-800 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Category */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-400">Category</label>
            <span className="text-xs text-zinc-600">{categories.length}/2</span>
          </div>
          <p className="mb-2 text-xs text-zinc-600">Wybierz 1 lub 2 kategorie</p>
          <div className="grid grid-cols-3 gap-2">
            {INTEREST_CATEGORIES.map((cat) => {
              const isSelected = categories.includes(cat.id);
              const isDisabled = !isSelected && categories.length >= 2;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  disabled={isDisabled}
                  className="relative flex flex-col items-center gap-1.5 rounded-2xl border py-3 transition-colors disabled:opacity-40"
                  style={{
                    borderColor: isSelected ? "#3b82f6" : "rgba(255,255,255,0.08)",
                    background: isSelected ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.04)",
                  }}
                >
                  {isSelected && (
                    <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white">
                      {categories.indexOf(cat.id) + 1}
                    </span>
                  )}
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-xs text-zinc-300">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Schedule */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Termin wydarzenia</label>
          <p className="mb-3 text-xs text-zinc-600">Od kiedy do kiedy trwa wydarzenie.</p>

          <p className="mb-1.5 text-xs font-medium text-zinc-500">Od</p>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
            />
          </div>

          <p className="mb-1.5 text-xs font-medium text-zinc-500">Do</p>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Lokalizacja</label>
          <LocationPicker
            value={selectedLocation}
            onChange={setSelectedLocation}
            disabled={submitting}
            variant="compact"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 py-4 text-sm font-semibold text-white shadow-lg transition-opacity disabled:opacity-50 hover:opacity-90 active:scale-[0.98]"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Tworzenie...
            </span>
          ) : (
            "Create Event"
          )}
        </button>

      </div>
    </div>
  );
}
