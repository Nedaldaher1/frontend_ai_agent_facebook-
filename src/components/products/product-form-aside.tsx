/**
 * The form's sticky aside: a live product preview, the publish toggle (which
 * gates whether the agent may surface the product), and the save/cancel
 * actions. Everything is derived live from the current form values.
 */

import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { brand } from "@/constants/theme";
import { uniqueColors } from "@/lib/products";
import type { ColorValue, ProductFormValues } from "@/types/product";
import {
  ColorDots,
  Price,
  ProductThumb,
  PublishBadge,
  StockBadge,
} from "./product-visuals";

type ProductFormAsideProps = {
  values: ProductFormValues;
  /** Resolve an image's color id (UUID) → its enum family for the preview. */
  colorFamilyOf: (colorId: string) => ColorValue | "";
  submitting?: boolean;
  onTogglePublish: (published: boolean) => void;
  onPublish: () => void;
  onSaveDraft: () => void;
  onCancel: () => void;
};

const primaryBtnClass =
  "h-auto w-full justify-center rounded-[12px] py-[11px] text-sm font-semibold shadow-[0_6px_18px_-8px_#2B50D6] dark:shadow-none";

export function ProductFormAside({
  values,
  colorFamilyOf,
  submitting,
  onTogglePublish,
  onPublish,
  onSaveDraft,
  onCancel,
}: ProductFormAsideProps) {
  const colors = uniqueColors(values.images, colorFamilyOf);
  const firstColor = colorFamilyOf(values.images[0]?.color ?? "") || undefined;
  const published = values.published;

  return (
    <aside className="top-[30px] flex flex-col gap-4 lg:sticky">
      {/* Live preview */}
      <div className="overflow-hidden rounded-[18px] border border-line bg-card shadow-[0_1px_2px_rgba(16,18,22,.04),0_12px_34px_-28px_rgba(16,18,22,.26)]">
        <div className="border-b border-surface-1 px-[18px] py-3.5 text-xs font-semibold text-ink-faint">
          معاينة حيّة
        </div>
        <div className="flex items-center gap-3.5 p-[18px]">
          <ProductThumb
            color={firstColor}
            url={values.images[0]?.url}
            className="h-16 w-[54px] rounded-[11px]"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14.5px] font-semibold text-ink">
              {values.name || "اسم المنتج"}
            </div>
            <Price
              value={values.price}
              className="mt-1 block text-[13px] font-semibold text-primary"
            />
            <div className="mt-[9px] flex gap-1.5">
              <PublishBadge status={published ? "published" : "draft"} />
              <StockBadge stock={values.stock} />
            </div>
          </div>
        </div>
        {colors.length > 0 && (
          <div className="flex items-center gap-[7px] px-[18px] pb-4">
            <span className="text-[11px] font-semibold text-ink-faint">
              الألوان
            </span>
            <ColorDots colors={colors} max={7} />
          </div>
        )}
      </div>

      {/* Publish */}
      <div className="rounded-[18px] border border-line bg-card p-[22px] shadow-[0_1px_2px_rgba(16,18,22,.04),0_12px_34px_-28px_rgba(16,18,22,.26)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-ink">حالة النشر</div>
            <div
              className="mt-[3px] text-xs font-medium"
              style={{ color: published ? brand.accentDark : "var(--ink-faint)" }}
            >
              {published ? "مرئي للزبائن" : "مخفي — مسودّة"}
            </div>
          </div>
          <Switch
            checked={published}
            onCheckedChange={onTogglePublish}
            aria-label="تبديل حالة النشر"
          />
        </div>
        <div className="mt-3.5 flex items-start gap-[9px] rounded-[11px] border border-line bg-surface-1 px-3 py-[11px]">
          <Info className="mt-px size-3.5 shrink-0 text-ink-faint" />
          <p className="m-0 text-xs leading-relaxed text-ink-muted">
            المنتجات المنشورة فقط يعرضها المساعد الذكي للزبائن. المسودّات تبقى
            مخفية.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-[9px]">
        <Button
          className={primaryBtnClass}
          onClick={onPublish}
          disabled={submitting}
        >
          نشر المنتج
        </Button>
        <Button
          variant="outline"
          className="h-auto w-full justify-center rounded-[12px] py-[11px] text-sm font-semibold"
          onClick={onSaveDraft}
          disabled={submitting}
        >
          حفظ كمسودّة
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-2 text-[13.5px] font-medium text-ink-muted transition-colors hover:text-danger-fg"
        >
          إلغاء
        </button>
      </div>
    </aside>
  );
}
