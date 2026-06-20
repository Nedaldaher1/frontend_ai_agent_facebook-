export const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";
export const TOKEN_KEY = "refine-auth";

/**
 * Public base for resolving storage KEYS to image URLs on the client.
 *
 * Most images arrive from the API already resolved to full URLs (products), but
 * order items carry only their raw `storageKey`, so the orders UI builds
 * `${STORAGE_URL}/<key>` itself — mirroring how the backend's r2 driver resolves
 * keys (`${R2_PUBLIC_URL}/<key>`). The default is the dev R2 bucket; override it
 * per environment with `VITE_STORAGE_URL`. Trailing slashes are normalized off.
 */
export const STORAGE_URL = (
  import.meta.env.VITE_STORAGE_URL ??
  "https://pub-caf9265870784196a65cfec387edb41a.r2.dev"
).replace(/\/+$/, "");
