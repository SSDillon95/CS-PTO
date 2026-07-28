import { promises as fs } from "fs";
import path from "path";
import type { SignupEntry } from "./types";
import type { SignupFormData } from "./types";
import { randomUUID } from "crypto";
import { resolveEventLabels } from "./events-store";

function storePath(): string {
  if (process.env.VERCEL) {
    return path.join("/tmp", "dorsey-pto-signups.json");
  }
  return path.join(process.cwd(), "data", "signups.json");
}

async function readAll(): Promise<SignupEntry[]> {
  try {
    const raw = await fs.readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as SignupEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(entries: SignupEntry[]): Promise<void> {
  const file = storePath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(entries, null, 2), "utf8");
}

export async function listSignups(): Promise<SignupEntry[]> {
  const entries = await readAll();
  return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addSignup(
  data: SignupFormData,
  emailSent: boolean,
  eventLabels?: string[]
): Promise<SignupEntry> {
  const entries = await readAll();
  const labels = eventLabels ?? (await resolveEventLabels(data.events));
  const entry: SignupEntry = {
    id: randomUUID(),
    ...data,
    eventLabels: labels,
    createdAt: new Date().toISOString(),
    emailSent,
  };
  entries.unshift(entry);
  await writeAll(entries);
  return entry;
}


export async function deleteSignup(id: string): Promise<boolean> {
  const entries = await readAll();
  const next = entries.filter((e) => e.id !== id);
  if (next.length === entries.length) return false;
  await writeAll(next);
  return true;
}

export function signupsToCsv(entries: SignupEntry[]): string {
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
