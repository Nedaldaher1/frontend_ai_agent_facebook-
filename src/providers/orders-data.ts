/**
 * Custom data provider for the orders admin API (`/admin/orders`).
 *
 * Registered as the named `orders` provider in `src/App.tsx`; orders pages select
 * it explicitly via `dataProviderName: "orders"`. Built on the shared `apiFetch`
 * interceptor, so auth + the `{ timestamp, path, error }` error envelope are
 * handled in one place (CLAUDE.md §6).
 *
 *  - getList → GET /admin/orders?status&limit&offset — maps the custom
 *              `{ items, total, limit, offset }` envelope to Refine's
 *              `{ data, total }`. `limit` is capped at 200.
 *  - getOne  → GET /admin/orders/:id — returns OrderDto + nested `items[]`, so the
 *              detail page reads everything from this single call.
 *  - custom  → PATCH /admin/orders/:id/status — the status transition. This is a
 *              sub-resource path, so it is driven through `custom`
 *              (useCustomMutation), NOT the standard `update`.
 *
 * create / update / deleteOne are intentionally unsupported: orders are created by
 * the agent, not the admin, and the only mutation (status) lives on a sub-resource.
 * They throw a clear error so a mis-wired hook fails loudly instead of hitting the
 * wrong URL. List order is fixed server-side, so sorters are ignored.
 */

import type {
  BaseRecord,
  CrudFilters,
  CustomParams,
  CustomResponse,
  DataProvider,
  GetListParams,
  GetListResponse,
  GetOneParams,
  GetOneResponse,
} from "@refinedev/core";

import type { OrderDto, OrderStatus, OrderWithItemsDto } from "@/types/order";
import { API_URL } from "./constants";
import { apiFetch } from "./http";

/** The custom list envelope the orders endpoint returns. */
type OrdersEnvelope = {
  items: OrderDto[];
  total: number;
  limit: number;
  offset: number;
};

/** The backend caps the page size at 200. */
const MAX_LIMIT = 200;

const ORDER_STATUSES: readonly string[] = [
  "draft",
  "confirmed",
  "fulfilled",
  "canceled",
];

/** Read the `status` filter (the only server-side one) from Refine's filters. */
const statusFromFilters = (
  filters: CrudFilters | undefined,
): OrderStatus | undefined => {
  for (const f of filters ?? []) {
    if (
      "field" in f &&
      f.field === "status" &&
      f.operator === "eq" &&
      typeof f.value === "string" &&
      ORDER_STATUSES.includes(f.value)
    ) {
      return f.value as OrderStatus;
    }
  }
  return undefined;
};

const unsupported = async (): Promise<never> => {
  throw Object.assign(new Error("هذه العملية غير مدعومة على الطلبات"), {
    statusCode: 405,
  });
};

export const ordersDataProvider: DataProvider = {
  getApiUrl: () => API_URL,

  getList: async <TData extends BaseRecord = BaseRecord>({
    pagination,
    filters,
  }: GetListParams): Promise<GetListResponse<TData>> => {
    const pageSize = Math.min(pagination?.pageSize ?? 50, MAX_LIMIT);
    const current = pagination?.currentPage ?? 1;
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String((current - 1) * pageSize),
    });
    const status = statusFromFilters(filters);
    if (status) params.set("status", status);

    const body = await apiFetch<OrdersEnvelope>(`admin/orders?${params}`);
    return {
      data: (body.items ?? []) as unknown as TData[],
      total: body.total ?? 0,
    };
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
