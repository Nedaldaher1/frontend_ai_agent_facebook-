/**
 * The color's form fields, in one card. Presentational — all state lives in the
 * parent ColorForm; this renders fields and calls back. Reuses the products'
 * shared form primitives so the look is identical.
 *
 * `family` is an English LTR key inside the RTL UI (forced `dir="ltr"`,
 * monospace) to make its technical, stable nature obvious.
 */

import type { UseFormRegister } from "react-hook-form";
import { KeyRound } from "lucide-react";

import { Input } from "@/components/ui/input";
import { HEX_PATTERN, sanitizeFamily, type ColorFormErrors } from "@/lib/colors";
import type { ColorFormValues } from "@/types/color";
import { cn } from "@/lib/utils";
import {
  ErrorText,
  FieldLabel,
  fieldClass,
  FormCard,
  Hint,
  SectionHeader,
} from "@/components/products/product-form-ui";

type ColorFieldsProps = {
  values: ColorFormValues;
  errors: ColorFormErrors;
  register: UseFormRegister<ColorFormValues>;
  /** Sync the native color picker back into the form's `hex` value. */
  onHex: (hex: string) => void;
  /** Write the sanitized `family` slug back into the form (controlled input). */
  onFamily: (family: string) => void;
};

export function ColorFields({
  values,
  errors,
  register,
  onHex,
  onFamily,
}: ColorFieldsProps) {
  const pickerValue = HEX_PATTERN.test(values.hex) ? values.hex : "#000000";

  return (
    <FormCard>
      <SectionHeader step="١" title="تفاصيل اللون" className="mb-4" />
      <div className="flex flex-col gap-[18px]">
        {/* Display name (Arabic) */}
        <div>
          <FieldLabel required>اسم اللون</FieldLabel>
          <Input
            {...register("name")}
            placeholder="مثال: أحمر"
            className={cn(fieldClass, errors.name && "border-[#E3A6A6]")}
          />
          {errors.name ? (
            <ErrorText>{errors.name}</ErrorText>
          ) : (
            <Hint>الاسم المعروض للطاقم باللغة العربية.</Hint>
          )}
        </div>

        {/* Canonical key (English slug) */}
        <div>
          <FieldLabel required>المفتاح القياسي</FieldLabel>
          <Input
            value={values.family ?? ""}
            onChange={(e) => onFamily(sanitizeFamily(e.target.value))}
            dir="ltr"
            spellCheck={false}
            autoCapitalize="none"
            placeholder="red"
            className={cn(
              fieldClass,
              "text-start font-mono",
              errors.family && "border-[#E3A6A6]",
            )}
          />
          {errors.family ? (
            <ErrorText>{errors.family}</ErrorText>
          ) : (
            <Hint className="inline-flex items-center gap-1.5">
              <KeyRound className="size-3" />
              مفتاح بحث ثابت بالإنجليزية تتوحّد عنده المصطلحات — لا يُنصح بتغييره.
            </Hint>
          )}
        </div>

        {/* Swatch (optional) */}
        <div>
          <FieldLabel>لون العيّنة</FieldLabel>
          <div className="flex items-center gap-2.5">
            <input
              type="color"
              value={pickerValue}
              onChange={(e) => onHex(e.target.value)}
              aria-label="منتقي اللون"
              className="size-[42px] shrink-0 cursor-pointer rounded-[11px] border border-[#E2E4E9] bg-card p-1"
            />
            <Input
              {...register("hex")}
              dir="ltr"
              spellCheck={false}
              placeholder="#B0212F"
              className={cn(
                fieldClass,
                "max-w-[170px] text-start font-mono uppercase",
                errors.hex && "border-[#E3A6A6]",
              )}
            />
          </div>
          {errors.hex ? (
            <ErrorText>{errors.hex}</ErrorText>
          ) : (
            <Hint>اختياري — يُستخدم للعرض فقط في اللوحة.</Hint>
          )}
        </div>
      </div>
    </FormCard>
  );
}
