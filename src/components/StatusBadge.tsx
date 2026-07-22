import type { AppointmentStatus } from "../types";

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; className: string }
> = {
  scheduled: {
    label: "Scheduled",
    className:
      "bg-brand-primary/10 text-brand-primary border-brand-primary/20",
  },
  "checked-in": {
    label: "Checked in",
    className: "bg-brand-accent/12 text-brand-accent border-brand-accent/25",
  },
  completed: {
    label: "Completed",
    className:
      "bg-status-completed/10 text-status-completed border-status-completed/20",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-terracotta/10 text-terracotta border-terracotta/20",
  },
};

interface StatusBadgeProps {
  status: AppointmentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className } = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide ${className}`}
    >
      {label}
    </span>
  );
}
