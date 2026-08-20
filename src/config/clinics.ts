/**
 * SINGLE SOURCE OF TRUTH FOR TENANT IDENTITY.
 *
 * Adding a clinic = adding one ClinicConfig object to this record.
 * NEVER hardcode clinic name, contact, branding, or treatment types anywhere
 * else in the app — always read via useClinicConfig().
 * A second clinic is a config row, not a code fork.
 * In Cycle 1 this same shape becomes a row in the Supabase `clinics` table.
 */

import type { ClinicConfig } from "../types";

export type { ClinicConfig };

/** Default when VITE_ACTIVE_CLINIC_ID is unset. */
const DEFAULT_ACTIVE_CLINIC_ID = "dhanvantari-001";

export const CLINIC_CONFIGS: Record<string, ClinicConfig> = {
  "dhanvantari-001": {
    clinicId: "dhanvantari-001",
    name: "Dhanvantari Clinic",
    doctorName: "Dr. Nijanand Khamkar",
    tagline: "Authentic Ayurvedic Care",
    contact: {
      phone: "+91 00000 00000",
      email: "clinic@dhanvantari.example",
      address: "Maharashtra, India",
      website: "https://dhanvantari.example",
    },
    branding: {
      logoText: "Dhanvantari",
      primaryColor: "#1F3D2B",
      accentColor: "#C8742B",
    },
    treatmentTypes: [
      "Consultation",
      "Panchakarma",
      "Abhyanga",
      "Shirodhara",
      "Nasya",
      "Basti",
      "Virechana",
      "Udvartana",
      "Follow-up",
    ],
    locale: "en-IN",
    timezone: "Asia/Kolkata",
  },

  // Second clinic — set VITE_ACTIVE_CLINIC_ID=wellness-002 (or swap the default below)
  // to re-theme the entire app from config alone.
  "wellness-002": {
    clinicId: "wellness-002",
    name: "Sattva Wellness Centre",
    doctorName: "Dr. Priya Deshmukh",
    tagline: "Balance Through Tradition",
    contact: {
      phone: "+91 00000 00001",
      email: "hello@sattva.example",
      address: "Pune, Maharashtra, India",
      website: "https://sattva.example",
    },
    branding: {
      logoText: "Sattva",
      primaryColor: "#2C4A3E",
      accentColor: "#D4A04A",
    },
    treatmentTypes: [
      "Consultation",
      "Panchakarma",
      "Abhyanga",
      "Shirodhara",
      "Follow-up",
    ],
    locale: "en-IN",
    timezone: "Asia/Kolkata",
  },
};

/** All known clinic IDs, derived from CLINIC_CONFIGS. */
export const CLINIC_IDS: string[] = Object.keys(CLINIC_CONFIGS);

/**
 * Active tenant for this build.
 * Prefer VITE_ACTIVE_CLINIC_ID when set; otherwise the hardcoded default.
 *
 * VITE_ACTIVE_CLINIC_ID (branding key, e.g. dhanvantari-001) and
 * VITE_CLINIC_ID (API UUID sent as X-Clinic-Id) are the same
 * "which clinic am I" concept, but two separate env vars until Cycle 8
 * multi-clinic login. Keep them in sync manually — do not merge yet.
 */
export const ACTIVE_CLINIC_ID: string =
  (import.meta.env.VITE_ACTIVE_CLINIC_ID?.trim() || DEFAULT_ACTIVE_CLINIC_ID);

export function getClinicConfig(clinicId: string): ClinicConfig {
  const config = CLINIC_CONFIGS[clinicId];
  if (!config) {
    throw new Error(
      `Unknown clinicId "${clinicId}". Known clinics: ${CLINIC_IDS.join(", ")}. ` +
        `Add a ClinicConfig row in src/config/clinics.ts or fix VITE_ACTIVE_CLINIC_ID.`,
    );
  }
  return config;
}
