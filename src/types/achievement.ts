export type AchievementUnlockType =
  | "event_attendance"
  | "first_attendance"
  | "event_count"
  | "recurring_count"
  | "complete_cycle"
  | "regular_attendance"
  | "manual"
  | "winner"
  | "podium"
  | "mvp"
  | "event_record";

export type AchievementVisibility = "visible" | "hidden" | "after_unlock";

export type AchievementStatus = "active" | "disabled";

export type AchievementStyle = "solid" | "gradient" | "outline";

export type EventAchievement = {
  id: string;
  event_id: string;
  created_by: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  background: string;
  style: AchievementStyle;
  custom_image_url: string | null;
  unlock_type: AchievementUnlockType;
  unlock_threshold: number | null;
  has_reward: boolean;
  reward_label: string | null;
  visibility: AchievementVisibility;
  status: AchievementStatus;
  created_at: string;
  updated_at: string;
  awards_count?: number;
};

export type EventAchievementInput = {
  event_id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  background: string;
  style: AchievementStyle;
  custom_image_url?: string | null;
  unlock_type: AchievementUnlockType;
  unlock_threshold?: number | null;
  has_reward: boolean;
  reward_label?: string | null;
  visibility: AchievementVisibility;
  status?: AchievementStatus;
};

export const UNLOCK_TYPE_OPTIONS: {
  id: AchievementUnlockType;
  label: string;
  needsThreshold?: boolean;
  /** Domyślna ikona + warianty do szybkiego wyboru */
  icons: string[];
}[] = [
  {
    id: "event_attendance",
    label: "Udział w wydarzeniu",
    icons: ["ticket", "check", "users", "calendar"],
  },
  {
    id: "first_attendance",
    label: "Pierwszy udział",
    icons: ["sparkles", "star", "flag", "rocket"],
  },
  {
    id: "event_count",
    label: "Określona liczba wydarzeń",
    needsThreshold: true,
    icons: ["target", "medal", "flame", "calendar"],
  },
  {
    id: "recurring_count",
    label: "Liczba zajęć cyklicznych",
    needsThreshold: true,
    icons: ["repeat", "calendar", "flame", "check"],
  },
  {
    id: "complete_cycle",
    label: "Ukończenie całego cyklu",
    icons: ["shield", "check", "flag", "trophy"],
  },
  {
    id: "regular_attendance",
    label: "Regularna obecność",
    icons: ["heart", "flame", "calendar", "repeat"],
  },
  {
    id: "manual",
    label: "Ręczne przyznanie",
    icons: ["handshake", "star", "gift", "sparkles"],
  },
  {
    id: "winner",
    label: "Zwycięzca",
    icons: ["trophy", "crown", "medal", "zap"],
  },
  {
    id: "podium",
    label: "Podium",
    icons: ["podium", "medal", "trophy", "star"],
  },
  {
    id: "mvp",
    label: "MVP / najlepszy zawodnik",
    icons: ["crown", "zap", "star", "flame"],
  },
  {
    id: "event_record",
    label: "Rekord wydarzenia",
    icons: ["gem", "target", "zap", "trophy"],
  },
];

export function defaultIconForUnlockType(type: AchievementUnlockType): string {
  return UNLOCK_TYPE_OPTIONS.find((o) => o.id === type)?.icons[0] ?? "trophy";
}

export function suggestedIconsForUnlockType(
  type: AchievementUnlockType,
): string[] {
  return UNLOCK_TYPE_OPTIONS.find((o) => o.id === type)?.icons ?? ["trophy"];
}

export const VISIBILITY_OPTIONS: {
  id: AchievementVisibility;
  label: string;
  sub: string;
}[] = [
  { id: "visible", label: "Widoczna", sub: "Od początku dla wszystkich" },
  { id: "after_unlock", label: "Po zdobyciu", sub: "Widać dopiero po odblokowaniu" },
  { id: "hidden", label: "Ukryta", sub: "Niewidoczna do momentu zdobycia" },
];

export const ACHIEVEMENT_COLORS = [
  "#8b5cf6",
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#a855f7",
];

export const ACHIEVEMENT_BACKGROUNDS = [
  "#151022",
  "#0f172a",
  "#1a1025",
  "#10221a",
  "#221810",
  "#101018",
];

export const ACHIEVEMENT_ICON_CATEGORIES: {
  id: string;
  label: string;
  icons: string[];
}[] = [
  {
    id: "conditions",
    label: "Warunki",
    icons: [
      "ticket",
      "check",
      "sparkles",
      "repeat",
      "handshake",
      "podium",
      "gem",
      "gift",
      "users",
      "calendar",
    ],
  },
  {
    id: "universal",
    label: "Uniwersalne",
    icons: ["trophy", "medal", "star", "crown", "shield", "flame", "flag", "heart"],
  },
  {
    id: "sport",
    label: "Sport",
    icons: ["soccer", "basketball", "trophy", "medal", "flame", "target", "podium"],
  },
  {
    id: "music",
    label: "Muzyka",
    icons: ["music", "mic", "headphones", "star"],
  },
  {
    id: "culture",
    label: "Kultura",
    icons: ["palette", "camera", "book", "theater"],
  },
  {
    id: "tech",
    label: "Technologia",
    icons: ["laptop", "rocket", "zap", "compass"],
  },
  {
    id: "food",
    label: "Jedzenie",
    icons: ["pizza", "coffee", "utensils"],
  },
];

export function unlockTypeLabel(type: AchievementUnlockType): string {
  return UNLOCK_TYPE_OPTIONS.find((o) => o.id === type)?.label ?? type;
}
