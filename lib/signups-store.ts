import { randomUUID } from "crypto";
import type { SignupEntry, SignupFormData } from "./types";
import { resolveEventLabels } from "./events-store";
import { ensureSchema, getSqlite, pgSql, usesPostgres } from "./db";

function rowToEntry(row: Record<string, unknown>): SignupEntry {
  let events: string[] = [];
  let eventLabels: string[] = [];
  try {
    events = JSON.parse(String(row.events_json || "[]")) as string[];
  } catch {
    events = [];
  }
  try {
    eventLabels = JSON.parse(String(row.event_labels_json || "[]")) as string[];
  } catch {
    eventLabels = [];
  }

  return {
    id: String(row.id),
    name: String(row.name),
    phone: String(row.phone),
    childNameGrade: String(row.child_name_grade),
    events,
    eventLabels,
    emailSent: Boolean(row.email_sent),
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

export async function listSignups(): Promise<SignupEntry[]> {
  await ensureSchema();

  if (usesPostgres()) {
    const sql = await pgSql();
    const rows = await sql`
      SELECT id, name, phone, child_name_grade, events_json, event_labels_json,
             email_sent, created_at
      FROM pto_signups
      ORDER BY created_at DESC
    `;
    return rows.map((r) => rowToEntry(r as Record<string, unknown>));
  }

  const db = await getSqlite();
  const rows = db
    .prepare(
      `SELECT id, name, phone, child_name_grade, events_json, event_labels_json,
              email_sent, created_at
       FROM pto_signups
       ORDER BY created_at DESC`
    )
    .all() as Record<string, unknown>[];
  return rows.map(rowToEntry);
}

export async function addSignup(
  data: SignupFormData,
  emailSent: boolean,
  eventLabels?: string[]
): Promise<SignupEntry> {
  await ensureSchema();

  const labels = eventLabels ?? (await resolveEventLabels(data.events));
  const entry: SignupEntry = {
    id: randomUUID(),
    ...data,
    eventLabels: labels,
    createdAt: new Date().toISOString(),
    emailSent,
  };

  const eventsJson = JSON.stringify(entry.events);
  const labelsJson = JSON.stringify(entry.eventLabels);

  if (usesPostgres()) {
    const sql = await pgSql();
    await sql`
      INSERT INTO pto_signups (
        id, name, phone, child_name_grade, events_json, event_labels_json,
        email_sent, created_at
      ) VALUES (
        ${entry.id},
        ${entry.name},
        ${entry.phone},
        ${entry.childNameGrade},
        ${eventsJson},
        ${labelsJson},
        ${entry.emailSent},
        ${entry.createdAt}
      )
    `;
    return entry;
  }

  const db = await getSqlite();
  db.prepare(
    `INSERT INTO pto_signups (
      id, name, phone, child_name_grade, events_json, event_labels_json,
      email_sent, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    entry.id,
    entry.name,
    entry.phone,
    entry.childNameGrade,
    eventsJson,
    labelsJson,
    entry.emailSent ? 1 : 0,
    entry.createdAt
  );
  return entry;
}

export async function deleteSignup(id: string): Promise<boolean> {
  await ensureSchema();

  if (usesPostgres()) {
    const sql = await pgSql();
    const rows = await sql`
      DELETE FROM pto_signups WHERE id = ${id} RETURNING id
    `;
    return rows.length > 0;
  }

  const db = await getSqlite();
  const result = db.prepare("DELETE FROM pto_signups WHERE id = ?").run(id);
  return result.changes > 0;
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
