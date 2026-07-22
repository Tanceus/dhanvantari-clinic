import { MOCK_APPOINTMENTS } from "../../data/mockAppointments";
import type { Appointment, AppointmentStatus, CreateAppointmentInput } from "../../types";
import { delay, isSameDay } from "../utils";

export async function fetchAppointments(
  clinicId: string,
): Promise<Appointment[]> {
  const appointments = MOCK_APPOINTMENTS.filter(
    (a) => a.clinicId === clinicId,
  );
  return delay(appointments);
}

export async function getById(
  clinicId: string,
  appointmentId: string,
): Promise<Appointment | undefined> {
  const appointment = MOCK_APPOINTMENTS.find(
    (a) => a.clinicId === clinicId && a.id === appointmentId,
  );
  return delay(appointment);
}

export async function getByPatientId(
  clinicId: string,
  patientId: string,
): Promise<Appointment[]> {
  const appointments = MOCK_APPOINTMENTS.filter(
    (a) => a.clinicId === clinicId && a.patientId === patientId,
  ).sort(
    (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime(),
  );
  return delay(appointments);
}

// SEAM — becomes PATCH /appointments/:id in Cycle 2/5; in-memory only.
export async function updateStatus(
  clinicId: string,
  appointmentId: string,
  status: AppointmentStatus,
): Promise<Appointment> {
  const index = MOCK_APPOINTMENTS.findIndex(
    (a) => a.clinicId === clinicId && a.id === appointmentId,
  );
  if (index === -1) {
    throw new Error(`Appointment not found: ${appointmentId}`);
  }
  MOCK_APPOINTMENTS[index] = { ...MOCK_APPOINTMENTS[index], status };
  return delay(MOCK_APPOINTMENTS[index]);
}

// SEAM — becomes POST /appointments in Cycle 2/5.
export async function create(
  clinicId: string,
  draftAppointment: CreateAppointmentInput,
): Promise<Appointment> {
  const nums = MOCK_APPOINTMENTS.map((a) =>
    parseInt(a.id.replace("apt-", ""), 10),
  ).filter((n) => !isNaN(n));
  const nextId = nums.length > 0 ? Math.max(...nums) + 1 : 1;

  const newAppointment: Appointment = {
    ...draftAppointment,
    id: `apt-${String(nextId).padStart(3, "0")}`,
    clinicId,
  };

  MOCK_APPOINTMENTS.push(newAppointment);
  return delay(newAppointment);
}

export async function fetchTodaysAppointments(
  clinicId: string,
): Promise<Appointment[]> {
  const today = new Date();
  const appointments = MOCK_APPOINTMENTS.filter(
    (a) =>
      a.clinicId === clinicId && isSameDay(new Date(a.datetime), today),
  ).sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
  );
  return delay(appointments);
}

export async function fetchUpcomingAppointments(
  clinicId: string,
): Promise<Appointment[]> {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const appointments = MOCK_APPOINTMENTS.filter(
    (a) =>
      a.clinicId === clinicId && new Date(a.datetime) > today,
  ).sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
  );
  return delay(appointments);
}
