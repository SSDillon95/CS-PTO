import type { SignupEntry } from "./types";

const STORAGE_KEY = "dorsey-pto-signups-v1";

export function loadEntries(): SignupEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SignupEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEntries(entries: SignupEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function createId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function exportCsv(entries: SignupEntry[]): string {
  const headers = [
    "Name",
    "Phone Number",
    "Child's Name & Grade",
    "Events",
    "Submitted",
    "Email Sent",
  ];
  const rows = entries.map((e) => [
    e.name,
    e.phone,
    e.childNameGrade,
    e.eventLabels.join("; "),
    e.createdAt,
    e.emailSent ? "Yes" : "No",
  ]);
  const escape = (cell: string) =>
    cell.includes(",") || cell.includes('"') || cell.includes("\n")
      ? `"${cell.replace(/"/g, '""')}"`
      : cell;
  return [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
}
