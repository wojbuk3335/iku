"use client";

import { useEffect, useRef, useState } from "react";

const WEEKDAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

const monthLabel = new Intl.DateTimeFormat("pl-PL", {
  month: "long",
  year: "numeric",
});

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getCalendarDays(viewMonth: Date): Date[] {
  const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

type EventDatePickerProps = {
  id?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
  value?: string;
  onChange?: (isoDate: string) => void;
};

export function EventDatePicker({
  id = "date",
  name = "date",
  disabled = false,
  className = "",
  value,
  onChange,
}: EventDatePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(`${value}T12:00:00`) : null,
  );
  const [viewMonth, setViewMonth] = useState<Date>(
    selectedDate ?? new Date(),
  );

  const today = startOfDay(new Date());
  const isoValue = selectedDate ? toIsoDate(selectedDate) : "";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectDate(date: Date) {
    setSelectedDate(date);
    setViewMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    onChange?.(toIsoDate(date));
    setOpen(false);
  }

  function previousMonth() {
    setViewMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
    );
  }

  function nextMonth() {
    setViewMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
    );
  }

  const displayValue = selectedDate
    ? new Intl.DateTimeFormat("pl-PL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(selectedDate)
    : "Wybierz datę";

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" id={id} name={name} value={isoValue} required />

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center justify-between rounded-[20px] border border-[#2a2640]/80 bg-[#101018]/70 px-5 py-4.5 text-left text-lg outline-none transition-colors focus:border-violet-500/50 disabled:opacity-60 ${
          selectedDate ? "text-white" : "text-zinc-500"
        } ${className}`}
      >
        <span>{displayValue}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5 shrink-0 text-zinc-400"
          aria-hidden
        >
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 rounded-[20px] border border-[#2a2640] bg-[#101018] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={previousMonth}
              className="rounded-lg px-2 py-1 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Poprzedni miesiąc"
            >
              ←
            </button>
            <span className="text-sm font-semibold capitalize text-white">
              {monthLabel.format(viewMonth)}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded-lg px-2 py-1 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Następny miesiąc"
            >
              →
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-1 text-center text-xs font-medium text-zinc-500"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {getCalendarDays(viewMonth).map((day) => {
              const isCurrentMonth = day.getMonth() === viewMonth.getMonth();
              const isSelected =
                selectedDate &&
                toIsoDate(day) === toIsoDate(selectedDate);
              const isPast = startOfDay(day) < today;

              return (
                <button
                  key={toIsoDate(day)}
                  type="button"
                  disabled={isPast}
                  onClick={() => selectDate(day)}
                  className={`h-9 rounded-lg text-sm transition-colors ${
                    isSelected
                      ? "bg-violet-600 font-semibold text-white"
                      : isPast
                        ? "cursor-not-allowed text-zinc-600"
                        : isCurrentMonth
                          ? "text-white hover:bg-violet-500/20"
                          : "text-zinc-600 hover:bg-white/5"
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
