import { NextResponse } from "next/server";
import { listActiveEvents } from "@/lib/events-store";

export const dynamic = "force-dynamic";

/** Public: active events shown on the signup form */
export async function GET() {
  const events = await listActiveEvents();
  return NextResponse.json({ events });
}
