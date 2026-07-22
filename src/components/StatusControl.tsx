import type { MouseEvent } from "react";
import type { Appointment, AppointmentStatus } from "../types";
import { useUpdateAppointmentStatus } from "../lib/hooks/useAppointments";
import { StatusBadge } from "./StatusBadge";

interface StatusControlProps {
  appointment: Appointment;
  variant?: "inline" | "prominent";
}

export function StatusControl({
  appointment,
  variant = "inline",
}: StatusControlProps) {
  const updateStatus = useUpdateAppointmentStatus();
  const { status } = appointment;
  const isPending = updateStatus.isPending;

  function advanceStatus(next: AppointmentStatus) {
    updateStatus.mutate({
      appointmentId: appointment.id,
      status: next,
      patientId: appointment.patientId,
    });
  }

  function handleAction(
    e: MouseEvent,
    next: AppointmentStatus,
  ) {
    e.stopPropagation();
    e.preventDefault();
    advanceStatus(next);
  }

  const actions: { label: string; next: AppointmentStatus; className: string }[] =
    [];

  if (status === "scheduled") {
    actions.push({
      label: "Check in",
      next: "checked-in",
      className:
        "border-brand-primary/25 bg-brand-primary/8 text-brand-primary hover:bg-brand-primary/12",
    });
  }
  if (status === "checked-in") {
    actions.push({
      label: "Mark completed",
      next: "completed",
      className:
        "border-status-completed/25 bg-status-completed/8 text-status-completed hover:bg-status-completed/12",
    });
  }
  if (status !== "cancelled" && status !== "completed") {
    actions.push({
      label: "Cancel",
      next: "cancelled",
      className:
        "border-terracotta/20 bg-transparent text-terracotta/80 hover:bg-terracotta/8",
    });
  }

  return (
    <div
      className={
        variant === "prominent"
          ? "flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
          : "flex flex-col items-end gap-2 sm:items-end"
      }
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <StatusBadge status={status} />
      {actions.length > 0 && (
        <div
          className={`flex flex-wrap gap-2 ${variant === "prominent" ? "" : "justify-end"}`}
        >
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              disabled={isPending}
              onClick={(e) => handleAction(e, action.next)}
              className={`min-h-11 rounded-lg border px-3 text-xs font-medium transition-colors disabled:opacity-50 ${action.className}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
