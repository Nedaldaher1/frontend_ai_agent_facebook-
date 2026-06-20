/**
 * Form sections 3–5: basic info + weight-based sizing, the closed-enum
 * attributes, and free-text tags. Presentational — all state lives in the
 * parent ProductForm; this component just renders fields and calls back.
 */

import * as React from "react";
import type { UseFormRegister } from "react-hook-form";
import { Lock } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  EMBROIDERY,
  FABRICS,
  OCCASIONS,
  SIZE_CATALOG,
  SLEEVES,
  STOCK_STATUSES,
  type EnumOption,
} from "@/constants/enums";
import { brand } from "@/constants/theme";
import type { ProductFormErrors } from "@/lib/products";
import type {
  ProductFormValues,
  ProductMeasurements,
  SizeId,
  StockStatus,
} from "@/types/product";
import { cn } from "@/lib/utils";
import {
  ErrorText,
  FieldLabel,
  fieldClass,
  FormCard,
  Hint,
  OptionalBadge,
  SectionHeader,
  selectTriggerClass,
} from "./product-form-ui";

type AttrKey = "sleeve" | "fabric" | "occasion" | "embroidery";

type ProductDetailsFieldsProps = {
  values: ProductFormValues;
  errors: ProductFormErrors;
  register: UseFormRegister<ProductFormValues>;
  onStock: (stock: StockStatus) => void;
  onToggleSize: (id: SizeId) => void;
  onMeasurement: (key: keyof ProductMeasurements, value: string) => void;
  onAttr: (key: AttrKey, value: string) => void;
  tagInput: string;
  onTagInput: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
};

export function ProductDetailsFields(props: ProductDetailsFieldsProps) {
  return (
    <>
      <InfoAndSizing {...props} />
      <Attributes values={props.values} onAttr={props.onAttr} />
      <Tags {...props} />
    </>
  );
}

function InfoAndSizing({
  values,
  errors,
  register,
  onStock,
  onToggleSize,
  onMeasurement,
}: ProductDetailsFieldsProps) {
  return (
    <FormCard>
      <SectionHeader step="٣" title="المعلومات والمقاسات" className="mb-4" />
      <div className="flex flex-col gap-[18px]">
        <div>
          <FieldLabel required>اسم المنتج</FieldLabel>
          <Input
            {...register("name")}
            placeholder="مثال: عباية كلوش مطرّزة"
            className={cn(fieldClass, errors.name && "border-danger-line")}
          />
          {errors.name && <ErrorText>اسم المنتج مطلوب</ErrorText>}
        </div>

        <div>
          <FieldLabel>الوصف</FieldLabel>
          <Textarea
            {...register("description")}
            rows={3}
            placeholder="تفاصيل القماش، القَصّة، التطريز، نصائح المقاس…"
            className={cn(fieldClass, "leading-relaxed")}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel required>السعر</FieldLabel>
            <div
              className={cn(
                "flex items-center overflow-hidden rounded-[11px] border bg-card focus-within:border-primary",
                errors.price ? "border-danger-line" : "border-line-2",
              )}
            >
              <input
                {...register("price")}
                inputMode="decimal"
                placeholder="0.000"
                className="min-w-0 flex-1 px-[13px] py-[11px] text-sm font-semibold text-ink outline-none"
                style={{ fontFeatureSettings: "'tnum'" }}
              />
              <span className="flex items-center self-stretch border-s border-line px-3.5 text-[12.5px] font-semibold text-ink-muted">
                {brand.currency}
              </span>
            </div>
            {errors.price && <ErrorText>أدخل سعراً صحيحاً</ErrorText>}
          </div>

          <div>
            <FieldLabel>حالة التوفّر</FieldLabel>
            <div className="flex gap-[7px]">
              {STOCK_STATUSES.map((s) => (
                <Chip
                  key={s.value}
                  active={values.stock === s.value}
                  onClick={() => onStock(s.value)}
                >
                  {s.label}
                </Chip>
              ))}
            </div>
            <Hint className="mt-[7px] text-[11px]">
              لا حاجة لعدد القطع — فقط حدّد التوفّر.
            </Hint>
          </div>
        </div>

        {/* weight-based sizes */}
        <div>
          <FieldLabel>
            المقاسات المتوفّرة{" "}
            <span className="font-medium text-ink-faint">(حسب الوزن)</span>
          </FieldLabel>
          <div className="grid grid-cols-1 gap-[9px] sm:grid-cols-2">
            {SIZE_CATALOG.map((sz) => {
              const active = values.sizes.includes(sz.id);
              return (
                <button
                  key={sz.id}
                  type="button"
                  onClick={() => onToggleSize(sz.id)}
                  className="block w-full rounded-[12px] border-[1.5px] px-[13px] py-[11px] text-start transition-colors"
                  style={
                    active
                      ? {
                          background: "var(--accent-soft)",
                          borderColor: "var(--accent-line)",
                          color: brand.accentDark,
                        }
                      : { background: "var(--card)", borderColor: "var(--neutral-line)", color: "var(--ink-2)" }
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">مقاس {sz.no}</span>
                    <span
                      className={cn(
                        "flex size-[19px] shrink-0 items-center justify-center rounded-full text-[11px]",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "border-[1.5px] border-line-2",
                      )}
                    >
                      {active ? "✓" : ""}
                    </span>
                  </div>
                  <div
                    className="mt-[3px] text-xs opacity-80"
                    style={{ fontFeatureSettings: "'tnum'" }}
                  >
                    {sz.fromKg} – {sz.toKg} كغ
                  </div>
                </button>
              );
            })}
          </div>
          <Hint className="mt-[9px] text-[11.5px]">
            اختر المقاسات المتوفّرة لهذه العباية حسب وزن الزبونة.
          </Hint>
        </div>

        {/* max weight */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>أقصى وزن تتّسع له العباية</FieldLabel>
            <SuffixInput
              {...register("maxWeight")}
              inputMode="numeric"
              placeholder="مثال: 150"
              unit="كغ"
            />
            <Hint className="mt-[7px] text-[11px]">الحدّ الأقصى لوزن من تلبسها.</Hint>
          </div>
        </div>

        {/* optional measurements */}
        <div>
          <div className="mb-[9px] flex items-center gap-2">
            <span className="text-[13px] font-semibold text-ink-2">
              القياسات
            </span>
            <OptionalBadge />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Measurement
              label="عرض الكتف"
              value={values.measurements.shoulderCm}
              onChange={(v) => onMeasurement("shoulderCm", v)}
            />
            <Measurement
              label="العرض عند الإبط"
              value={values.measurements.armpitCm}
              onChange={(v) => onMeasurement("armpitCm", v)}
            />
            <Measurement
              label="الطول"
              value={values.measurements.lengthCm}
              onChange={(v) => onMeasurement("lengthCm", v)}
            />
          </div>
        </div>
      </div>
    </FormCard>
  );
}

function Attributes({
  values,
  onAttr,
}: {
  values: ProductFormValues;
  onAttr: (key: AttrKey, value: string) => void;
}) {
  const fields: { key: AttrKey; label: string; options: readonly EnumOption[] }[] = [
    { key: "sleeve", label: "نوع الكم", options: SLEEVES },
    { key: "fabric", label: "القماش", options: FABRICS },
    { key: "occasion", label: "المناسبة", options: OCCASIONS },
    { key: "embroidery", label: "التطريز / الزينة", options: EMBROIDERY },
  ];

  return (
    <FormCard>
      <SectionHeader step="٤" title="الخصائص" className="mb-4" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key}>
            <FieldLabel>{f.label}</FieldLabel>
            <Select
              value={values[f.key] || undefined}
              onValueChange={(v) => onAttr(f.key, v)}
            >
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="— اختر —" />
              </SelectTrigger>
              <SelectContent>
                {f.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      <div className="mt-[13px] inline-flex items-center gap-1.5 text-[11px] text-ink-faint">
        <Lock className="size-3" />
        قوائم محصورة لضمان اتساق القيم
      </div>
    </FormCard>
  );
}

function Tags({
  values,
  tagInput,
  onTagInput,
  onAddTag,
  onRemoveTag,
}: ProductDetailsFieldsProps) {
  return (
    <FormCard>
      <SectionHeader step="٥" title="الوسوم" className="mb-1.5" />
      <Hint>
        أوصاف حرّة تساعد المساعد الذكي على المطابقة — اضغط Enter للإضافة.
      </Hint>
      <div className="mt-[13px] flex flex-wrap items-center gap-[7px] rounded-[11px] border border-line-2 bg-card px-[11px] py-[9px] focus-within:border-primary">
        {values.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 rounded-lg border border-accent-line bg-accent-soft py-[5px] pe-2.5 ps-1.5 text-[12.5px] font-medium text-primary"
          >
            <button
              type="button"
              onClick={() => onRemoveTag(tag)}
              aria-label={`إزالة ${tag}`}
              className="text-[#7E94D8] transition-colors hover:text-primary dark:text-[#8ea6ee]"
            >
              ✕
            </button>
            {tag}
          </span>
        ))}
        <input
          value={tagInput}
          onChange={(e) => onTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAddTag();
            }
          }}
          placeholder="أضف وسماً…"
          className="min-w-[120px] flex-1 p-1 text-[13.5px] text-ink outline-none"
        />
      </div>
    </FormCard>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 rounded-[10px] border py-[9px] text-center text-[13px] font-semibold transition-colors"
      style={
        active
          ? {
              color: brand.accentDark,
              background: "var(--accent-soft)",
              borderColor: "var(--accent-line)",
            }
          : { color: "var(--neutral-fg)", background: "var(--card)", borderColor: "var(--line-2)" }
      }
    >
      {children}
    </button>
  );
}

const SuffixInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & { unit: string }
>(({ unit, className, ...props }, ref) => {
  return (
    <div className="flex items-center overflow-hidden rounded-[11px] border border-line-2 bg-card focus-within:border-primary">
      <input
        ref={ref}
        {...props}
        className={cn(
          "min-w-0 flex-1 px-[13px] py-[11px] text-sm font-semibold text-ink outline-none",
          className,
        )}
        style={{ fontFeatureSettings: "'tnum'" }}
      />
      <span className="flex items-center self-stretch border-s border-line px-3 text-xs font-semibold text-ink-muted">
        {unit}
      </span>
    </div>
  );
});
SuffixInput.displayName = "SuffixInput";

function Measurement({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number | null;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 text-xs text-ink-muted">{label}</div>
      <SuffixInput
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        inputMode="numeric"
        placeholder="—"
        unit="سم"
      />
    </div>
  );
}
