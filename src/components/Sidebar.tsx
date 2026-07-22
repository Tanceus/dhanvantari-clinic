import { NavLink } from "react-router-dom";
import { useClinicConfig } from "../config/ClinicConfigProvider";
import {
  AppointmentsIcon,
  DashboardIcon,
  MessagesIcon,
  PatientsIcon,
} from "./icons";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { to: "/patients", label: "Patients", icon: PatientsIcon },
  { to: "/appointments", label: "Appointments", icon: AppointmentsIcon },
  { to: "/messages", label: "Messages", icon: MessagesIcon },
] as const;

function NavItem({
  to,
  label,
  icon: Icon,
  mobile = false,
}: {
  to: string;
  label: string;
  icon: typeof DashboardIcon;
  mobile?: boolean;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 rounded-lg font-medium transition-colors",
          mobile
            ? "min-h-11 min-w-0 flex-1 flex-col justify-center gap-1 px-2 py-2 text-[11px]"
            : "min-h-11 px-3 py-2.5 text-sm",
          isActive
            ? mobile
              ? "text-brand-primary"
              : "bg-brand-primary/10 text-brand-primary"
            : mobile
              ? "text-text-muted"
              : "text-text-muted hover:bg-line/40 hover:text-text-primary",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={`h-5 w-5 shrink-0 ${isActive && mobile ? "text-brand-primary" : ""}`}
          />
          <span className={mobile ? "truncate" : ""}>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const { config } = useClinicConfig();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-line bg-bg-surface lg:flex">
        <div className="border-b border-line px-5 py-6">
          <p className="font-display text-xl font-semibold tracking-tight text-brand-primary">
            {config.branding.logoText}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-text-muted">
            {config.tagline}
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>
        <div className="border-t border-line px-5 py-4">
          <p className="text-xs text-text-muted">Signed in as</p>
          <p className="mt-0.5 text-sm font-medium text-text-primary">
            {config.doctorName}
          </p>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-stretch border-t border-line bg-bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1 shadow-elevated backdrop-blur-md lg:hidden">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} mobile />
        ))}
      </nav>
    </>
  );
}
