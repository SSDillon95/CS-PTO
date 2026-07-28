"use client";

import type { PtoEntry } from "@/lib/types";
import {
  daysInMonth,
  entriesOnDate,
  firstWeekday,
  monthLabel,
  toIsoDate,
} from "@/lib/calendar";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface PtoCalendarProps {
  entries: PtoEntry[];
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export default function PtoCalendar({
  entries,
  year,
  month,
  onPrev,
  onNext,
  onToday,
}: PtoCalendarProps) {
  const total = daysInMonth(year, month);
  const offset = firstWeekday(year, month);
  const todayIso = new Date().toISOString().slice(0, 10);

  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {monthLabel(year, month)}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Who’s volunteering each day
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPrev}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ← Prev
          </button>
          <button
            type="button"
            onClick={onToday}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Today
          </button>
          <button
            type="button"
            onClick={onNext}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) {
            return (
              <div
                key={`empty-${i}`}
                className="min-h-[88px] rounded-lg bg-slate-50/50 dark:bg-slate-800/20"
              />
            );
          }
          const iso = toIsoDate(year, month, day);
          const dayEntries = entriesOnDate(entries, iso);
          const isToday = iso === todayIso;

          return (
            <div
              key={iso}
              className={`min-h-[88px] rounded-lg border p-1.5 text-left ${
                isToday
                  ? "border-teal-400 bg-teal-50/60 dark:border-teal-600 dark:bg-teal-950/30"
                  : "border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              <div
                className={`mb-1 text-xs font-semibold ${
                  isToday
                    ? "text-teal-700 dark:text-teal-300"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {day}
              </div>
              <div className="space-y-0.5">
                {dayEntries.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    title={`${e.name}${e.eventName ? ` — ${e.eventName}` : ""}`}
                    className="truncate rounded bg-teal-600/90 px-1 py-0.5 text-[10px] font-medium text-white"
                  >
                    {e.name.split(" ")[0]}
                    {e.eventName ? `: ${e.eventName}` : ""}
                  </div>
                ))}
                {dayEntries.length > 3 && (
                  <div className="text-[10px] text-slate-500">
                    +{dayEntries.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
