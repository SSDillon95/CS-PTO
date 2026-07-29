import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  clearGmailSettings,
  getGmailSetupStatus,
  saveDistributionEmails,
  saveGmailSettings,
  validateGmailUsername,
} from "@/lib/gmail-config";
import { testGmailSmtp } from "@/lib/gmail-send";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getGmailSetupStatus();
  return NextResponse.json({ ok: true, data: status });
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
    username?: string;
    password?: string;
    distributionEmails?: string[];
  };

  try {
    if (raw.action === "clear-gmail") {
      const status = await clearGmailSettings();
      return NextResponse.json({ ok: true, data: status });
    }

    if (raw.action === "save-distribution") {
      const emails = await saveDistributionEmails(
        Array.isArray(raw.distributionEmails) ? raw.distributionEmails : []
      );
      const status = await getGmailSetupStatus();
      return NextResponse.json({
        ok: true,
        data: { ...status, distributionEmails: emails },
      });
    }

    // Default: save Gmail credentials
    const username = validateGmailUsername(String(raw.username ?? ""));
    const { normalizeGmailAppPassword, resolveGmailCredentials } =
      await import("@/lib/gmail-config");
    const passwordInput = normalizeGmailAppPassword(
      String(raw.password ?? "")
    );
    const current = await getGmailSetupStatus();

    let password = passwordInput;
    if (!password && current.hasPassword) {
      // Keep existing password — re-read from saved config
      const creds = await resolveGmailCredentials();
      password = normalizeGmailAppPassword(creds.password || "");
    }

    if (!password) {
      return NextResponse.json(
        {
          error:
            "Gmail App Password is required. Create one at myaccount.google.com/apppasswords (not your normal Gmail password).",
        },
        { status: 400 }
      );
    }

    await testGmailSmtp({ username, password });
    const status = await saveGmailSettings({ username, password });
    return NextResponse.json({ ok: true, data: status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Save failed." },
      { status: 400 }
    );
  }
}
