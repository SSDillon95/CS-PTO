import { promises as fs } from "fs";
import path from "path";
import { DEFAULT_DISTRIBUTION_EMAILS } from "./types";

export const GMAIL_SMTP_HOST = "smtp.gmail.com";
export const GMAIL_SMTP_PORT = 587;

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

function configPath(): string {
  if (process.env.VERCEL) {
    return path.join("/tmp", "dorsey-pto-gmail-config.json");
  }
  return path.join(process.cwd(), "data", "gmail-config.json");
}

function emptyConfig(): EmailDistributionConfig {
  return {
    gmail: null,
    distributionEmails: [...DEFAULT_DISTRIBUTION_EMAILS],
  };
}

export async function loadEmailConfig(): Promise<EmailDistributionConfig> {
  try {
    const raw = await fs.readFile(configPath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<EmailDistributionConfig>;
    const emails = Array.isArray(parsed.distributionEmails)
      ? parsed.distributionEmails
          .filter((e): e is string => typeof e === "string")
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean)
      : [...DEFAULT_DISTRIBUTION_EMAILS];

    return {
      gmail: parsed.gmail ?? null,
      distributionEmails:
        emails.length > 0 ? uniqueEmails(emails) : [...DEFAULT_DISTRIBUTION_EMAILS],
    };
  } catch {
    return emptyConfig();
  }
}

export async function saveEmailConfig(
  config: EmailDistributionConfig
): Promise<void> {
  const file = configPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(config, null, 2), "utf8");
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
  const email = validateEmail(username);
  return email;
}

export async function getDistributionEmails(): Promise<string[]> {
  const config = await loadEmailConfig();
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
  const config = await loadEmailConfig();
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
  const config = await loadEmailConfig();
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
  const password = input.password.trim();
  if (!password) throw new Error("Gmail password / App Password is required.");

  const config = await loadEmailConfig();
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
  const config = await loadEmailConfig();
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
  const config = await loadEmailConfig();
  config.distributionEmails = normalized;
  await saveEmailConfig(config);
  return config.distributionEmails;
}
