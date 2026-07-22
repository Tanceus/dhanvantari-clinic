import type { MessageType } from "../types";

const TYPE_CONFIG: Record<
  MessageType,
  { label: string; className: string }
> = {
  reminder: {
    label: "Reminder",
    className: "bg-gold/12 text-gold border-gold/25",
  },
  "care-instruction": {
    label: "Care instruction",
    className: "bg-brand-primary/8 text-brand-primary border-brand-primary/18",
  },
  "follow-up": {
    label: "Follow-up",
    className: "bg-brand-accent/10 text-brand-accent border-brand-accent/22",
  },
};

interface MessageTypeBadgeProps {
  type: MessageType;
}

export function MessageTypeBadge({ type }: MessageTypeBadgeProps) {
  const { label, className } = TYPE_CONFIG[type];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide ${className}`}
    >
      {label}
    </span>
  );
}
