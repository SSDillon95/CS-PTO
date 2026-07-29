import { randomUUID } from "crypto";
import { DEFAULT_EVENTS, type EventOption } from "./types";
import { ensureSchema, getSqlite, pgSql, usesPostgres } from "./db";

function rowToEvent(row: Record<string, unknown>): EventOption {
  return {
    id: String(row.id),
    label: String(row.label),
    active: Boolean(row.active),
  };
}

async function seedDefaultsIfEmpty(): Promise<void> {
  if (usesPostgres()) {
    const sql = await pgSql();
    const rows = await sql`SELECT COUNT(*)::int AS count FROM pto_events`;
    const count = Number((rows[0] as { count?: number })?.count ?? 0);
    if (count > 0) return;
    for (let i = 0; i < DEFAULT_EVENTS.length; i++) {
      const e = DEFAULT_EVENTS[i];
      await sql`
        INSERT INTO pto_events (id, label, active, sort_order)
        VALUES (${e.id}, ${e.label}, ${e.active}, ${i})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    return;
  }

  const db = await getSqlite();
  const row = db.prepare("SELECT COUNT(*) AS count FROM pto_events").get() as {
    count: number;
  };
  if (row.count > 0) return;
  const insert = db.prepare(
    "INSERT OR IGNORE INTO pto_events (id, label, active, sort_order) VALUES (?, ?, ?, ?)"
  );
  const tx = db.transaction(() => {
    DEFAULT_EVENTS.forEach((e, i) => {
      insert.run(e.id, e.label, e.active ? 1 : 0, i);
    });
  });
  tx();
}

export async function listEvents(): Promise<EventOption[]> {
  await ensureSchema();
  await seedDefaultsIfEmpty();

  if (usesPostgres()) {
    const sql = await pgSql();
    const rows = await sql`
      SELECT id, label, active, sort_order
      FROM pto_events
      ORDER BY sort_order ASC, label ASC
    `;
    return rows.map((r) => rowToEvent(r as Record<string, unknown>));
  }

  const db = await getSqlite();
  const rows = db
    .prepare(
      "SELECT id, label, active, sort_order FROM pto_events ORDER BY sort_order ASC, label ASC"
    )
    .all() as Record<string, unknown>[];
  return rows.map(rowToEvent);
}

export async function listActiveEvents(): Promise<EventOption[]> {
  const all = await listEvents();
  return all.filter((e) => e.active);
}

export async function getEventLabelMap(): Promise<Map<string, string>> {
  const all = await listEvents();
  return new Map(all.map((e) => [e.id, e.label]));
}

export async function resolveEventLabels(ids: string[]): Promise<string[]> {
  const map = await getEventLabelMap();
  return ids.map((id) => map.get(id) ?? id);
}

function slugify(label: string): string {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || randomUUID().slice(0, 8);
}

async function writeAllEvents(events: EventOption[]): Promise<void> {
  if (usesPostgres()) {
    const sql = await pgSql();
    await sql`DELETE FROM pto_events`;
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      await sql`
        INSERT INTO pto_events (id, label, active, sort_order)
        VALUES (${e.id}, ${e.label}, ${e.active}, ${i})
      `;
    }
    return;
  }

  const db = await getSqlite();
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM pto_events").run();
    const insert = db.prepare(
      "INSERT INTO pto_events (id, label, active, sort_order) VALUES (?, ?, ?, ?)"
    );
    events.forEach((e, i) => {
      insert.run(e.id, e.label, e.active ? 1 : 0, i);
    });
  });
  tx();
}

export async function saveEvents(events: EventOption[]): Promise<EventOption[]> {
  await ensureSchema();
  if (!Array.isArray(events) || events.length === 0) {
    throw new Error("At least one event is required.");
  }

  const seen = new Set<string>();
  const normalized: EventOption[] = [];

  for (const raw of events) {
    const label = String(raw.label ?? "").trim();
    if (!label) throw new Error("Every event needs a name/label.");

    let id = String(raw.id ?? "").trim();
    if (!id) id = slugify(label);
    if (seen.has(id)) id = `${id}-${randomUUID().slice(0, 6)}`;
    seen.add(id);

    normalized.push({
      id,
      label,
      active: raw.active === false ? false : true,
    });
  }

  await writeAllEvents(normalized);
  return normalized;
}

export async function addEvent(label: string): Promise<EventOption[]> {
  const text = label.trim();
  if (!text) throw new Error("Event name is required.");
  const events = await listEvents();
  let id = slugify(text);
  if (events.some((e) => e.id === id)) {
    id = `${id}-${randomUUID().slice(0, 6)}`;
  }
  events.push({ id, label: text, active: true });
  return saveEvents(events);
}

export async function updateEvent(
  id: string,
  patch: { label?: string; active?: boolean }
): Promise<EventOption[]> {
  const events = await listEvents();
  const idx = events.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error("Event not found.");

  if (typeof patch.label === "string") {
    const label = patch.label.trim();
    if (!label) throw new Error("Event name is required.");
    events[idx].label = label;
  }
  if (typeof patch.active === "boolean") {
    events[idx].active = patch.active;
  }
  return saveEvents(events);
}

export async function deleteEvent(
  id: string
): Promise<{ events: EventOption[]; signupsUpdated: number }> {
  const events = await listEvents();
  const next = events.filter((e) => e.id !== id);
  if (next.length === events.length) throw new Error("Event not found.");
  if (next.length === 0) throw new Error("You must keep at least one event.");
  const saved = await saveEvents(next);

  // Also strip this event from every existing signup (admin delete = remove everywhere)
  const { removeEventFromAllSignups } = await import("./signups-store");
  const signupsUpdated = await removeEventFromAllSignups(id);

  return { events: saved, signupsUpdated };
}

export async function moveEvent(
  id: string,
  direction: "up" | "down"
): Promise<EventOption[]> {
  const events = await listEvents();
  const idx = events.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error("Event not found.");

  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= events.length) return events;

  const tmp = events[idx];
  events[idx] = events[swapWith];
  events[swapWith] = tmp;
  return saveEvents(events);
}
