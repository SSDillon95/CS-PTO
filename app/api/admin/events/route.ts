import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  addEvent,
  deleteEvent,
  listEvents,
  moveEvent,
  saveEvents,
  updateEvent,
} from "@/lib/events-store";
import type { EventOption } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const events = await listEvents();
  return NextResponse.json({ events });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const raw = body as {
    action?: string;
    id?: string;
    label?: string;
    active?: boolean;
    direction?: "up" | "down";
    events?: EventOption[];
  };

  try {
    let events: EventOption[];
    let signupsUpdated: number | undefined;

    switch (raw.action) {
      case "add":
        events = await addEvent(String(raw.label ?? ""));
        break;
      case "update":
        events = await updateEvent(String(raw.id ?? ""), {
          label: raw.label,
          active: raw.active,
        });
        break;
      case "delete": {
        const result = await deleteEvent(String(raw.id ?? ""));
        events = result.events;
        signupsUpdated = result.signupsUpdated;
        break;
      }
      case "move":
        if (raw.direction !== "up" && raw.direction !== "down") {
          return NextResponse.json(
            { error: "direction must be up or down." },
            { status: 400 }
          );
        }
        events = await moveEvent(String(raw.id ?? ""), raw.direction);
        break;
      case "replace":
        events = await saveEvents(Array.isArray(raw.events) ? raw.events : []);
        break;
      default:
        return NextResponse.json(
          { error: "Unknown action." },
          { status: 400 }
        );
    }

    return NextResponse.json({
      ok: true,
      events,
      ...(signupsUpdated !== undefined ? { signupsUpdated } : {}),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed." },
      { status: 400 }
    );
  }
}
