/**
 * The products table from the design prototype, rendered as an accessible CSS
 * grid (ARIA roles) inside a horizontally-scrollable card. The header row and
 * the body rows share one column template so they always line up; the loading
 * skeleton reuses the very same template so there is no layout shift when real
 * rows arrive.
 */

import { Loader2, Pencil, ArrowDownToLine, ArrowUpToLine, Trash2 } from "lucide-react";

import { labelOf, PUBLISH_STATUSES } from "@/constants/enums";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";
import {
  ColorDots,
  Price,
  ProductThumb,
  PublishBadge,
  StockBadge,
} from "./product-visuals";

/** Shared grid template — every row (head, body, skeleton) must use this. */
const ROW =
  "grid min-w-[760px] grid-cols-[52px_minmax(170px,1fr)_96px_104px_96px_100px_104px] items-center gap-2 px-[22px]";

const cardClass =
  "overflow-hidden overflow-x-auto rounded-[18px] border border-[#ECEDF1] bg-card shadow-[0_1px_2px_rgba(16,18,22,.04),0_14px_38px_-28px_rgba(16,18,22,.28)]";

type ProductsTableProps = {
  products: Product[];
  onEdit: (id: Product["id"]) => void;
  onToggle: (product: Product) => void;
  onDelete: (product: Product) => void;
  /** Disables the publish toggle for a row while its mutation is in flight. */
  pendingId?: Product["id"] | null;
};

function HeaderRow() {
  return (
    <div
      role="row"
      className={cn(
        ROW,
        "border-b border-[#EEEFF2] bg-[#FAFAFB] py-[13px] text-[11.5px] font-semibold text-[#9197A0]",
      )}
    >
      <div role="columnheader" aria-label="صورة" />
      <div role="columnheader">المنتج</div>
      <div role="columnheader">السعر</div>
      <div role="columnheader">الألوان</div>
      <div role="columnheader">المخزون</div>
      <div role="columnheader">النشر</div>
      <div role="columnheader" className="text-start">
        إجراءات
      </div>
    </div>
  );
}

export function ProductsTable({
  products,
  onEdit,
  onToggle,
  onDelete,
  pendingId,
}: ProductsTableProps) {
  return (
    <div className={cardClass}>
      <div role="table" aria-label="جدول المنتجات">
        <HeaderRow />
        {products.map((p) => {
          const tagsLine = (p.tags ?? []).map((t) => `#${t}`).join("  ");
          const isPublished = p.status === "published";
          return (
            <div
              key={p.id}
              role="row"
              className={cn(
                ROW,
                "border-b border-[#F1F2F4] py-3 transition-colors hover:bg-[#FBFBFC]",
              )}
            >
              <div role="cell">
                <ProductThumb
                  color={p.colors?.[0]}
                  className="h-[50px] w-[42px]"
                  showLabel
                />
              </div>
              <div role="cell" className="min-w-0">
                <div className="truncate text-sm font-semibold text-[#1B1D23]">
                  {p.name}
                </div>
                {tagsLine && (
                  <div className="mt-0.5 truncate text-[11.5px] text-[#9197A0]">
                    {tagsLine}
                  </div>
                )}
              </div>
              <div role="cell">
                <Price
                  value={p.price}
                  className="text-sm font-semibold text-[#1B1D23]"
                />
              </div>
              <div role="cell">
                <ColorDots colors={p.colors ?? []} />
              </div>
              <div role="cell">
                <StockBadge stock={p.stock} />
              </div>
              <div role="cell">
                <PublishBadge status={p.status} />
              </div>
              <div role="cell" className="flex items-center justify-start gap-1">
                <IconButton
                  label="تعديل"
                  onClick={() => onEdit(p.id)}
                >
                  <Pencil className="size-[15px]" />
                </IconButton>
                <IconButton
                  label={isPublished ? "إلغاء النشر" : "نشر"}
                  onClick={() => onToggle(p)}
                  disabled={pendingId === p.id}
                >
                  {isPublished ? (
                    <ArrowDownToLine className="size-[15px]" />
                  ) : (
                    <ArrowUpToLine className="size-[15px]" />
                  )}
                </IconButton>
                <IconButton
                  label="حذف"
                  tone="danger"
                  onClick={() => onDelete(p)}
                >
                  <Trash2 className="size-[15px]" />
                </IconButton>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Loading skeleton — same column template + row height as the real table. */
export function ProductsTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className={cardClass}>
      <div className="flex items-center gap-[9px] border-b border-[#EEEFF2] bg-[#FAFAFB] px-[22px] py-[13px] text-xs text-[#9197A0]">
        <Loader2 className="size-[13px] animate-spin text-primary" />
        جارٍ تحميل المنتجات…
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={cn(ROW, "border-b border-[#F1F2F4] py-3.5")}>
          <SkeletonBar className="h-[50px] w-[42px] rounded-[9px]" />
          <div>
            <SkeletonBar className="h-[11px] w-[62%]" />
            <SkeletonBar className="mt-2 h-[9px] w-[38%]" />
          </div>
          <SkeletonBar className="h-[11px] w-[60%]" />
          <SkeletonBar className="h-[11px] w-[70%]" />
          <SkeletonBar className="h-5 w-[74px] rounded-full" />
          <SkeletonBar className="h-5 w-[64px] rounded-full" />
          <SkeletonBar className="ms-auto h-[11px] w-1/2" />
        </div>
      ))}
    </div>
  );
}

function SkeletonBar({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-[#EDEEF1]", className)} />
  );
}

type IconButtonProps = {
  label: string;
  tone?: "default" | "danger";
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function IconButton({
  label,
  tone = "default",
  disabled,
  onClick,
  children,
}: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-[30px] items-center justify-center rounded-[9px] border border-[#E6E8EC] bg-card text-[#7A7F88] transition-colors disabled:opacity-50",
        tone === "default" &&
          "hover:border-[#CBD6F5] hover:bg-[#EEF1FC] hover:text-primary",
        tone === "danger" &&
          "hover:border-[#F2D6D6] hover:bg-[#FBEDED] hover:text-[#C0392B]",
      )}
    >
      {children}
    </button>
  );
}
