import { useClinicConfig } from "../config/ClinicConfigProvider";
import { useTodaysAppointments } from "../lib/hooks/useAppointments";
import { useDraftMessages, useDashboardStats } from "../lib/hooks/useMessages";
import { formatDate } from "../lib/utils";
import { AppointmentCard } from "../components/AppointmentCard";
import { EmptyState } from "../components/EmptyState";
import {
  CalendarDayIcon,
  InboxIcon,
  SparkleIcon,
  UsersIcon,
} from "../components/icons";
import { MessagePreviewCard } from "../components/MessagePreviewCard";
import { StatCard } from "../components/StatCard";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function Dashboard() {
  const { config } = useClinicConfig();
  const today = formatDate(new Date(), config.locale, config.timezone);

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: todaysAppointments, isLoading: appointmentsLoading } =
    useTodaysAppointments();
  const { data: draftMessages, isLoading: messagesLoading } =
    useDraftMessages();

  const activeAppointments =
    todaysAppointments?.filter((a) => a.status !== "cancelled") ?? [];

  return (
    <div className="space-y-8">
      {/* Warm header */}
      <header className="relative overflow-hidden rounded-2xl border border-line bg-bg-surface px-6 py-8 shadow-soft sm:px-8">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-[0.07]"
          style={{ backgroundColor: config.branding.accentColor }}
        />
        <div
          className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full opacity-[0.05]"
          style={{ backgroundColor: config.branding.primaryColor }}
        />
        <p className="text-sm font-medium text-brand-accent">
          {getGreeting()}
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
          {config.name}
        </h1>
        <p className="mt-2 text-base text-text-muted">{config.doctorName}</p>
        <p className="mt-4 text-sm text-text-muted">{today}</p>
      </header>

      {/* Stat cards */}
      <section aria-label="Overview statistics">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Today's Appointments"
            value={stats?.todaysAppointments ?? 0}
            loading={statsLoading}
            hint="Scheduled for today"
            icon={<CalendarDayIcon className="h-5 w-5" />}
          />
          <StatCard
            label="Patients Seen Today"
            value={stats?.patientsSeenToday ?? 0}
            loading={statsLoading}
            hint="Completed visits"
            icon={<UsersIcon className="h-5 w-5" />}
          />
          <StatCard
            label="Messages Awaiting Review"
            value={stats?.messagesAwaitingReview ?? 0}
            loading={statsLoading}
            hint="Draft messages"
            icon={<InboxIcon className="h-5 w-5" />}
          />
          <StatCard
            label="New Patients"
            value={stats?.newPatientsThisWeek ?? 0}
            loading={statsLoading}
            hint="This week"
            icon={<SparkleIcon className="h-5 w-5" />}
          />
        </div>
      </section>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Today's appointments */}
        <section className="xl:col-span-2" aria-label="Today's appointments">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-text-primary">
                Today's Appointments
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                {appointmentsLoading
                  ? "Loading schedule..."
                  : activeAppointments.length > 0
                    ? `${activeAppointments.length} active session${activeAppointments.length === 1 ? "" : "s"} remaining`
                    : "Your schedule for the day"}
              </p>
            </div>
          </div>

          {appointmentsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl border border-line bg-bg-surface"
                />
              ))}
            </div>
          ) : todaysAppointments && todaysAppointments.length > 0 ? (
            <div className="space-y-3">
              {todaysAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No appointments today"
              description="Your schedule is clear. New bookings will appear here automatically."
              icon={<CalendarDayIcon className="h-6 w-6" />}
            />
          )}
        </section>

        {/* Messages awaiting review */}
        <section aria-label="Messages awaiting review">
          <div className="rounded-2xl border border-line bg-bg-surface p-5 shadow-soft sm:p-6">
            <div className="mb-4 border-b border-line pb-4">
              <h2 className="font-display text-xl font-semibold text-text-primary">
                Awaiting Review
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                Draft messages ready for your approval
              </p>
            </div>

            {messagesLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-lg bg-line/40"
                  />
                ))}
              </div>
            ) : draftMessages && draftMessages.length > 0 ? (
              <div className="space-y-3">
                {draftMessages.map((message) => (
                  <MessagePreviewCard key={message.id} message={message} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="All caught up"
                description="No draft messages need your review right now."
                icon={<InboxIcon className="h-5 w-5" />}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
