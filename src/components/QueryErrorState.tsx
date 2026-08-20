import { RefreshIcon } from "./icons";

interface QueryErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function QueryErrorState({ message, onRetry }: QueryErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-bg-surface/50 px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
        <RefreshIcon className="h-6 w-6" />
      </div>
      <h3 className="font-display text-lg font-semibold text-text-primary">
        Couldn&apos;t load this
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-muted">
        {message ||
          "Something went wrong. Check your connection and try again."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-primary px-5 text-sm font-medium text-white shadow-soft transition-opacity hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
