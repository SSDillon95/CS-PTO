import { NextResponse } from "next/server";
import { EVENTS, type EventId, type SignupFormData } from "@/lib/types";
import { sendSignupNotification } from "@/lib/email";
import { addSignup } from "@/lib/signups-store";

const EVENT_IDS = new Set(EVENTS.map((e) => e.id));

function isEventId(v: unknown): v is EventId {
  return typeof v === "string" && EVENT_IDS.has(v as EventId);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const phone = typeof raw.phone === "string" ? raw.phone.trim() : "";
  const childNameGrade =
    typeof raw.childNameGrade === "string" ? raw.childNameGrade.trim() : "";
  const eventsRaw = Array.isArray(raw.events) ? raw.events : [];
  const events = eventsRaw.filter(isEventId);

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json(
      { error: "Phone number is required." },
      { status: 400 }
    );
  }
  if (!childNameGrade) {
    return NextResponse.json(
      { error: "Child's name & grade is required." },
      { status: 400 }
    );
  }
  if (events.length === 0) {
    return NextResponse.json(
      { error: "Select at least one event to help with." },
      { status: 400 }
    );
  }

  const data: SignupFormData = { name, phone, childNameGrade, events };
  const emailResult = await sendSignupNotification(data);

  let entryId: string | undefined;
  try {
    const entry = await addSignup(data, emailResult.ok);
    entryId = entry.id;
  } catch {
    // still return success for the volunteer if email/store partially works
  }

  return NextResponse.json({
    ok: true,
    id: entryId,
    emailSent: emailResult.ok,
    emailError: emailResult.ok ? undefined : emailResult.error,
    emailId: emailResult.ok ? emailResult.id : undefined,
  });
}

