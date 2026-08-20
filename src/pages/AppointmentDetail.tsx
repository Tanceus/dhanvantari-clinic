import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useClinicConfig } from "../config/ClinicConfigProvider";
import { ConsentBadge } from "../components/ConsentBadge";
import { EmptyState } from "../components/EmptyState";
import { QueryErrorState } from "../components/QueryErrorState";
import { ScheduleAppointmentDrawer } from "../components/ScheduleAppointmentDrawer";
import { CalendarDayIcon, ChevronLeftIcon } from "../components/icons";
import { PrakritiBadge } from "../components/PrakritiBadge";
import { StatusControl } from "../components/StatusControl";
import { TreatmentTag } from "../components/TreatmentTag";
import {
  useAppointment,
  useDeleteAppointment,
} from "../lib/hooks/useAppointments";
import { useTriggerMessage } from "../lib/hooks/useMessages";
import { usePatient } from "../lib/hooks/usePatients";
import type { Message, MessageType } from "../types";
import { formatDateTime, getInitials } from "../lib/utils";
import { getErrorMessage } from "../lib/api/client";

const MESSAGE_ACTIONS: { label: string; type: MessageType }[] = [
  { label: "Send Reminder", type: "reminder" },
  { label: "Send Care Instructions", type: "care-instruction" },
  { label: "Schedule Follow-up", type: "follow-up" },
];

type BannerTone = "success" | "warning" | "error";

type TriggerBanner = {
  tone: BannerTone;
  title: string;
};

const BANNER_TONE_CLASS: Record<BannerTone, string> = {
  success:
    "border-status-completed/25 bg-status-completed/8 text-status-completed",
  warning: "border-gold/25 bg-gold/8 text-text-primary",
  error: "border-terracotta/30 bg-terracotta/8 text-terracotta",
};

/**
 * Copy for every skip_reason the backend currently writes on a messages row
 * (message_engine gates) plus already_exists from sweep-level dedup, in case
 * that value ever appears on a trigger response.
 */
const SKIP_REASON_COPY: Record<string, string> = {
  no_consent: "Message blocked — patient consent pending",
  patient_deleted: "Message blocked — this patient has been removed",
  duplicate: "Message blocked — a similar message was already sent recently",
  already_exists: "Message blocked — a similar message already exists",
};

function bannerForTriggeredMessage(message: Message): TriggerBanner {
  if (message.skipReason) {
    return {
      tone: "warning",
      title:
        SKIP_REASON_COPY[message.skipReason] ??
        `Message blocked — ${message.skipReason.replace(/_/g, " ")}`,
    };
  }
  if (message.status === "failed") {
    return { tone: "error", title: "Message failed to send" };
  }
  return { tone: "success", title: "Draft created" };
}

export function AppointmentDetailPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { config } = useClinicConfig();
  const navigate = useNavigate();

  const { data: appointment, isLoading, isError, error, refetch } = useAppointment(appointmentId);
  const { data: patient } = usePatient(appointment?.patientId);
  const triggerMessage = useTriggerMessage();
  const deleteAppointment = useDeleteAppointment();

  const [triggerBanner, setTriggerBanner] = useState<TriggerBanner | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (isLoading) {
    return <AppointmentDetailSkeleton />;
  }

  if (isError) {
    return (
      <QueryErrorState
        message={getErrorMessage(error)}
        onRetry={() => void refetch()}
      />
    );
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
        onSuccess: (message) => {
          setTriggerBanner(bannerForTriggeredMessage(message));
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

      {successMessage && (
        <div
          role="status"
          className="rounded-lg border border-status-completed/25 bg-status-completed/8 px-4 py-3 text-sm font-medium text-status-completed"
        >
          {successMessage}
        </div>
      )}

      {actionError && (
        <p role="alert" className="rounded-lg border border-terracotta/30 bg-terracotta/8 px-4 py-3 text-sm text-terracotta">
          {actionError}
        </p>
      )}

      {triggerBanner && (
        <div
          role="status"
          className={`flex flex-col gap-2 rounded-lg border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${BANNER_TONE_CLASS[triggerBanner.tone]}`}
        >
          <span className="font-medium">{triggerBanner.title}</span>
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
        <div className="mt-5 space-y-3 border-t border-line pt-5">
          <StatusControl appointment={appointment} variant="prominent" />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setActionError(null);
                setDrawerOpen(true);
              }}
              className="min-h-11 rounded-lg border border-line bg-bg-base px-4 text-sm font-medium text-text-primary transition-colors hover:border-gold/40 hover:bg-bg-surface"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                setActionError(null);
                setDeleteOpen(true);
              }}
              className="min-h-11 rounded-lg border border-terracotta/25 px-4 text-sm font-medium text-terracotta transition-colors hover:bg-terracotta/8"
            >
              Delete
            </button>
          </div>
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

      <ScheduleAppointmentDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => {
          setSuccessMessage("Appointment updated.");
          setTimeout(() => setSuccessMessage(null), 4000);
        }}
        appointment={appointment}
      />

      {deleteOpen && (
        <DeleteAppointmentDialog
          busy={deleteAppointment.isPending}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={() => {
            deleteAppointment.mutate(
              {
                appointmentId: appointment.id,
                patientId: appointment.patientId,
              },
              {
                onSuccess: () => {
                  navigate("/appointments");
                },
                onError: (err) => {
                  setDeleteOpen(false);
                  setActionError(getErrorMessage(err));
                },
              },
            );
          }}
        />
      )}
    </div>
  );
}

function DeleteAppointmentDialog({
  busy,
  onCancel,
  onConfirm,
}: {
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-text-primary/20 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={onCancel}
        disabled={busy}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-appointment-title"
        aria-describedby="delete-appointment-body"
        className="relative z-10 w-full max-w-md rounded-2xl border border-line bg-bg-surface p-6 shadow-elevated"
      >
        <h2
          id="delete-appointment-title"
          className="font-display text-xl font-semibold text-text-primary"
        >
          Delete appointment
        </h2>
        <p id="delete-appointment-body" className="mt-2 text-sm leading-relaxed text-text-muted">
          Delete this appointment permanently? This cannot be undone.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-11 rounded-lg border border-line px-4 text-sm font-medium text-text-muted transition-colors hover:bg-line/30 disabled:opacity-50"
          >
            Keep appointment
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="min-h-11 rounded-lg bg-terracotta px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Deleting..." : "Delete permanently"}
          </button>
        </div>
      </div>
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
