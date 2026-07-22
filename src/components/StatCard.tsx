import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  icon?: ReactNode;
  loading?: boolean;
}

export function StatCard({ label, value, hint, icon, loading }: StatCardProps) {
  return (
    <div className="rounded-xl border border-line bg-bg-surface p-5 shadow-soft transition-shadow hover:shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-muted">{label}</p>
          {loading ? (
            <div className="mt-2 h-9 w-16 animate-pulse rounded-md bg-line/60" />
          ) : (
            <p className="mt-1 font-display text-3xl font-semibold tracking-tight text-text-primary">
              {value}
            </p>
          )}
          {hint && !loading && (
            <p className="mt-1.5 text-xs text-text-muted">{hint}</p>
          )}
        </div>
        {icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-primary/8 text-brand-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
