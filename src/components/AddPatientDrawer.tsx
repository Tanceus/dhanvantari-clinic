import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { ConsentStatus, CreatePatientInput, Prakriti } from "../types";
import { useCreatePatient } from "../lib/hooks/usePatients";
import { isValidEmail } from "../lib/utils";
import { CloseIcon } from "./icons";

const PRAKRITI_OPTIONS: Prakriti[] = [
  "Vata",
  "Pitta",
  "Kapha",
  "Vata-Pitta",
  "Pitta-Kapha",
  "Vata-Kapha",
];

const GENDER_OPTIONS = ["Female", "Male", "Other"];

interface AddPatientDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  name: string;
  age: string;
  gender: string;
  phone: string;
  email: string;
  prakriti: Prakriti;
  primaryConcern: string;
  consentStatus: ConsentStatus;
}

const INITIAL_FORM: FormState = {
  name: "",
  age: "",
  gender: "Female",
  phone: "",
  email: "",
  prakriti: "Vata",
  primaryConcern: "",
  consentStatus: "pending",
};

interface FormErrors {
  name?: string;
  age?: string;
  email?: string;
}

export function AddPatientDrawer({
  open,
  onClose,
  onSuccess,
}: AddPatientDrawerProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const createPatient = useCreatePatient();

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
      setForm(INITIAL_FORM);
      setErrors({});
    }
  }, [open]);

  if (!open) return null;

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = "Name is required";
    const ageNum = Number(form.age);
    if (!form.age.trim() || isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
      next.age = "Enter a valid age";
    }
    if (form.email.trim() && !isValidEmail(form.email)) {
      next.email = "Enter a valid email address";
    }
    return next;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const draft: CreatePatientInput = {
      name: form.name.trim(),
      age: Number(form.age),
      gender: form.gender,
      phone: form.phone.trim(),
      email: form.email.trim(),
      prakriti: form.prakriti,
      primaryConcern: form.primaryConcern.trim(),
      consentStatus: form.consentStatus,
      consentDate: form.consentStatus === "granted" ? today : null,
    };

    createPatient.mutate(draft, {
      onSuccess: () => {
        onClose();
        onSuccess();
      },
    });
  }

  function updateField<K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

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
        aria-labelledby="add-patient-title"
        className="relative flex h-full w-full max-w-md flex-col border-l border-line bg-bg-surface shadow-elevated sm:max-w-lg"
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
          <h2
            id="add-patient-title"
            className="font-display text-xl font-semibold text-text-primary"
          >
            Add Patient
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
            <Field label="Full name" error={errors.name} required>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className={inputClass(errors.name)}
                placeholder="Patient full name"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Age" error={errors.age} required>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={form.age}
                  onChange={(e) => updateField("age", e.target.value)}
                  className={inputClass(errors.age)}
                  placeholder="Age"
                />
              </Field>

              <Field label="Gender">
                <select
                  value={form.gender}
                  onChange={(e) => updateField("gender", e.target.value)}
                  className={inputClass()}
                >
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Phone">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className={inputClass()}
                placeholder="+91 98765 43210"
              />
            </Field>

            <Field label="Email" error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className={inputClass(errors.email)}
                placeholder="patient@example.com"
              />
            </Field>

            <Field label="Prakriti">
              <select
                value={form.prakriti}
                onChange={(e) =>
                  updateField("prakriti", e.target.value as Prakriti)
                }
                className={inputClass()}
              >
                {PRAKRITI_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Primary concern">
              <textarea
                value={form.primaryConcern}
                onChange={(e) =>
                  updateField("primaryConcern", e.target.value)
                }
                rows={3}
                className={`${inputClass()} resize-none`}
                placeholder="Main health concern or reason for visit"
              />
            </Field>

            <Field label="Consent status">
              <div className="flex rounded-lg border border-line p-1">
                {(["pending", "granted"] as ConsentStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => updateField("consentStatus", status)}
                    className={`min-h-11 flex-1 rounded-md px-3 text-sm font-medium capitalize transition-colors ${
                      form.consentStatus === status
                        ? "bg-brand-primary text-white shadow-soft"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
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
                disabled={createPatient.isPending}
                className="min-h-11 flex-1 rounded-lg bg-brand-primary px-4 text-sm font-medium text-white shadow-soft transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {createPatient.isPending ? "Saving..." : "Add Patient"}
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
      {error && (
        <p className="mt-1 text-xs text-terracotta">{error}</p>
      )}
    </label>
  );
}

function inputClass(error?: string) {
  return `w-full rounded-lg border bg-bg-base px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${
    error ? "border-terracotta/50" : "border-line focus:border-brand-primary/40"
  }`;
}
