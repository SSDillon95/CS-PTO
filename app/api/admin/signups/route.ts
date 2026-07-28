import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  deleteSignup,
  listSignups,
  signupsToCsv,
} from "@/lib/signups-store";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await listSignups();
  const { searchParams } = new URL(request.url);
  if (searchParams.get("format") === "csv") {
    const csv = signupsToCsv(entries);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="dorsey-pto-signups.csv"`,
      },
    });
  }

  return NextResponse.json({ entries });
}

export async function DELETE(request: Request) {
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

  const id =
    body && typeof body === "object" && "id" in body
      ? String((body as { id: unknown }).id)
      : "";
  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  const ok = await deleteSignup(id);
  if (!ok) {
    return NextResponse.json({ error: "Signup not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
