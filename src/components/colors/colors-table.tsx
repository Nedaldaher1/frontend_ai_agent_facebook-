/**
 * The colors table — same accessible CSS-grid technique as the products and
 * knowledge tables (ARIA roles, one shared column template for head / body /
 * skeleton, a horizontally-scrollable card) so it lines up perfectly and matches
 * the rest of the admin with zero design drift.
 */

import { Loader2, Pencil, Trash2 } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { Color } from "@/types/color";
import { Swatch, SynonymCountBadge } from "./color-visuals";

/** Shared grid template — every row (head, body, skeleton) must use this. */
const ROW =
  "grid min-w-[760px] grid-cols-[44px_minmax(160px,1fr)_minmax(140px,200px)_132px_132px_88px] items-center gap-2 px-[22px]";

const cardClass =
  "overflow-hidden overflow-x-auto rounded-[18px] border border-[#ECEDF1] bg-card shadow-[0_1px_2px_rgba(16,18,22,.04),0_14px_38px_-28px_rgba(16,18,22,.28)]";

type ColorsTableProps = {
  colors: Color[];
  /** Resolve a color's dialect-term count (from the global synonyms list). */
  synonymCount: (colorId: string) => number;
  onEdit: (id: Color["id"]) => void;
  onToggle: (color: Color) => void;
  onDelete: (color: Color) => void;
  /** Disables the active toggle for a row while its mutation is in flight. */
  pendingId?: Color["id"] | null;
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
      <div role="columnheader" aria-label="العيّنة" />
      <div role="columnheader">اللون</div>
      <div role="columnheader">المفتاح</div>
      <div role="columnheader">المصطلحات</div>
      <div role="columnheader">الحالة</div>
      <div role="columnheader" className="text-start">
        إجراءات
      </div>
    </div>
  );
}

export function ColorsTable({
  colors,
  synonymCount,
  onEdit,
  onToggle,
  onDelete,
  pendingId,
}: ColorsTableProps) {
  return (
    <div className={cardClass}>
      <div role="table" aria-label="جدول الألوان">
        <HeaderRow />
        {colors.map((color) => (
          <div
            key={color.id}
            role="row"
            className={cn(
              ROW,
              "border-b border-[#F1F2F4] py-3 transition-colors hover:bg-[#FBFBFC]",
            )}
          >
            <div role="cell">
              <Swatch hex={color.hex} />
            </div>
            <div role="cell" className="min-w-0">
              <div className="truncate text-sm font-semibold text-[#1B1D23]">
                {color.name}
              </div>
            </div>
            <div role="cell" className="min-w-0">
              {/* family is a technical English key — LTR, monospace, muted. */}
              <span
                dir="ltr"
                className="block truncate text-start font-mono text-[12.5px] text-[#8A8F98]"
              >
                {color.family}
              </span>
            </div>
            <div role="cell">
              <SynonymCountBadge count={synonymCount(color.id)} />
            </div>
            <div role="cell" className="flex items-center gap-2">
              <Switch
                checked={color.isActive}
                onCheckedChange={() => onToggle(color)}
                disabled={pendingId === color.id}
                aria-label={
                  color.isActive ? "تعطيل اللون" : "تفعيل اللون"
                }
              />
              <span
                className={cn(
                  "text-[12px] font-medium",
                  color.isActive ? "text-[#1B7A4E]" : "text-[#9197A0]",
                )}
              >
                {color.isActive ? "مفعّل" : "معطّل"}
              </span>
            </div>
            <div role="cell" className="flex items-center justify-start gap-1">
              <IconButton label="تعديل" onClick={() => onEdit(color.id)}>
                <Pencil className="size-[15px]" />
              </IconButton>
              <IconButton
                label="حذف"
                tone="danger"
                onClick={() => onDelete(color)}
              >
                <Trash2 className="size-[15px]" />
              </IconButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Loading skeleton — same column template + row height as the real table. */
export function ColorsTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className={cardClass}>
      <div className="flex items-center gap-[9px] border-b border-[#EEEFF2] bg-[#FAFAFB] px-[22px] py-[13px] text-xs text-[#9197A0]">
        <Loader2 className="size-[13px] animate-spin text-primary" />
        جارٍ تحميل الألوان…
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={cn(ROW, "border-b border-[#F1F2F4] py-3.5")}>
          <SkeletonBar className="size-[22px] rounded-[7px]" />
          <SkeletonBar className="h-[11px] w-[55%]" />
          <SkeletonBar className="h-[11px] w-[60%]" />
          <SkeletonBar className="h-5 w-[84px] rounded-full" />
          <SkeletonBar className="h-5 w-[70px] rounded-full" />
          <SkeletonBar className="ms-auto h-[11px] w-1/2" />
        </div>
      ))}
    </div>
  );
}

function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-[#EDEEF1]", className)} />;
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
