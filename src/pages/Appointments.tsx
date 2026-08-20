import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClinicConfig } from "../config/ClinicConfigProvider";
import { DateNavigator } from "../components/DateNavigator";
import { EmptyState } from "../components/EmptyState";
import { QueryErrorState } from "../components/QueryErrorState";
import { CalendarDayIcon, PlusIcon } from "../components/icons";
import { ScheduleAppointmentDrawer } from "../components/ScheduleAppointmentDrawer";
import { StatusControl } from "../components/StatusControl";
import { TreatmentTag } from "../components/TreatmentTag";
import { useAppointments } from "../lib/hooks/useAppointments";
import { getErrorMessage } from "../lib/api/client";
import { usePatient } from "../lib/hooks/usePatients";
import type { Appointment, AppointmentStatus } from "../types";
import {
  formatGroupDate,
  formatTime,
  getDateKeyInTimezone,
  isSameDayInTimezone,
} from "../lib/utils";

type StatusFilter =
  | "All"
  | "Scheduled"
  | "Checked-in"
  | "Completed"
  | "Cancelled";

const STATUS_FILTER_MAP: Record<
  Exclude<StatusFilter, "All">,
  AppointmentStatus
> = {
  Scheduled: "scheduled",
  "Checked-in": "checked-in",
  Completed: "completed",
  Cancelled: "cancelled",
};

const UPCOMING_LIMIT = 8;

export function AppointmentsPage() {
  const { config } = useClinicConfig();
  const { data: appointments, isLoading, isError, error, refetch } = useAppointments();

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [treatmentFilter, setTreatmentFilter] = useState<string>("All");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const dayAppointments = useMemo(() => {
    if (!appointments) return [];

    let result = appointments.filter((a) =>
      isSameDayInTimezone(a.datetime, selectedDate, config.timezone),
    );

    if (statusFilter !== "All") {
      const status = STATUS_FILTER_MAP[statusFilter];
      result = result.filter((a) => a.status === status);
    }

    if (treatmentFilter !== "All") {
      result = result.filter((a) => a.treatmentType === treatmentFilter);
    }

    return result.sort(
      (a, b) =>
        new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
    );
  }, [appointments, selectedDate, config.timezone, statusFilter, treatmentFilter]);

  const upcomingGrouped = useMemo(() => {
    if (!appointments) return [];

    const selectedKey = getDateKeyInTimezone(selectedDate, config.timezone);
    const future = appointments
      .filter((a) => {
        const aptKey = getDateKeyInTimezone(
          new Date(a.datetime),
          config.timezone,
        );
        return aptKey > selectedKey;
      })
      .sort(
        (a, b) =>
          new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
      )
      .slice(0, UPCOMING_LIMIT);

    const groups = new Map<string, Appointment[]>();
    for (const apt of future) {
      const key = getDateKeyInTimezone(new Date(apt.datetime), config.timezone);
      const list = groups.get(key) ?? [];
      list.push(apt);
      groups.set(key, list);
    }

    return Array.from(groups.entries()).map(([dateKey, items]) => ({
      dateKey,
      label: formatGroupDate(items[0].datetime, config.locale, config.timezone),
      items,
    }));
  }, [appointments, selectedDate, config.timezone, config.locale]);

  function handleScheduled() {
    setSuccessMessage("Appointment scheduled successfully.");
    setTimeout(() => setSuccessMessage(null), 4000);
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <div
          role="status"
          className="rounded-lg border border-status-completed/25 bg-status-completed/8 px-4 py-3 text-sm font-medium text-status-completed"
        >
          {successMessage}
        </div>
      )}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
            Appointments
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {isLoading
              ? "Loading schedule..."
              : `${dayAppointments.length} appointment${dayAppointments.length === 1 ? "" : "s"} this day`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-primary px-5 text-sm font-medium text-white shadow-soft transition-opacity hover:opacity-90"
        >
          <PlusIcon className="h-4 w-4" />
          Schedule Appointment
        </button>
      </header>

      <DateNavigator
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-surface p-4 shadow-soft sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:p-5">
        <FilterChipGroup
          label="Status"
          options={
            [
              "All",
              "Scheduled",
              "Checked-in",
              "Completed",
              "Cancelled",
            ] as const
          }
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <FilterChipGroup
          label="Treatment"
          options={["All", ...config.treatmentTypes] as readonly string[]}
          value={treatmentFilter}
          onChange={setTreatmentFilter}
        />
      </div>

      <section aria-label="Day agenda">
        {isError ? (
          <QueryErrorState
            message={getErrorMessage(error)}
            onRetry={() => void refetch()}
          />
        ) : isLoading ? (
          <AgendaSkeleton />
        ) : dayAppointments.length === 0 ? (
          <EmptyState
            title="No appointments scheduled for this day"
            description="Select another date or schedule a new appointment for this day."
            icon={<CalendarDayIcon className="h-6 w-6" />}
          />
        ) : (
          <div className="space-y-3">
            {dayAppointments.map((appointment) => (
              <AgendaAppointmentRow
                key={appointment.id}
                appointment={appointment}
              />
            ))}
          </div>
        )}
      </section>

      {upcomingGrouped.length > 0 && (
        <section aria-label="Upcoming appointments">
          <div className="mb-4">
            <h2 className="font-display text-xl font-semibold text-text-primary">
              Upcoming
            </h2>
            <p className="mt-0.5 text-sm text-text-muted">
              Future appointments beyond the selected day
            </p>
          </div>
          <div className="space-y-5">
            {upcomingGrouped.map((group) => (
              <div key={group.dateKey}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {group.label}
                </p>
                <div className="space-y-2">
                  {group.items.map((appointment) => (
                    <UpcomingRow
                      key={appointment.id}
                      appointment={appointment}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <ScheduleAppointmentDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handleScheduled}
        defaultDate={selectedDate}
      />
    </div>
  );
}

function AgendaAppointmentRow({ appointment }: { appointment: Appointment }) {
  const { config } = useClinicConfig();
  const navigate = useNavigate();
  const { data: patient } = usePatient(appointment.patientId);

  const time = formatTime(
    appointment.datetime,
    config.locale,
    config.timezone,
  );
  const timeParts = time.split(" ");
  const timeMain = timeParts[0];
  const timePeriod = timeParts.slice(1).join(" ");

  function navigateToDetail() {
    navigate(`/appointments/${appointment.id}`);
  }

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={navigateToDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigateToDetail();
        }
      }}
      className="cursor-pointer rounded-xl border border-line bg-bg-surface p-4 shadow-soft transition-all hover:border-gold/30 hover:shadow-card sm:p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="flex min-w-[4.5rem] shrink-0 flex-col items-center rounded-lg bg-brand-primary/6 px-3 py-2">
            <span className="font-display text-lg font-semibold leading-none text-brand-primary">
              {timeMain}
            </span>
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-text-muted">
              {timePeriod}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-semibold text-text-primary">
              {patient?.name ?? "Loading..."}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <TreatmentTag treatment={appointment.treatmentType} />
            </div>
            {appointment.notes && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted">
                {appointment.notes}
              </p>
            )}
          </div>
        </div>
        <StatusControl appointment={appointment} />
      </div>
    </article>
  );
}

function UpcomingRow({ appointment }: { appointment: Appointment }) {
  const { config } = useClinicConfig();
  const { data: patient } = usePatient(appointment.patientId);
  const time = formatTime(
    appointment.datetime,
    config.locale,
    config.timezone,
  );

  return (
    <Link
      to={`/appointments/${appointment.id}`}
      className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-line bg-bg-surface/80 px-4 py-3 text-sm transition-colors hover:border-gold/35 hover:bg-bg-surface"
    >
      <div className="min-w-0">
        <span className="font-medium text-text-primary">
          {patient?.name ?? "..."}
        </span>
        <span className="mx-2 text-text-muted/50">·</span>
        <TreatmentTag treatment={appointment.treatmentType} />
      </div>
      <span className="shrink-0 text-xs font-medium text-text-muted">
        {time}
      </span>
    </Link>
  );
}

function FilterChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
        {label}
      </span>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`min-h-11 rounded-full px-3.5 text-xs font-medium transition-colors ${
            value === option
              ? "bg-brand-primary text-white shadow-soft"
              : "border border-line bg-bg-base text-text-muted hover:border-gold/40 hover:text-text-primary"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function AgendaSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-xl border border-line bg-bg-surface sm:h-24"
        />
      ))}
    </div>
  );
}
