import type { EventCategory } from "@/types/event";
import { INTEREST_CATEGORIES } from "@/types/interests";

const GRADIENTS: Record<EventCategory, string> = {
  muzyka: "from-violet-600 via-fuchsia-600 to-purple-900",
  sport: "from-emerald-500 via-green-600 to-teal-900",
  kultura: "from-rose-500 via-orange-500 to-amber-900",
  jedzenie: "from-orange-400 via-red-500 to-rose-900",
  tech: "from-cyan-500 via-blue-600 to-indigo-900",
  kluby: "from-indigo-500 via-violet-600 to-purple-950",
  dzieci: "from-sky-400 via-blue-500 to-indigo-800",
  seniorzy: "from-amber-400 via-orange-500 to-red-900",
};

export function getCategoryMeta(category: EventCategory) {
  const meta = INTEREST_CATEGORIES.find((item) => item.id === category);

  return {
    label: meta?.label ?? category,
    emoji: meta?.emoji ?? "✨",
    gradient: GRADIENTS[category] ?? GRADIENTS.muzyka,
  };
}
