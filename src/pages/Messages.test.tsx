import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ClinicConfigProvider } from "../config/ClinicConfigProvider";
import { SENT_MESSAGE_DELETE_HINT } from "../lib/messageDelete";
import { MessagesPage } from "./Messages";

const PATIENT_ID = "f8ae21a8-3eeb-4a5f-8c52-03e989e31859";
const CLINIC_UUID = "55ad4fc1-a5ad-4ddb-bcfa-d76ab1df7375";
const DRAFT_ID = "c0a80101-0000-4000-8000-000000000001";
const SENT_ID = "c0a80101-0000-4000-8000-000000000002";
const FAILED_ID = "c0a80101-0000-4000-8000-000000000003";

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

function apiMessage(
  id: string,
  status: string,
  body = "Namaste, reminder for your visit.",
) {
  return {
    id,
    clinic_id: CLINIC_UUID,
    patient_id: PATIENT_ID,
    appointment_id: null,
    kind: "reminder_24h",
    channel: "whatsapp",
    recipient: "9000000002",
    body,
    status,
    skip_reason: null,
    provider_message_id: status === "sent" ? "stub-1" : null,
    error: status === "failed" ? "send_failed" : null,
    scheduled_for: "2026-08-20T10:00:00Z",
    sent_at: status === "sent" ? "2026-08-20T10:01:00Z" : null,
    created_at: "2026-08-20T09:00:00Z",
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
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
        <MemoryRouter>{children}</MemoryRouter>
      </ClinicConfigProvider>
    </QueryClientProvider>
  );
}

function fetchCalls(method: string, urlPart: string) {
  const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
  return fetchMock.mock.calls.filter(([input, init]) => {
    const url = String(input);
    const m = ((init as RequestInit | undefined)?.method ?? "GET").toUpperCase();
    return m === method && url.includes(urlPart);
  });
}

describe("MessagesPage delete", () => {
  let rows: ReturnType<typeof apiMessage>[];

  beforeEach(() => {
    rows = [
      apiMessage(DRAFT_ID, "queued"),
      apiMessage(FAILED_ID, "failed"),
      apiMessage(SENT_ID, "sent"),
    ];

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
        if (method === "DELETE" && url.includes(`/messages/${DRAFT_ID}`)) {
          rows = rows.filter((r) => r.id !== DRAFT_ID);
          return jsonResponse(undefined, 204);
        }
        if (method === "DELETE" && url.includes(`/messages/${FAILED_ID}`)) {
          rows = rows.filter((r) => r.id !== FAILED_ID);
          return jsonResponse(undefined, 204);
        }
        if (method === "DELETE" && url.includes(`/messages/${SENT_ID}`)) {
          return jsonResponse(
            {
              detail:
                "Cannot delete: this message was already sent to the patient. Sent messages are kept as a permanent record.",
            },
            409,
          );
        }
        if (method === "GET" && /\/messages\/[^/?]+/.test(url)) {
          const id = url.split("/messages/")[1]?.split("?")[0];
          const row = rows.find((r) => r.id === id);
          return row
            ? jsonResponse(row)
            : jsonResponse({ detail: "Message not found" }, 404);
        }
        if (method === "GET" && url.includes("/messages")) {
          return jsonResponse(rows);
        }
        return jsonResponse({ detail: `unhandled ${method} ${url}` }, 404);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("deletes a draft after confirmation and removes it from the list", async () => {
    const user = userEvent.setup();
    render(<MessagesPage />, { wrapper });

    expect(
      await screen.findAllByText("Namaste, reminder for your visit."),
    ).not.toHaveLength(0);

    const deleteButtons = screen.getAllByRole("button", {
      name: "Delete message",
    });
    await user.click(deleteButtons[0]);

    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent(
      "Delete this message permanently? This cannot be undone.",
    );
    expect(fetchCalls("DELETE", `/messages/${DRAFT_ID}`)).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Delete permanently" }));

    await waitFor(() => {
      expect(fetchCalls("DELETE", `/messages/${DRAFT_ID}`)).toHaveLength(1);
    });
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Delete message" }),
      ).not.toBeInTheDocument();
    });
  });

  it("keeps sent-message delete disabled so DELETE never fires", async () => {
    const user = userEvent.setup();
    render(<MessagesPage />, { wrapper });

    await user.click(await screen.findByRole("button", { name: "All" }));
    await user.click(screen.getByRole("button", { name: "Sent" }));

    const locked = await screen.findAllByRole("button", {
      name: SENT_MESSAGE_DELETE_HINT,
    });
    expect(locked.length).toBeGreaterThan(0);
    expect(locked[0]).toBeDisabled();

    await user.click(locked[0]);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(fetchCalls("DELETE", `/messages/${SENT_ID}`)).toHaveLength(0);
    expect(screen.getAllByText("Granted Gate Test").length).toBeGreaterThan(0);
  });
});
