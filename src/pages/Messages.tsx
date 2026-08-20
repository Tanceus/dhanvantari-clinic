import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClinicConfig } from "../config/ClinicConfigProvider";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { QueryErrorState } from "../components/QueryErrorState";
import { InboxIcon, TrashIcon } from "../components/icons";
import { MessageStatusBadge } from "../components/MessageStatusBadge";
import { MessageTypeBadge } from "../components/MessageTypeBadge";
import { useDeleteMessage, useMessages } from "../lib/hooks/useMessages";
import { usePatient } from "../lib/hooks/usePatients";
import { canDeleteMessage, SENT_MESSAGE_DELETE_HINT } from "../lib/messageDelete";
import type { Message, MessageStatus } from "../types";
import { formatDateTime } from "../lib/utils";
import { getErrorMessage } from "../lib/api/client";

type MessageFilter = "All" | "Drafts" | "Sent" | "Failed";

const FILTER_STATUS: Record<
  Exclude<MessageFilter, "All">,
  MessageStatus
> = {
  Drafts: "draft",
  Sent: "sent",
  Failed: "failed",
};

const EMPTY_COPY: Record<MessageFilter, { title: string; description: string }> =
  {
    All: {
      title: "No messages yet",
      description:
        "Draft reminders, care instructions, and follow-ups will appear here.",
    },
    Drafts: {
      title: "No drafts awaiting review",
      description: "All caught up — new AI drafts will appear here for review.",
    },
    Sent: {
      title: "No sent messages",
      description: "Messages you send will be recorded here.",
    },
    Failed: {
      title: "No failed messages",
      description: "Delivery failures will appear here for retry.",
    },
  };

export function MessagesPage() {
  const { config } = useClinicConfig();
  const { data: messages, isLoading, isError, error, refetch } = useMessages();
  const deleteMessage = useDeleteMessage();
  const [filter, setFilter] = useState<MessageFilter>("Drafts");
  const [pendingDelete, setPendingDelete] = useState<Message | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const counts = useMemo(() => {
    if (!messages) return { draft: 0, sent: 0, failed: 0 };
    return {
      draft: messages.filter((m) => m.status === "draft").length,
      sent: messages.filter((m) => m.status === "sent").length,
      failed: messages.filter((m) => m.status === "failed").length,
    };
  }, [messages]);

  const filteredMessages = useMemo(() => {
    if (!messages) return [];
    let result = [...messages];
    if (filter !== "All") {
      const status = FILTER_STATUS[filter];
      result = result.filter((m) => m.status === status);
    }
    return result.sort(
      (a, b) =>
        new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
    );
  }, [messages, filter]);

  const emptyCopy = EMPTY_COPY[filter];

  function requestDelete(message: Message) {
    if (!canDeleteMessage(message.status)) return;
    setActionError(null);
    setPendingDelete(message);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
          Messages
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {isLoading
            ? "Loading messages..."
            : `${counts.draft} draft${counts.draft === 1 ? "" : "s"} awaiting review · ${counts.sent} sent${counts.failed > 0 ? ` · ${counts.failed} failed` : ""}`}
        </p>
      </header>

      {actionError && (
        <div
          role="alert"
          className="rounded-lg border border-terracotta/30 bg-terracotta/8 px-4 py-3 text-sm font-medium text-terracotta"
        >
          {actionError}
        </div>
      )}

      <div className="inline-flex w-full flex-wrap gap-1 rounded-xl border border-line bg-bg-surface p-1 shadow-soft sm:w-auto">
        {(["All", "Drafts", "Sent", "Failed"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`min-h-11 flex-1 rounded-lg px-4 text-sm font-medium transition-colors sm:flex-none ${
              filter === tab
                ? "bg-brand-primary text-white shadow-soft"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isError ? (
        <QueryErrorState
          message={getErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : isLoading ? (
        <MessageListSkeleton />
      ) : filteredMessages.length === 0 ? (
        <EmptyState
          title={emptyCopy.title}
          description={emptyCopy.description}
          icon={<InboxIcon className="h-6 w-6" />}
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-line bg-bg-surface shadow-soft md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-bg-base/50 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Patient</th>
                  <th className="px-5 py-3.5">Subject</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Generated</th>
                  <th className="px-5 py-3.5">Channel</th>
                  <th className="px-5 py-3.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map((message) => (
                  <MessageTableRow
                    key={message.id}
                    message={message}
                    locale={config.locale}
                    timezone={config.timezone}
                    onDelete={() => requestDelete(message)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {filteredMessages.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                locale={config.locale}
                timezone={config.timezone}
                onDelete={() => requestDelete(message)}
              />
            ))}
          </div>
        </>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete message"
          body="Delete this message permanently? This cannot be undone."
          confirmLabel="Delete permanently"
          cancelLabel="Keep message"
          busy={deleteMessage.isPending}
          busyLabel="Deleting..."
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            const id = pendingDelete.id;
            deleteMessage.mutate(id, {
              onSuccess: () => setPendingDelete(null),
              onError: (err) => {
                setPendingDelete(null);
                setActionError(getErrorMessage(err));
              },
            });
          }}
        />
      )}
    </div>
  );
}

function MessageTableRow({
  message,
  locale,
  timezone,
  onDelete,
}: {
  message: Message;
  locale: string;
  timezone: string;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  const { data: patient } = usePatient(message.patientId);

  function goToDetail() {
    navigate(`/messages/${message.id}`);
  }

  return (
    <tr
      onClick={goToDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToDetail();
        }
      }}
      tabIndex={0}
      role="link"
      className="group cursor-pointer border-b border-line/70 transition-colors last:border-b-0 hover:bg-brand-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary/30"
    >
      <td className="px-5 py-4">
        <MessageTypeBadge type={message.type} />
      </td>
      <td className="px-5 py-4 font-medium text-text-primary">
        {patient?.name ?? "..."}
      </td>
      <td className="max-w-[240px] truncate px-5 py-4 text-text-muted">
        {message.subject}
      </td>
      <td className="px-5 py-4">
        <MessageStatusBadge status={message.status} />
      </td>
      <td className="px-5 py-4 text-text-muted">
        {formatDateTime(message.generatedAt, locale, timezone)}
      </td>
      <td className="px-5 py-4 capitalize text-text-muted">
        {message.channel}
      </td>
      <td className="px-5 py-4 text-right">
        <RowDeleteButton status={message.status} onDelete={onDelete} />
      </td>
    </tr>
  );
}

function MessageCard({
  message,
  locale,
  timezone,
  onDelete,
}: {
  message: Message;
  locale: string;
  timezone: string;
  onDelete: () => void;
}) {
  const { data: patient } = usePatient(message.patientId);

  return (
    <div className="rounded-xl border border-line bg-bg-surface p-4 shadow-soft transition-all hover:border-gold/30 hover:shadow-card">
      <Link
        to={`/messages/${message.id}`}
        className="block min-h-11 active:scale-[0.99]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <MessageTypeBadge type={message.type} />
          <MessageStatusBadge status={message.status} />
        </div>
        <p className="mt-3 font-medium text-text-primary">
          {patient?.name ?? "..."}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-text-muted">
          {message.subject}
        </p>
        <p className="mt-2 text-xs text-text-muted/80">
          {formatDateTime(message.generatedAt, locale, timezone)} ·{" "}
          {message.channel}
        </p>
      </Link>
      <div className="mt-3 flex justify-end border-t border-line/70 pt-3">
        <RowDeleteButton status={message.status} onDelete={onDelete} label="Delete" />
      </div>
    </div>
  );
}

function RowDeleteButton({
  status,
  onDelete,
  label,
}: {
  status: MessageStatus;
  onDelete: () => void;
  label?: string;
}) {
  const locked = !canDeleteMessage(status);
  const button = (
    <button
      type="button"
      aria-label={locked ? SENT_MESSAGE_DELETE_HINT : "Delete message"}
      title={locked ? SENT_MESSAGE_DELETE_HINT : "Delete"}
      disabled={locked}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!locked) onDelete();
      }}
      className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium text-terracotta/80 opacity-100 transition-colors hover:bg-terracotta/10 hover:text-terracotta disabled:cursor-not-allowed disabled:opacity-40 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
    >
      <TrashIcon className="h-4 w-4" />
      {label ? <span>{label}</span> : null}
    </button>
  );
  if (!locked) return button;
  return <span title={SENT_MESSAGE_DELETE_HINT}>{button}</span>;
}

function MessageListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-[72px] animate-pulse rounded-xl border border-line bg-bg-surface md:h-14"
        />
      ))}
    </div>
  );
}
