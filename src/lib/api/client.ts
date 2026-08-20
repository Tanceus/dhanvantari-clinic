/**
 * Thin fetch wrapper for the FastAPI backend.
 *
 * VITE_CLINIC_ID is the API tenant (X-Clinic-Id header).
 * VITE_ACTIVE_CLINIC_ID is the Cycle 0 branding key in src/config/clinics.ts.
 * They are the same "which clinic am I" concept, but two separate env vars
 * until real multi-clinic login exists (Cycle 8). Keep them in sync manually.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isNotFoundError(error: unknown): boolean {
  return isApiError(error) && error.status === 404;
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) return error.detail;
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}

function getBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!raw) {
    throw new ApiError(
      500,
      "VITE_API_BASE_URL is not set. Add it to the frontend .env.",
    );
  }
  return raw.replace(/\/+$/, "");
}

function getClinicId(): string {
  const id = import.meta.env.VITE_CLINIC_ID?.trim();
  if (!id) {
    throw new ApiError(
      500,
      "VITE_CLINIC_ID is not set. Add it to the frontend .env.",
    );
  }
  return id;
}

function parseDetail(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const parts = detail.map((item) => {
      if (item && typeof item === "object" && "msg" in item) {
        return String((item as { msg: unknown }).msg);
      }
      return typeof item === "string" ? item : "";
    });
    const joined = parts.filter(Boolean).join("; ");
    if (joined) return joined;
  }
  return fallback;
}

export async function api<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("X-Clinic-Id", getClinicId());
  if (init.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const url = `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  let response: Response;
  try {
    response = await fetch(url, { ...init, headers });
  } catch {
    throw new ApiError(
      0,
      "Could not reach the clinic API. Check your connection and try again.",
    );
  }

  const raw = await response.text();
  let parsed: unknown = undefined;
  if (raw) {
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      parsed = undefined;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      parseDetail(parsed, response.statusText || "Request failed"),
    );
  }

  return parsed as T;
}

export function apiQuery(
  params: Record<string, string | undefined | null>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
