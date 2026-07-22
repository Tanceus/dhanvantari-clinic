import { Link } from "react-router-dom";
import type { Message } from "../types";
import { usePatient } from "../lib/hooks/usePatients";
import { MessageStatusBadge } from "./MessageStatusBadge";
import { MessageTypeBadge } from "./MessageTypeBadge";

interface MessagePreviewCardProps {
  message: Message;
}

export function MessagePreviewCard({ message }: MessagePreviewCardProps) {
  const { data: patient } = usePatient(message.patientId);

  return (
    <Link
      to={`/messages/${message.id}`}
      className="block rounded-lg border border-line bg-bg-base/60 p-3.5 transition-colors hover:border-gold/35 hover:bg-bg-surface"
    >
      <div className="flex items-center justify-between gap-2">
        <MessageTypeBadge type={message.type} />
        <MessageStatusBadge status={message.status} />
      </div>
      <p className="mt-1.5 text-sm font-medium text-text-primary">
        {patient?.name ?? "..."}
      </p>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-muted">
        {message.subject}
      </p>
    </Link>
  );
}
