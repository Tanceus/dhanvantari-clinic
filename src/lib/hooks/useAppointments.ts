import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useClinicConfig } from "../../config/ClinicConfigProvider";
import type { Appointment, AppointmentStatus, CreateAppointmentInput } from "../../types";
import {
  create,
  fetchAppointments,
  fetchTodaysAppointments,
  fetchUpcomingAppointments,
  getById,
  getByPatientId,
  remove,
  update,
  updateStatus,
} from "../services/appointmentService";

export function useAppointments() {
  const { clinicId } = useClinicConfig();
  return useQuery({
    queryKey: ["appointments", clinicId],
    queryFn: () => fetchAppointments(clinicId),
  });
}

export function useAppointment(appointmentId: string | undefined) {
  const { clinicId } = useClinicConfig();
  return useQuery({
    queryKey: ["appointment", clinicId, appointmentId],
    queryFn: () => getById(clinicId, appointmentId!),
    enabled: !!appointmentId,
  });
}

export function useTodaysAppointments() {
  const { clinicId } = useClinicConfig();
  return useQuery({
    queryKey: ["appointments", "today", clinicId],
    queryFn: () => fetchTodaysAppointments(clinicId),
  });
}

export function useUpcomingAppointments() {
  const { clinicId } = useClinicConfig();
  return useQuery({
    queryKey: ["appointments", "upcoming", clinicId],
    queryFn: () => fetchUpcomingAppointments(clinicId),
  });
}

export function usePatientAppointments(patientId: string | undefined) {
  const { clinicId } = useClinicConfig();
  return useQuery({
    queryKey: ["appointments", "patient", clinicId, patientId],
    queryFn: () => getByPatientId(clinicId, patientId!),
    enabled: !!patientId,
  });
}

interface UpdateStatusVariables {
  appointmentId: string;
  status: AppointmentStatus;
  patientId?: string;
}

export function useUpdateAppointmentStatus() {
  const { clinicId } = useClinicConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appointmentId, status }: UpdateStatusVariables) =>
      updateStatus(clinicId, appointmentId, status),
    onMutate: async ({ appointmentId, status, patientId }) => {
      await queryClient.cancelQueries({ queryKey: ["appointments", clinicId] });
      await queryClient.cancelQueries({
        queryKey: ["appointment", clinicId, appointmentId],
      });

      const previousAppointments = queryClient.getQueryData<Appointment[]>([
        "appointments",
        clinicId,
      ]);
      const previousAppointment = queryClient.getQueryData<Appointment>([
        "appointment",
        clinicId,
        appointmentId,
      ]);
      const previousPatientAppointments = patientId
        ? queryClient.getQueryData<Appointment[]>([
            "appointments",
            "patient",
            clinicId,
            patientId,
          ])
        : undefined;

      const patch = (list: Appointment[] | undefined) =>
        list?.map((a) => (a.id === appointmentId ? { ...a, status } : a));

      if (previousAppointments) {
        queryClient.setQueryData(
          ["appointments", clinicId],
          patch(previousAppointments),
        );
      }
      if (previousAppointment) {
        queryClient.setQueryData(["appointment", clinicId, appointmentId], {
          ...previousAppointment,
          status,
        });
      }
      if (previousPatientAppointments && patientId) {
        queryClient.setQueryData(
          ["appointments", "patient", clinicId, patientId],
          patch(previousPatientAppointments),
        );
      }

      return {
        previousAppointments,
        previousAppointment,
        previousPatientAppointments,
        patientId,
      };
    },
    onError: (_err, { appointmentId }, context) => {
      if (context?.previousAppointments) {
        queryClient.setQueryData(
          ["appointments", clinicId],
          context.previousAppointments,
        );
      }
      if (context?.previousAppointment) {
        queryClient.setQueryData(
          ["appointment", clinicId, appointmentId],
          context.previousAppointment,
        );
      }
      if (context?.previousPatientAppointments && context.patientId) {
        queryClient.setQueryData(
          ["appointments", "patient", clinicId, context.patientId],
          context.previousPatientAppointments,
        );
      }
    },
    onSettled: (_data, _err, { appointmentId, patientId }) => {
      queryClient.invalidateQueries({ queryKey: ["appointments", clinicId] });
      queryClient.invalidateQueries({
        queryKey: ["appointment", clinicId, appointmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["appointments", "today", clinicId],
      });
      queryClient.invalidateQueries({
        queryKey: ["appointments", "upcoming", clinicId],
      });
      if (patientId) {
        queryClient.invalidateQueries({
          queryKey: ["appointments", "patient", clinicId, patientId],
        });
      }
    },
  });
}

export function useCreateAppointment() {
  const { clinicId } = useClinicConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draft: CreateAppointmentInput) => create(clinicId, draft),
    onSuccess: (appointment) => {
      queryClient.invalidateQueries({ queryKey: ["appointments", clinicId] });
      queryClient.invalidateQueries({
        queryKey: ["appointments", "today", clinicId],
      });
      queryClient.invalidateQueries({
        queryKey: ["appointments", "upcoming", clinicId],
      });
      queryClient.invalidateQueries({
        queryKey: ["appointments", "patient", clinicId, appointment.patientId],
      });
    },
  });
}

interface UpdateAppointmentVariables {
  appointmentId: string;
  draft: CreateAppointmentInput;
}

export function useUpdateAppointment() {
  const { clinicId } = useClinicConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appointmentId, draft }: UpdateAppointmentVariables) =>
      update(clinicId, appointmentId, draft),
    onSuccess: (appointment) => {
      queryClient.invalidateQueries({ queryKey: ["appointments", clinicId] });
      queryClient.invalidateQueries({
        queryKey: ["appointment", clinicId, appointment.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["appointments", "today", clinicId],
      });
      queryClient.invalidateQueries({
        queryKey: ["appointments", "upcoming", clinicId],
      });
      queryClient.invalidateQueries({
        queryKey: ["appointments", "patient", clinicId, appointment.patientId],
      });
    },
  });
}

interface DeleteAppointmentVariables {
  appointmentId: string;
  patientId?: string;
}

export function useDeleteAppointment() {
  const { clinicId } = useClinicConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appointmentId }: DeleteAppointmentVariables) =>
      remove(clinicId, appointmentId),
    onSuccess: (_void, { appointmentId, patientId }) => {
      queryClient.removeQueries({
        queryKey: ["appointment", clinicId, appointmentId],
      });
      queryClient.invalidateQueries({ queryKey: ["appointments", clinicId] });
      queryClient.invalidateQueries({
        queryKey: ["appointments", "today", clinicId],
      });
      queryClient.invalidateQueries({
        queryKey: ["appointments", "upcoming", clinicId],
      });
      if (patientId) {
        queryClient.invalidateQueries({
          queryKey: ["appointments", "patient", clinicId, patientId],
        });
      }
    },
  });
}
