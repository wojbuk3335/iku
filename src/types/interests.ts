export type InterestCategory = {
  id: string;
  label: string;
  emoji: string;
};

export const INTEREST_CATEGORIES: InterestCategory[] = [
  { id: "muzyka", label: "Muzyka", emoji: "🎵" },
  { id: "sport", label: "Sport", emoji: "⚽" },
  { id: "kultura", label: "Kultura", emoji: "🎨" },
  { id: "jedzenie", label: "Jedzenie", emoji: "🍕" },
  { id: "tech", label: "Tech", emoji: "💻" },
  { id: "kluby", label: "Kluby", emoji: "🌙" },
  { id: "dzieci", label: "Dzieci", emoji: "🎈" },
  { id: "seniorzy", label: "Seniorzy", emoji: "👴" },
];

export const MIN_INTERESTS = 3;
