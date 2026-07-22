import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-bg-surface/50 px-6 py-12 text-center">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/8 text-brand-primary">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-text-primary">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-muted">
        {description}
      </p>
    </div>
  );
}
