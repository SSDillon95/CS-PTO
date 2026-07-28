import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { DEFAULT_EVENTS, type EventOption } from "./types";

function storePath(): string {
  if (process.env.VERCEL) {
    return path.join("/tmp", "dorsey-pto-events.json");
  }
  return path.join(process.cwd(), "data", "events.json");
}

function normalizeEvent(raw: unknown): EventOption | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;
  const id = typeof e.id === "string" ? e.id.trim() : "";
  const label = typeof e.label === "string" ? e.label.trim() : "";
  if (!id || !label) return null;
  return {
    id,
    label,
    active: e.active === false ? false : true,
  };
}

async function readAll(): Promise<EventOption[]> {
  try {
    const raw = await fs.readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_EVENTS.map((e) => ({ ...e }));
    const events = parsed
      .map(normalizeEvent)
      .filter((e): e is EventOption => e !== null);
    return events.length > 0 ? events : DEFAULT_EVENTS.map((e) => ({ ...e }));
  } catch {
    return DEFAULT_EVENTS.map((e) => ({ ...e }));
  }
}

async function writeAll(events: EventOption[]): Promise<void> {
  const file = storePath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(events, null, 2), "utf8");
}

export async function listEvents(): Promise<EventOption[]> {
  return readAll();
}

export async function listActiveEvents(): Promise<EventOption[]> {
  const all = await readAll();
  return all.filter((e) => e.active);
}

export async function getEventLabelMap(): Promise<Map<string, string>> {
  const all = await readAll();
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

export async function saveEvents(events: EventOption[]): Promise<EventOption[]> {
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

    if (seen.has(id)) {
      id = `${id}-${randomUUID().slice(0, 6)}`;
    }
    seen.add(id);

    normalized.push({
      id,
      label,
      active: raw.active === false ? false : true,
    });
  }

  await writeAll(normalized);
  return normalized;
}

export async function addEvent(label: string): Promise<EventOption[]> {
  const text = label.trim();
  if (!text) throw new Error("Event name is required.");

  const events = await readAll();
  let id = slugify(text);
  if (events.some((e) => e.id === id)) {
    id = `${id}-${randomUUID().slice(0, 6)}`;
  }
  events.push({ id, label: text, active: true });
  await writeAll(events);
  return events;
}

export async function updateEvent(
  id: string,
  patch: { label?: string; active?: boolean }
): Promise<EventOption[]> {
  const events = await readAll();
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

  await writeAll(events);
  return events;
}

export async function deleteEvent(id: string): Promise<EventOption[]> {
  const events = await readAll();
  const next = events.filter((e) => e.id !== id);
  if (next.length === events.length) throw new Error("Event not found.");
  if (next.length === 0) {
    throw new Error("You must keep at least one event.");
  }
  await writeAll(next);
  return next;
}

export async function moveEvent(
  id: string,
  direction: "up" | "down"
): Promise<EventOption[]> {
  const events = await readAll();
  const idx = events.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error("Event not found.");

  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= events.length) return events;

  const tmp = events[idx];
  events[idx] = events[swapWith];
  events[swapWith] = tmp;
  await writeAll(events);
  return events;
}
