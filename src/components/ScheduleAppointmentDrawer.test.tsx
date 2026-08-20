import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ClinicConfigProvider } from "../config/ClinicConfigProvider";
import { ScheduleAppointmentDrawer } from "./ScheduleAppointmentDrawer";

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
        {children}
      </ClinicConfigProvider>
    </QueryClientProvider>
  );
}

describe("ScheduleAppointmentDrawer", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();

        if (url.includes("/patients") && method === "GET") {
          return jsonResponse([patientRow]);
        }
        if (url.includes("/treatments") && method === "GET") {
          return jsonResponse([treatmentRow]);
        }
        if (url.endsWith("/appointments") && method === "POST") {
          const body = JSON.parse(String(init?.body ?? "{}")) as Record<
            string,
            unknown
          >;
          return jsonResponse(
            {
              id: APT_ID,
              clinic_id: CLINIC_UUID,
              patient_id: body.patient_id,
              treatment_id: body.treatment_id,
              scheduled_at: body.scheduled_at,
              duration_minutes: treatmentRow.duration_minutes,
              status: "scheduled",
              no_show_marked_at: null,
              rescheduled_from: null,
              amount_inr: null,
              notes: body.notes ?? null,
              created_at: "2026-08-20T12:00:00Z",
            },
            201,
          );
        }
        return jsonResponse({ detail: `unhandled ${method} ${url}` }, 404);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("POSTs /appointments with patient_id, treatment_id, and scheduled_at", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(
      <ScheduleAppointmentDrawer
        open
        onClose={onClose}
        onSuccess={onSuccess}
        defaultDate={new Date("2026-08-22T00:00:00+05:30")}
      />,
      { wrapper },
    );

    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: "Granted Gate Test" }),
      ).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: "Nadi Pariksha" }),
      ).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText(/^patient/i), PATIENT_ID);
    await user.selectOptions(
      screen.getByLabelText(/treatment type/i),
      TREATMENT_ID,
    );
    await user.click(screen.getByRole("button", { name: "Schedule" }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
    expect(onClose).toHaveBeenCalled();

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const postCall = fetchMock.mock.calls.find(([input, init]) => {
      const url = String(input);
      const method = ((init as RequestInit | undefined)?.method ?? "GET").toUpperCase();
      return url.endsWith("/appointments") && method === "POST";
    });

    expect(postCall).toBeDefined();
    const [, init] = postCall!;
    const payload = JSON.parse(String((init as RequestInit).body));
    expect(payload).toEqual(
      expect.objectContaining({
        patient_id: PATIENT_ID,
        treatment_id: TREATMENT_ID,
        scheduled_at: expect.any(String),
      }),
    );
    expect(payload.scheduled_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(payload.status).toBeUndefined();
  });

  it("prefills an existing appointment and PATCHes /appointments/:id on save", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    const existing = {
      id: APT_ID,
      clinicId: "dhanvantari-001",
      patientId: PATIENT_ID,
      datetime: "2026-08-22T04:30:00.000Z",
      treatmentType: "Nadi Pariksha",
      treatmentId: TREATMENT_ID,
      status: "scheduled" as const,
      notes: "Original notes",
    };

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();
        if (url.includes("/patients") && method === "GET") {
          return jsonResponse([patientRow]);
        }
        if (url.includes("/treatments") && method === "GET") {
          return jsonResponse([treatmentRow]);
        }
        if (url.includes(`/appointments/${APT_ID}`) && method === "PATCH") {
          const body = JSON.parse(String(init?.body ?? "{}")) as Record<
            string,
            unknown
          >;
          return jsonResponse({
            id: APT_ID,
            clinic_id: CLINIC_UUID,
            patient_id: PATIENT_ID,
            treatment_id: body.treatment_id ?? TREATMENT_ID,
            scheduled_at: body.scheduled_at ?? existing.datetime,
            duration_minutes: 30,
            status: body.status ?? "scheduled",
            no_show_marked_at: null,
            rescheduled_from: null,
            amount_inr: null,
            notes: body.notes ?? null,
            created_at: "2026-08-20T12:00:00Z",
          });
        }
        return jsonResponse({ detail: `unhandled ${method} ${url}` }, 404);
      },
    );

    render(
      <ScheduleAppointmentDrawer
        open
        onClose={onClose}
        onSuccess={onSuccess}
        appointment={existing}
      />,
      { wrapper },
    );

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Granted Gate Test" })).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Nadi Pariksha" })).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: "Edit Appointment" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^patient/i)).toHaveValue(PATIENT_ID);
    expect(screen.getByLabelText(/^date/i)).toHaveValue("2026-08-22");
    expect(screen.getByDisplayValue("10:00")).toHaveAttribute("type", "time");
    expect(screen.getByLabelText(/treatment type/i)).toHaveValue(TREATMENT_ID);
    expect(screen.getByLabelText(/^notes/i)).toHaveValue("Original notes");

    await user.clear(screen.getByLabelText(/^notes/i));
    await user.type(screen.getByLabelText(/^notes/i), "Prep: oil massage");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
    expect(onClose).toHaveBeenCalled();

    const patchCall = fetchMock.mock.calls.find(([input, init]) => {
      const url = String(input);
      const method = ((init as RequestInit | undefined)?.method ?? "GET").toUpperCase();
      return url.includes(`/appointments/${APT_ID}`) && method === "PATCH";
    });
    expect(patchCall).toBeDefined();
    const payload = JSON.parse(String((patchCall![1] as RequestInit).body));
    expect(payload).toEqual(
      expect.objectContaining({
        treatment_id: TREATMENT_ID,
        notes: "Prep: oil massage",
        scheduled_at: expect.any(String),
      }),
    );
    expect(payload.scheduled_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(payload.patient_id).toBeUndefined();
  });

  it("shows an error instead of staying silent when the POST fails", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();
        if (url.includes("/patients") && method === "GET") {
          return jsonResponse([patientRow]);
        }
        if (url.includes("/treatments") && method === "GET") {
          return jsonResponse([treatmentRow]);
        }
        if (url.endsWith("/appointments") && method === "POST") {
          return jsonResponse({ detail: "Slot already booked" }, 409);
        }
        return jsonResponse({ detail: "unhandled" }, 404);
      },
    );

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    render(
      <ScheduleAppointmentDrawer
        open
        onClose={vi.fn()}
        onSuccess={onSuccess}
        defaultDate={new Date("2026-08-22T00:00:00+05:30")}
      />,
      { wrapper },
    );

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Granted Gate Test" })).toBeInTheDocument();
    });
    await user.selectOptions(screen.getByLabelText(/^patient/i), PATIENT_ID);
    await user.click(screen.getByRole("button", { name: "Schedule" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Slot already booked");
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    errorSpy.mockRestore();
  });
});
