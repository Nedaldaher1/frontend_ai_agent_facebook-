/**
 * The orders table, rendered as an accessible CSS grid (ARIA roles) inside a
 * horizontally-scrollable card — the same structure as the products table, so the
 * header, body rows and loading skeleton all share one column template and never
 * shift. Each row is clickable and opens the order detail.
 */

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { OrderDto } from "@/types/order";
import {
  Money,
  OrderSourceIcon,
  OrderStatusBadge,
  formatOrderDate,
  shortOrderId,
} from "./order-visuals";

/** Shared grid template — every row (head, body, skeleton) must use this. */
const ROW =
  "grid min-w-[720px] grid-cols-[110px_minmax(120px,1fr)_64px_minmax(120px,150px)_minmax(96px,120px)_64px_96px] items-center gap-2 px-[22px]";

const cardClass =
  "overflow-hidden overflow-x-auto rounded-[18px] border border-line bg-card shadow-[0_1px_2px_rgba(16,18,22,.04),0_14px_38px_-28px_rgba(16,18,22,.28)]";

type OrdersTableProps = {
  orders: OrderDto[];
  onView: (id: OrderDto["id"]) => void;
};

function HeaderRow() {
  return (
    <div
      role="row"
      className={cn(
        ROW,
        "border-b border-line bg-surface-1 py-[13px] text-[11.5px] font-semibold text-ink-faint",
      )}
    >
      <div role="columnheader">رقم الطلب</div>
      <div role="columnheader">التاريخ</div>
      <div role="columnheader">المصدر</div>
      <div role="columnheader">الهاتف</div>
      <div role="columnheader">الإجمالي</div>
      <div role="columnheader">العناصر</div>
      <div role="columnheader">الحالة</div>
    </div>
  );
}

export function OrdersTable({ orders, onView }: OrdersTableProps) {
  return (
    <div className={cardClass}>
      <div role="table" aria-label="جدول الطلبات">
        <HeaderRow />
        {orders.map((o) => (
          <div
            key={o.id}
            role="row"
            tabIndex={0}
            aria-label={`عرض الطلب ${shortOrderId(o.id)}`}
            onClick={() => onView(o.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onView(o.id);
              }
            }}
            className={cn(
              ROW,
              "cursor-pointer border-b border-line py-3 transition-colors hover:bg-surface-hover focus:outline-none focus-visible:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent-line",
            )}
          >
            <div
              role="cell"
              dir="ltr"
              className="text-start text-[13px] font-semibold text-ink"
              style={{ fontFeatureSettings: "'tnum'" }}
            >
              {shortOrderId(o.id)}
            </div>
            <div role="cell" className="truncate text-[13px] text-ink-2">
              {formatOrderDate(o.createdAt)}
            </div>
            <div role="cell">
              <OrderSourceIcon source={o.source} />
            </div>
            <div
              role="cell"
              dir="ltr"
              className="truncate text-start text-[13px] text-ink-2"
              style={{ fontFeatureSettings: "'tnum'" }}
            >
              {o.phone || <span className="text-ink-faint">—</span>}
            </div>
            <div role="cell">
              <Money
                value={o.total}
                currency={o.currency}
                className="text-sm font-semibold text-ink"
              />
            </div>
            <div
              role="cell"
              className="text-[13px] text-ink-2"
              style={{ fontFeatureSettings: "'tnum'" }}
            >
              {o.itemCount ?? <span className="text-ink-faint">—</span>}
            </div>
            <div role="cell">
              <OrderStatusBadge status={o.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Loading skeleton — same column template + row height as the real table. */
export function OrdersTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className={cardClass}>
      <div className="flex items-center gap-[9px] border-b border-line bg-surface-1 px-[22px] py-[13px] text-xs text-ink-faint">
        <Loader2 className="size-[13px] animate-spin text-primary" />
        جارٍ تحميل الطلبات…
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={cn(ROW, "border-b border-line py-3.5")}>
          <SkeletonBar className="h-[11px] w-[70%]" />
          <SkeletonBar className="h-[11px] w-[62%]" />
          <SkeletonBar className="size-4 rounded-full" />
          <SkeletonBar className="h-[11px] w-[80%]" />
          <SkeletonBar className="h-[11px] w-[60%]" />
          <SkeletonBar className="h-[11px] w-[40%]" />
          <SkeletonBar className="h-5 w-[64px] rounded-full" />
        </div>
      ))}
    </div>
  );
}

function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-line", className)} />;
}
