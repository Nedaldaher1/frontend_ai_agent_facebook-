/**
 * Types + metadata for the orders admin API (`/admin/orders`).
 *
 * The wire DTOs are already camelCase and map 1:1 onto what the UI renders, so —
 * unlike products/knowledge — there is no separate mapper; the data provider
 * hands these DTOs straight to the pages.
 *
 * Money values are STRINGS in numeric(10,3) form (e.g. "12.500") and are rendered
 * verbatim. Never parse them for math — totals are server-computed (CLAUDE.md §6).
 */

/** Lifecycle state of an order. `fulfilled` / `canceled` are terminal. */
export type OrderStatus = "draft" | "confirmed" | "fulfilled" | "canceled";

/** Channel the order originated from. */
export type OrderSource = "messenger" | "whatsapp";

/** An order header row — the shape `GET /admin/orders` returns inside `items`. */
export type OrderDto = {
  id: string;
  conversationId: string | null;
  source: OrderSource;
  phone: string | null;
  /** Single free-text delivery address (no structured fields). */
  address: string | null;
  unifiedSize: string | null;
  subtotal: string;
  deliveryFee: string;
  total: string;
  currency: "JOD";
  status: OrderStatus;
  createdAt: string;
};

/** A single line item within an order. */
export type OrderItemDto = {
  id: string;
  orderId: string;
  productId: string | null;
  /**
   * Storage KEY (not a URL). The admin orders API does NOT resolve it, so the UI
   * builds the image URL from this key (`${STORAGE_URL}/<key>`), preferring
   * `imageUrl` if a future API revision returns one.
   */
  storageKey: string;
  size: string | null;
  qty: number;
  unitPrice: string;
  lineTotal: string;
  productName: string | null;
  colorName: string | null;
  /**
   * A resolved public image URL when the API provides one (the backend resolves
   * storage keys to public URLs elsewhere). Preferred over `storageKey`; with
   * none, the line falls back to a neutral placeholder thumbnail.
   */
  imageUrl?: string | null;
};

/** `GET /admin/orders/:id` — the order header plus its nested line items. */
export type OrderWithItemsDto = OrderDto & { items: OrderItemDto[] };

/**
 * Arabic label + (theme-aware) badge color tokens per status. The tokens are the
 * same CSS variables the product stock/publish badges use, so the badge adapts to
 * dark mode with no per-component work: draft=amber, confirmed=brand-blue,
 * fulfilled=green, canceled=red.
 */
export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; fg: string; bg: string; border: string }
> = {
  draft: {
    label: "مسودّة",
    fg: "var(--warn-fg)",
    bg: "var(--warn-bg)",
    border: "var(--warn-line)",
  },
  confirmed: {
    label: "مؤكّد",
    fg: "var(--publish-fg)",
    bg: "var(--publish-bg)",
    border: "var(--publish-line)",
  },
  fulfilled: {
    label: "مكتمل",
    fg: "var(--ok-fg)",
    bg: "var(--ok-bg)",
    border: "var(--ok-line)",
  },
  canceled: {
    label: "ملغى",
    fg: "var(--danger-fg)",
    bg: "var(--danger-bg)",
    border: "var(--danger-line)",
  },
};

/** Valid forward transitions. An empty array ⇒ terminal (no action buttons). */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ["confirmed", "canceled"],
  confirmed: ["fulfilled", "canceled"],
  fulfilled: [],
  canceled: [],
};

/** Arabic source labels (the matching icon lives in `order-visuals`). */
export const ORDER_SOURCE_META: Record<OrderSource, { label: string }> = {
  messenger: { label: "ماسنجر" },
  whatsapp: { label: "واتساب" },
};

/** Currency code → display symbol. Orders are JOD, shown as the app's «د.أ». */
export const CURRENCY_LABEL: Record<string, string> = { JOD: "د.أ" };
