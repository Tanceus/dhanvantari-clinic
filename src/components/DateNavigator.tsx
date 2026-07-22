import { useClinicConfig } from "../config/ClinicConfigProvider";
import { formatAgendaDate, getDateKeyInTimezone } from "../lib/utils";
import { ChevronLeftIcon } from "./icons";

interface DateNavigatorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function DateNavigator({
  selectedDate,
  onDateChange,
}: DateNavigatorProps) {
  const { config } = useClinicConfig();
  const today = new Date();
  const isToday =
    getDateKeyInTimezone(selectedDate, config.timezone) ===
    getDateKeyInTimezone(today, config.timezone);

  function shiftDays(delta: number) {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + delta);
    onDateChange(next);
  }

  function goToToday() {
    onDateChange(new Date());
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-bg-surface px-5 py-4 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Selected day
        </p>
        <p className="font-display text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
          {formatAgendaDate(selectedDate, config.locale, config.timezone)}
        </p>
        {isToday && (
          <p className="mt-0.5 text-xs font-medium text-brand-accent">Today</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => shiftDays(-1)}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-line bg-bg-base text-text-muted transition-colors hover:border-gold/40 hover:text-text-primary"
          aria-label="Previous day"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={goToToday}
          disabled={isToday}
          className="min-h-11 rounded-lg border border-line bg-bg-base px-4 text-sm font-medium text-text-primary transition-colors hover:border-gold/40 disabled:cursor-default disabled:opacity-50"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => shiftDays(1)}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-line bg-bg-base text-text-muted transition-colors hover:border-gold/40 hover:text-text-primary"
          aria-label="Next day"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
