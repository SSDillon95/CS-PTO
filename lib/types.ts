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
