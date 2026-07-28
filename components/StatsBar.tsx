"use client";

import type { PtoEntry } from "@/lib/types";
import { daysBetween } from "@/lib/storage";
import { upcomingEntries } from "@/lib/calendar";

interface StatsBarProps {
  entries: PtoEntry[];
}

export default function StatsBar({ entries }: StatsBarProps) {
  const today = new Date().toISOString().slice(0, 10);
  const active = entries.filter((e) => e.status !== "cancelled");
  const upcoming = upcomingEntries(active, today);
  const onLeaveToday = active.filter(
    (e) => e.startDate <= today && e.endDate >= today
  );
  const totalDays = active.reduce(
    (sum, e) => sum + daysBetween(e.startDate, e.endDate),
    0
  );

  const cards = [
    { label: "On leave today", value: onLeaveToday.length },
    { label: "Upcoming", value: upcoming.length },
    { label: "Total entries", value: active.length },
    { label: "PTO days logged", value: totalDays },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="text-2xl font-bold text-teal-700 dark:text-teal-400">
            {c.value}
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}
