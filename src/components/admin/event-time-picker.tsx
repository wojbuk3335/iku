"use client";

import { useEffect, useRef, useState } from "react";

const HOURS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0"),
);
const MINUTES = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, "0"),
);

type EventTimePickerProps = {
  id?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
  value?: string;
  onChange?: (time: string) => void;
};

export function EventTimePicker({
  id = "time",
  name = "time",
  disabled = false,
  className = "",
  value = "",
  onChange,
}: EventTimePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const [hour, minute] = (() => {
    if (!value || !/^\d{2}:\d{2}$/.test(value)) return ["", ""];
    const [h, m] = value.split(":");
    const rounded =
      MINUTES.find((x) => x === m) ??
      MINUTES.reduce((best, cur) =>
        Math.abs(Number(cur) - Number(m)) < Math.abs(Number(best) - Number(m))
          ? cur
          : best,
      );
    return [h, rounded];
  })();

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

  useEffect(() => {
    if (!open) return;
    const scrollSelected = (list: HTMLDivElement | null, id: string) => {
      const el = list?.querySelector<HTMLElement>(`[data-value="${id}"]`);
      el?.scrollIntoView({ block: "center" });
    };
    requestAnimationFrame(() => {
      if (hour) scrollSelected(hourListRef.current, hour);
      if (minute) scrollSelected(minuteListRef.current, minute);
    });
  }, [open, hour, minute]);

  function pick(nextHour: string, nextMinute: string) {
    if (!nextHour || !nextMinute) return;
    onChange?.(`${nextHour}:${nextMinute}`);
  }

  const displayValue = hour && minute ? `${hour}:${minute}` : "--:--";

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" id={id} name={name} value={value} required />

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center justify-between rounded-[20px] border border-[#2a2640]/80 bg-[#101018]/70 px-5 py-4.5 text-left text-lg outline-none transition-colors focus:border-violet-500/50 disabled:opacity-60 ${
          hour && minute ? "text-white" : "text-zinc-500"
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
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-[20px] border border-[#2a2640] bg-[#101018] shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
          <div className="grid grid-cols-2 border-b border-white/5">
            <p className="px-3 py-2 text-center text-xs font-medium text-zinc-500">
              Godzina
            </p>
            <p className="px-3 py-2 text-center text-xs font-medium text-zinc-500">
              Minuta
            </p>
          </div>
          <div className="grid grid-cols-2">
            <div
              ref={hourListRef}
              className="max-h-52 overflow-y-auto border-r border-white/5 py-1"
            >
              {HOURS.map((h) => {
                const selected = hour === h;
                return (
                  <button
                    key={h}
                    type="button"
                    data-value={h}
                    onClick={() => pick(h, minute || "00")}
                    className={`flex w-full items-center justify-center py-2.5 text-sm transition-colors ${
                      selected
                        ? "bg-violet-600 font-semibold text-white"
                        : "text-zinc-300 hover:bg-violet-500/20 hover:text-white"
                    }`}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
            <div
              ref={minuteListRef}
              className="max-h-52 overflow-y-auto py-1"
            >
              {MINUTES.map((m) => {
                const selected = minute === m;
                return (
                  <button
                    key={m}
                    type="button"
                    data-value={m}
                    onClick={() => {
                      pick(hour || "12", m);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-center py-2.5 text-sm transition-colors ${
                      selected
                        ? "bg-violet-600 font-semibold text-white"
                        : "text-zinc-300 hover:bg-violet-500/20 hover:text-white"
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="border-t border-white/5 p-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full rounded-xl py-2 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              Gotowe
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
