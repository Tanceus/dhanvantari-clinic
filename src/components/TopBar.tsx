import { useClinicConfig } from "../config/ClinicConfigProvider";
import { formatDate } from "../lib/utils";

export function TopBar() {
  const { config } = useClinicConfig();
  const today = formatDate(new Date(), config.locale, config.timezone);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg-base/90 backdrop-blur-md">
      <div className="flex min-h-14 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="min-w-0 lg:hidden">
          <p className="truncate font-display text-lg font-semibold text-brand-primary">
            {config.branding.logoText}
          </p>
          <p className="truncate text-xs text-text-muted">{config.name}</p>
        </div>
        <div className="hidden min-w-0 flex-1 lg:block" />
        <div className="shrink-0 text-right">
          <p className="text-xs font-medium uppercase tracking-wider text-gold">
            Today
          </p>
          <p className="text-sm font-medium text-text-primary">{today}</p>
        </div>
      </div>
    </header>
  );
}
