import { promises as fs } from "fs";
import path from "path";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export const DEFAULT_ADMIN_USERNAME =
  process.env.ADMIN_USERNAME?.trim() || "Hopalong";
export const DEFAULT_ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD?.trim() || "Cassity";

interface StoredCredentials {
  username: string;
  /** scrypt hash: salt:hash (hex) */
  passwordHash: string;
  updatedAt: string;
}

function storePath(): string {
  if (process.env.VERCEL) {
    return path.join("/tmp", "dorsey-pto-admin-credentials.json");
  }
  return path.join(process.cwd(), "data", "admin-credentials.json");
}

function hashPassword(password: string, salt?: Buffer): string {
  const s = salt ?? randomBytes(16);
  const hash = scryptSync(password, s, 64);
  return `${s.toString("hex")}:${hash.toString("hex")}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const actual = scryptSync(password, salt, expected.length);
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  } catch {
    return false;
  }
}

async function readStored(): Promise<StoredCredentials | null> {
  try {
    const raw = await fs.readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<StoredCredentials>;
    if (
      typeof parsed.username === "string" &&
      parsed.username.trim() &&
      typeof parsed.passwordHash === "string" &&
      parsed.passwordHash.includes(":")
    ) {
      return {
        username: parsed.username.trim(),
        passwordHash: parsed.passwordHash,
        updatedAt: parsed.updatedAt || "",
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function writeStored(creds: StoredCredentials): Promise<void> {
  const file = storePath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(creds, null, 2), "utf8");
}

export async function getAdminUsername(): Promise<string> {
  const stored = await readStored();
  return stored?.username || DEFAULT_ADMIN_USERNAME;
}

export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const stored = await readStored();
  const user = username.trim();

  if (stored) {
    return (
      user.toLowerCase() === stored.username.toLowerCase() &&
      verifyPassword(password, stored.passwordHash)
    );
  }

  // Defaults / env (plain comparison for bootstrap credentials)
  return (
    user === DEFAULT_ADMIN_USERNAME && password === DEFAULT_ADMIN_PASSWORD
  );
}

export async function updateAdminCredentials(input: {
  currentPassword: string;
  newUsername: string;
  newPassword: string;
}): Promise<{ username: string }> {
  const newUsername = input.newUsername.trim();
  if (!newUsername) {
    throw new Error("Username is required.");
  }
  if (newUsername.length < 2) {
    throw new Error("Username must be at least 2 characters.");
  }
  if (!input.newPassword || input.newPassword.length < 4) {
    throw new Error("Password must be at least 4 characters.");
  }

  const currentUser = await getAdminUsername();
  const ok = await verifyAdminCredentials(currentUser, input.currentPassword);
  if (!ok) {
    throw new Error("Current password is incorrect.");
  }

  const creds: StoredCredentials = {
    username: newUsername,
    passwordHash: hashPassword(input.newPassword),
    updatedAt: new Date().toISOString(),
  };
  await writeStored(creds);
  return { username: newUsername };
}
