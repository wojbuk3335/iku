export function HomeHeader() {
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

          <button
            type="button"
            aria-label="Szukaj"
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
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>

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
