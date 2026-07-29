import { randomUUID } from "crypto";
import type {
  ChildEntry,
  ParentMatch,
  SignupEntry,
  SignupFormData,
} from "./types";
import {
  formatChildren,
  normalizeChildren,
  normalizePhoneDigits,
  phonesMatch,
} from "./types";
import { resolveEventLabels } from "./events-store";
import { ensureSchema, getSqlite, pgSql, usesPostgres } from "./db";

function parseChildrenFromRow(row: Record<string, unknown>): {
  children: ChildEntry[];
  childNameGrade: string;
} {
  const legacy = String(row.child_name_grade || "").trim();
  const rawJson = row.children_json;

  if (rawJson != null && String(rawJson).trim()) {
    try {
      const children = normalizeChildren(JSON.parse(String(rawJson)));
      if (children.length > 0) {
        return {
          children,
          childNameGrade: formatChildren(children) || legacy,
        };
      }
    } catch {
      // fall through to legacy
    }
  }

  // Legacy single combined field
  if (legacy) {
    return {
      children: [{ name: legacy, grade: "" }],
      childNameGrade: legacy,
    };
  }

  return { children: [], childNameGrade: "" };
}

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

  const { children, childNameGrade } = parseChildrenFromRow(row);

  return {
    id: String(row.id),
    name: String(row.name),
    phone: String(row.phone),
    children,
    childNameGrade,
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
      SELECT id, name, phone, child_name_grade, children_json, events_json,
             event_labels_json, email_sent, created_at
      FROM pto_signups
      ORDER BY created_at DESC
    `;
    return rows.map((r) => rowToEntry(r as Record<string, unknown>));
  }

  const db = await getSqlite();
  const rows = db
    .prepare(
      `SELECT id, name, phone, child_name_grade, children_json, events_json,
              event_labels_json, email_sent, created_at
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

  const children = normalizeChildren(data.children);
  const childNameGrade = formatChildren(children);
  const labels = eventLabels ?? (await resolveEventLabels(data.events));
  const entry: SignupEntry = {
    id: randomUUID(),
    name: data.name,
    phone: data.phone,
    children,
    childNameGrade,
    events: data.events,
    eventLabels: labels,
    createdAt: new Date().toISOString(),
    emailSent,
  };

  const eventsJson = JSON.stringify(entry.events);
  const labelsJson = JSON.stringify(entry.eventLabels);
  const childrenJson = JSON.stringify(entry.children);

  if (usesPostgres()) {
    const sql = await pgSql();
    await sql`
      INSERT INTO pto_signups (
        id, name, phone, child_name_grade, children_json, events_json,
        event_labels_json, email_sent, created_at
      ) VALUES (
        ${entry.id},
        ${entry.name},
        ${entry.phone},
        ${entry.childNameGrade},
        ${childrenJson},
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
      id, name, phone, child_name_grade, children_json, events_json,
      event_labels_json, email_sent, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    entry.id,
    entry.name,
    entry.phone,
    entry.childNameGrade,
    childrenJson,
    eventsJson,
    labelsJson,
    entry.emailSent ? 1 : 0,
    entry.createdAt
  );
  return entry;
}

/**
 * Find the most recent signup matching a phone number.
 * Used by the public form to offer autofill for returning parents.
 */
export async function findSignupByPhone(
  phone: string
): Promise<ParentMatch | null> {
  const key = normalizePhoneDigits(phone);
  if (key.length < 10) return null;

  const entries = await listSignups();
  const match = entries.find((e) => phonesMatch(e.phone, phone));
  if (!match) return null;

  return {
    name: match.name,
    phone: match.phone,
    children: match.children?.length
      ? match.children
      : match.childNameGrade
        ? [{ name: match.childNameGrade, grade: "" }]
        : [],
    events: match.events || [],
    eventLabels: match.eventLabels || [],
  };
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
    "Children",
    "Child 1 Name",
    "Child 1 Grade",
    "Child 2 Name",
    "Child 2 Grade",
    "Child 3 Name",
    "Child 3 Grade",
    "Child 4 Name",
    "Child 4 Grade",
    "Events",
    "Submitted",
    "Email Sent",
  ];
  const rows = entries.map((e) => {
    const kids = e.children?.length
      ? e.children
      : e.childNameGrade
        ? [{ name: e.childNameGrade, grade: "" }]
        : [];
    const cells = [
      e.name,
      e.phone,
      e.childNameGrade || formatChildren(kids),
    ];
    for (let i = 0; i < 4; i++) {
      cells.push(kids[i]?.name ?? "", kids[i]?.grade ?? "");
    }
    cells.push(
      e.eventLabels.join("; "),
      e.createdAt,
      e.emailSent ? "Yes" : "No"
    );
    return cells;
  });
  const escape = (cell: string) =>
    cell.includes(",") || cell.includes('"') || cell.includes("\n")
      ? `"${cell.replace(/"/g, '""')}"`
      : cell;
  return [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
}
