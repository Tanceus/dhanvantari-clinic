import { useQuery } from "@tanstack/react-query";
import { useClinicConfig } from "../../config/ClinicConfigProvider";
import { getAll } from "../services/treatmentService";

export function useTreatments() {
  const { clinicId } = useClinicConfig();
  return useQuery({
    queryKey: ["treatments", clinicId],
    queryFn: () => getAll(clinicId),
  });
}
