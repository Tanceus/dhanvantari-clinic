import { MOCK_PATIENTS } from "../../data/mockPatients";
import type { CreatePatientInput, Patient } from "../../types";
import { delay } from "../utils";

export async function fetchPatients(clinicId: string): Promise<Patient[]> {
  const patients = MOCK_PATIENTS.filter((p) => p.clinicId === clinicId);
  return delay(patients);
}

export async function getById(
  clinicId: string,
  patientId: string,
): Promise<Patient | undefined> {
  const patient = MOCK_PATIENTS.find(
    (p) => p.clinicId === clinicId && p.id === patientId,
  );
  return delay(patient);
}

// SEAM — becomes POST /patients in Cycle 2/5; in-memory only for now.
export async function create(
  clinicId: string,
  draftPatient: CreatePatientInput,
): Promise<Patient> {
  const nums = MOCK_PATIENTS.map((p) =>
    parseInt(p.id.replace("pat-", ""), 10),
  ).filter((n) => !isNaN(n));
  const nextId = nums.length > 0 ? Math.max(...nums) + 1 : 1;

  const today = new Date().toISOString().split("T")[0];
  const newPatient: Patient = {
    ...draftPatient,
    id: `pat-${String(nextId).padStart(3, "0")}`,
    clinicId,
    lastVisit: draftPatient.lastVisit ?? today,
  };

  MOCK_PATIENTS.push(newPatient);
  return delay(newPatient);
}

/** @deprecated Use getById — kept for any existing imports */
export const fetchPatientById = getById;
