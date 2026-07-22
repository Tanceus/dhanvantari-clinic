import type { Appointment } from "../types";
import { useClinicConfig } from "../config/ClinicConfigProvider";
import { usePatient } from "../lib/hooks/usePatients";
import { formatTime } from "../lib/utils";
import { StatusBadge } from "./StatusBadge";

interface AppointmentCardProps {
  appointment: Appointment;
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const { config } = useClinicConfig();
  const { data: patient } = usePatient(appointment.patientId);

  const time = formatTime(
    appointment.datetime,
    config.locale,
    config.timezone,
  );

  return (
    <article className="group rounded-xl border border-line bg-bg-surface p-4 shadow-soft transition-all hover:border-gold/30 hover:shadow-card sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="flex min-w-[4.5rem] flex-col items-center rounded-lg bg-brand-primary/6 px-3 py-2">
            <span className="font-display text-lg font-semibold leading-none text-brand-primary">
              {time.split(" ")[0]}
            </span>
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-text-muted">
              {time.split(" ").slice(1).join(" ")}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-semibold text-text-primary">
              {patient?.name ?? "Loading..."}
            </h3>
            <p className="mt-0.5 text-sm font-medium text-brand-accent">
              {appointment.treatmentType}
            </p>
            {appointment.notes && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted">
                {appointment.notes}
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0 self-start sm:pt-1">
          <StatusBadge status={appointment.status} />
        </div>
      </div>
    </article>
  );
}
