"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { AchievementIcon } from "@/components/achievements/achievement-icon";
import {
  createEventAchievement,
  updateEventAchievement,
} from "@/app/admin/events/achievements-actions";
import {
  ACHIEVEMENT_BACKGROUNDS,
  ACHIEVEMENT_COLORS,
  ACHIEVEMENT_ICON_CATEGORIES,
  UNLOCK_TYPE_OPTIONS,
  VISIBILITY_OPTIONS,
  defaultIconForUnlockType,
  suggestedIconsForUnlockType,
} from "@/types/achievement";
import type {
  AchievementStyle,
  AchievementUnlockType,
  AchievementVisibility,
  EventAchievement,
} from "@/types/achievement";

const sectionClass =
  "rounded-[20px] border border-[#2a2640]/80 bg-[#101018]/70 p-5";
const labelClass = "mb-2 block text-sm font-medium text-zinc-400";
const fieldClass =
  "w-full rounded-2xl border border-[#2a2640]/80 bg-[#0c0c14] px-4 py-3 text-base text-white outline-none placeholder:text-zinc-600 focus:border-violet-500/50";
const hintClass = "mt-2 text-xs text-zinc-600";

export function AchievementWizard({
  eventId,
  eventTitle,
  achievement,
  returnTo = "list",
}: {
  eventId: string;
  eventTitle: string;
  achievement?: EventAchievement | null;
  returnTo?: "list" | "event";
}) {
  const router = useRouter();
  const isEdit = !!achievement;
  const [isPending, startTransition] = useTransition();
  const backHref =
    returnTo === "event"
      ? `/admin/events/${eventId}`
      : `/admin/events/${eventId}/achievements`;
  const backLabel =
    returnTo === "event" ? "← Wróć do wydarzenia" : "← Lista odznak";

  const [name, setName] = useState(achievement?.name ?? "");
  const [description, setDescription] = useState(achievement?.description ?? "");
  const [icon, setIcon] = useState(
    achievement?.icon ??
      defaultIconForUnlockType(achievement?.unlock_type ?? "event_attendance"),
  );
  const [color, setColor] = useState(achievement?.color ?? "#8b5cf6");
  const [background, setBackground] = useState(
    achievement?.background ?? "#151022",
  );
  const [style, setStyle] = useState<AchievementStyle>(
    achievement?.style ?? "solid",
  );
  const [unlockType, setUnlockType] = useState<AchievementUnlockType>(
    achievement?.unlock_type ?? "event_attendance",
  );
  const [threshold, setThreshold] = useState(
    achievement?.unlock_threshold?.toString() ?? "3",
  );
  const [hasReward, setHasReward] = useState(achievement?.has_reward ?? false);
  const [rewardLabel, setRewardLabel] = useState(
    achievement?.reward_label ?? "",
  );
  const [visibility, setVisibility] = useState<AchievementVisibility>(
    achievement?.visibility ?? "visible",
  );
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [iconCategory, setIconCategory] = useState("conditions");
  const [iconQuery, setIconQuery] = useState("");
  const [iconManuallyPicked, setIconManuallyPicked] = useState(!!achievement);
  const [error, setError] = useState<string | null>(null);

  const unlockNeedsThreshold = useMemo(
    () =>
      unlockType === "event_count" || unlockType === "recurring_count",
    [unlockType],
  );

  const suggestedIcons = useMemo(
    () => suggestedIconsForUnlockType(unlockType),
    [unlockType],
  );

  const categoryIcons =
    ACHIEVEMENT_ICON_CATEGORIES.find((c) => c.id === iconCategory)?.icons ??
    [];

  const filteredIcons = iconQuery.trim()
    ? ACHIEVEMENT_ICON_CATEGORIES.flatMap((c) => c.icons).filter((i) =>
        i.toLowerCase().includes(iconQuery.trim().toLowerCase()),
      )
    : categoryIcons;

  function pickIcon(next: string) {
    setIcon(next);
    setIconManuallyPicked(true);
    setIconPickerOpen(false);
    setIconQuery("");
  }

  function changeUnlockType(next: AchievementUnlockType) {
    setUnlockType(next);
    if (!iconManuallyPicked) {
      setIcon(defaultIconForUnlockType(next));
    }
  }

  function handleSubmit(publish: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        const payload = {
          event_id: eventId,
          name,
          description,
          icon,
          color,
          background,
          style,
          unlock_type: unlockType,
          unlock_threshold: unlockNeedsThreshold
            ? Number(threshold)
            : null,
          has_reward: hasReward,
          reward_label: hasReward ? rewardLabel : null,
          visibility,
          status: publish ? ("active" as const) : ("disabled" as const),
        };

        if (isEdit && achievement) {
          await updateEventAchievement(achievement.id, payload);
        } else {
          await createEventAchievement(payload);
        }

        router.push(backHref);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Nie udało się zapisać odznaki.",
        );
      }
    });
  }

  return (
    <div className="min-h-dvh w-full bg-[radial-gradient(ellipse_at_top,_#2a1845_0%,_#12101a_38%,_#080810_100%)] text-white">
      <div className="mx-auto flex w-full max-w-2xl flex-col px-4 pb-28 pt-8 sm:px-6">
        <Link
          href={backHref}
          className="mb-4 inline-flex text-sm text-zinc-400 transition-colors hover:text-white"
        >
          {backLabel}
        </Link>
        <h1 className="text-3xl font-bold">
          {isEdit ? "Edytuj odznakę" : "Nowa odznaka"}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">{eventTitle}</p>

        <div className="mt-8 flex flex-col gap-5">
          {/* Preview sticky-ish */}
          <section className={sectionClass}>
            <p className={labelClass}>Podgląd na żywo</p>
            <div className="flex items-center gap-4">
              <div
                className="flex h-24 w-24 items-center justify-center rounded-3xl"
                style={{
                  background:
                    style === "gradient"
                      ? `linear-gradient(135deg, ${background}, ${color}55)`
                      : background,
                  boxShadow:
                    style === "outline"
                      ? `inset 0 0 0 2px ${color}`
                      : `0 0 24px ${color}33`,
                }}
              >
                <AchievementIcon icon={icon} size={40} color={color} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-semibold">
                  {name || "Nazwa odznaki"}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                  {description || "Opis pojawi się tutaj."}
                </p>
              </div>
            </div>
          </section>

          {/* Section 1 */}
          <section className={sectionClass}>
            <h2 className="mb-4 text-lg font-semibold">1. Podstawowe informacje</h2>
            <div>
              <label className={labelClass} htmlFor="ach-name">
                Nazwa
              </label>
              <input
                id="ach-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Pierwszy Trening"
                maxLength={100}
                className={fieldClass}
                disabled={isPending}
              />
              <p className={hintClass}>Nazwa widoczna będzie dla uczestników.</p>
            </div>
            <div className="mt-4">
              <label className={labelClass} htmlFor="ach-desc">
                Opis
              </label>
              <textarea
                id="ach-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Wyjaśnij za co uczestnik otrzyma odznakę…"
                maxLength={500}
                className={`${fieldClass} resize-none`}
                disabled={isPending}
              />
              <p className={hintClass}>
                Wyjaśnij użytkownikowi za co otrzyma odznakę.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className={sectionClass}>
            <h2 className="mb-4 text-lg font-semibold">2. Wygląd</h2>

            <p className={labelClass}>Ikona odznaki</p>
            <div className="mb-2 flex items-center gap-3">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background, boxShadow: `0 0 16px ${color}33` }}
              >
                <AchievementIcon icon={icon} size={28} color={color} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white capitalize">{icon}</p>
                <p className="text-xs text-zinc-500">
                  Sugerowane pod wybrany warunek — możesz zmienić.
                </p>
              </div>
            </div>

            <div className="mb-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {suggestedIcons.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => pickIcon(id)}
                  className={`flex h-14 flex-col items-center justify-center gap-1 rounded-2xl border transition-colors ${
                    icon === id
                      ? "border-violet-500 bg-violet-500/20"
                      : "border-[#2a2640] hover:border-violet-500/40"
                  }`}
                  aria-label={`Ikona ${id}`}
                >
                  <AchievementIcon icon={id} size={22} color={color} />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIconPickerOpen(true)}
              className="mb-5 w-full rounded-2xl border border-dashed border-[#2a2640] bg-[#0c0c14] px-4 py-3 text-sm text-zinc-300 transition-colors hover:border-violet-500/40"
            >
              Więcej ikon (wszystkie kategorie)…
            </button>

            <p className={labelClass}>Kolor</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {ACHIEVEMENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-9 w-9 rounded-full transition-transform ${
                    color === c ? "scale-110 ring-2 ring-white" : ""
                  }`}
                  style={{ background: c }}
                  aria-label={`Kolor ${c}`}
                />
              ))}
            </div>

            <p className={labelClass}>Tło</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {ACHIEVEMENT_BACKGROUNDS.map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => setBackground(bg)}
                  className={`h-9 w-9 rounded-full border border-white/10 ${
                    background === bg ? "ring-2 ring-violet-400" : ""
                  }`}
                  style={{ background: bg }}
                  aria-label={`Tło ${bg}`}
                />
              ))}
            </div>

            <p className={labelClass}>Styl</p>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "solid", label: "Solid" },
                  { id: "gradient", label: "Gradient" },
                  { id: "outline", label: "Obramowanie" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStyle(opt.id)}
                  className={`rounded-2xl border px-3 py-3 text-sm transition-colors ${
                    style === opt.id
                      ? "border-violet-500 bg-violet-500/15 text-white"
                      : "border-[#2a2640] text-zinc-400 hover:border-[#3a3650]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* Section 3 */}
          <section className={sectionClass}>
            <h2 className="mb-4 text-lg font-semibold">3. Warunek zdobycia</h2>
            <label className={labelClass} htmlFor="unlock">
              Za co użytkownik otrzyma odznakę?
            </label>
            <div className="grid gap-2">
              {UNLOCK_TYPE_OPTIONS.map((opt) => {
                const selected = unlockType === opt.id;
                const previewIcon = opt.icons[0];
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => changeUnlockType(opt.id)}
                    disabled={isPending}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                      selected
                        ? "border-violet-500 bg-violet-500/15"
                        : "border-[#2a2640] hover:border-[#3a3650]"
                    }`}
                  >
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0c0c14]"
                      style={{ color }}
                    >
                      <AchievementIcon
                        icon={previewIcon}
                        size={20}
                        color={selected ? color : "#a1a1aa"}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-white">
                        {opt.label}
                      </span>
                    </span>
                    {selected && (
                      <span className="text-xs font-medium text-violet-300">
                        Wybrane
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {unlockNeedsThreshold && (
              <div className="mt-4">
                <label className={labelClass} htmlFor="threshold">
                  Liczba
                </label>
                <input
                  id="threshold"
                  type="number"
                  min={1}
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className={fieldClass}
                  disabled={isPending}
                />
              </div>
            )}
          </section>

          {/* Section 4 */}
          <section className={sectionClass}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">4. Nagroda</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Opcjonalna korzyść dla zdobywcy
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHasReward((v) => !v)}
                className={`relative h-8 w-14 rounded-full transition-colors ${
                  hasReward ? "bg-violet-600" : "bg-zinc-700"
                }`}
                aria-pressed={hasReward}
              >
                <span
                  className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-transform ${
                    hasReward ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>
            {hasReward && (
              <div>
                <label className={labelClass} htmlFor="reward">
                  Opis nagrody
                </label>
                <input
                  id="reward"
                  value={rewardLabel}
                  onChange={(e) => setRewardLabel(e.target.value)}
                  placeholder="np. 10% zniżki na kolejne wydarzenie"
                  className={fieldClass}
                  disabled={isPending}
                />
              </div>
            )}
          </section>

          {/* Section 5 */}
          <section className={sectionClass}>
            <h2 className="mb-4 text-lg font-semibold">5. Widoczność</h2>
            <div className="grid gap-3">
              {VISIBILITY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setVisibility(opt.id)}
                  className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                    visibility === opt.id
                      ? "border-violet-500 bg-violet-500/15"
                      : "border-[#2a2640] hover:border-[#3a3650]"
                  }`}
                >
                  <p className="font-medium text-white">{opt.label}</p>
                  <p className="mt-1 text-xs text-zinc-500">{opt.sub}</p>
                </button>
              ))}
            </div>
          </section>

          {error && (
            <p className="text-center text-sm text-red-300">{error}</p>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-[#080810]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl gap-3 px-4 py-4 sm:px-6">
          <Link
            href={backHref}
            className="flex h-12 flex-1 items-center justify-center rounded-2xl border border-white/10 text-sm font-medium text-zinc-300"
          >
            Anuluj
          </Link>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleSubmit(true)}
            className="flex h-12 flex-[1.4] items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-violet-600 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isPending ? "Zapisywanie…" : isEdit ? "Zapisz zmiany" : "Opublikuj"}
          </button>
        </div>
      </div>

      {/* Icon picker modal */}
      {iconPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="flex max-h-[80dvh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-[#2a2640] bg-[#101018]">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <h3 className="font-semibold">Wybierz ikonę</h3>
              <button
                type="button"
                onClick={() => setIconPickerOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="border-b border-white/5 px-4 py-3">
              <input
                value={iconQuery}
                onChange={(e) => setIconQuery(e.target.value)}
                placeholder="Szukaj ikony…"
                className={fieldClass}
              />
            </div>
            <div className="flex min-h-0 flex-1">
              {!iconQuery && (
                <div className="w-36 shrink-0 overflow-y-auto border-r border-white/5 p-2">
                  {ACHIEVEMENT_ICON_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setIconCategory(cat.id)}
                      className={`mb-1 w-full rounded-xl px-3 py-2 text-left text-sm ${
                        iconCategory === cat.id
                          ? "bg-violet-500/20 text-violet-200"
                          : "text-zinc-400 hover:bg-white/5"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}
                  <div className="grid flex-1 grid-cols-4 gap-2 overflow-y-auto p-3">
                {filteredIcons.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => pickIcon(id)}
                    className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-2xl border transition-colors ${
                      icon === id
                        ? "border-violet-500 bg-violet-500/20"
                        : "border-white/10 hover:border-violet-500/40"
                    }`}
                  >
                    <AchievementIcon icon={id} size={22} color="#e4e4e7" />
                    <span className="max-w-full truncate px-1 text-[9px] text-zinc-500">
                      {id}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
