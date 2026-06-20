/**
 * Presentational atoms shared by the orders list and detail pages.
 *
 * Status badges reuse the same token-driven inline-style mechanism as the product
 * stock/publish badges, so they stay theme-aware (dark mode) with no per-component
 * work. Money is rendered verbatim (strings) with its currency, LTR — never parsed
 * (CLAUDE.md §6).
 */

import { useState } from "react";
import { ImageOff, MessageCircle, MessageSquare } from "lucide-react";

import { COLORS } from "@/constants/enums";
import { STORAGE_URL } from "@/providers/constants";
import { cn } from "@/lib/utils";
import {
  CURRENCY_LABEL,
  ORDER_SOURCE_META,
  ORDER_STATUS_META,
  type OrderSource,
  type OrderStatus,
} from "@/types/order";

/** Shared pill geometry, matching the product badges. */
const badgeClass =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-[11px] py-1 text-[11.5px] font-semibold";

/** A short, copy-free display id for an order (the full id stays dir="ltr"). */
export const shortOrderId = (id: string): string => `#${id.slice(0, 8)}`;

/** Format an ISO timestamp for Arabic staff (Gregorian, optionally with time). */
export const formatOrderDate = (iso: string, withTime = false): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ar-JO", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" } : {}),
  }).format(d);
};

/** Colored, theme-aware order-status badge. */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS_META[status];
  return (
    <span
      className={badgeClass}
      style={{ color: meta.fg, background: meta.bg, borderColor: meta.border }}
    >
      {meta.label}
    </span>
  );
}

/** Source channel as an icon (with an accessible Arabic label, shown optionally). */
export function OrderSourceIcon({
  source,
  withLabel = false,
}: {
  source: OrderSource;
  withLabel?: boolean;
}) {
  const label = ORDER_SOURCE_META[source].label;
  const Icon = source === "whatsapp" ? MessageSquare : MessageCircle;
  // messenger → brand blue, whatsapp → green; both theme-aware tokens.
  const color = source === "whatsapp" ? "var(--ok-fg)" : "var(--publish-fg)";
  return (
    <span className="inline-flex items-center gap-1.5" title={label}>
      <Icon className="size-4" style={{ color }} aria-hidden />
      {withLabel ? (
        <span className="text-[13px] font-medium text-ink-2">{label}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </span>
  );
}

/** A money amount rendered verbatim (never parsed) with its currency, LTR. */
export function Money({
  value,
  currency,
  className,
  strong = false,
}: {
  value: string;
  currency: string;
  className?: string;
  strong?: boolean;
}) {
  return (
    <span
      dir="ltr"
      className={cn("inline-flex items-center gap-1", className)}
      style={{ fontFeatureSettings: "'tnum'" }}
    >
      <span className={cn(strong && "font-semibold")}>{value || "0.000"}</span>
      <span className="text-[11px] font-medium text-ink-faint">
        {CURRENCY_LABEL[currency] ?? currency}
      </span>
    </span>
  );
}

/** Best-effort hex for a free-text color name via the closed COLORS enum. */
const resolveColorHex = (name?: string | null): string | null => {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  const hit = COLORS.find(
    (c) => c.value.toLowerCase() === n || c.label === name.trim(),
  );
  return hit ? hit.hex : null;
};

/**
 * A color name with a leading swatch dot — only when the free-text name maps to a
 * known enum color (otherwise the name shows on its own, per "swatch if available").
 */
export function OrderColorSwatch({ colorName }: { colorName: string }) {
  const hex = resolveColorHex(colorName);
  return (
    <span className="inline-flex items-center gap-1.5">
      {hex && (
        <span
          className="inline-block size-[13px] shrink-0 rounded-full border"
          style={{
            background: hex,
            borderColor:
              hex.toUpperCase() === "#FFFFFF"
                ? "var(--swatch-ring-white)"
                : "var(--swatch-ring)",
          }}
          aria-hidden
        />
      )}
      <span className="text-[13px] text-ink-2">{colorName}</span>
    </span>
  );
}

/**
 * Resolve a line item's image source: a ready `imageUrl` wins (forward-compatible
 * if the API ever returns one); otherwise the raw `storageKey` is turned into a
 * public URL via {@link STORAGE_URL} (`${base}/<key>`), the same scheme the
 * backend's storage driver uses. Returns null when neither is available.
 */
const resolveItemImage = (
  imageUrl?: string | null,
  storageKey?: string | null,
): string | null => {
  if (imageUrl && imageUrl.trim()) return imageUrl.trim();
  const key = storageKey?.trim();
  if (!key) return null;
  if (/^https?:\/\//i.test(key)) return key;
  return `${STORAGE_URL}/${key.replace(/^\/+/, "")}`;
};

/**
 * A line-item thumbnail. Renders the resolved product image (from `imageUrl` or
 * `storageKey`); falls back to a neutral placeholder when there is no source or
 * the image fails to load.
 */
export function OrderItemThumb({
  imageUrl,
  storageKey,
  className,
}: {
  imageUrl?: string | null;
  storageKey?: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = resolveItemImage(imageUrl, storageKey);

  if (src && !failed) {
    return (
      <div
        className={cn(
          "shrink-0 overflow-hidden rounded-[10px] border border-line bg-surface-1",
          className,
        )}
      >
        <img
          src={src}
          alt=""
          loading="lazy"
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[10px] border border-line bg-surface-1",
        className,
      )}
      aria-hidden
    >
      <ImageOff className="size-4 text-ink-faint" />
    </div>
  );
}
