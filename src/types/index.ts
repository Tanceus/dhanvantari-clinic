/**
 * Shared domain types contract.
 *
 * These shapes are the single import surface for Clinic/ClinicConfig, Patient,
 * Appointment, Message, and related enums/unions. The Supabase schema (Cycle 1)
 * and FastAPI response models (Cycle 2) must match this contract. That is what
 * keeps frontend and backend in sync when mock data is swapped for real APIs
 * in Cycle 5.
 *
 * Do not change field names casually — they mirror future DB columns.
 * Import from `../types` (or `../../types`) only; do not redefine these elsewhere.
 */

// --- Enums / unions ---------------------------------------------------------

export type Prakriti =
  | "Vata"
  | "Pitta"
  | "Kapha"
  | "Vata-Pitta"
  | "Pitta-Kapha"
  | "Vata-Kapha";

export type ConsentStatus = "granted" | "pending";

export type AppointmentStatus =
  | "scheduled"
  | "checked-in"
  | "completed"
  | "cancelled";

export type MessageType = "reminder" | "care-instruction" | "follow-up";

export type MessageStatus = "draft" | "sent" | "failed";

export type MessageChannel = "email";

// --- Clinic / tenant identity (see also src/config/clinics.ts) --------------

export interface ClinicContact {
  phone: string;
  email: string;
  address: string;
  website: string;
}

export interface ClinicBranding {
  logoText: string;
  primaryColor: string;
  accentColor: string;
}

export interface ClinicConfig {
  clinicId: string;
  name: string;
  doctorName: string;
  tagline: string;
  contact: ClinicContact;
  branding: ClinicBranding;
  treatmentTypes: string[];
  locale: string;
  timezone: string;
}

// --- Patient ----------------------------------------------------------------

export interface Patient {
  id: string;
  clinicId: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  prakriti: Prakriti;
  primaryConcern: string;
  lastVisit: string;
  consentStatus: ConsentStatus;
  consentDate: string | null;
}

export type CreatePatientInput = Omit<
  Patient,
  "id" | "clinicId" | "lastVisit"
> & {
  lastVisit?: string;
};

// --- Appointment ------------------------------------------------------------

export interface Appointment {
  id: string;
  clinicId: string;
  patientId: string;
  datetime: string;
  treatmentType: string;
  /** Live treatments.id. Empty when the API row has no treatment_id. */
  treatmentId: string;
  status: AppointmentStatus;
  notes: string;
}

export type CreateAppointmentInput = Omit<Appointment, "id" | "clinicId">;

// --- Message ----------------------------------------------------------------

export interface Message {
  id: string;
  clinicId: string;
  patientId: string;
  type: MessageType;
  channel: MessageChannel;
  status: MessageStatus;
  preview: string;
  subject: string;
  body: string;
  appointmentId: string | null;
  generatedAt: string;
  sentAt: string | null;
  /** Backend skip gate, e.g. no_consent / duplicate. Null when not skipped. */
  skipReason: string | null;
}

export type UpdateMessageInput = Pick<Message, "subject" | "body">;

// --- Dashboard --------------------------------------------------------------

export interface DashboardStats {
  todaysAppointments: number;
  patientsSeenToday: number;
  messagesAwaitingReview: number;
  newPatientsThisWeek: number;
}
