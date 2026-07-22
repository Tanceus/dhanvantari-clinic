import type { ConsentStatus } from "../types";

const CONSENT_CONFIG: Record<
  ConsentStatus,
  { label: string; className: string }
> = {
  granted: {
    label: "Granted",
    className:
      "bg-status-completed/10 text-status-completed border-status-completed/20",
  },
  pending: {
    label: "Pending",
    className: "bg-gold/15 text-gold border-gold/30",
  },
};

interface ConsentBadgeProps {
  status: ConsentStatus;
}

export function ConsentBadge({ status }: ConsentBadgeProps) {
  const { label, className } = CONSENT_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide ${className}`}
    >
      {label}
    </span>
  );
}
