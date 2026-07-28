export const EVENTS = [
  {
    id: "bulldog-bites",
    label: "Bulldog Bites - During School Day",
  },
  {
    id: "fall-festival",
    label: "Fall Festival - After School",
  },
  {
    id: "bulldog-boutique",
    label: "Bulldog Boutique - During School Day",
  },
  {
    id: "additional",
    label: "Additional Events - During & After School Hours",
  },
] as const;

export type EventId = (typeof EVENTS)[number]["id"];

export interface SignupFormData {
  name: string;
  phone: string;
  childNameGrade: string;
  events: EventId[];
}

export interface SignupEntry extends SignupFormData {
  id: string;
  eventLabels: string[];
  createdAt: string;
  emailSent: boolean;
}

/** PTO board emails notified on every completed signup */
export const NOTIFY_EMAILS = [
  "carlsheppard1392@gmail.com",
  "hspenser@itawambacountyschools.com",
  "mhmitchell@itawambacountyschools.com",
  "kameroneskew@yahoo.com",
] as const;

export function eventLabel(id: string): string {
  return EVENTS.find((e) => e.id === id)?.label ?? id;
}
