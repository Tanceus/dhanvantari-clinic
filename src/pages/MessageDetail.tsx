import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useClinicConfig } from "../config/ClinicConfigProvider";
import { EmailPreview } from "../components/EmailPreview";
import { EmptyState } from "../components/EmptyState";
import { ChevronLeftIcon, InboxIcon } from "../components/icons";
import { MessageStatusBadge } from "../components/MessageStatusBadge";
import { MessageTypeBadge } from "../components/MessageTypeBadge";
import {
  useDiscardMessage,
  useMessage,
  useRegenerateMessage,
  useSendMessage,
  useUpdateMessage,
} from "../lib/hooks/useMessages";
import { usePatient } from "../lib/hooks/usePatients";
import { formatDateTime } from "../lib/utils";

export function MessageDetailPage() {
  const { messageId } = useParams<{ messageId: string }>();
  const navigate = useNavigate();
  const { config } = useClinicConfig();

  const { data: message, isLoading } = useMessage(messageId);
  const { data: patient } = usePatient(message?.patientId);

  const updateMessage = useUpdateMessage();
  const sendMessage = useSendMessage();
  const regenerateMessage = useRegenerateMessage();
  const discardMessage = useDiscardMessage();

  const [editMode, setEditMode] = useState(false);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [saveNotice, setSaveNotice] = useState(false);

  useEffect(() => {
    if (message) {
      setEditSubject(message.subject);
      setEditBody(message.body);
    }
  }, [message]);

  if (isLoading) {
    return <MessageDetailSkeleton />;
  }

  if (!message) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <EmptyState
          title="Message not found"
          description="This message may have been discarded or the link is incorrect."
          icon={<InboxIcon className="h-6 w-6" />}
        />
        <Link
          to="/messages"
          className="mt-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to messages
        </Link>
      </div>
    );
  }

  const canSend = patient?.consentStatus === "granted";
  const isDraft = message.status === "draft";
  const isSent = message.status === "sent";
  const isFailed = message.status === "failed";

  function enterEditMode() {
    setEditSubject(message!.subject);
    setEditBody(message!.body);
    setEditMode(true);
  }

  function cancelEdit() {
    setEditSubject(message!.subject);
    setEditBody(message!.body);
    setEditMode(false);
  }

  function handleSave() {
    updateMessage.mutate(
      {
        messageId: message!.id,
        patch: { subject: editSubject.trim(), body: editBody.trim() },
      },
      {
        onSuccess: () => {
          setEditMode(false);
          setSaveNotice(true);
          setTimeout(() => setSaveNotice(false), 3000);
        },
      },
    );
  }

  function handleRegenerate() {
    if (
      editMode &&
      (editSubject !== message!.subject || editBody !== message!.body)
    ) {
      const confirmed = window.confirm(
        "Regenerating will discard your unsaved edits. Continue?",
      );
      if (!confirmed) return;
    }
    regenerateMessage.mutate(message!.id, {
      onSuccess: (data) => {
        setEditSubject(data.subject);
        setEditBody(data.body);
        setEditMode(false);
      },
    });
  }

  function handleSend() {
    if (!canSend) return;
    sendMessage.mutate(message!.id);
  }

  function handleDiscard() {
    const confirmed = window.confirm(
      "Discard this draft? This cannot be undone.",
    );
    if (!confirmed) return;
    discardMessage.mutate(message!.id, {
      onSuccess: () => navigate("/messages"),
    });
  }

  const displaySubject = editMode ? editSubject : message.subject;
  const displayBody = editMode ? editBody : message.body;

  return (
    <div className="space-y-6">
      <Link
        to="/messages"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-text-muted transition-colors hover:text-brand-primary"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to messages
      </Link>

      {saveNotice && (
        <div
          role="status"
          className="rounded-lg border border-status-completed/25 bg-status-completed/8 px-4 py-3 text-sm font-medium text-status-completed"
        >
          Changes saved.
        </div>
      )}

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <MessageTypeBadge type={message.type} />
          <MessageStatusBadge status={message.status} />
        </div>
        <p className="text-sm text-text-muted">
          Generated{" "}
          {formatDateTime(message.generatedAt, config.locale, config.timezone)}
        </p>
        <p className="text-sm">
          <span className="text-text-muted">Patient: </span>
          <Link
            to={`/patients/${message.patientId}`}
            className="font-medium text-brand-primary hover:underline"
          >
            {patient?.name ?? "Loading..."}
          </Link>
        </p>
        <p className="text-sm leading-relaxed text-text-muted">
          AI-drafted from a fixed template for safety. Review before sending.
        </p>
      </header>

      {isFailed && (
        <div className="rounded-xl border border-terracotta/30 bg-terracotta/8 px-5 py-4">
          <p className="font-medium text-terracotta">Delivery failed</p>
          <p className="mt-1 text-sm text-text-muted">
            This message could not be sent. You can retry delivery below.
          </p>
        </div>
      )}

      {editMode ? (
        <div className="space-y-4 rounded-2xl border border-line bg-bg-surface p-5 shadow-soft sm:p-6">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-text-primary">
              Subject
            </span>
            <input
              type="text"
              value={editSubject}
              onChange={(e) => setEditSubject(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-base px-3 py-2.5 text-sm text-text-primary focus:border-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/15"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-text-primary">
              Body
            </span>
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={14}
              className="w-full resize-y rounded-lg border border-line bg-bg-base px-3 py-2.5 font-mono text-sm leading-relaxed text-text-primary focus:border-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/15"
            />
          </label>
        </div>
      ) : (
        patient && (
          <EmailPreview
            toName={patient.name}
            toEmail={patient.email}
            subject={displaySubject}
            body={displayBody}
          />
        )
      )}

      <section
        aria-label="Review and send"
        className="rounded-2xl border border-line bg-bg-surface p-5 shadow-soft sm:p-6"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {isDraft && (
            <>
              {editMode ? (
                <>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={updateMessage.isPending}
                    className="min-h-11 rounded-lg bg-brand-primary px-5 text-sm font-medium text-white shadow-soft transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {updateMessage.isPending ? "Saving..." : "Save changes"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="min-h-11 rounded-lg border border-line px-5 text-sm font-medium text-text-muted transition-colors hover:bg-line/30"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={enterEditMode}
                  className="min-h-11 rounded-lg border border-line bg-bg-base px-5 text-sm font-medium text-text-primary transition-colors hover:border-gold/40"
                >
                  Review / Edit
                </button>
              )}
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={regenerateMessage.isPending}
                className="min-h-11 rounded-lg border border-line px-5 text-sm font-medium text-text-muted transition-colors hover:border-gold/40 hover:text-text-primary disabled:opacity-60"
              >
                {regenerateMessage.isPending
                  ? "Regenerating..."
                  : "Regenerate draft"}
              </button>
            </>
          )}

          {isDraft && !editMode && (
            <div className="w-full border-t border-line pt-4 sm:pt-0 sm:border-t-0">
              {!canSend && (
                <p className="mb-3 rounded-lg border border-gold/25 bg-gold/8 px-4 py-3 text-sm text-text-muted">
                  Cannot send — patient consent is pending. Confirm consent
                  before sending health communications (DPDP Act).{" "}
                  <Link
                    to={`/patients/${message.patientId}`}
                    className="font-medium text-brand-primary hover:underline"
                  >
                    View patient
                  </Link>
                </p>
              )}
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend || sendMessage.isPending}
                className="min-h-11 w-full rounded-lg bg-brand-primary px-5 text-sm font-medium text-white shadow-soft transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                {sendMessage.isPending ? "Sending..." : "Send Email"}
              </button>
              <p className="mt-2 text-xs text-text-muted">
                Sends from the clinic&apos;s Gmail (set up in the email step).
              </p>
            </div>
          )}

          {isSent && message.sentAt && (
            <p className="text-sm font-medium text-status-completed">
              Sent on{" "}
              {formatDateTime(message.sentAt, config.locale, config.timezone)}
            </p>
          )}

          {isFailed && (
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend || sendMessage.isPending}
              className="min-h-11 rounded-lg bg-brand-primary px-5 text-sm font-medium text-white shadow-soft transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sendMessage.isPending ? "Retrying..." : "Retry send"}
            </button>
          )}
        </div>

        {isDraft && !editMode && (
          <div className="mt-5 border-t border-line pt-4">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={discardMessage.isPending}
              className="min-h-11 text-sm font-medium text-terracotta/80 transition-colors hover:text-terracotta disabled:opacity-60"
            >
              {discardMessage.isPending ? "Discarding..." : "Discard draft"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function MessageDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-36 animate-pulse rounded bg-line/60" />
      <div className="h-8 w-64 animate-pulse rounded bg-line/60" />
      <div className="h-96 animate-pulse rounded-2xl border border-line bg-bg-surface" />
      <div className="h-32 animate-pulse rounded-2xl border border-line bg-bg-surface" />
    </div>
  );
}
