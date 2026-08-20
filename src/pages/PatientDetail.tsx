import { Link, useParams } from "react-router-dom";
import { useClinicConfig } from "../config/ClinicConfigProvider";
import { ConsentBadge } from "../components/ConsentBadge";
import { EmptyState } from "../components/EmptyState";
import {
  CalendarDayIcon,
  ChevronLeftIcon,
  InboxIcon,
  UsersIcon,
} from "../components/icons";
import { MessageStatusBadge } from "../components/MessageStatusBadge";
import { MessageTypeBadge } from "../components/MessageTypeBadge";
import { PrakritiBadge } from "../components/PrakritiBadge";
import { StatusBadge } from "../components/StatusBadge";
import { QueryErrorState } from "../components/QueryErrorState";
import { getErrorMessage } from "../lib/api/client";
import { usePatientAppointments } from "../lib/hooks/useAppointments";
import { usePatientMessages } from "../lib/hooks/useMessages";
import { usePatient } from "../lib/hooks/usePatients";
import type { Message } from "../types";
import { formatDateTime, formatShortDate, getInitials } from "../lib/utils";

export function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const { config } = useClinicConfig();

  const { data: patient, isLoading: patientLoading, isError: patientError, error: patientErr, refetch: refetchPatient } = usePatient(patientId);
  const { data: appointments, isLoading: appointmentsLoading, isError: appointmentsError, error: appointmentsErr, refetch: refetchAppointments } =
    usePatientAppointments(patientId);
  const { data: messages, isLoading: messagesLoading, isError: messagesError, error: messagesErr, refetch: refetchMessages } =
    usePatientMessages(patientId);

  const isLoading = patientLoading;

  if (isLoading) {
    return <PatientDetailSkeleton />;
  }

  if (patientError) {
    return (
      <QueryErrorState
        message={getErrorMessage(patientErr)}
        onRetry={() => void refetchPatient()}
      />
    );
  }

  if (!patient) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <EmptyState
          title="Patient not found"
          description="This patient may have been removed or the link is incorrect."
          icon={<UsersIcon className="h-6 w-6" />}
        />
        <Link
          to="/patients"
          className="mt-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to patients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/patients"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-text-muted transition-colors hover:text-brand-primary"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to patients
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 lg:sticky lg:top-6 lg:w-80">
          <ProfilePanel patient={patient} locale={config.locale} timezone={config.timezone} />
        </aside>

        <main className="min-w-0 flex-1 space-y-8">
          <section aria-label="Visit history">
            <SectionHeader
              title="Visit History"
              description="Past and upcoming appointments"
            />
            {appointmentsError ? (
              <QueryErrorState
                message={getErrorMessage(appointmentsErr)}
                onRetry={() => void refetchAppointments()}
              />
            ) : appointmentsLoading ? (
              <SectionSkeleton rows={3} />
            ) : appointments && appointments.length > 0 ? (
              <ol className="relative space-y-0 border-l border-line pl-6">
                {appointments.map((apt, index) => (
                  <li key={apt.id} className="relative pb-6 last:pb-0">
                    <span className="absolute -left-[25px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-bg-surface bg-brand-primary" />
                    <div className="rounded-xl border border-line bg-bg-surface p-4 shadow-soft">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {formatDateTime(
                              apt.datetime,
                              config.locale,
                              config.timezone,
                            )}
                          </p>
                          <p className="mt-0.5 text-sm font-medium text-brand-accent">
                            {apt.treatmentType}
                          </p>
                        </div>
                        <StatusBadge status={apt.status} />
                      </div>
                      {apt.notes && (
                        <p className="mt-3 text-sm leading-relaxed text-text-muted">
                          {apt.notes}
                        </p>
                      )}
                    </div>
                    {index < appointments.length - 1 && (
                      <span className="sr-only">Next visit</span>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState
                title="No visits recorded"
                description="Appointments for this patient will appear here once scheduled."
                icon={<CalendarDayIcon className="h-5 w-5" />}
              />
            )}
          </section>

          <section aria-label="Messages">
            <SectionHeader
              title="Messages"
              description="Communications sent or drafted for this patient"
            />
            {messagesError ? (
              <QueryErrorState
                message={getErrorMessage(messagesErr)}
                onRetry={() => void refetchMessages()}
              />
            ) : messagesLoading ? (
              <SectionSkeleton rows={2} />
            ) : messages && messages.length > 0 ? (
              <div className="space-y-3">
                {messages.map((message) => (
                  <MessageRow key={message.id} message={message} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No messages yet"
                description="Care instructions, reminders, and follow-ups will appear here."
                icon={<InboxIcon className="h-5 w-5" />}
              />
            )}
          </section>

          <section aria-label="Clinical notes">
            <SectionHeader
              title="Clinical Notes"
              description="Patient concern and visit context"
            />
            <div className="rounded-xl border border-line bg-bg-base/50 p-5 shadow-soft">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Primary concern
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-primary">
                {patient.primaryConcern || "No clinical notes recorded yet."}
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function ProfilePanel({
  patient,
  locale,
  timezone,
}: {
  patient: {
    name: string;
    age: number;
    gender: string;
    prakriti: string;
    primaryConcern: string;
    phone: string;
    email: string;
    consentStatus: "granted" | "pending";
    consentDate: string | null;
  };
  locale: string;
  timezone: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-bg-surface p-5 shadow-soft sm:p-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10 font-display text-xl font-semibold text-brand-primary">
        {getInitials(patient.name)}
      </div>

      <h1 className="mt-4 font-display text-2xl font-semibold text-text-primary">
        {patient.name}
      </h1>
      <p className="mt-1 text-sm text-text-muted">
        {patient.age} years / {patient.gender}
      </p>

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Prakriti
        </p>
        <PrakritiBadge prakriti={patient.prakriti} />
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Primary concern
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-text-primary">
          {patient.primaryConcern}
        </p>
      </div>

      <div className="mt-5 border-t border-line pt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Contact
        </p>
        <dl className="mt-2 space-y-2 text-sm">
          <div>
            <dt className="text-text-muted">Phone</dt>
            <dd className="font-medium text-text-primary">{patient.phone}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Email</dt>
            <dd className="font-medium text-text-primary">{patient.email}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-5 rounded-xl border border-line bg-bg-base/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Consent & Data
        </p>
        <div className="mt-2 flex items-center gap-2">
          <ConsentBadge status={patient.consentStatus} />
        </div>
        <p className="mt-2 text-sm text-text-muted">
          {patient.consentDate
            ? formatShortDate(patient.consentDate, locale, timezone)
            : "Awaiting consent"}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-text-muted/80">
          Personal health data handled under India&apos;s DPDP Act.
        </p>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-xl font-semibold text-text-primary">
        {title}
      </h2>
      <p className="mt-0.5 text-sm text-text-muted">{description}</p>
    </div>
  );
}

function MessageRow({ message }: { message: Message }) {
  return (
    <Link
      to={`/messages/${message.id}`}
      className="block rounded-xl border border-line bg-bg-surface p-4 shadow-soft transition-colors hover:border-gold/30"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <MessageTypeBadge type={message.type} />
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-brand-primary/8 px-2 py-0.5 text-[10px] font-medium capitalize text-brand-primary">
            {message.channel}
          </span>
          <MessageStatusBadge status={message.status} />
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted">
        {message.subject}
      </p>
    </Link>
  );
}

function SectionSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-20 animate-pulse rounded-xl border border-line bg-bg-surface"
        />
      ))}
    </div>
  );
}

function PatientDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-32 animate-pulse rounded bg-line/60" />
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="h-[480px] w-full animate-pulse rounded-2xl border border-line bg-bg-surface lg:w-80" />
        <div className="flex-1 space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-6 w-40 animate-pulse rounded bg-line/60" />
              <div className="h-24 animate-pulse rounded-xl border border-line bg-bg-surface" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
