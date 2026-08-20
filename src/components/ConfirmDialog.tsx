interface ConfirmDialogProps {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  busyLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel,
  busy = false,
  busyLabel = "Working...",
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-text-primary/20 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={onCancel}
        disabled={busy}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-body"
        className="relative z-10 w-full max-w-md rounded-2xl border border-line bg-bg-surface p-6 shadow-elevated"
      >
        <h2
          id="confirm-dialog-title"
          className="font-display text-xl font-semibold text-text-primary"
        >
          {title}
        </h2>
        <p
          id="confirm-dialog-body"
          className="mt-2 text-sm leading-relaxed text-text-muted"
        >
          {body}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-11 rounded-lg border border-line px-4 text-sm font-medium text-text-muted transition-colors hover:bg-line/30 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="min-h-11 rounded-lg bg-terracotta px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
