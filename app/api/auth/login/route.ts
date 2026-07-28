import { NextResponse } from "next/server";
import { createSession, validateCredentials } from "@/lib/auth";
import { getAdminUsername } from "@/lib/admin-credentials";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const raw = body as { username?: unknown; password?: unknown };
  const username = typeof raw.username === "string" ? raw.username : "";
  const password = typeof raw.password === "string" ? raw.password : "";

  if (!(await validateCredentials(username, password))) {
    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 401 }
    );
  }

  // Use canonical stored username casing
  const canonical = await getAdminUsername();
  const sessionUser =
    username.trim().toLowerCase() === canonical.toLowerCase()
      ? canonical
      : username.trim();

  await createSession(sessionUser);
  return NextResponse.json({ ok: true, username: sessionUser });
}
