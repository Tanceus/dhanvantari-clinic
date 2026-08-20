/** Snake_case shapes returned by the FastAPI/Pydantic models. */

export interface ApiPatient {
  id: string;
  clinic_id: string;
  name: string;
  phone: string;
  email: string | null;
  date_of_birth: string | null;
  prakriti: string | null;
  notes: string | null;
  visit_count: number | null;
  first_visit_date: string | null;
  last_visit_date: string | null;
  next_recall_date: string | null;
  consent_status: string | null;
  consent_granted_at: string | null;
  consent_withdrawn_at: string | null;
  consent_source: string | null;
  is_deleted?: boolean;
  created_at: string | null;
}

export interface ApiAppointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  treatment_id: string | null;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string;
  no_show_marked_at: string | null;
  rescheduled_from: string | null;
  amount_inr: number | null;
  notes: string | null;
  created_at: string | null;
}

export interface ApiMessage {
  id: string;
  clinic_id: string;
  patient_id: string | null;
  appointment_id: string | null;
  kind: string;
  channel: string | null;
  recipient: string | null;
  body: string | null;
  status: string;
  skip_reason: string | null;
  provider_message_id: string | null;
  error: string | null;
  scheduled_for: string | null;
  sent_at: string | null;
  created_at: string | null;
}

export interface ApiTreatment {
  id: string;
  clinic_id: string;
  name: string;
  price_inr: number | null;
  duration_minutes: number | null;
  is_panchakarma: boolean | null;
  typical_sessions: number | null;
  aftercare_notes: string | null;
  active: boolean | null;
}
