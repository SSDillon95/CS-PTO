/** Parent Teacher Organization volunteer / event signup categories */
export type SignupCategory =
  | "event"
  | "classroom"
  | "fundraising"
  | "hospitality"
  | "other";

export type SignupStatus = "confirmed" | "pending" | "cancelled";

export interface PtoEntry {
  id: string;
  name: string;
  email: string;
  phone: string;
  studentName: string;
  eventName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  type: SignupCategory;
  status: SignupStatus;
  notes: string;
  createdAt: string; // ISO
}

export interface PtoFormData {
  name: string;
  email: string;
  phone: string;
  studentName: string;
  eventName: string;
  startDate: string;
  endDate: string;
  type: SignupCategory;
  notes: string;
}

export const SIGNUP_CATEGORIES: { value: SignupCategory; label: string }[] = [
  { value: "event", label: "Event volunteer" },
  { value: "classroom", label: "Classroom help" },
  { value: "fundraising", label: "Fundraising" },
  { value: "hospitality", label: "Hospitality / snacks" },
  { value: "other", label: "Other" },
];

export const SIGNUP_STATUSES: { value: SignupStatus; label: string }[] = [
  { value: "confirmed", label: "Confirmed" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
];

/** @deprecated use SIGNUP_CATEGORIES */
export const PTO_TYPES = SIGNUP_CATEGORIES;
/** @deprecated use SIGNUP_STATUSES */
export const PTO_STATUSES = SIGNUP_STATUSES;

export type PtoType = SignupCategory;
export type PtoStatus = SignupStatus;
