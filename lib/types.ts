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


export function eventLabel(id: string): string {
  return EVENTS.find((e) => e.id === id)?.label ?? id;
}
