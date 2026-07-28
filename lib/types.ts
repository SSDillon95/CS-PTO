export type PtoType = "vacation" | "sick" | "personal" | "other";

export type PtoStatus = "scheduled" | "pending" | "cancelled";

export interface PtoEntry {
  id: string;
  name: string;
  email: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  type: PtoType;
  status: PtoStatus;
  notes: string;
  createdAt: string; // ISO
}

export interface PtoFormData {
  name: string;
  email: string;
  startDate: string;
  endDate: string;
  type: PtoType;
  notes: string;
}

export const PTO_TYPES: { value: PtoType; label: string }[] = [
  { value: "vacation", label: "Vacation" },
  { value: "sick", label: "Sick" },
  { value: "personal", label: "Personal" },
  { value: "other", label: "Other" },
];

export const PTO_STATUSES: { value: PtoStatus; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
];
