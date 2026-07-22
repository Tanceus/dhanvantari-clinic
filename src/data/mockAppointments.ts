import type { Appointment } from "../types";

function todayAt(hour: number, minute: number): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function daysFromNow(days: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: "apt-001",
    clinicId: "dhanvantari-001",
    patientId: "pat-010",
    datetime: todayAt(9, 0),
    treatmentType: "Consultation",
    status: "completed",
    notes: "Follow-up on blood sugar levels. Adjusted diet plan.",
  },
  {
    id: "apt-002",
    clinicId: "dhanvantari-001",
    patientId: "pat-001",
    datetime: todayAt(10, 30),
    treatmentType: "Shirodhara",
    status: "checked-in",
    notes: "Third session of Shirodhara series for insomnia.",
  },
  {
    id: "apt-003",
    clinicId: "dhanvantari-001",
    patientId: "pat-007",
    datetime: todayAt(11, 30),
    treatmentType: "Nasya",
    status: "scheduled",
    notes: "Nasya therapy for thyroid support protocol.",
  },
  {
    id: "apt-004",
    clinicId: "dhanvantari-001",
    patientId: "pat-005",
    datetime: todayAt(14, 0),
    treatmentType: "Consultation",
    status: "scheduled",
    notes: "Initial consultation. Consent form pending.",
  },
  {
    id: "apt-005",
    clinicId: "dhanvantari-001",
    patientId: "pat-002",
    datetime: todayAt(15, 30),
    treatmentType: "Virechana",
    status: "scheduled",
    notes: "Preparation day for Virechana detox.",
  },
  {
    id: "apt-006",
    clinicId: "dhanvantari-001",
    patientId: "pat-008",
    datetime: todayAt(17, 0),
    treatmentType: "Abhyanga",
    status: "cancelled",
    notes: "Patient requested reschedule due to travel.",
  },
  {
    id: "apt-007",
    clinicId: "dhanvantari-001",
    patientId: "pat-003",
    datetime: daysFromNow(1, 10, 0),
    treatmentType: "Udvartana",
    status: "scheduled",
    notes: "Dry powder massage for Kapha reduction.",
  },
  {
    id: "apt-008",
    clinicId: "dhanvantari-001",
    patientId: "pat-004",
    datetime: daysFromNow(2, 11, 0),
    treatmentType: "Basti",
    status: "scheduled",
    notes: "Basti therapy for joint pain relief.",
  },
  {
    id: "apt-009",
    clinicId: "dhanvantari-001",
    patientId: "pat-006",
    datetime: daysFromNow(3, 9, 30),
    treatmentType: "Follow-up",
    status: "scheduled",
    notes: "Blood pressure review after herbal regimen.",
  },
  {
    id: "apt-010",
    clinicId: "dhanvantari-001",
    patientId: "pat-009",
    datetime: daysFromNow(5, 14, 30),
    treatmentType: "Panchakarma",
    status: "scheduled",
    notes: "Begin Panchakarma programme for menopausal care.",
  },
];
