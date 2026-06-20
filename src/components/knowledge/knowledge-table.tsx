/**
 * The knowledge-base table — same accessible CSS-grid technique as the products
 * table (ARIA roles, one shared column template for head / body / skeleton, a
 * horizontally-scrollable card) so it lines up perfectly and matches the rest of
 * the admin with zero design drift.
 */

import {
  ArrowDownToLine,
  ArrowUpToLine,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { KnowledgeEntry } from "@/types/knowledge";
import { PublishBadge } from "@/components/products/product-visuals";
import {
  CategoryBadge,
  GeneralBadge,
  PriorityValue,
  ProductBadge,
} from "./knowledge-visuals";

/** Shared grid template — every row (head, body, skeleton) must use this. */
const ROW =
  "grid min-w-[880px] grid-cols-[minmax(220px,1fr)_158px_104px_88px_minmax(120px,168px)_112px] items-center gap-2 px-[22px]";

const cardClass =
  "overflow-hidden overflow-x-auto rounded-[18px] border border-line bg-card shadow-[0_1px_2px_rgba(16,18,22,.04),0_14px_38px_-28px_rgba(16,18,22,.28)]";

type KnowledgeTableProps = {
  entries: KnowledgeEntry[];
  onEdit: (id: KnowledgeEntry["id"]) => void;
  onToggle: (entry: KnowledgeEntry) => void;
  onDelete: (entry: KnowledgeEntry) => void;
  /** Resolve a linked product's display name (best-effort, from the catalog). */
  productNameById: (id: string) => string | undefined;
  /** Disables the publish toggle for a row while its mutation is in flight. */
  pendingId?: KnowledgeEntry["id"] | null;
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
      <div role="columnheader">العنوان</div>
      <div role="columnheader">الفئة</div>
      <div role="columnheader">النشر</div>
      <div role="columnheader">الأولوية</div>
      <div role="columnheader">المنتج المرتبط</div>
      <div role="columnheader" className="text-start">
        إجراءات
      </div>
    </div>
  );
}

export function KnowledgeTable({
  entries,
  onEdit,
  onToggle,
  onDelete,
  productNameById,
  pendingId,
}: KnowledgeTableProps) {
  return (
    <div className={cardClass}>
      <div role="table" aria-label="جدول قاعدة المعرفة">
        <HeaderRow />
        {entries.map((e) => {
          const isPublished = e.status === "published";
          // The "question" is the most useful subtitle; fall back to tags.
          const subtitle =
            e.situation || (e.tags ?? []).map((t) => `#${t}`).join("  ");
          return (
            <div
              key={e.id}
              role="row"
              className={cn(
                ROW,
                "border-b border-line py-3 transition-colors hover:bg-surface-hover",
              )}
            >
              <div role="cell" className="min-w-0">
                <div className="truncate text-sm font-semibold text-ink">
                  {e.title}
                </div>
                {subtitle && (
                  <div className="mt-0.5 truncate text-[11.5px] text-ink-faint">
                    {subtitle}
                  </div>
                )}
              </div>
              <div role="cell">
                <CategoryBadge category={e.category} />
              </div>
              <div role="cell">
                <PublishBadge status={e.status} />
              </div>
              <div role="cell">
                <PriorityValue value={e.priority} />
              </div>
              <div role="cell" className="min-w-0">
                {e.productId ? (
                  <ProductBadge name={productNameById(e.productId)} />
                ) : (
                  <GeneralBadge />
                )}
              </div>
              <div role="cell" className="flex items-center justify-start gap-1">
                <IconButton label="تعديل" onClick={() => onEdit(e.id)}>
                  <Pencil className="size-[15px]" />
                </IconButton>
                <IconButton
                  label={isPublished ? "إلغاء النشر" : "نشر"}
                  onClick={() => onToggle(e)}
                  disabled={pendingId === e.id}
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
                  onClick={() => onDelete(e)}
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
export function KnowledgeTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className={cardClass}>
      <div className="flex items-center gap-[9px] border-b border-line bg-surface-1 px-[22px] py-[13px] text-xs text-ink-faint">
        <Loader2 className="size-[13px] animate-spin text-primary" />
        جارٍ تحميل قاعدة المعرفة…
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={cn(ROW, "border-b border-line py-3.5")}>
          <div>
            <SkeletonBar className="h-[11px] w-[58%]" />
            <SkeletonBar className="mt-2 h-[9px] w-[40%]" />
          </div>
          <SkeletonBar className="h-5 w-[110px] rounded-full" />
          <SkeletonBar className="h-5 w-[64px] rounded-full" />
          <SkeletonBar className="h-[11px] w-6" />
          <SkeletonBar className="h-5 w-[90px] rounded-full" />
          <SkeletonBar className="ms-auto h-[11px] w-1/2" />
        </div>
      ))}
    </div>
  );
}

function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-line", className)} />;
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
        "flex size-[30px] items-center justify-center rounded-[9px] border border-neutral-line bg-card text-ink-muted transition-colors disabled:opacity-50",
        tone === "default" &&
          "hover:border-accent-line hover:bg-accent-soft hover:text-primary",
        tone === "danger" &&
          "hover:border-danger-line hover:bg-danger-bg hover:text-danger-fg",
      )}
    >
      {children}
    </button>
  );
}
