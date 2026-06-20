/**
 * Custom data provider for the orders admin API (`/admin/orders`).
 *
 * Registered as the named `orders` provider in `src/App.tsx`; orders pages select
 * it explicitly via `dataProviderName: "orders"`. Built on the shared `apiFetch`
 * interceptor, so auth + the `{ timestamp, path, error }` error envelope are
 * handled in one place (CLAUDE.md §6).
 *
 *  - getList → GET /admin/orders?limit&offset — the endpoint returns a BARE ARRAY
 *              (no `{ items, total }` envelope, no count header) and has NO status
 *              filter. So one generous page is fetched newest-first and mapped to
 *              Refine's `{ data, total }`; status filtering, per-status counts and
 *              pagination are all done client-side in the list page.
 *  - getOne  → GET /admin/orders/:id — returns OrderDto + nested `items[]`, so the
 *              detail page reads everything from this single call.
 *  - custom  → PATCH /admin/orders/:id/status — the status transition. This is a
 *              sub-resource path, so it is driven through `custom`
 *              (useCustomMutation), NOT the standard `update`.
 *
 * create / update / deleteOne are intentionally unsupported: orders are created by
 * the agent, not the admin, and the only mutation (status) lives on a sub-resource.
 * They throw a clear error so a mis-wired hook fails loudly instead of hitting the
 * wrong URL.
 */

import type {
  BaseRecord,
  CustomParams,
  CustomResponse,
  DataProvider,
  GetListParams,
  GetListResponse,
  GetOneParams,
  GetOneResponse,
} from "@refinedev/core";

import type { OrderDto, OrderWithItemsDto } from "@/types/order";
import { API_URL } from "./constants";
import { apiFetch } from "./http";

/** The backend caps the page size at 200. */
const MAX_LIMIT = 200;

/** Newest order first by `createdAt` (guards the list's newest-first contract). */
const byNewestFirst = (a: OrderDto, b: OrderDto): number =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

const unsupported = async (): Promise<never> => {
  throw Object.assign(new Error("هذه العملية غير مدعومة على الطلبات"), {
    statusCode: 405,
  });
};

export const ordersDataProvider: DataProvider = {
  getApiUrl: () => API_URL,

  getList: async <TData extends BaseRecord = BaseRecord>({
    pagination,
  }: GetListParams): Promise<GetListResponse<TData>> => {
    const pageSize = Math.min(pagination?.pageSize ?? MAX_LIMIT, MAX_LIMIT);
    const current = pagination?.currentPage ?? 1;
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String((current - 1) * pageSize),
    });

    // The endpoint responds with a bare `OrderDto[]` (newest-first by default);
    // guard the shape and re-sort defensively so order never depends on it.
    const rows = await apiFetch<OrderDto[]>(`admin/orders?${params}`);
    const data = (Array.isArray(rows) ? rows : []).slice().sort(byNewestFirst);
    return { data: data as unknown as TData[], total: data.length };
  },

  getOne: async <TData extends BaseRecord = BaseRecord>({
    id,
  }: GetOneParams): Promise<GetOneResponse<TData>> => {
    const order = await apiFetch<OrderWithItemsDto>(`admin/orders/${id}`);
    return { data: order as unknown as TData };
  },

  // Status transitions hit a sub-resource (PATCH /admin/orders/:id/status), so
  // they go through `custom` (driven by useCustomMutation) rather than `update`.
  custom: async <
    TData extends BaseRecord = BaseRecord,
    TQuery = unknown,
    TPayload = unknown,
  >({
    url,
    method,
    payload,
  }: CustomParams<TQuery, TPayload>): Promise<CustomResponse<TData>> => {
    const data = await apiFetch<TData>(url, {
      method: (method ?? "get").toUpperCase(),
      json: payload,
    });
    return { data };
  },

  create: unsupported,
  update: unsupported,
  deleteOne: unsupported,
};
