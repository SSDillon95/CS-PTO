import { DEFAULT_DISTRIBUTION_EMAILS } from "./types";
import { ensureSchema, kvDelete, kvGet, kvSet } from "./db";

export const GMAIL_SMTP_HOST = "smtp.gmail.com";
export const GMAIL_SMTP_PORT = 587;

const KV_GMAIL = "gmail_settings";
const KV_DISTRIBUTION = "distribution_emails";

export interface GmailSettings {
  username: string;
  password: string;
  fromAddress: string;
  smtpHost: string;
  smtpPort: number;
  updatedAt: string | null;
}

export interface EmailDistributionConfig {
  gmail: GmailSettings | null;
  distributionEmails: string[];
}

export interface GmailSetupStatus {
  username: string;
  hasPassword: boolean;
  configured: boolean;
  configSource: "saved" | "environment" | "none";
  smtpHost: string;
  smtpPort: number;
  fromAddress: string;
  updatedAt: string | null;
  distributionEmails: string[];
}

function uniqueEmails(emails: string[]): string[] {
  return [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
}

export function validateEmail(email: string): string {
  const value = email.trim().toLowerCase();
  if (!value) throw new Error("Email is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error(`Invalid email address: ${email}`);
  }
  return value;
}

export function validateGmailUsername(username: string): string {
  return validateEmail(username);
}

/** Google shows App Passwords as "xxxx xxxx xxxx xxxx" — SMTP needs the 16 chars only. */
export function normalizeGmailAppPassword(password: string): string {
  return password.replace(/\s+/g, "").trim();
}

async function loadConfig(): Promise<EmailDistributionConfig> {
  await ensureSchema();

  let gmail: GmailSettings | null = null;
  const gmailRaw = await kvGet(KV_GMAIL);
  if (gmailRaw) {
    try {
      gmail = JSON.parse(gmailRaw) as GmailSettings;
    } catch {
      gmail = null;
    }
  }

  let distributionEmails: string[] = [...DEFAULT_DISTRIBUTION_EMAILS];
  const distRaw = await kvGet(KV_DISTRIBUTION);
  if (distRaw) {
    try {
      const parsed = JSON.parse(distRaw) as string[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        distributionEmails = uniqueEmails(parsed);
      }
    } catch {
      // keep defaults
    }
  }

  return { gmail, distributionEmails };
}

export async function loadEmailConfig(): Promise<EmailDistributionConfig> {
  return loadConfig();
}

export async function saveEmailConfig(
  config: EmailDistributionConfig
): Promise<void> {
  await ensureSchema();
  if (config.gmail) {
    await kvSet(KV_GMAIL, JSON.stringify(config.gmail));
  } else {
    await kvDelete(KV_GMAIL);
  }
  await kvSet(
    KV_DISTRIBUTION,
    JSON.stringify(
      config.distributionEmails.length > 0
        ? config.distributionEmails
        : [...DEFAULT_DISTRIBUTION_EMAILS]
    )
  );
}

export async function getDistributionEmails(): Promise<string[]> {
  const config = await loadConfig();
  return config.distributionEmails.length > 0
    ? config.distributionEmails
    : [...DEFAULT_DISTRIBUTION_EMAILS];
}

export async function resolveGmailCredentials(): Promise<{
  username: string | null;
  password: string | null;
  fromAddress: string | null;
  smtpHost: string;
  smtpPort: number;
  source: "saved" | "environment" | "none";
  updatedAt: string | null;
}> {
  const config = await loadConfig();
  if (config.gmail?.username?.trim() && config.gmail.password?.trim()) {
    return {
      username: config.gmail.username.trim(),
      password: config.gmail.password.trim(),
      fromAddress:
        config.gmail.fromAddress?.trim() || config.gmail.username.trim(),
      smtpHost: config.gmail.smtpHost || GMAIL_SMTP_HOST,
      smtpPort: config.gmail.smtpPort || GMAIL_SMTP_PORT,
      source: "saved",
      updatedAt: config.gmail.updatedAt,
    };
  }

  const username = process.env.GMAIL_USERNAME?.trim() ?? null;
  const password = process.env.GMAIL_PASSWORD?.trim() ?? null;
  if (username && password) {
    return {
      username,
      password,
      fromAddress: username,
      smtpHost: GMAIL_SMTP_HOST,
      smtpPort: GMAIL_SMTP_PORT,
      source: "environment",
      updatedAt: null,
    };
  }

  return {
    username: null,
    password: null,
    fromAddress: null,
    smtpHost: GMAIL_SMTP_HOST,
    smtpPort: GMAIL_SMTP_PORT,
    source: "none",
    updatedAt: null,
  };
}

export async function getGmailSetupStatus(): Promise<GmailSetupStatus> {
  const config = await loadConfig();
  const credentials = await resolveGmailCredentials();

  return {
    username:
      config.gmail?.username?.trim() ||
      (credentials.source === "environment"
        ? process.env.GMAIL_USERNAME?.trim() ?? ""
        : ""),
    hasPassword: Boolean(
      config.gmail?.password?.trim() ||
        (credentials.source === "environment" &&
          process.env.GMAIL_PASSWORD?.trim())
    ),
    configured: credentials.source !== "none",
    configSource: credentials.source,
    smtpHost: credentials.smtpHost,
    smtpPort: credentials.smtpPort,
    fromAddress: credentials.fromAddress || "",
    updatedAt: credentials.updatedAt,
    distributionEmails: config.distributionEmails,
  };
}

export async function saveGmailSettings(input: {
  username: string;
  password: string;
}): Promise<GmailSetupStatus> {
  const username = validateGmailUsername(input.username);
  const password = normalizeGmailAppPassword(input.password);
  if (!password) throw new Error("Gmail App Password is required.");
  if (password.length !== 16) {
    throw new Error(
      "Google App Passwords are exactly 16 characters. Create one at myaccount.google.com/apppasswords — do not use your normal Gmail password."
    );
  }

  const config = await loadConfig();
  config.gmail = {
    username,
    password,
    fromAddress: username,
    smtpHost: GMAIL_SMTP_HOST,
    smtpPort: GMAIL_SMTP_PORT,
    updatedAt: new Date().toISOString(),
  };
  await saveEmailConfig(config);
  return getGmailSetupStatus();
}

export async function clearGmailSettings(): Promise<GmailSetupStatus> {
  const config = await loadConfig();
  config.gmail = null;
  await saveEmailConfig(config);
  return getGmailSetupStatus();
}

export async function saveDistributionEmails(
  emails: string[]
): Promise<string[]> {
  const normalized = uniqueEmails(emails.map(validateEmail));
  if (normalized.length === 0) {
    throw new Error("Add at least one distribution email.");
  }
  const config = await loadConfig();
  config.distributionEmails = normalized;
  await saveEmailConfig(config);
  return config.distributionEmails;
}
