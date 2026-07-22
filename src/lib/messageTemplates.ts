import type {
  Appointment,
  ClinicConfig,
  MessageType,
  Patient,
} from "../types";
import { formatDateTime, formatShortDate } from "./utils";

export interface TemplateContext {
  patient: Patient;
  appointment: Appointment | null;
  clinic: ClinicConfig;
}

export interface FilledTemplate {
  subject: string;
  body: string;
}

// SEAM — in Cycle 4 the AI fills the patient-specific slots within this fixed
// structure (templated, not freeform). The safe skeleton stays fixed for
// health-content guardrails.
export function fillTemplate(
  type: MessageType,
  context: TemplateContext,
  locale: string,
  timezone: string,
): FilledTemplate {
  const { patient, appointment, clinic } = context;
  const treatmentType = appointment?.treatmentType ?? "Consultation";

  const appointmentDate = appointment
    ? formatShortDate(appointment.datetime, locale, timezone)
    : "your scheduled date";
  const appointmentDateTime = appointment
    ? formatDateTime(appointment.datetime, locale, timezone)
    : "your upcoming session";

  switch (type) {
    case "reminder":
      return {
        subject: `Appointment Reminder — ${treatmentType} on ${appointmentDate}`,
        body: [
          `Dear ${patient.name},`,
          "",
          `This is a gentle reminder about your upcoming ${treatmentType} appointment at ${clinic.name}.`,
          "",
          `Date & time: ${appointmentDateTime}`,
          `Treatment: ${treatmentType}`,
          "",
          `Clinic address: ${clinic.contact.address}`,
          `Phone: ${clinic.contact.phone}`,
          "",
          "Please arrive a few minutes early so we can begin your session calmly and without rush.",
          "",
          `Warm regards,`,
          `${clinic.doctorName}`,
          clinic.name,
        ].join("\n"),
      };

    case "care-instruction":
      return {
        subject: `Post-Treatment Care — ${treatmentType}`,
        body: [
          `Dear ${patient.name},`,
          "",
          `Thank you for visiting ${clinic.name}. Here are general aftercare suggestions to support your wellbeing following your ${treatmentType} session.`,
          "",
          "• Rest well and allow your body time to integrate the treatment.",
          "• Sip warm water throughout the day to stay hydrated.",
          "• Favour light, sattvic meals — warm, freshly prepared foods are ideal.",
          "• Avoid cold, heavy, or overly processed foods for the next day or two.",
          "• Maintain a gentle daily routine with adequate sleep and unhurried movement.",
          "",
          "These are general wellness guidelines, not a substitute for personalised medical advice. If you experience any discomfort, please contact the clinic.",
          "",
          `Phone: ${clinic.contact.phone}`,
          `Email: ${clinic.contact.email}`,
          "",
          `With care,`,
          `${clinic.doctorName}`,
          clinic.name,
        ].join("\n"),
      };

    case "follow-up":
      return {
        subject: `Follow-up — Continuing your care at ${clinic.name}`,
        body: [
          `Dear ${patient.name},`,
          "",
          `We hope you are feeling well since your recent visit to ${clinic.name}.`,
          "",
          "When you are ready, we encourage you to book a follow-up consultation so we can review your progress and adjust your care plan together.",
          "",
          `To schedule, please contact us:`,
          `Phone: ${clinic.contact.phone}`,
          `Email: ${clinic.contact.email}`,
          "",
          `Warm regards,`,
          `${clinic.doctorName}`,
          clinic.name,
        ].join("\n"),
      };
  }
}
