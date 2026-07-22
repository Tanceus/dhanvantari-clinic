import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClinicConfig } from "../config/ClinicConfigProvider";
import { AddPatientDrawer } from "../components/AddPatientDrawer";
import { ConsentBadge } from "../components/ConsentBadge";
import { EmptyState } from "../components/EmptyState";
import { PlusIcon, SearchIcon, UsersIcon } from "../components/icons";
import { PrakritiBadge } from "../components/PrakritiBadge";
import { usePatients } from "../lib/hooks/usePatients";
import type { ConsentStatus, Patient } from "../types";
import { formatShortDate, prakritiIncludesDosha } from "../lib/utils";

type PrakritiFilter = "All" | "Vata" | "Pitta" | "Kapha";
type ConsentFilter = "All" | "Granted" | "Pending";

export function PatientsPage() {
  const { config } = useClinicConfig();
  const navigate = useNavigate();
  const { data: patients, isLoading } = usePatients();

  const [search, setSearch] = useState("");
  const [prakritiFilter, setPrakritiFilter] = useState<PrakritiFilter>("All");
  const [consentFilter, setConsentFilter] = useState<ConsentFilter>("All");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredPatients = useMemo(() => {
    if (!patients) return [];

    let result = [...patients];

    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.primaryConcern.toLowerCase().includes(query),
      );
    }

    if (prakritiFilter !== "All") {
      result = result.filter((p) =>
        prakritiIncludesDosha(p.prakriti, prakritiFilter),
      );
    }

    if (consentFilter !== "All") {
      const status: ConsentStatus =
        consentFilter === "Granted" ? "granted" : "pending";
      result = result.filter((p) => p.consentStatus === status);
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [patients, search, prakritiFilter, consentFilter]);

  function handlePatientAdded() {
    setSuccessMessage("Patient added successfully.");
    setTimeout(() => setSuccessMessage(null), 4000);
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <div
          role="status"
          className="rounded-lg border border-status-completed/25 bg-status-completed/8 px-4 py-3 text-sm font-medium text-status-completed"
        >
          {successMessage}
        </div>
      )}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
            Patients
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {isLoading
              ? "Loading registry..."
              : `${filteredPatients.length} patient${filteredPatients.length === 1 ? "" : "s"}${patients && filteredPatients.length !== patients.length ? ` of ${patients.length}` : ""}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-primary px-5 text-sm font-medium text-white shadow-soft transition-opacity hover:opacity-90"
        >
          <PlusIcon className="h-4 w-4" />
          Add Patient
        </button>
      </header>

      <div className="space-y-4 rounded-2xl border border-line bg-bg-surface p-4 shadow-soft sm:p-5">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or concern..."
            className="w-full rounded-lg border border-line bg-bg-base py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted/60 focus:border-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/15"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <FilterChipGroup
            label="Prakriti"
            options={["All", "Vata", "Pitta", "Kapha"] as const}
            value={prakritiFilter}
            onChange={setPrakritiFilter}
          />
          <FilterChipGroup
            label="Consent"
            options={["All", "Granted", "Pending"] as const}
            value={consentFilter}
            onChange={setConsentFilter}
          />
        </div>
      </div>

      {isLoading ? (
        <PatientListSkeleton />
      ) : filteredPatients.length === 0 ? (
        <EmptyState
          title={
            patients && patients.length > 0
              ? "No matching patients"
              : "No patients yet"
          }
          description={
            patients && patients.length > 0
              ? "Try adjusting your search or filters to find who you are looking for."
              : "Add your first patient to begin building your clinic registry."
          }
          icon={<UsersIcon className="h-6 w-6" />}
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-line bg-bg-surface shadow-soft md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-bg-base/50 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <th className="px-5 py-3.5 font-semibold">Name</th>
                  <th className="px-5 py-3.5 font-semibold">Age / Gender</th>
                  <th className="px-5 py-3.5 font-semibold">Prakriti</th>
                  <th className="px-5 py-3.5 font-semibold">Primary Concern</th>
                  <th className="px-5 py-3.5 font-semibold">Last Visit</th>
                  <th className="px-5 py-3.5 font-semibold">Consent</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <PatientTableRow
                    key={patient.id}
                    patient={patient}
                    locale={config.locale}
                    timezone={config.timezone}
                    onNavigate={() => navigate(`/patients/${patient.id}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {filteredPatients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                locale={config.locale}
                timezone={config.timezone}
                onNavigate={() => navigate(`/patients/${patient.id}`)}
              />
            ))}
          </div>
        </>
      )}

      <AddPatientDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handlePatientAdded}
      />
    </div>
  );
}

function FilterChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
        {label}
      </span>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`min-h-11 rounded-full px-3.5 text-xs font-medium transition-colors ${
            value === option
              ? "bg-brand-primary text-white shadow-soft"
              : "border border-line bg-bg-base text-text-muted hover:border-gold/40 hover:text-text-primary"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function PatientTableRow({
  patient,
  locale,
  timezone,
  onNavigate,
}: {
  patient: Patient;
  locale: string;
  timezone: string;
  onNavigate: () => void;
}) {
  return (
    <tr
      onClick={onNavigate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onNavigate();
        }
      }}
      tabIndex={0}
      role="link"
      className="cursor-pointer border-b border-line/70 transition-colors last:border-b-0 hover:bg-brand-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary/30"
    >
      <td className="px-5 py-4">
        <span className="font-medium text-text-primary">{patient.name}</span>
      </td>
      <td className="px-5 py-4 text-text-muted">
        {patient.age} / {patient.gender}
      </td>
      <td className="px-5 py-4">
        <PrakritiBadge prakriti={patient.prakriti} />
      </td>
      <td className="max-w-[200px] truncate px-5 py-4 text-text-muted">
        {patient.primaryConcern}
      </td>
      <td className="px-5 py-4 text-text-muted">
        {formatShortDate(patient.lastVisit, locale, timezone)}
      </td>
      <td className="px-5 py-4">
        <ConsentBadge status={patient.consentStatus} />
      </td>
    </tr>
  );
}

function PatientCard({
  patient,
  locale,
  timezone,
  onNavigate,
}: {
  patient: Patient;
  locale: string;
  timezone: string;
  onNavigate: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onNavigate}
      className="w-full rounded-xl border border-line bg-bg-surface p-4 text-left shadow-soft transition-all hover:border-gold/30 hover:shadow-card active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-semibold text-text-primary">
            {patient.name}
          </p>
          <p className="mt-0.5 text-sm text-text-muted">
            {patient.age} / {patient.gender}
          </p>
        </div>
        <ConsentBadge status={patient.consentStatus} />
      </div>
      <div className="mt-3">
        <PrakritiBadge prakriti={patient.prakriti} />
      </div>
      <p className="mt-3 text-sm text-text-muted">{patient.primaryConcern}</p>
      <p className="mt-2 text-xs text-text-muted/80">
        Last visit: {formatShortDate(patient.lastVisit, locale, timezone)}
      </p>
    </button>
  );
}

function PatientListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-[72px] animate-pulse rounded-xl border border-line bg-bg-surface md:h-14"
        />
      ))}
    </div>
  );
}
