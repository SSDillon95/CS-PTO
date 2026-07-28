import { NextResponse } from "next/server";
import { createSession, getSession } from "@/lib/auth";
import {
  getAdminUsername,
  updateAdminCredentials,
} from "@/lib/admin-credentials";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const username = await getAdminUsername();
  return NextResponse.json({ ok: true, username });
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
    currentPassword?: unknown;
    newUsername?: unknown;
    newPassword?: unknown;
    confirmPassword?: unknown;
  };

  const currentPassword =
    typeof raw.currentPassword === "string" ? raw.currentPassword : "";
  const newUsername =
    typeof raw.newUsername === "string" ? raw.newUsername : "";
  const newPassword = typeof raw.newPassword === "string" ? raw.newPassword : "";
  const confirmPassword =
    typeof raw.confirmPassword === "string" ? raw.confirmPassword : "";

  if (!currentPassword) {
    return NextResponse.json(
      { error: "Current password is required." },
      { status: 400 }
    );
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { error: "New password and confirmation do not match." },
      { status: 400 }
    );
  }

  try {
    const result = await updateAdminCredentials({
      currentPassword,
      newUsername,
      newPassword,
    });
    // Refresh session with new username so admin stays logged in
    await createSession(result.username);
    return NextResponse.json({
      ok: true,
      username: result.username,
      message: "Username and password updated.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not update credentials.",
      },
      { status: 400 }
    );
  }
}
