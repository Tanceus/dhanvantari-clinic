import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useClinicConfig } from "../config/ClinicConfigProvider";
import { useCreateAppointment } from "../lib/hooks/useAppointments";
import { usePatients } from "../lib/hooks/usePatients";
import type { AppointmentStatus } from "../types";
import { combineDateAndTime, toDateInputValue } from "../lib/utils";
import { CloseIcon } from "./icons";

interface ScheduleAppointmentDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDate?: Date;
}

interface FormState {
  patientId: string;
  date: string;
  time: string;
  treatmentType: string;
  notes: string;
  status: AppointmentStatus;
}

interface FormErrors {
  patientId?: string;
  date?: string;
  time?: string;
  treatmentType?: string;
}

export function ScheduleAppointmentDrawer({
  open,
  onClose,
  onSuccess,
  defaultDate,
}: ScheduleAppointmentDrawerProps) {
  const { config } = useClinicConfig();
  const { data: patients } = usePatients();
  const createAppointment = useCreateAppointment();

  const initialDate = toDateInputValue(
    defaultDate ?? new Date(),
    config.timezone,
  );

  const [form, setForm] = useState<FormState>({
    patientId: "",
    date: initialDate,
    time: "10:00",
    treatmentType: config.treatmentTypes[0] ?? "",
    notes: "",
    status: "scheduled",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setForm({
        patientId: "",
        date: toDateInputValue(defaultDate ?? new Date(), config.timezone),
        time: "10:00",
        treatmentType: config.treatmentTypes[0] ?? "",
        notes: "",
        status: "scheduled",
      });
      setErrors({});
    }
  }, [open, defaultDate, config.timezone, config.treatmentTypes]);

  if (!open) return null;

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!form.patientId) next.patientId = "Select a patient";
    if (!form.date.trim()) next.date = "Date is required";
    if (!form.time.trim()) next.time = "Time is required";
    if (!form.treatmentType) next.treatmentType = "Select a treatment type";
    return next;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    createAppointment.mutate(
      {
        patientId: form.patientId,
        datetime: combineDateAndTime(form.date, form.time),
        treatmentType: form.treatmentType,
        notes: form.notes.trim(),
        status: form.status,
      },
      {
        onSuccess: () => {
          onClose();
          onSuccess();
        },
      },
    );
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  const sortedPatients = [...(patients ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-text-primary/20 backdrop-blur-[2px]"
        aria-label="Close drawer"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-appointment-title"
        className="relative flex h-full w-full max-w-md flex-col border-l border-line bg-bg-surface shadow-elevated sm:max-w-lg"
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
          <h2
            id="schedule-appointment-title"
            className="font-display text-xl font-semibold text-text-primary"
          >
            Schedule Appointment
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-line/50 hover:text-text-primary"
            aria-label="Close"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-y-auto"
        >
          <div className="space-y-5 px-5 py-5 sm:px-6">
            <Field label="Patient" error={errors.patientId} required>
              <select
                value={form.patientId}
                onChange={(e) => updateField("patientId", e.target.value)}
                className={inputClass(errors.patientId)}
              >
                <option value="">Select patient...</option>
                {sortedPatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Date" error={errors.date} required>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => updateField("date", e.target.value)}
                  className={inputClass(errors.date)}
                />
              </Field>
              <Field label="Time" error={errors.time} required>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => updateField("time", e.target.value)}
                  className={inputClass(errors.time)}
                />
              </Field>
            </div>

            <Field label="Treatment type" error={errors.treatmentType} required>
              <select
                value={form.treatmentType}
                onChange={(e) => updateField("treatmentType", e.target.value)}
                className={inputClass(errors.treatmentType)}
              >
                {config.treatmentTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Notes">
              <textarea
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
                className={`${inputClass()} resize-none`}
                placeholder="Session notes or preparation instructions"
              />
            </Field>

            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) =>
                  updateField("status", e.target.value as AppointmentStatus)
                }
                className={inputClass()}
              >
                <option value="scheduled">Scheduled</option>
                <option value="checked-in">Checked in</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </Field>
          </div>

          <footer className="mt-auto border-t border-line px-5 py-4 sm:px-6">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 flex-1 rounded-lg border border-line px-4 text-sm font-medium text-text-muted transition-colors hover:bg-line/30"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createAppointment.isPending}
                className="min-h-11 flex-1 rounded-lg bg-brand-primary px-4 text-sm font-medium text-white shadow-soft transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {createAppointment.isPending ? "Scheduling..." : "Schedule"}
              </button>
            </div>
          </footer>
        </form>
      </aside>
    </div>
  );
}

function Field({
  label,
  children,
  error,
  required,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-text-primary">
        {label}
        {required && <span className="text-brand-accent"> *</span>}
      </span>
      {children}
      {error && <p className="mt-1 text-xs text-terracotta">{error}</p>}
    </label>
  );
}

function inputClass(error?: string) {
  return `w-full rounded-lg border bg-bg-base px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${
    error ? "border-terracotta/50" : "border-line focus:border-brand-primary/40"
  }`;
}
