const STORIES = [
  {
    id: "electric",
    label: "Electric",
    live: true,
    gradient: "from-fuchsia-500 to-violet-700",
    emoji: "⚡",
  },
  {
    id: "anna",
    label: "Anna",
    gradient: "from-rose-400 to-orange-500",
    emoji: "A",
  },
  {
    id: "michal",
    label: "Michał",
    gradient: "from-sky-400 to-blue-600",
    emoji: "M",
  },
  {
    id: "neon",
    label: "Neon",
    gradient: "from-purple-500 to-indigo-700",
    emoji: "🌙",
  },
  {
    id: "food",
    label: "Food",
    gradient: "from-amber-400 to-orange-600",
    emoji: "🍕",
  },
];

export function StoriesRow() {
  return (
    <section className="border-b border-white/5 px-3 py-4">
      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STORIES.map((story) => (
          <button
            key={story.id}
            type="button"
            className="flex shrink-0 flex-col items-center gap-2"
          >
            <div
              className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${story.gradient} ${
                story.live
                  ? "ring-2 ring-red-500 ring-offset-2 ring-offset-[#080810]"
                  : "ring-2 ring-violet-500/40 ring-offset-2 ring-offset-[#080810]"
              }`}
            >
              <span className="text-lg font-semibold text-white">
                {story.emoji}
              </span>
              {story.live && (
                <span className="absolute -bottom-1 rounded bg-red-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                  Live
                </span>
              )}
            </div>
            <span className="max-w-16 truncate text-[11px] text-zinc-400">
              {story.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
