"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCustomBadge } from "@/app/badges/create/actions";

// ─── Preset icons ────────────────────────────────────────────────────────────
type IconId = "star" | "moon" | "music" | "lightning" | "chart" | "calendar"
            | "compass" | "heart" | "shield" | "filter" | "map" | "zap" | "bookmark";

function PresetIcon({ id, size = 20, color = "currentColor" }: { id: IconId; size?: number; color?: string }) {
  const p = { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none" as const, stroke: color, strokeWidth: 1.5, width: size, height: size };
  switch (id) {
    case "star":     return <svg {...p}><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.52 4.674a1 1 0 00.95.69h4.915c.97 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.98 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.95-.69l1.52-4.674z" strokeLinejoin="round"/></svg>;
    case "moon":     return <svg {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinejoin="round"/></svg>;
    case "music":    return <svg {...p}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
    case "lightning":return <svg {...p}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinejoin="round"/></svg>;
    case "chart":    return <svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
    case "calendar": return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
    case "compass":  return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" strokeLinejoin="round"/></svg>;
    case "heart":    return <svg {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinejoin="round"/></svg>;
    case "shield":   return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinejoin="round"/></svg>;
    case "filter":   return <svg {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" strokeLinejoin="round"/></svg>;
    case "map":      return <svg {...p}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" strokeLinejoin="round"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>;
    case "zap":      return <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
    case "bookmark": return <svg {...p}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" strokeLinejoin="round"/></svg>;
  }
}

const PRESET_ICONS: IconId[] = ["star","moon","music","lightning","chart","calendar","compass","heart","shield","filter","map","zap","bookmark"];

const RARITIES = [
  { id: "Powszechna", color: "#3b82f6" },
  { id: "Rzadka",     color: "#06b6d4" },
  { id: "Epicka",     color: "#a855f7" },
  { id: "Legendarna", color: "#f59e0b" },
];

const UNLOCK_CONDITIONS = [
  { id: "event_participation", label: "Udział w wydarzeniu" },
  { id: "event_count",         label: "Liczba wydarzeń" },
  { id: "interactions",        label: "Interakcje (polubienia/komentarze)" },
  { id: "custom",              label: "Własny warunek" },
];

const VISIBILITIES = [
  { id: "public",     label: "Publiczna",        sub: "Widoczna dla wszystkich",  icon: "🌐" },
  { id: "event_only", label: "Tylko wydarzenie", sub: "Widoczna uczestnikam",     icon: "🎟️" },
  { id: "private",    label: "Prywatna",         sub: "Tylko dla ciebie",         icon: "🔒" },
];

const REWARDS = [
  { id: "none",           label: "Brak nagrody",   icon: "—" },
  { id: "discount",       label: "Zniżka",          icon: "%" },
  { id: "vip_access",     label: "Dostęp VIP",      icon: "⭐" },
  { id: "digital_reward", label: "Nagroda cyfrowa", icon: "🎁" },
];

function rarityColor(r: string) {
  return RARITIES.find((x) => x.id === r)?.color ?? "#3b82f6";
}

export function BadgeCreatorForm() {
  const router = useRouter();

  const [name, setName]           = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [fullDesc, setFullDesc]   = useState("");
  const [icon, setIcon]           = useState<IconId>("star");
  const [iconScale, setIconScale] = useState(100);
  const [rarity, setRarity]       = useState("Powszechna");
  const [unlock, setUnlock]       = useState("event_participation");
  const [visibility, setVisibility] = useState("public");
  const [reward, setReward]       = useState("none");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const previewSize = Math.round((iconScale / 100) * 32);

  async function handleSubmit() {
    if (!name.trim() || !shortDesc.trim()) {
      setError("Wypełnij nazwę i krótki opis odznaki.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createCustomBadge({
        name: name.trim(),
        short_description: shortDesc.trim(),
        full_description: fullDesc.trim() || undefined,
        icon,
        icon_scale: iconScale,
        rarity,
        unlock_condition: unlock,
        visibility,
        reward_type: reward,
      });
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd podczas tworzenia odznaki.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-[#080810] pb-10 text-white">
      {/* Header */}
      <header className="flex items-center px-4 pb-2 pt-5">
        <button type="button" onClick={() => router.back()} className="mr-4 rounded-full p-1.5 text-zinc-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 className="flex-1 text-center text-base font-semibold">Kreator odznak</h1>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !name.trim() || !shortDesc.trim()}
          className="rounded-2xl bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40 hover:bg-violet-500 transition-colors"
        >
          {submitting ? "..." : "Zapisz"}
        </button>
      </header>

      <div className="space-y-4 px-4 pt-4">

        {/* Live preview */}
        <div className="rounded-2xl bg-white/5 p-4">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-blue-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            Podgląd na żywo
          </p>
          <div className="flex items-center gap-4">
            {/* Badge tile preview */}
            <div
              className="relative flex h-[72px] w-[72px] shrink-0 flex-col items-center justify-center rounded-2xl"
              style={{ background: `linear-gradient(135deg, ${rarityColor(rarity)}99, ${rarityColor(rarity)}33)`, border: `1.5px solid ${rarityColor(rarity)}66` }}
            >
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full" style={{ background: rarityColor(rarity), boxShadow: `0 0 6px ${rarityColor(rarity)}` }} />
              <PresetIcon id={icon} size={previewSize} color="white" />
              <span className="mt-1 w-full truncate px-1 text-center text-[9px] font-medium text-white leading-tight">
                {name || "Nazwa odznaki"}
              </span>
            </div>
            {/* Text info */}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium" style={{ color: rarityColor(rarity) }}>{rarity}</p>
              <p className="truncate text-sm font-semibold text-white">{name || "Nazwa odznaki"}</p>
              <p className="line-clamp-2 text-xs text-zinc-500">{shortDesc || "Krótki opis odznaki pojawi się tutaj."}</p>
            </div>
          </div>
          {/* Icon scale slider */}
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-zinc-500">Skala ikony</span>
              <span className="text-xs text-zinc-400">{iconScale}%</span>
            </div>
            <input
              type="range"
              min={20}
              max={100}
              value={iconScale}
              onChange={(e) => setIconScale(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>

        {/* Icon picker */}
        <div className="rounded-2xl bg-white/5 p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Wybierz ikonę</h2>
          <div className="grid grid-cols-6 gap-2">
            {PRESET_ICONS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setIcon(id)}
                className="flex h-10 w-full items-center justify-center rounded-xl border transition-colors"
                style={{
                  borderColor: icon === id ? rarityColor(rarity) : "rgba(255,255,255,0.1)",
                  background: icon === id ? `${rarityColor(rarity)}22` : "rgba(255,255,255,0.04)",
                }}
              >
                <PresetIcon id={id} size={18} color={icon === id ? rarityColor(rarity) : "#71717a"} />
              </button>
            ))}
          </div>
        </div>

        {/* Informacje */}
        <div className="rounded-2xl bg-white/5 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-white">Informacje</h2>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Nazwa odznaki</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Nocny Gracz"
              maxLength={100}
              className="w-full rounded-xl border border-zinc-800 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Krótki opis ({shortDesc.length}/100)</label>
            <input
              type="text"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="np. Uczestnik 10 wydarzeń nocnych"
              maxLength={100}
              className="w-full rounded-xl border border-zinc-800 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Pełny opis (opcjonalny)</label>
            <textarea
              value={fullDesc}
              onChange={(e) => setFullDesc(e.target.value)}
              placeholder="Rozszerzony opis odznaki wyświetlany po jej odblokowaniu..."
              maxLength={500}
              rows={3}
              className="w-full resize-none rounded-xl border border-zinc-800 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Warunek odblokowania */}
        <div className="rounded-2xl bg-white/5 p-4 space-y-2">
          <h2 className="mb-1 text-sm font-semibold text-white">Warunek odblokowania</h2>
          {UNLOCK_CONDITIONS.map((cond) => (
            <button
              key={cond.id}
              type="button"
              onClick={() => setUnlock(cond.id)}
              className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm text-left transition-colors"
              style={{
                borderColor: unlock === cond.id ? "#3b82f6" : "rgba(255,255,255,0.08)",
                background: unlock === cond.id ? "rgba(59,130,246,0.12)" : "transparent",
              }}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2" style={{ borderColor: unlock === cond.id ? "#3b82f6" : "#52525b" }}>
                {unlock === cond.id && <span className="h-2 w-2 rounded-full bg-blue-500" />}
              </span>
              <span className={unlock === cond.id ? "text-white" : "text-zinc-400"}>{cond.label}</span>
            </button>
          ))}
        </div>

        {/* Rzadkość */}
        <div className="rounded-2xl bg-white/5 p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Rzadkość</h2>
          <div className="grid grid-cols-2 gap-2">
            {RARITIES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRarity(r.id)}
                className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors"
                style={{
                  borderColor: rarity === r.id ? r.color : "rgba(255,255,255,0.08)",
                  background: rarity === r.id ? `${r.color}22` : "rgba(255,255,255,0.04)",
                  color: rarity === r.id ? r.color : "#71717a",
                }}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                {r.id}
              </button>
            ))}
          </div>
        </div>

        {/* Widoczność */}
        <div className="rounded-2xl bg-white/5 p-4 space-y-2">
          <h2 className="mb-1 text-sm font-semibold text-white">Widoczność</h2>
          {VISIBILITIES.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setVisibility(v.id)}
              className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors"
              style={{
                borderColor: visibility === v.id ? "#3b82f6" : "rgba(255,255,255,0.08)",
                background: visibility === v.id ? "rgba(59,130,246,0.12)" : "transparent",
              }}
            >
              <span className="text-lg">{v.icon}</span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${visibility === v.id ? "text-white" : "text-zinc-400"}`}>{v.label}</p>
                <p className="text-xs text-zinc-600">{v.sub}</p>
              </div>
              {visibility === v.id && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" className="h-4 w-4 shrink-0">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Nagroda */}
        <div className="rounded-2xl bg-white/5 p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Nagroda (opcjonalna)</h2>
          <div className="grid grid-cols-2 gap-2">
            {REWARDS.map((rw) => (
              <button
                key={rw.id}
                type="button"
                onClick={() => setReward(rw.id)}
                className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors"
                style={{
                  borderColor: reward === rw.id ? "#3b82f6" : "rgba(255,255,255,0.08)",
                  background: reward === rw.id ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.04)",
                  color: reward === rw.id ? "white" : "#71717a",
                }}
              >
                <span className="text-base">{rw.icon}</span>
                <span className="text-xs font-medium">{rw.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !name.trim() || !shortDesc.trim()}
          className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 py-4 text-sm font-semibold text-white shadow-lg transition-opacity disabled:opacity-50 hover:opacity-90 active:scale-[0.98]"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Tworzenie...
            </span>
          ) : "Utwórz odznakę"}
        </button>
      </div>
    </div>
  );
}
