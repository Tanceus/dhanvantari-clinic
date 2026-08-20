import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ClinicConfigProvider } from "../config/ClinicConfigProvider";
import { AppointmentDetailPage } from "./AppointmentDetail";

const PATIENT_ID = "f8ae21a8-3eeb-4a5f-8c52-03e989e31859";
const TREATMENT_ID = "8bba3444-1ef6-4e65-b753-0945100884da";
const CLINIC_UUID = "55ad4fc1-a5ad-4ddb-bcfa-d76ab1df7375";
const APT_ID = "edfcb2ea-057c-4452-b97b-0d1ab1fbace6";

const patientRow = {
  id: PATIENT_ID,
  clinic_id: CLINIC_UUID,
  name: "Granted Gate Test",
  phone: "9000000002",
  email: null,
  date_of_birth: "1990-01-15",
  prakriti: "Vata",
  notes: null,
  visit_count: 1,
  first_visit_date: "2026-01-01",
  last_visit_date: "2026-08-01",
  next_recall_date: null,
  consent_status: "granted",
  consent_granted_at: "2026-01-01T00:00:00Z",
  consent_withdrawn_at: null,
  consent_source: null,
  created_at: "2026-01-01T00:00:00Z",
};

const treatmentRow = {
  id: TREATMENT_ID,
  clinic_id: CLINIC_UUID,
  name: "Nadi Pariksha",
  price_inr: 500,
  duration_minutes: 30,
  is_panchakarma: false,
  typical_sessions: 1,
  aftercare_notes: null,
  active: true,
};

const appointmentRow = {
  id: APT_ID,
  clinic_id: CLINIC_UUID,
  patient_id: PATIENT_ID,
  treatment_id: TREATMENT_ID,
  scheduled_at: "2026-08-22T04:30:00.000Z",
  duration_minutes: 30,
  status: "scheduled",
  no_show_marked_at: null,
  rescheduled_from: null,
  amount_inr: null,
  notes: "Original notes",
  created_at: "2026-08-20T12:00:00Z",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return (
    <QueryClientProvider client={client}>
      <ClinicConfigProvider clinicId="dhanvantari-001">
        <MemoryRouter initialEntries={[`/appointments/${APT_ID}`]}>
          <Routes>
            <Route
              path="/appointments/:appointmentId"
              element={children}
            />
            <Route path="/appointments" element={<p>Appointments list</p>} />
          </Routes>
        </MemoryRouter>
      </ClinicConfigProvider>
    </QueryClientProvider>
  );
}

function fetchCalls(
  method: string,
  urlPart: string,
): [RequestInfo | URL, RequestInit | undefined][] {
  const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
  return fetchMock.mock.calls.filter(([input, init]) => {
    const url = String(input);
    const m = ((init as RequestInit | undefined)?.method ?? "GET").toUpperCase();
    return m === method && url.includes(urlPart);
  }) as [RequestInfo | URL, RequestInit | undefined][];
}

describe("AppointmentDetailPage delete", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();

        if (url.includes(`/patients/${PATIENT_ID}`) && method === "GET") {
          return jsonResponse(patientRow);
        }
        if (url.includes("/patients") && method === "GET") {
          return jsonResponse([patientRow]);
        }
        if (url.includes("/treatments") && method === "GET") {
          return jsonResponse([treatmentRow]);
        }
        if (url.includes(`/appointments/${APT_ID}`) && method === "GET") {
          return jsonResponse(appointmentRow);
        }
        if (url.includes(`/appointments/${APT_ID}`) && method === "DELETE") {
          return jsonResponse({ ok: true });
        }
        return jsonResponse({ detail: `unhandled ${method} ${url}` }, 404);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("does not DELETE until the confirmation dialog is confirmed", async () => {
    const user = userEvent.setup();

    render(<AppointmentDetailPage />, { wrapper });

    expect(
      await screen.findByRole("button", { name: "Delete" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(fetchCalls("DELETE", `/appointments/${APT_ID}`)).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Delete" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent(
      "Delete this appointment permanently? This cannot be undone.",
    );
    expect(fetchCalls("DELETE", `/appointments/${APT_ID}`)).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Keep appointment" }));
    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
    expect(fetchCalls("DELETE", `/appointments/${APT_ID}`)).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await screen.findByRole("alertdialog");
    await user.click(
      screen.getByRole("button", { name: "Delete permanently" }),
    );

    await waitFor(() => {
      expect(fetchCalls("DELETE", `/appointments/${APT_ID}`)).toHaveLength(1);
    });
    expect(await screen.findByText("Appointments list")).toBeInTheDocument();
  });
});
