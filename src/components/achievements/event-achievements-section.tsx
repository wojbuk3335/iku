import { AchievementIcon } from "@/components/achievements/achievement-icon";
import { unlockTypeLabel } from "@/types/achievement";
import type { EventAchievement } from "@/types/achievement";

export function EventAchievementsSection({
  achievements,
}: {
  achievements: EventAchievement[];
}) {
  if (achievements.length === 0) return null;

  return (
    <section className="space-y-3">
      <h3 className="text-base font-semibold text-white">Odznaki do zdobycia</h3>
      <div className="flex flex-col gap-3">
        {achievements.map((item) => (
          <div
            key={item.id}
            className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
          >
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{
                background: item.background,
                boxShadow:
                  item.style === "outline"
                    ? `inset 0 0 0 2px ${item.color}`
                    : undefined,
              }}
            >
              <AchievementIcon icon={item.icon} size={24} color={item.color} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-white">{item.name}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">
                {item.description}
              </p>
              <p className="mt-1 text-[11px] text-violet-300/80">
                {unlockTypeLabel(item.unlock_type)}
                {item.unlock_threshold ? ` · ${item.unlock_threshold}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
