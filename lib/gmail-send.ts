import nodemailer from "nodemailer";
import {
  GMAIL_SMTP_HOST,
  GMAIL_SMTP_PORT,
  normalizeGmailAppPassword,
  resolveGmailCredentials,
} from "./gmail-config";

function formatGmailAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  const isBadCredentials =
    lower.includes("invalid login") ||
    lower.includes("badcredentials") ||
    lower.includes("username and password not accepted") ||
    lower.includes("535-5.7.8") ||
    lower.includes("535 5.7.8");

  if (isBadCredentials) {
    return [
      "Gmail rejected the username/password (Invalid login).",
      "Google no longer accepts your normal Gmail password for apps.",
      "Use a 16-character App Password instead:",
      "1) Turn on 2-Step Verification for this Google account",
      "2) Open https://myaccount.google.com/apppasswords",
      "3) Create an app password (name it “Dorsey PTO”)",
      "4) Paste that 16-character code here (spaces are OK)",
      "If this is a school/Workspace account, an admin may need to allow App Passwords.",
    ].join(" ");
  }

  return `Gmail SMTP connection failed. ${message}`;
}

export async function testGmailSmtp(input: {
  username: string;
  password: string;
}): Promise<void> {
  const username = input.username.trim().toLowerCase();
  const password = normalizeGmailAppPassword(input.password);
  if (!username || !password) {
    throw new Error("Gmail address and password are required.");
  }
  // Normal Gmail passwords are rejected by Google for SMTP; App Passwords are 16 chars.
  if (password.length !== 16) {
    throw new Error(
      "Use a Google App Password (exactly 16 characters from myaccount.google.com/apppasswords). Your normal Gmail sign-in password will not work."
    );
  }

  const transporter = nodemailer.createTransport({
    host: GMAIL_SMTP_HOST,
    port: GMAIL_SMTP_PORT,
    secure: false,
    requireTLS: true,
    auth: { user: username, pass: password },
  });

  try {
    await transporter.verify();
  } catch (error) {
    throw new Error(formatGmailAuthError(error));
  }
}

export async function sendViaGmail(input: {
  to: string[];
  subject: string;
  html: string;
  text: string;
}): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const credentials = await resolveGmailCredentials();
  if (!credentials.username || !credentials.password) {
    return { ok: false, error: "Gmail is not configured." };
  }

  const password = normalizeGmailAppPassword(credentials.password);

  const transporter = nodemailer.createTransport({
    host: credentials.smtpHost,
    port: credentials.smtpPort,
    secure: false,
    requireTLS: true,
    auth: {
      user: credentials.username,
      pass: password,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `Dorsey PTO <${credentials.fromAddress || credentials.username}>`,
      to: input.to.join(", "),
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return { ok: true, id: info.messageId };
  } catch (error) {
    return {
      ok: false,
      error: formatGmailAuthError(error),
    };
  }
}
