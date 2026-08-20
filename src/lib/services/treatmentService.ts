import { api, isNotFoundError } from "../api/client";
import { mapTreatment, type Treatment } from "../api/mappers";
import type { ApiTreatment } from "../api/types";

export type { Treatment };

export async function getAll(clinicId: string): Promise<Treatment[]> {
  void clinicId;
  const rows = await api<ApiTreatment[]>("/treatments");
  return rows.map(mapTreatment);
}

export async function getById(
  clinicId: string,
  treatmentId: string,
): Promise<Treatment | undefined> {
  void clinicId;
  try {
    const row = await api<ApiTreatment>(`/treatments/${treatmentId}`);
    return mapTreatment(row);
  } catch (error) {
    if (isNotFoundError(error)) return undefined;
    throw error;
  }
}
