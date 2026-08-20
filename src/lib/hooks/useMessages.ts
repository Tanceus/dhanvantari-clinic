import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useClinicConfig } from "../../config/ClinicConfigProvider";
import type { MessageType, UpdateMessageInput } from "../../types";
import {
  createDraft,
  deleteMessage,
  fetchDashboardStats,
  fetchDraftMessages,
  fetchMessages,
  getById,
  getByPatientId,
  regenerate,
  send,
  update,
} from "../services/messageService";

export function useMessages() {
  const { clinicId } = useClinicConfig();
  return useQuery({
    queryKey: ["messages", clinicId],
    queryFn: () => fetchMessages(clinicId),
  });
}

export function useMessage(messageId: string | undefined) {
  const { clinicId } = useClinicConfig();
  return useQuery({
    queryKey: ["message", clinicId, messageId],
    queryFn: () => getById(clinicId, messageId!),
    enabled: !!messageId,
  });
}

export function useDraftMessages() {
  const { clinicId } = useClinicConfig();
  return useQuery({
    queryKey: ["messages", "draft", clinicId],
    queryFn: () => fetchDraftMessages(clinicId),
  });
}

export function useDashboardStats() {
  const { clinicId } = useClinicConfig();
  return useQuery({
    queryKey: ["dashboard-stats", clinicId],
    queryFn: () => fetchDashboardStats(clinicId),
  });
}

export function usePatientMessages(patientId: string | undefined) {
  const { clinicId } = useClinicConfig();
  return useQuery({
    queryKey: ["messages", "patient", clinicId, patientId],
    queryFn: () => getByPatientId(clinicId, patientId!),
    enabled: !!patientId,
  });
}

interface TriggerMessageVariables {
  patientId: string;
  type: MessageType;
  appointmentId: string;
}

export function useTriggerMessage() {
  const { clinicId } = useClinicConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ patientId, type, appointmentId }: TriggerMessageVariables) =>
      createDraft(clinicId, patientId, type, appointmentId),
    onSuccess: (data, { patientId }) => {
      queryClient.invalidateQueries({ queryKey: ["messages", clinicId] });
      queryClient.invalidateQueries({
        queryKey: ["messages", "draft", clinicId],
      });
      queryClient.invalidateQueries({
        queryKey: ["messages", "patient", clinicId, patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard-stats", clinicId],
      });
      queryClient.setQueryData(["message", clinicId, data.id], data);
    },
  });
}

export function useUpdateMessage() {
  const { clinicId } = useClinicConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      patch,
    }: {
      messageId: string;
      patch: UpdateMessageInput;
    }) => update(clinicId, messageId, patch),
    onSuccess: (data) => {
      queryClient.setQueryData(["message", clinicId, data.id], data);
      queryClient.invalidateQueries({ queryKey: ["messages", clinicId] });
      queryClient.invalidateQueries({
        queryKey: ["messages", "draft", clinicId],
      });
      queryClient.invalidateQueries({
        queryKey: ["messages", "patient", clinicId, data.patientId],
      });
    },
  });
}

export function useSendMessage() {
  const { clinicId } = useClinicConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => send(clinicId, messageId),
    onSuccess: (data) => {
      queryClient.setQueryData(["message", clinicId, data.id], data);
      queryClient.invalidateQueries({ queryKey: ["messages", clinicId] });
      queryClient.invalidateQueries({
        queryKey: ["messages", "draft", clinicId],
      });
      queryClient.invalidateQueries({
        queryKey: ["messages", "patient", clinicId, data.patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard-stats", clinicId],
      });
    },
  });
}

export function useRegenerateMessage() {
  const { clinicId } = useClinicConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => regenerate(clinicId, messageId),
    onSuccess: (data) => {
      queryClient.setQueryData(["message", clinicId, data.id], data);
      queryClient.invalidateQueries({ queryKey: ["messages", clinicId] });
      queryClient.invalidateQueries({
        queryKey: ["messages", "draft", clinicId],
      });
      queryClient.invalidateQueries({
        queryKey: ["messages", "patient", clinicId, data.patientId],
      });
    },
  });
}

export function useDiscardMessage() {
  return useDeleteMessage();
}

export function useDeleteMessage() {
  const { clinicId } = useClinicConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => deleteMessage(clinicId, messageId),
    onSuccess: (_data, messageId) => {
      queryClient.removeQueries({
        queryKey: ["message", clinicId, messageId],
      });
      queryClient.invalidateQueries({ queryKey: ["messages", clinicId] });
      queryClient.invalidateQueries({
        queryKey: ["messages", "draft", clinicId],
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard-stats", clinicId],
      });
      queryClient.invalidateQueries({
        queryKey: ["messages", "patient", clinicId],
      });
    },
  });
}
