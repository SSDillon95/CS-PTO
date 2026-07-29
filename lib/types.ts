export interface EventOption {
  id: string;
  label: string;
  /** When false, hidden from the public form (kept for existing signups). Default true. */
  active: boolean;
}

export const DEFAULT_EVENTS: EventOption[] = [
  {
    id: "bulldog-bites",
    label: "Bulldog Bites - During School Day",
    active: true,
  },
  {
    id: "fall-festival",
    label: "Fall Festival - After School",
    active: true,
  },
  {
    id: "bulldog-boutique",
    label: "Bulldog Boutique - During School Day",
    active: true,
  },
  {
    id: "additional",
    label: "Additional Events - During & After School Hours",
    active: true,
  },
];

/** @deprecated use DEFAULT_EVENTS / listEvents() */
export const EVENTS = DEFAULT_EVENTS;

export type EventId = string;

export const MAX_CHILDREN = 4;

export interface ChildEntry {
  name: string;
  grade: string;
}

export interface SignupFormData {
  name: string;
  phone: string;
  children: ChildEntry[];
  events: EventId[];
}

export interface SignupEntry extends SignupFormData {
  id: string;
  /** Formatted display string for all children (also used for legacy rows). */
  childNameGrade: string;
  eventLabels: string[];
  createdAt: string;
  emailSent: boolean;
}

export function formatChildren(children: ChildEntry[]): string {
  return children
    .map((c) => {
      const name = c.name.trim();
      const grade = c.grade.trim();
      if (!name && !grade) return "";
      if (name && grade) return `${name} — ${grade}`;
      return name || grade;
    })
    .filter(Boolean)
    .join("; ");
}

export function normalizeChildren(input: unknown): ChildEntry[] {
  if (!Array.isArray(input)) return [];
  const out: ChildEntry[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const raw = item as { name?: unknown; grade?: unknown };
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    const grade = typeof raw.grade === "string" ? raw.grade.trim() : "";
    if (!name && !grade) continue;
    out.push({ name, grade });
    if (out.length >= MAX_CHILDREN) break;
  }
  return out;
}

/** Digits-only phone key for matching (US-friendly last 10). */
export function normalizePhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

export function phonesMatch(a: string, b: string): boolean {
  const da = normalizePhoneDigits(a);
  const db = normalizePhoneDigits(b);
  if (da.length < 7 || db.length < 7) return false;
  if (da === db) return true;
  // Allow match when one has country code / extension formatting differences
  return da.endsWith(db) || db.endsWith(da);
}

/** Public-safe profile returned for returning-parent lookup. */
export interface ParentMatch {
  name: string;
  phone: string;
  children: ChildEntry[];
  events: EventId[];
  eventLabels: string[];
}

/** Default PTO board emails for form entry distribution */
export const DEFAULT_DISTRIBUTION_EMAILS = [
  "carlsheppard1392@gmail.com",
  "hspenser@itawambacountyschools.com",
  "mhmitchell@itawambacountyschools.com",
  "kameroneskew@yahoo.com",
] as const;

/** @deprecated use DEFAULT_DISTRIBUTION_EMAILS / getDistributionEmails() */
export const NOTIFY_EMAILS = DEFAULT_DISTRIBUTION_EMAILS;

export interface DistributionContact {
  email: string;
  label?: string;
}

/** Named contacts for the admin distribution list display */
export const DISTRIBUTION_CONTACTS: DistributionContact[] = [
  { email: "carlsheppard1392@gmail.com", label: "Carl Sheppard" },
  { email: "hspenser@itawambacountyschools.com", label: "H. Spenser" },
  { email: "mhmitchell@itawambacountyschools.com", label: "M.H. Mitchell" },
  { email: "kameroneskew@yahoo.com", label: "Kameron Eskew" },
];
