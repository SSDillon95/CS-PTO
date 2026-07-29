import { NextResponse } from "next/server";
import { normalizePhoneDigits } from "@/lib/types";
import { findSignupByPhone } from "@/lib/signups-store";

export const dynamic = "force-dynamic";

/**
 * Public lookup for returning parents.
 * Requires a full phone number so data is only returned when the caller
 * already knows the number on file.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const raw =
    body && typeof body === "object"
      ? (body as { phone?: unknown }).phone
      : undefined;
  const phone = typeof raw === "string" ? raw.trim() : "";
  const digits = normalizePhoneDigits(phone);

  if (digits.length < 10) {
    return NextResponse.json(
      { found: false, error: "Enter a full phone number to look up." },
      { status: 400 }
    );
  }

  try {
    const match = await findSignupByPhone(phone);
    if (!match) {
      return NextResponse.json({ found: false });
    }
    return NextResponse.json({ found: true, match });
  } catch {
    return NextResponse.json(
      { found: false, error: "Lookup failed." },
      { status: 500 }
    );
  }
}
