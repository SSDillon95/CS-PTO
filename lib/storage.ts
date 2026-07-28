import type { PtoEntry } from "./types";
import { SIGNUP_CATEGORIES } from "./types";

const STORAGE_KEY = "cs-pto-volunteer-signups-v1";

export function loadEntries(): PtoEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PtoEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEntries(entries: PtoEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function createId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function entriesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export function daysBetween(start: string, end: string): number {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  const ms = e.getTime() - s.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
}

export function formatDateRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  const s = new Date(start + "T12:00:00").toLocaleDateString("en-US", opts);
  if (start === end) return s;
  const e = new Date(end + "T12:00:00").toLocaleDateString("en-US", opts);
  return `${s} – ${e}`;
}

export function categoryLabel(type: string): string {
  return SIGNUP_CATEGORIES.find((c) => c.value === type)?.label ?? type;
}

export function exportCsv(entries: PtoEntry[]): string {
  const headers = [
    "Name",
    "Email",
    "Phone",
    "Student",
    "Event / Role",
    "Start Date",
    "End Date",
    "Category",
    "Status",
    "Notes",
    "Signed Up",
  ];
  const rows = entries.map((e) => [
    e.name,
    e.email,
    e.phone ?? "",
    e.studentName ?? "",
    e.eventName ?? "",
    e.startDate,
    e.endDate,
    categoryLabel(e.type),
    e.status,
    (e.notes ?? "").replace(/"/g, '""'),
    e.createdAt,
  ]);
  const escape = (cell: string) =>
    cell.includes(",") || cell.includes('"') || cell.includes("\n")
      ? `"${cell}"`
      : cell;
  return [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
}
