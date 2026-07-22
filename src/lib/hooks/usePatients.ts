import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useClinicConfig } from "../../config/ClinicConfigProvider";
import type { CreatePatientInput } from "../../types";
import { create, fetchPatients, getById } from "../services/patientService";

export function usePatients() {
  const { clinicId } = useClinicConfig();
  return useQuery({
    queryKey: ["patients", clinicId],
    queryFn: () => fetchPatients(clinicId),
  });
}

export function usePatient(patientId: string | undefined) {
  const { clinicId } = useClinicConfig();
  return useQuery({
    queryKey: ["patient", clinicId, patientId],
    queryFn: () => getById(clinicId, patientId!),
    enabled: !!patientId,
  });
}

export function useCreatePatient() {
  const { clinicId } = useClinicConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draftPatient: CreatePatientInput) =>
      create(clinicId, draftPatient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients", clinicId] });
    },
  });
}
