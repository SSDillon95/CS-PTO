import nodemailer from "nodemailer";
import {
  GMAIL_SMTP_HOST,
  GMAIL_SMTP_PORT,
  resolveGmailCredentials,
} from "./gmail-config";

export async function testGmailSmtp(input: {
  username: string;
  password: string;
}): Promise<void> {
  const username = input.username.trim().toLowerCase();
  const password = input.password.trim();
  if (!username || !password) {
    throw new Error("Gmail address and password are required.");
  }

  const transporter = nodemailer.createTransport({
    host: GMAIL_SMTP_HOST,
    port: GMAIL_SMTP_PORT,
    secure: false,
    auth: { user: username, pass: password },
  });

  try {
    await transporter.verify();
  } catch (error) {
    throw new Error(
      `Gmail SMTP connection failed. If 2-Step Verification is on, use a Google App Password. ${
        (error as Error).message
      }`
    );
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

  const transporter = nodemailer.createTransport({
    host: credentials.smtpHost,
    port: credentials.smtpPort,
    secure: false,
    auth: {
      user: credentials.username,
      pass: credentials.password,
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
      error:
        error instanceof Error
          ? error.message
          : "Failed to send email via Gmail.",
    };
  }
}
