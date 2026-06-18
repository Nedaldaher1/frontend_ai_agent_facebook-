/**
 * The single HTTP entry point for the admin API (central interceptor).
 *
 * Every protected call goes through `apiFetch`, which:
 *  - prefixes {@link API_URL} and injects `Authorization: Bearer <token>`,
 *  - serialises JSON bodies (but never sets `Content-Type` for `FormData`, so
 *    the browser can set the multipart boundary — required by image upload),
 *  - unwraps the backend's `{ timestamp, path, error }` error envelope into a
 *    Refine {@link HttpError} (mapping zod `issues` onto field-level `errors`).
 *
 * Both the data provider and the auth provider build on this, so token handling
 * and error shape live in exactly one place (CLAUDE.md §6).
 */

import type { HttpError } from "@refinedev/core";

import { API_URL, TOKEN_KEY } from "./constants";

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void =>
  localStorage.setItem(TOKEN_KEY, token);
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

/** A zod validation issue as returned inside a `400` error envelope. */
type ZodIssue = { path?: (string | number)[]; message?: string };

/** The backend error envelope: `error` is an object (4xx) or a string (500). */
type ErrorEnvelope = {
  error?:
    | string
    | { statusCode?: number; message?: string; issues?: ZodIssue[] };
  message?: string;
};

type ApiInit = Omit<RequestInit, "body"> & {
  /** JSON body — serialised and sent as `application/json`. */
  json?: unknown;
  /** Raw body (e.g. `FormData` for uploads); takes precedence over `json`. */
  body?: BodyInit;
};

/** Build a Refine `HttpError` (also a real `Error`) from a parsed envelope. */
const toHttpError = (status: number, body: ErrorEnvelope | undefined): HttpError => {
  const envelope = body?.error;

  // 500s send `error` as a bare string.
  if (typeof envelope === "string") {
    return Object.assign(new Error(envelope), { statusCode: status });
  }

  if (envelope && typeof envelope === "object") {
    const message = envelope.message ?? body?.message ?? "حدث خطأ غير متوقّع";
    const error: HttpError = Object.assign(new Error(message), {
      statusCode: envelope.statusCode ?? status,
    });
    // 400 validation: surface each zod issue on its field so the form can show
    // it inline (keyed by the dotted issue path, e.g. "priceJod").
    if (Array.isArray(envelope.issues)) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of envelope.issues) {
        const key = (issue.path ?? []).join(".");
        if (key && issue.message) fieldErrors[key] = issue.message;
      }
      if (Object.keys(fieldErrors).length > 0) error.errors = fieldErrors;
    }
    return error;
  }

  return Object.assign(new Error(body?.message ?? "حدث خطأ غير متوقّع"), {
    statusCode: status,
  });
};

const buildUrl = (path: string): string =>
  `${API_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

/**
 * Perform an authenticated request and return the parsed JSON body (or the raw
 * `Response` when `raw: true`). Throws an {@link HttpError} on any non-2xx.
 */
export async function apiFetch<T = unknown>(
  path: string,
  init: ApiInit = {},
): Promise<T> {
  const { json, headers, body, ...rest } = init;

  const finalHeaders = new Headers(headers);
  const token = getToken();
  if (token) finalHeaders.set("Authorization", `Bearer ${token}`);

  let finalBody = body;
  if (json !== undefined) {
    finalHeaders.set("Content-Type", "application/json");
    finalBody = JSON.stringify(json);
  }
  // NOTE: for FormData we intentionally leave Content-Type unset.

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      ...rest,
      headers: finalHeaders,
      body: finalBody,
    });
  } catch {
    // Network/transport failure (server down, CORS, offline).
    throw Object.assign(new Error("تعذّر الاتصال بالخادم"), { statusCode: 0 });
  }

  if (!response.ok) {
    let envelope: ErrorEnvelope | undefined;
    try {
      envelope = (await response.json()) as ErrorEnvelope;
    } catch {
      envelope = undefined;
    }
    throw toHttpError(response.status, envelope);
  }

  // 204 No Content / empty body.
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
