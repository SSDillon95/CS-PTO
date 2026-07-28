import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import {
  getAdminUsername,
  verifyAdminCredentials,
} from "./admin-credentials";

const COOKIE_NAME = "dorsey_pto_admin";
const SESSION_DAYS = 7;

function sessionSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "dorsey-pto-session-secret-change-me"
  );
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function makeToken(username: string, exp: number): string {
  const payload = `${username}|${exp}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

function verifyToken(token: string): { username: string } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  let payload: string;
  try {
    payload = Buffer.from(body, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expected = sign(payload);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  const [username, expStr] = payload.split("|");
  const exp = Number(expStr);
  if (!username || !Number.isFinite(exp) || Date.now() > exp) return null;
  return { username };
}

export async function validateCredentials(
  username: string,
  password: string
): Promise<boolean> {
  return verifyAdminCredentials(username, password);
}

export async function createSession(username: string): Promise<void> {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const token = makeToken(username, exp);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSession(): Promise<{ username: string } | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireSession(): Promise<{ username: string } | null> {
  return getSession();
}

export { getAdminUsername };
