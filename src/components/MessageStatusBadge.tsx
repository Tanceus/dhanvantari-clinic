import type { MessageStatus } from "../types";

const STATUS_CONFIG: Record<
  MessageStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-gold/15 text-gold border-gold/30",
  },
  sent: {
    label: "Sent",
    className:
      "bg-status-completed/10 text-status-completed border-status-completed/20",
  },
  failed: {
    label: "Failed",
    className: "bg-terracotta/10 text-terracotta border-terracotta/20",
  },
};

interface MessageStatusBadgeProps {
  status: MessageStatus;
}

export function MessageStatusBadge({ status }: MessageStatusBadgeProps) {
  const { label, className } = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide ${className}`}
    >
      {label}
    </span>
  );
}
