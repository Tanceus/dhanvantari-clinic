/**
 * Maps FastAPI/Supabase snake_case rows onto the Cycle 0 frontend types
 * (camelCase) so hooks and screens keep their existing contract.
 *
 * The live schema drifted from the mock types (no gender column, treatment_id
 * instead of treatmentType, kind instead of type, etc.). Mapping lives here
 * rather than in components.
 */

import type {
  Appointment,
  AppointmentStatus,
  ConsentStatus,
  CreateAppointmentInput,
  CreatePatientInput,
  Message,
  MessageStatus,
  MessageType,
  Patient,
  Prakriti,
} from "../../types";
import type {
  ApiAppointment,
  ApiMessage,
  ApiPatient,
  ApiTreatment,
} from "./types";

const PRAKRITI_VALUES: readonly Prakriti[] = [
  "Vata",
  "Pitta",
  "Kapha",
  "Vata-Pitta",
  "Pitta-Kapha",
  "Vata-Kapha",
];

export interface Treatment {
  id: string;
  clinicId: string;
  name: string;
  priceInr: number | null;
  durationMinutes: number | null;
  isPanchakarma: boolean | null;
  typicalSessions: number | null;
  aftercareNotes: string | null;
  active: boolean | null;
}

function ageFromDob(dob: string | null): number {
  if (!dob) return 0;
  const birth = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return Math.max(0, age);
}

export function dobFromAge(age: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function asPrakriti(value: string | null): Prakriti {
  if (value && PRAKRITI_VALUES.includes(value as Prakriti)) {
    return value as Prakriti;
  }
  return "" as Prakriti;
}

function asConsent(value: string | null): ConsentStatus {
  return value?.toLowerCase() === "granted" ? "granted" : "pending";
}

function lastVisitOf(row: ApiPatient): string {
  return (
    row.last_visit_date ||
    row.first_visit_date ||
    (row.created_at ? row.created_at.slice(0, 10) : "") ||
    new Date().toISOString().slice(0, 10)
  );
}

export function mapPatient(row: ApiPatient): Patient {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    name: row.name,
    age: ageFromDob(row.date_of_birth),
    gender: "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    prakriti: asPrakriti(row.prakriti),
    primaryConcern: row.notes ?? "",
    lastVisit: lastVisitOf(row),
    consentStatus: asConsent(row.consent_status),
    consentDate: row.consent_granted_at
      ? row.consent_granted_at.slice(0, 10)
      : null,
  };
}

export function toPatientCreate(draft: CreatePatientInput): Record<string, unknown> {
  return {
    name: draft.name,
    phone: draft.phone,
    email: draft.email || null,
    date_of_birth: dobFromAge(draft.age),
    prakriti: draft.prakriti,
    notes: draft.primaryConcern || null,
  };
}

export function toPatientConsentPatch(
  draft: CreatePatientInput,
): Record<string, unknown> | null {
  if (!draft.consentStatus) return null;
  return {
    consent_status: draft.consentStatus,
    consent_granted_at:
      draft.consentStatus === "granted"
        ? (draft.consentDate ?? new Date().toISOString())
        : null,
  };
}

export function mapAppointment(
  row: ApiAppointment,
  treatmentName = "",
): Appointment {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    datetime: row.scheduled_at,
    treatmentType: treatmentName || "",
    treatmentId: row.treatment_id ?? "",
    status: mapAppointmentStatus(row.status),
    notes: row.notes ?? "",
  };
}

export function mapAppointmentStatus(status: string): AppointmentStatus {
  switch (status) {
    case "scheduled":
    case "checked-in":
    case "completed":
    case "cancelled":
      return status;
    case "no_show":
      return "cancelled";
    default:
      return "scheduled";
  }
}

export function toAppointmentCreate(
  draft: CreateAppointmentInput,
  treatmentId: string,
): Record<string, unknown> {
  return {
    patient_id: draft.patientId,
    treatment_id: treatmentId,
    scheduled_at: draft.datetime,
    notes: draft.notes || null,
  };
}

export function toAppointmentUpdate(
  draft: CreateAppointmentInput,
  treatmentId: string,
): Record<string, unknown> {
  return {
    treatment_id: treatmentId,
    scheduled_at: draft.datetime,
    notes: draft.notes || null,
    status: draft.status,
  };
}

export function mapTreatment(row: ApiTreatment): Treatment {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    name: row.name,
    priceInr: row.price_inr,
    durationMinutes: row.duration_minutes,
    isPanchakarma: row.is_panchakarma,
    typicalSessions: row.typical_sessions,
    aftercareNotes: row.aftercare_notes,
    active: row.active,
  };
}

const KIND_TO_TYPE: Record<string, MessageType> = {
  reminder_24h: "reminder",
  reminder_2h: "reminder",
  aftercare: "care-instruction",
  care_instruction: "care-instruction",
  panchakarma_continuity: "care-instruction",
  recall: "follow-up",
  reactivation: "follow-up",
  follow_up: "follow-up",
  no_show_recovery: "follow-up",
  birthday: "follow-up",
};

export function messageTypeToKind(type: MessageType): string {
  switch (type) {
    case "reminder":
      return "reminder_24h";
    case "care-instruction":
      return "aftercare";
    case "follow-up":
      return "recall";
  }
}

export function mapMessageType(kind: string): MessageType {
  return KIND_TO_TYPE[kind] ?? "reminder";
}

export function mapMessageStatus(status: string): MessageStatus {
  switch (status) {
    case "sent":
      return "sent";
    case "failed":
    case "skipped":
      return "failed";
    case "queued":
    case "draft":
    default:
      return "draft";
  }
}

function subjectFromBody(body: string, kind: string): string {
  const line = body.split(/\n/)[0]?.trim() ?? "";
  if (line) return line.length > 90 ? `${line.slice(0, 87)}…` : line;
  return kind.replace(/_/g, " ");
}

export function mapMessage(row: ApiMessage): Message {
  const body = row.body ?? "";
  const subject = subjectFromBody(body, row.kind);
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id ?? "",
    type: mapMessageType(row.kind),
    channel: "email",
    status: mapMessageStatus(row.status),
    preview: subject,
    subject,
    body,
    appointmentId: row.appointment_id,
    generatedAt: row.created_at ?? new Date().toISOString(),
    sentAt: row.sent_at,
    skipReason: row.skip_reason,
  };
}

export function matchTreatmentId(
  treatments: Treatment[],
  treatmentType: string,
): string | undefined {
  const needle = treatmentType.trim().toLowerCase();
  if (!needle) return undefined;
  const exact = treatments.find((t) => t.name.toLowerCase() === needle);
  if (exact) return exact.id;
  const partial = treatments.find(
    (t) =>
      t.name.toLowerCase().includes(needle) ||
      needle.includes(t.name.toLowerCase()),
  );
  return partial?.id;
}
