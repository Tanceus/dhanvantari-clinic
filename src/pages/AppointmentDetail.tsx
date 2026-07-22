import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useClinicConfig } from "../config/ClinicConfigProvider";
import { ConsentBadge } from "../components/ConsentBadge";
import { EmptyState } from "../components/EmptyState";
import { CalendarDayIcon, ChevronLeftIcon } from "../components/icons";
import { PrakritiBadge } from "../components/PrakritiBadge";
import { StatusControl } from "../components/StatusControl";
import { TreatmentTag } from "../components/TreatmentTag";
import { useAppointment } from "../lib/hooks/useAppointments";
import { useTriggerMessage } from "../lib/hooks/useMessages";
import { usePatient } from "../lib/hooks/usePatients";
import type { MessageType } from "../types";
import { formatDateTime, getInitials } from "../lib/utils";

const MESSAGE_ACTIONS: { label: string; type: MessageType }[] = [
  { label: "Send Reminder", type: "reminder" },
  { label: "Send Care Instructions", type: "care-instruction" },
  { label: "Schedule Follow-up", type: "follow-up" },
];

export function AppointmentDetailPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { config } = useClinicConfig();

  const { data: appointment, isLoading } = useAppointment(appointmentId);
  const { data: patient } = usePatient(appointment?.patientId);
  const triggerMessage = useTriggerMessage();

  const [draftBanner, setDraftBanner] = useState(false);

  if (isLoading) {
    return <AppointmentDetailSkeleton />;
  }

  if (!appointment) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <EmptyState
          title="Appointment not found"
          description="This appointment may have been removed or the link is incorrect."
          icon={<CalendarDayIcon className="h-6 w-6" />}
        />
        <Link
          to="/appointments"
          className="mt-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to appointments
        </Link>
      </div>
    );
  }

  function handleTriggerMessage(type: MessageType) {
    triggerMessage.mutate(
      {
        patientId: appointment!.patientId,
        type,
        appointmentId: appointment!.id,
      },
      {
        onSuccess: () => {
          setDraftBanner(true);
        },
      },
    );
  }

  const formattedDateTime = formatDateTime(
    appointment.datetime,
    config.locale,
    config.timezone,
  );

  return (
    <div className="space-y-6">
      <Link
        to="/appointments"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-text-muted transition-colors hover:text-brand-primary"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to appointments
      </Link>

      {draftBanner && (
        <div
          role="status"
          className="flex flex-col gap-2 rounded-lg border border-status-completed/25 bg-status-completed/8 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="font-medium text-status-completed">
            Draft created
          </span>
          <Link
            to="/messages"
            className="font-medium text-brand-primary hover:underline"
          >
            View in Messages
          </Link>
        </div>
      )}

      <header className="rounded-2xl border border-line bg-bg-surface px-6 py-6 shadow-soft sm:px-8">
        <p className="font-display text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
          {formattedDateTime}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <TreatmentTag treatment={appointment.treatmentType} />
        </div>
        <div className="mt-5 border-t border-line pt-5">
          <StatusControl appointment={appointment} variant="prominent" />
        </div>
      </header>

      <Link
        to={`/patients/${appointment.patientId}`}
        className="block rounded-2xl border border-line bg-bg-surface p-5 shadow-soft transition-all hover:border-gold/30 hover:shadow-card sm:p-6"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 font-display text-lg font-semibold text-brand-primary">
            {patient ? getInitials(patient.name) : "..."}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Patient
            </p>
            <h2 className="mt-0.5 font-display text-xl font-semibold text-text-primary">
              {patient?.name ?? "Loading..."}
            </h2>
            {patient && (
              <>
                <div className="mt-2">
                  <PrakritiBadge prakriti={patient.prakriti} />
                </div>
                <div className="mt-2">
                  <ConsentBadge status={patient.consentStatus} />
                </div>
              </>
            )}
          </div>
        </div>
      </Link>

      <section aria-label="Appointment notes">
        <div className="mb-3">
          <h2 className="font-display text-xl font-semibold text-text-primary">
            Appointment Notes
          </h2>
          <p className="mt-0.5 text-sm text-text-muted">
            Session context and preparation details
          </p>
        </div>
        <div className="rounded-xl border border-line bg-bg-base/50 p-5 shadow-soft">
          <p className="text-sm leading-relaxed text-text-primary">
            {appointment.notes || "No notes recorded for this appointment."}
          </p>
        </div>
      </section>

      <section aria-label="Message actions">
        <div className="mb-3">
          <h2 className="font-display text-xl font-semibold text-text-primary">
            Message Actions
          </h2>
          <p className="mt-0.5 text-sm text-text-muted">
            Stage a draft message for this patient
          </p>
        </div>

        {patient?.consentStatus === "pending" && (
          <p className="mb-4 rounded-lg border border-gold/25 bg-gold/8 px-4 py-3 text-sm text-text-muted">
            Patient consent pending — confirm before sending communications.
          </p>
        )}

        <div className="rounded-xl border border-line bg-bg-surface p-5 shadow-soft">
          <p className="mb-4 text-xs leading-relaxed text-text-muted">
            Drafts are AI-generated and reviewed before sending (coming in the
            AI message step).
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {MESSAGE_ACTIONS.map((action) => (
              <button
                key={action.type}
                type="button"
                disabled={triggerMessage.isPending}
                onClick={() => handleTriggerMessage(action.type)}
                className="min-h-11 rounded-lg border border-line bg-bg-base px-4 text-sm font-medium text-text-primary transition-colors hover:border-gold/40 hover:bg-bg-surface disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function AppointmentDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-40 animate-pulse rounded bg-line/60" />
      <div className="h-40 animate-pulse rounded-2xl border border-line bg-bg-surface" />
      <div className="h-28 animate-pulse rounded-2xl border border-line bg-bg-surface" />
      <div className="h-32 animate-pulse rounded-xl border border-line bg-bg-surface" />
    </div>
  );
}
