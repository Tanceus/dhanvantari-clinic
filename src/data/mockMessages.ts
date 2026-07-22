import { CLINIC_CONFIGS } from "../config/clinics";
import type { Message, MessageStatus, MessageType } from "../types";
import { fillTemplate } from "../lib/messageTemplates";
import { MOCK_APPOINTMENTS } from "./mockAppointments";
import { MOCK_PATIENTS } from "./mockPatients";

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

function findPatient(id: string) {
  const patient = MOCK_PATIENTS.find((p) => p.id === id);
  if (!patient) throw new Error(`Mock patient not found: ${id}`);
  return patient;
}

function findAppointment(id: string) {
  return MOCK_APPOINTMENTS.find((a) => a.id === id) ?? null;
}

function buildMessage(
  id: string,
  patientId: string,
  type: MessageType,
  status: MessageStatus,
  appointmentId: string | null,
  generatedAt: string,
  sentAt: string | null,
): Message {
  const clinic = CLINIC_CONFIGS["dhanvantari-001"];
  const patient = findPatient(patientId);
  const appointment = appointmentId ? findAppointment(appointmentId) : null;
  const { subject, body } = fillTemplate(
    type,
    { patient, appointment, clinic },
    clinic.locale,
    clinic.timezone,
  );

  return {
    id,
    clinicId: "dhanvantari-001",
    patientId,
    type,
    channel: "email",
    status,
    subject,
    body,
    preview: subject,
    appointmentId,
    generatedAt,
    sentAt,
  };
}

export const MOCK_MESSAGES: Message[] = [
  buildMessage(
    "msg-001",
    "pat-007",
    "reminder",
    "draft",
    "apt-003",
    daysAgo(0),
    null,
  ),
  buildMessage(
    "msg-002",
    "pat-005",
    "care-instruction",
    "draft",
    "apt-004",
    daysAgo(0),
    null,
  ),
  buildMessage(
    "msg-003",
    "pat-001",
    "follow-up",
    "sent",
    "apt-002",
    daysAgo(3),
    daysAgo(2),
  ),
  buildMessage(
    "msg-004",
    "pat-010",
    "care-instruction",
    "sent",
    "apt-001",
    daysAgo(5),
    daysAgo(4),
  ),
  buildMessage(
    "msg-005",
    "pat-002",
    "reminder",
    "draft",
    "apt-005",
    daysAgo(1),
    null,
  ),
  buildMessage(
    "msg-006",
    "pat-006",
    "reminder",
    "failed",
    "apt-009",
    daysAgo(2),
    null,
  ),
  buildMessage(
    "msg-007",
    "pat-003",
    "follow-up",
    "sent",
    null,
    daysAgo(7),
    daysAgo(6),
  ),
  buildMessage(
    "msg-008",
    "pat-009",
    "reminder",
    "sent",
    "apt-010",
    daysAgo(10),
    daysAgo(9),
  ),
  buildMessage(
    "msg-009",
    "pat-004",
    "care-instruction",
    "sent",
    "apt-008",
    daysAgo(8),
    daysAgo(7),
  ),
];
