import type { PtoEntry } from "./types";
import { entriesOverlap } from "./storage";

export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Sunday = 0 */
export function firstWeekday(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function toIsoDate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export function entriesOnDate(entries: PtoEntry[], isoDate: string): PtoEntry[] {
  return entries.filter(
    (e) =>
      e.status !== "cancelled" &&
      entriesOverlap(e.startDate, e.endDate, isoDate, isoDate)
  );
}

export function upcomingEntries(entries: PtoEntry[], fromIso: string): PtoEntry[] {
  return entries
    .filter((e) => e.status !== "cancelled" && e.endDate >= fromIso)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}
