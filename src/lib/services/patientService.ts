import { api, apiQuery, isNotFoundError } from "../api/client";
import {
  mapPatient,
  toPatientConsentPatch,
  toPatientCreate,
} from "../api/mappers";
import type { ApiPatient } from "../api/types";
import type { CreatePatientInput, Patient } from "../../types";

/**
 * clinicId is the Cycle 0 branding key from useClinicConfig().
 * The API tenant is VITE_CLINIC_ID (X-Clinic-Id). Keep both in sync
 * until Cycle 8 login merges them.
 */

export async function getAll(
  clinicId: string,
  search?: string,
): Promise<Patient[]> {
  void clinicId;
  const rows = await api<ApiPatient[]>(
    `/patients${apiQuery({ search: search?.trim() || undefined })}`,
  );
  return rows.map(mapPatient);
}

export const fetchPatients = getAll;

export async function getById(
  clinicId: string,
  patientId: string,
): Promise<Patient | undefined> {
  void clinicId;
  try {
    const row = await api<ApiPatient>(`/patients/${patientId}`);
    return mapPatient(row);
  } catch (error) {
    if (isNotFoundError(error)) return undefined;
    throw error;
  }
}

export async function create(
  clinicId: string,
  draftPatient: CreatePatientInput,
): Promise<Patient> {
  void clinicId;
  const created = await api<ApiPatient>("/patients", {
    method: "POST",
    body: JSON.stringify(toPatientCreate(draftPatient)),
  });

  const consentPatch = toPatientConsentPatch(draftPatient);
  if (!consentPatch) {
    return mapPatient(created);
  }

  try {
    const updated = await api<ApiPatient>(`/patients/${created.id}`, {
      method: "PATCH",
      body: JSON.stringify(consentPatch),
    });
    return mapPatient(updated);
  } catch {
    return mapPatient(created);
  }
}

export async function update(
  clinicId: string,
  patientId: string,
  patch: Partial<CreatePatientInput>,
): Promise<Patient> {
  void clinicId;
  const body: Record<string, unknown> = {};
  if (patch.name !== undefined) body.name = patch.name;
  if (patch.phone !== undefined) body.phone = patch.phone;
  if (patch.email !== undefined) body.email = patch.email || null;
  if (patch.prakriti !== undefined) body.prakriti = patch.prakriti;
  if (patch.primaryConcern !== undefined) body.notes = patch.primaryConcern || null;
  if (patch.consentStatus !== undefined) {
    body.consent_status = patch.consentStatus;
    body.consent_granted_at =
      patch.consentStatus === "granted"
        ? (patch.consentDate ?? new Date().toISOString())
        : null;
  }
  const row = await api<ApiPatient>(`/patients/${patientId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return mapPatient(row);
}

export async function remove(
  clinicId: string,
  patientId: string,
): Promise<void> {
  void clinicId;
  await api<ApiPatient>(`/patients/${patientId}`, { method: "DELETE" });
}

/** @deprecated Use getById — kept for any existing imports */
export const fetchPatientById = getById;
