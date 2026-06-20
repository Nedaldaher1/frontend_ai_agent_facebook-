/**
 * The color form's sticky aside: a live preview (swatch + name + key + status),
 * the active/retired toggle, and the save/cancel actions. Mirrors the product /
 * knowledge form asides so the editor feels identical across the admin.
 */

import { Info, Palette } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { brand } from "@/constants/theme";
import type { ColorFormValues } from "@/types/color";
import { ColorStatusBadge, Swatch } from "./color-visuals";

type ColorFormAsideProps = {
  values: ColorFormValues;
  mode: "create" | "edit";
  submitting?: boolean;
  onToggleActive: (active: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
};

const primaryBtnClass =
  "h-auto w-full justify-center rounded-[12px] py-[11px] text-sm font-semibold shadow-[0_6px_18px_-8px_#2B50D6]";

export function ColorFormAside({
  values,
  mode,
  submitting,
  onToggleActive,
  onSave,
  onCancel,
}: ColorFormAsideProps) {
  const { isActive } = values;
  // On create the toggle is locked on: a new color is activated server-side, so
  // the field is shown (ON) but not editable until the color exists.
  const isCreate = mode === "create";

  return (
    <aside className="top-[30px] flex flex-col gap-4 lg:sticky">
      {/* Live preview */}
      <div className="overflow-hidden rounded-[18px] border border-[#ECEDF1] bg-card shadow-[0_1px_2px_rgba(16,18,22,.04),0_12px_34px_-28px_rgba(16,18,22,.26)]">
        <div className="border-b border-[#F0F1F4] px-[18px] py-3.5 text-xs font-semibold text-[#9197A0]">
          معاينة اللون
        </div>
        <div className="flex items-center gap-3.5 p-[18px]">
          {/* Refine populates the edit form from the raw record, where `hex` is
              nullable — guard every value before trimming for the preview. */}
          <Swatch
            hex={(values.hex ?? "").trim() || null}
            className="size-14 rounded-[14px]"
          />
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold text-[#14161B]">
              {(values.name ?? "").trim() || "اسم اللون"}
            </div>
            <div
              dir="ltr"
              className="mt-0.5 truncate text-start font-mono text-[12px] text-[#9197A0]"
            >
              {(values.family ?? "").trim() || "key"}
            </div>
            <div className="mt-2">
              <ColorStatusBadge active={isActive} />
            </div>
          </div>
        </div>
      </div>

      {/* Active state */}
      <div className="rounded-[18px] border border-[#ECEDF1] bg-card p-[22px] shadow-[0_1px_2px_rgba(16,18,22,.04),0_12px_34px_-28px_rgba(16,18,22,.26)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[#14161B]">حالة اللون</div>
            <div
              className="mt-[3px] text-xs font-medium"
              style={{ color: isActive ? brand.accentDark : "#9197A0" }}
            >
              {isActive ? "مفعّل — يُستخدم في المطابقة" : "معطّل — مخفي عن المطابقة"}
            </div>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={onToggleActive}
            disabled={isCreate}
            aria-label="تبديل حالة اللون"
          />
        </div>
        <div className="mt-3.5 flex items-start gap-[9px] rounded-[11px] border border-[#EDEEF1] bg-[#F7F8FA] px-3 py-[11px]">
          <Info className="mt-px size-3.5 shrink-0 text-[#9197A0]" />
          <p className="m-0 text-xs leading-relaxed text-[#7A7F88]">
            {isCreate
              ? "اللون الجديد مفعّل تلقائيًا، يمكنك تعطيله بعد الحفظ."
              : "تعطيل اللون يبقيه محفوظاً مع مصطلحاته لكن لا يستخدمه المساعد في مطابقة ألوان المنتجات — بديل آمن عن الحذف."}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-[9px]">
        <Button className={primaryBtnClass} onClick={onSave} disabled={submitting}>
          {mode === "create" ? (
            <>
              <Palette className="size-4" />
              حفظ ومتابعة
            </>
          ) : (
            "حفظ التغييرات"
          )}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-2 text-[13.5px] font-medium text-[#8A8F98] transition-colors hover:text-[#C0392B]"
        >
          إلغاء
        </button>
      </div>
    </aside>
  );
}
