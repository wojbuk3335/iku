"use client";

import { useEffect, useRef, useState } from "react";

export type PreciseSearchMode = "user" | "organizer" | "event";

const SEARCH_MENU_ITEMS: {
  id: PreciseSearchMode;
  label: string;
}[] = [
  { id: "user", label: "Wyszukaj użytkownika" },
  { id: "organizer", label: "Wyszukaj organizatora" },
  { id: "event", label: "Wyszukaj wydarzenie" },
];

type HomeHeaderProps = {
  onPreciseSearch?: (mode: PreciseSearchMode) => void;
};

export function HomeHeader({ onPreciseSearch }: HomeHeaderProps) {
  const [searchMenuOpen, setSearchMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchMenuOpen) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setSearchMenuOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSearchMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [searchMenuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#080810]/90 backdrop-blur-md">
      <div className="relative flex items-center justify-center px-4 py-4">
        <h1 className="text-xl font-bold tracking-[0.2em] text-white">IKU</h1>

        <div className="absolute right-4 flex items-center gap-3 text-zinc-300">
          <button
            type="button"
            aria-label="Mapa"
            className="rounded-full p-1 transition-colors hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
              aria-hidden
            >
              <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" />
              <path d="M15 5.764v15" />
              <path d="M9 3.236v15" />
            </svg>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="Szukaj precyzyjnie"
              aria-expanded={searchMenuOpen}
              aria-haspopup="menu"
              onClick={() => setSearchMenuOpen((open) => !open)}
              className={`cursor-pointer rounded-full p-1 transition-colors hover:text-white ${
                searchMenuOpen ? "text-white" : ""
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>

            {searchMenuOpen && (
              <div
                role="menu"
                aria-label="Wyszukiwanie precyzyjne"
                className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#12121a] py-1 shadow-xl shadow-black/50"
              >
                {SEARCH_MENU_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setSearchMenuOpen(false);
                      onPreciseSearch?.(item.id);
                    }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-zinc-200 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-4 w-4 shrink-0 text-zinc-500"
                      aria-hidden
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            aria-label="Utwórz"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white shadow-[0_0_16px_rgba(59,130,246,0.45)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              className="h-4 w-4"
              aria-hidden
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
