# Dhanvantari Clinic

Multi-tenant Ayurvedic patient-care system — appointments, treatment records, and patient communication for Dhanvantari Clinic (and additional clinics via config).

## Architecture

Everything keys off `clinicId`. Clinic config in `src/config/clinics.ts` is the **single source of truth** for tenant identity (name, doctor, branding, contact, treatment types, locale/timezone). A second clinic is a config row, not a code fork — components read branding and copy through `useClinicConfig()` only.

Data flows through a deliberate seam: **services → TanStack Query hooks → screens**. Today services read mock data; in Cycle 5 they will call FastAPI without rewriting UI.

## Tech stack

**Frontend (this repo):** React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query.

**Planned backend:** FastAPI, Supabase, n8n, OpenAI / Claude, Gmail API.

## Getting started

**Prerequisites:** Node 20 (see `.nvmrc`).

```bash
npm install
npm run dev        # local development
npm run build      # typecheck + production build
npm run preview    # serve dist locally
npm run lint       # eslint
```

## Multi-tenancy

**Switch the active clinic**

1. Set `VITE_ACTIVE_CLINIC_ID` in `.env` (e.g. `wellness-002`), or
2. Change the default in `src/config/clinics.ts` (`DEFAULT_ACTIVE_CLINIC_ID`).

Rebuild / restart the dev server after changing env. The app re-themes from config with no component edits.

**Add a new clinic**

Add one `ClinicConfig` object to `CLINIC_CONFIGS` in `src/config/clinics.ts`, keyed by `clinicId`. Never hardcode clinic name, contact, branding, or treatment types elsewhere.

## Environment

See [`.env.example`](.env.example) for the full variable contract across cycles.

- `VITE_*` variables are **public** — they are embedded in the client bundle. Use them only for non-secrets (API base URL, active clinic id).
- All secrets (Supabase service role, API keys, Gmail credentials) are **backend-only**. Never prefix them with `VITE_`. Never commit `.env`.

## Deployment

Deployed to **Netlify**.

- Publish directory: `dist`
- Build command: `npm run build`
- Node: 20 (`netlify.toml` + `.nvmrc`)
- SPA routing: `netlify.toml` `[[redirects]]` and `public/_redirects` (`/*` → `/index.html` status 200) so deep links and refreshes work

## Build roadmap

| Cycle | Focus |
|-------|--------|
| **F** | Frontend demo (Vite + mock data) — current shipping surface |
| **0b** | Netlify production deploy / branding polish |
| **0** | Repo hygiene + clinics config as single source of truth *(this cycle)* |
| **1** | Supabase schema (`clinics` table mirrors `ClinicConfig`) |
| **2** | FastAPI service layer |
| **3** | Auth / clinic-scoped access |
| **4** | AI message generation (OpenAI / Claude) |
| **5** | Swap mock services for FastAPI |
| **6** | Gmail send path |
| **7** | n8n automation |
| **8** | Hardening, ops, handoff |

v1 is **single-clinic in production** but **multi-tenant in architecture** from day one.

## Compliance

Patient health data is subject to India’s **DPDP Act**. The data model carries consent state (`consentStatus` / `consentDate` on patients). The schema in Cycle 1 is designed for consent tracking and retention-aware storage; the UI already blocks sending health communications when consent is pending.
