import { Resend } from "resend";
import type { SignupFormData } from "./types";
import { NOTIFY_EMAILS, eventLabel } from "./types";

export function buildEmailHtml(data: SignupFormData): string {
  const eventsList = data.events
    .map((id) => `<li>${escapeHtml(eventLabel(id))}</li>`)
    .join("");

  return `
<!DOCTYPE html>
<html>
<body style="font-family: Georgia, 'Times New Roman', serif; color: #111; line-height: 1.5;">
  <div style="max-width: 560px; margin: 0 auto; border: 2px solid #c9a227; border-radius: 12px; overflow: hidden;">
    <div style="background: #111; color: #f5e6a8; padding: 20px 24px; text-align: center;">
      <div style="font-size: 22px; font-weight: bold; letter-spacing: 0.08em;">PTO SIGN UP</div>
      <div style="font-size: 13px; margin-top: 4px; color: #e8d48b;">Dorsey Attendance Center</div>
    </div>
    <div style="padding: 24px; background: #faf8f2;">
      <p style="margin: 0 0 16px;">A new volunteer signup was submitted:</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; width: 40%; vertical-align: top;">Name</td>
          <td style="padding: 8px 0;">${escapeHtml(data.name)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Phone Number</td>
          <td style="padding: 8px 0;">${escapeHtml(data.phone)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Child's Name &amp; Grade</td>
          <td style="padding: 8px 0;">${escapeHtml(data.childNameGrade)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Events to Help In</td>
          <td style="padding: 8px 0;"><ul style="margin: 0; padding-left: 18px;">${eventsList}</ul></td>
        </tr>
      </table>
      <p style="margin: 20px 0 0; font-size: 12px; color: #666;">
        Sent automatically from the Dorsey PTO Sign Up Sheet.
      </p>
    </div>
  </div>
</body>
</html>`.trim();
}

export function buildEmailText(data: SignupFormData): string {
  const events = data.events.map((id) => `  - ${eventLabel(id)}`).join("\n");
  return [
    "Dorsey Attendance Center PTO — New Volunteer Signup",
    "",
    `Name: ${data.name}`,
    `Phone Number: ${data.phone}`,
    `Child's Name & Grade: ${data.childNameGrade}`,
    "Events to Help In:",
    events,
    "",
    "Sent automatically from the Dorsey PTO Sign Up Sheet.",
  ].join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type SendResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

/**
 * Sends signup notification to all PTO board emails via Resend.
 * Requires RESEND_API_KEY. Optional RESEND_FROM (verified domain sender).
 */
export async function sendSignupNotification(
  data: SignupFormData
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error:
        "Email is not configured (missing RESEND_API_KEY). Signup was still recorded.",
    };
  }

  const from =
    process.env.RESEND_FROM?.trim() ||
    "Dorsey PTO <onboarding@resend.dev>";

  const resend = new Resend(apiKey);

  try {
    const { data: result, error } = await resend.emails.send({
      from,
      to: [...NOTIFY_EMAILS],
      subject: `PTO Signup: ${data.name} — ${data.events.map(eventLabel).join(", ")}`,
      html: buildEmailHtml(data),
      text: buildEmailText(data),
      replyTo: undefined,
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, id: result?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return { ok: false, error: message };
  }
}
