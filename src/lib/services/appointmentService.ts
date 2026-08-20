import { ApiError, api, apiQuery, isNotFoundError } from "../api/client";
import {
  mapAppointment,
  matchTreatmentId,
  toAppointmentCreate,
} from "../api/mappers";
import type { ApiAppointment } from "../api/types";
import type {
  Appointment,
  AppointmentStatus,
  CreateAppointmentInput,
} from "../../types";
import { getDateKeyInTimezone } from "../utils";
import { getAll as getTreatments } from "./treatmentService";

const CLINIC_TZ = "Asia/Kolkata";

async function treatmentNames(): Promise<Map<string, string>> {
  const treatments = await getTreatments("");
  return new Map(treatments.map((t) => [t.id, t.name]));
}

function hydrate(
  rows: ApiAppointment[],
  names: Map<string, string>,
): Appointment[] {
  return rows.map((row) =>
    mapAppointment(row, row.treatment_id ? (names.get(row.treatment_id) ?? "") : ""),
  );
}

export async function getAll(
  clinicId: string,
  filters?: { date?: string; status?: string },
): Promise<Appointment[]> {
  void clinicId;
  const [rows, names] = await Promise.all([
    api<ApiAppointment[]>(
      `/appointments${apiQuery({
        date: filters?.date,
        status: filters?.status,
      })}`,
    ),
    treatmentNames(),
  ]);
  return hydrate(rows, names);
}

export const fetchAppointments = getAll;

export async function getById(
  clinicId: string,
  appointmentId: string,
): Promise<Appointment | undefined> {
  void clinicId;
  try {
    const [row, names] = await Promise.all([
      api<ApiAppointment>(`/appointments/${appointmentId}`),
      treatmentNames(),
    ]);
    return mapAppointment(
      row,
      row.treatment_id ? (names.get(row.treatment_id) ?? "") : "",
    );
  } catch (error) {
    if (isNotFoundError(error)) return undefined;
    throw error;
  }
}

export async function getByPatientId(
  clinicId: string,
  patientId: string,
): Promise<Appointment[]> {
  const appointments = await getAll(clinicId);
  return appointments
    .filter((a) => a.patientId === patientId)
    .sort(
      (a, b) =>
        new Date(b.datetime).getTime() - new Date(a.datetime).getTime(),
    );
}

export async function updateStatus(
  clinicId: string,
  appointmentId: string,
  status: AppointmentStatus,
): Promise<Appointment> {
  void clinicId;
  const [row, names] = await Promise.all([
    api<ApiAppointment>(`/appointments/${appointmentId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
    treatmentNames(),
  ]);
  return mapAppointment(
    row,
    row.treatment_id ? (names.get(row.treatment_id) ?? "") : "",
  );
}

export async function create(
  clinicId: string,
  draftAppointment: CreateAppointmentInput,
): Promise<Appointment> {
  const treatments = await getTreatments(clinicId);
  const treatmentId = matchTreatmentId(
    treatments,
    draftAppointment.treatmentType,
  );
  if (!treatmentId) {
    const available = treatments.map((t) => t.name).join(", ") || "(none)";
    throw new ApiError(
      400,
      `No treatment named "${draftAppointment.treatmentType}" for this clinic. Available: ${available}`,
    );
  }

  const [row, names] = await Promise.all([
    api<ApiAppointment>("/appointments", {
      method: "POST",
      body: JSON.stringify(
        toAppointmentCreate(draftAppointment, treatmentId),
      ),
    }),
    Promise.resolve(new Map(treatments.map((t) => [t.id, t.name]))),
  ]);
  return mapAppointment(row, names.get(row.treatment_id ?? "") ?? "");
}

export async function fetchTodaysAppointments(
  clinicId: string,
): Promise<Appointment[]> {
  const date = getDateKeyInTimezone(new Date(), CLINIC_TZ);
  const appointments = await getAll(clinicId, { date });
  return appointments.sort(
    (a, b) =>
      new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
  );
}

export async function fetchUpcomingAppointments(
  clinicId: string,
): Promise<Appointment[]> {
  const todayKey = getDateKeyInTimezone(new Date(), CLINIC_TZ);
  const appointments = await getAll(clinicId);
  return appointments
    .filter((a) => {
      const key = getDateKeyInTimezone(new Date(a.datetime), CLINIC_TZ);
      return key > todayKey;
    })
    .sort(
      (a, b) =>
        new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
    );
}
