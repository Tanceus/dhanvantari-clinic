import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClinicConfigProvider } from "../config/ClinicConfigProvider";
import { SENT_MESSAGE_DELETE_HINT } from "../lib/messageDelete";
import { MessageDetailPage } from "./MessageDetail";

const PATIENT_ID = "f8ae21a8-3eeb-4a5f-8c52-03e989e31859";
const CLINIC_UUID = "55ad4fc1-a5ad-4ddb-bcfa-d76ab1df7375";
const MSG_ID = "c0a80101-0000-4000-8000-000000000001";

const patientRow = {
  id: PATIENT_ID,
  clinic_id: CLINIC_UUID,
  name: "Granted Gate Test",
  phone: "9000000002",
  email: "granted@example.com",
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

function apiMessage(status: string) {
  return {
    id: MSG_ID,
    clinic_id: CLINIC_UUID,
    patient_id: PATIENT_ID,
    appointment_id: null,
    kind: "reminder_24h",
    channel: "whatsapp",
    recipient: "9000000002",
    body: "Namaste, reminder for your visit.",
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

function renderDetail() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <ClinicConfigProvider clinicId="dhanvantari-001">
        <MemoryRouter initialEntries={[`/messages/${MSG_ID}`]}>
          <Routes>
            <Route path="/messages/:messageId" element={children} />
            <Route path="/messages" element={<p>Messages list</p>} />
          </Routes>
        </MemoryRouter>
      </ClinicConfigProvider>
    </QueryClientProvider>
  );
  return render(<MessageDetailPage />, { wrapper });
}

function fetchCalls(method: string, urlPart: string) {
  const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
  return fetchMock.mock.calls.filter(([input, init]) => {
    const url = String(input);
    const m = ((init as RequestInit | undefined)?.method ?? "GET").toUpperCase();
    return m === method && url.includes(urlPart);
  });
}

describe("MessageDetailPage delete", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function stubMessage(status: string) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();
        if (url.includes(`/patients/${PATIENT_ID}`) && method === "GET") {
          return jsonResponse(patientRow);
        }
        if (url.includes(`/messages/${MSG_ID}`) && method === "GET") {
          return jsonResponse(apiMessage(status));
        }
        if (url.includes(`/messages/${MSG_ID}`) && method === "DELETE") {
          return jsonResponse(undefined, 204);
        }
        if (url.includes("/messages") && method === "GET") {
          return jsonResponse([]);
        }
        return jsonResponse({ detail: `unhandled ${method} ${url}` }, 404);
      }),
    );
  }

  it("does not DELETE a failed message until the dialog is confirmed", async () => {
    stubMessage("failed");
    const user = userEvent.setup();
    renderDetail();

    const deleteBtn = await screen.findByRole("button", { name: "Delete" });
    expect(deleteBtn).toBeEnabled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    await user.click(deleteBtn);
    expect(await screen.findByRole("alertdialog")).toHaveTextContent(
      "Delete this message permanently?",
    );
    expect(fetchCalls("DELETE", `/messages/${MSG_ID}`)).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Keep message" }));
    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
    expect(fetchCalls("DELETE", `/messages/${MSG_ID}`)).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await screen.findByRole("alertdialog");
    await user.click(screen.getByRole("button", { name: "Delete permanently" }));

    await waitFor(() => {
      expect(fetchCalls("DELETE", `/messages/${MSG_ID}`)).toHaveLength(1);
    });
    expect(await screen.findByText("Messages list")).toBeInTheDocument();
  });

  it("disables Delete on a sent message with an explanatory tooltip", async () => {
    stubMessage("sent");
    const user = userEvent.setup();
    renderDetail();

    const locked = await screen.findByRole("button", {
      name: SENT_MESSAGE_DELETE_HINT,
    });
    expect(locked).toBeDisabled();
    await user.click(locked);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(fetchCalls("DELETE", `/messages/${MSG_ID}`)).toHaveLength(0);
  });
});
