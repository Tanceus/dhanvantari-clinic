import { getClinicConfig } from "../../config/clinics";
import { MOCK_MESSAGES } from "../../data/mockMessages";
import { MOCK_PATIENTS } from "../../data/mockPatients";
import { MOCK_APPOINTMENTS } from "../../data/mockAppointments";
import { fillTemplate } from "../messageTemplates";
import type {
  DashboardStats,
  Message,
  MessageType,
  UpdateMessageInput,
} from "../../types";
import { delay, isSameDay, startOfWeek } from "../utils";

export async function fetchMessages(clinicId: string): Promise<Message[]> {
  const messages = MOCK_MESSAGES.filter((m) => m.clinicId === clinicId);
  return delay(messages);
}

export async function getById(
  clinicId: string,
  messageId: string,
): Promise<Message | undefined> {
  const message = MOCK_MESSAGES.find(
    (m) => m.clinicId === clinicId && m.id === messageId,
  );
  return delay(message);
}

export async function getByPatientId(
  clinicId: string,
  patientId: string,
): Promise<Message[]> {
  const messages = MOCK_MESSAGES.filter(
    (m) => m.clinicId === clinicId && m.patientId === patientId,
  );
  return delay(messages);
}

// SEAM — becomes POST /trigger-message → AI generation in Cycle 4; mock draft only for now.
export async function createDraft(
  clinicId: string,
  patientId: string,
  type: MessageType,
  appointmentId: string,
): Promise<Message> {
  const nums = MOCK_MESSAGES.map((m) =>
    parseInt(m.id.replace("msg-", ""), 10),
  ).filter((n) => !isNaN(n));
  const nextId = nums.length > 0 ? Math.max(...nums) + 1 : 1;

  const clinic = getClinicConfig(clinicId);
  const patient = MOCK_PATIENTS.find(
    (p) => p.clinicId === clinicId && p.id === patientId,
  );
  if (!patient) {
    throw new Error(`Patient not found: ${patientId}`);
  }

  const appointment =
    MOCK_APPOINTMENTS.find(
      (a) =>
        a.clinicId === clinicId &&
        a.id === appointmentId &&
        a.patientId === patientId,
    ) ?? null;

  const { subject, body } = fillTemplate(
    type,
    { patient, appointment, clinic },
    clinic.locale,
    clinic.timezone,
  );

  const newMessage: Message = {
    id: `msg-${String(nextId).padStart(3, "0")}`,
    clinicId,
    patientId,
    type,
    channel: "email",
    status: "draft",
    subject,
    body,
    preview: subject,
    appointmentId,
    generatedAt: new Date().toISOString(),
    sentAt: null,
  };

  MOCK_MESSAGES.push(newMessage);
  return delay(newMessage);
}

// SEAM — becomes PATCH /messages/:id in Cycle 2/5 (saving human edits to an AI draft).
export async function update(
  clinicId: string,
  messageId: string,
  patch: UpdateMessageInput,
): Promise<Message> {
  const index = MOCK_MESSAGES.findIndex(
    (m) => m.clinicId === clinicId && m.id === messageId,
  );
  if (index === -1) {
    throw new Error(`Message not found: ${messageId}`);
  }

  MOCK_MESSAGES[index] = {
    ...MOCK_MESSAGES[index],
    subject: patch.subject,
    body: patch.body,
    preview: patch.subject,
  };
  return delay(MOCK_MESSAGES[index]);
}

// SEAM — becomes Gmail API send (send-as clinic) in Cycle 6; in-memory only for now.
export async function send(
  clinicId: string,
  messageId: string,
): Promise<Message> {
  const index = MOCK_MESSAGES.findIndex(
    (m) => m.clinicId === clinicId && m.id === messageId,
  );
  if (index === -1) {
    throw new Error(`Message not found: ${messageId}`);
  }

  MOCK_MESSAGES[index] = {
    ...MOCK_MESSAGES[index],
    status: "sent",
    sentAt: new Date().toISOString(),
  };
  return delay(MOCK_MESSAGES[index]);
}

// SEAM — becomes AI regeneration in Cycle 4.
export async function regenerate(
  clinicId: string,
  messageId: string,
): Promise<Message> {
  const index = MOCK_MESSAGES.findIndex(
    (m) => m.clinicId === clinicId && m.id === messageId,
  );
  if (index === -1) {
    throw new Error(`Message not found: ${messageId}`);
  }

  const message = MOCK_MESSAGES[index];
  const clinic = getClinicConfig(clinicId);
  const patient = MOCK_PATIENTS.find(
    (p) => p.clinicId === clinicId && p.id === message.patientId,
  );
  if (!patient) {
    throw new Error(`Patient not found: ${message.patientId}`);
  }

  const appointment = message.appointmentId
    ? (MOCK_APPOINTMENTS.find(
        (a) => a.clinicId === clinicId && a.id === message.appointmentId,
      ) ?? null)
    : null;

  const { subject, body } = fillTemplate(
    message.type,
    { patient, appointment, clinic },
    clinic.locale,
    clinic.timezone,
  );

  MOCK_MESSAGES[index] = {
    ...message,
    subject,
    body,
    preview: subject,
    status: "draft",
    sentAt: null,
  };
  return delay(MOCK_MESSAGES[index]);
}

// SEAM — becomes DELETE /messages/:id in Cycle 2/5; in-memory only for now.
export async function discard(
  clinicId: string,
  messageId: string,
): Promise<void> {
  const index = MOCK_MESSAGES.findIndex(
    (m) => m.clinicId === clinicId && m.id === messageId,
  );
  if (index === -1) {
    throw new Error(`Message not found: ${messageId}`);
  }
  MOCK_MESSAGES.splice(index, 1);
  return delay(undefined);
}

export async function fetchDraftMessages(
  clinicId: string,
): Promise<Message[]> {
  const messages = MOCK_MESSAGES.filter(
    (m) => m.clinicId === clinicId && m.status === "draft",
  );
  return delay(messages);
}

export async function fetchDashboardStats(
  clinicId: string,
): Promise<DashboardStats> {
  const today = new Date();
  const weekStart = startOfWeek(today);

  const todaysAppointments = MOCK_APPOINTMENTS.filter(
    (a) =>
      a.clinicId === clinicId && isSameDay(new Date(a.datetime), today),
  );

  const patientsSeenToday = todaysAppointments.filter(
    (a) => a.status === "completed",
  ).length;

  const messagesAwaitingReview = MOCK_MESSAGES.filter(
    (m) => m.clinicId === clinicId && m.status === "draft",
  ).length;

  const newPatientsThisWeek = MOCK_PATIENTS.filter((p) => {
    if (p.clinicId !== clinicId) return false;
    const lastVisit = new Date(p.lastVisit);
    return lastVisit >= weekStart && lastVisit <= today;
  }).length;

  return delay({
    todaysAppointments: todaysAppointments.length,
    patientsSeenToday,
    messagesAwaitingReview,
    newPatientsThisWeek,
  });
}
