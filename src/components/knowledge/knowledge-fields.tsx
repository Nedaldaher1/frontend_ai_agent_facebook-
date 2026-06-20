/**
 * The knowledge entry's form fields, split into two cards (content + organising)
 * to match the products form's visual rhythm. Presentational — all state lives
 * in the parent KnowledgeForm; this just renders fields and calls back. Reuses
 * the products' shared form primitives so the look is identical.
 */

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
import { KNOWLEDGE_CATEGORIES } from "@/constants/enums";
import type { KnowledgeFormErrors } from "@/lib/knowledge";
import type {
  KnowledgeCategory,
  KnowledgeFormValues,
} from "@/types/knowledge";
import { cn } from "@/lib/utils";
import {
  ErrorText,
  FieldLabel,
  fieldClass,
  FormCard,
  Hint,
  SectionHeader,
  selectTriggerClass,
} from "@/components/products/product-form-ui";
import { ProductCombobox } from "./product-combobox";

type KnowledgeFieldsProps = {
  values: KnowledgeFormValues;
  errors: KnowledgeFormErrors;
  register: UseFormRegister<KnowledgeFormValues>;
  onCategory: (value: KnowledgeCategory) => void;
  onProductId: (value: string | null) => void;
  tagInput: string;
  onTagInput: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
};

export function KnowledgeFields(props: KnowledgeFieldsProps) {
  return (
    <>
      <ContentSection {...props} />
      <OrganiseSection {...props} />
    </>
  );
}

function ContentSection({
  values,
  errors,
  register,
  onCategory,
}: KnowledgeFieldsProps) {
  return (
    <FormCard>
      <SectionHeader step="١" title="المحتوى" className="mb-4" />
      <div className="flex flex-col gap-[18px]">
        <div>
          <FieldLabel required>العنوان</FieldLabel>
          <Input
            {...register("title")}
            placeholder="مثال: هل يمكن إرجاع العباية بعد الاستلام؟"
            className={cn(fieldClass, errors.title && "border-danger-line")}
          />
          {errors.title && <ErrorText>العنوان مطلوب</ErrorText>}
        </div>

        <div>
          <FieldLabel required>الفئة</FieldLabel>
          <Select
            value={values.category || undefined}
            onValueChange={(v) => onCategory(v as KnowledgeCategory)}
          >
            <SelectTrigger
              className={cn(
                selectTriggerClass,
                errors.category && "border-danger-line",
              )}
            >
              <SelectValue placeholder="— اختر الفئة —" />
            </SelectTrigger>
            <SelectContent>
              {KNOWLEDGE_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category ? (
            <ErrorText>اختر فئة المدخل</ErrorText>
          ) : (
            <Hint className="inline-flex items-center gap-1.5">
              <Lock className="size-3" />
              قائمة محصورة لضمان اتساق التصنيف
            </Hint>
          )}
        </div>

        <div>
          <FieldLabel>السؤال / الحالة</FieldLabel>
          <Input
            {...register("situation")}
            placeholder="مثال: هل القماش شفاف؟"
            className={fieldClass}
          />
          <Hint>
            ما السؤال الذي يجيب عنه هذا المدخل؟ يدخل فعلياً في مطابقة المساعد
            لرسائل الزبائن.
          </Hint>
        </div>

        <div>
          <FieldLabel required>المحتوى / الجواب</FieldLabel>
          <Textarea
            {...register("content")}
            rows={6}
            placeholder="اكتب الإجابة التي سيستخدمها المساعد الذكي عند الرد على الزبون…"
            className={cn(
              fieldClass,
              "leading-relaxed",
              errors.content && "border-danger-line",
            )}
          />
          {errors.content ? (
            <ErrorText>المحتوى مطلوب</ErrorText>
          ) : (
            <Hint>هذا النص هو ما يعرضه المساعد للزبون.</Hint>
          )}
        </div>
      </div>
    </FormCard>
  );
}

function OrganiseSection({
  values,
  register,
  onProductId,
  tagInput,
  onTagInput,
  onAddTag,
  onRemoveTag,
}: KnowledgeFieldsProps) {
  return (
    <FormCard>
      <SectionHeader step="٢" title="التنظيم والربط" className="mb-4" />
      <div className="flex flex-col gap-[18px]">
        {/* Tags */}
        <div>
          <FieldLabel>الوسوم</FieldLabel>
          <div className="flex flex-wrap items-center gap-[7px] rounded-[11px] border border-line-2 bg-card px-[11px] py-[9px] focus-within:border-primary">
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
          <Hint>أوصاف حرّة تساعد على التنظيم — اضغط Enter للإضافة.</Hint>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Priority */}
          <div>
            <FieldLabel>الأولوية</FieldLabel>
            <Input
              {...register("priority", { valueAsNumber: true })}
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              placeholder="0"
              className={fieldClass}
              style={{ fontFeatureSettings: "'tnum'" }}
            />
            <Hint className="mt-[7px] text-[11.5px]">
              الأعلى يظهر أولاً للمساعد عند تساوي النتائج.
            </Hint>
          </div>

          {/* Linked product */}
          <div>
            <FieldLabel>المنتج المرتبط</FieldLabel>
            <ProductCombobox
              value={values.productId}
              onChange={onProductId}
            />
            <Hint className="mt-[7px] text-[11.5px]">
              اتركه «عام» لمعرفة تنطبق على كل المنتجات.
            </Hint>
          </div>
        </div>
      </div>
    </FormCard>
  );
}
