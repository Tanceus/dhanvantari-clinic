import { ApiError, api, apiQuery, isNotFoundError } from "../api/client";
import { mapMessage, messageTypeToKind } from "../api/mappers";
import type { ApiAppointment, ApiMessage, ApiPatient } from "../api/types";
import type {
  DashboardStats,
  Message,
  MessageType,
  UpdateMessageInput,
} from "../../types";
import { getDateKeyInTimezone, startOfWeek } from "../utils";

const CLINIC_TZ = "Asia/Kolkata";

export async function getAll(clinicId: string): Promise<Message[]> {
  void clinicId;
  const rows = await api<ApiMessage[]>("/messages");
  return rows.map(mapMessage);
}

export const fetchMessages = getAll;

export async function getById(
  clinicId: string,
  messageId: string,
): Promise<Message | undefined> {
  void clinicId;
  try {
    const row = await api<ApiMessage>(`/messages/${messageId}`);
    return mapMessage(row);
  } catch (error) {
    if (isNotFoundError(error)) return undefined;
    throw error;
  }
}

export async function getByPatientId(
  clinicId: string,
  patientId: string,
): Promise<Message[]> {
  const messages = await getAll(clinicId);
  return messages.filter((m) => m.patientId === patientId);
}

/**
 * Mock flow: create a draft, review, then send.
 * Live flow: POST /messages/trigger renders AND attempts send in one call
 * (queued immediately, or after quiet hours; skipped if gates fail).
 * There is no separate "save draft then send later" endpoint.
 */
export async function createDraft(
  clinicId: string,
  patientId: string,
  type: MessageType,
  appointmentId: string,
): Promise<Message> {
  void clinicId;
  const row = await api<ApiMessage>("/messages/trigger", {
    method: "POST",
    body: JSON.stringify({
      patient_id: patientId,
      kind: messageTypeToKind(type),
      appointment_id: appointmentId || null,
    }),
  });
  return mapMessage(row);
}

export async function update(
  clinicId: string,
  messageId: string,
  patch: UpdateMessageInput,
): Promise<Message> {
  void clinicId;
  const row = await api<ApiMessage>(`/messages/${messageId}`, {
    method: "PATCH",
    body: JSON.stringify({ body: patch.body }),
  });
  return mapMessage(row);
}

/**
 * No dedicated send endpoint exists. Trigger already attempted send.
 * If the row is already sent, return it. Otherwise explain the gap.
 */
export async function send(
  clinicId: string,
  messageId: string,
): Promise<Message> {
  const message = await getById(clinicId, messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }
  if (message.status === "sent") {
    return message;
  }
  throw new ApiError(
    501,
    "This message was created via /messages/trigger, which already attempts delivery. A separate Send API is not available yet (Cycle 6).",
  );
}

export async function regenerate(
  clinicId: string,
  messageId: string,
): Promise<Message> {
  void clinicId;
  void messageId;
  throw new ApiError(
    501,
    "Regenerate is not available on the live API yet. There is no endpoint to rewrite an existing message.",
  );
}

export async function discard(
  clinicId: string,
  messageId: string,
): Promise<void> {
  await deleteMessage(clinicId, messageId);
}

export async function deleteMessage(
  clinicId: string,
  messageId: string,
): Promise<void> {
  void clinicId;
  await api(`/messages/${messageId}`, { method: "DELETE" });
}

export async function fetchDraftMessages(
  clinicId: string,
): Promise<Message[]> {
  void clinicId;
  const rows = await api<ApiMessage[]>(
    `/messages${apiQuery({ status: "queued" })}`,
  );
  return rows.map(mapMessage);
}

export async function fetchDashboardStats(
  clinicId: string,
): Promise<DashboardStats> {
  void clinicId;
  const today = getDateKeyInTimezone(new Date(), CLINIC_TZ);
  const weekStart = startOfWeek(new Date());

  const [appointments, queued, patients] = await Promise.all([
    api<ApiAppointment[]>(`/appointments${apiQuery({ date: today })}`),
    api<ApiMessage[]>(`/messages${apiQuery({ status: "queued" })}`),
    api<ApiPatient[]>("/patients"),
  ]);

  const patientsSeenToday = appointments.filter(
    (a) => a.status === "completed",
  ).length;

  const newPatientsThisWeek = patients.filter((p) => {
    if (!p.created_at) return false;
    const created = new Date(p.created_at);
    return created >= weekStart && created <= new Date();
  }).length;

  return {
    todaysAppointments: appointments.length,
    patientsSeenToday,
    messagesAwaitingReview: queued.length,
    newPatientsThisWeek,
  };
}
