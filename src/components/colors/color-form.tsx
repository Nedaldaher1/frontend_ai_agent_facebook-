/**
 * The add/edit color form. Self-contained: it owns the Refine `useForm` instance
 * (so create.tsx / edit.tsx stay one-liners), maps the API record into editable
 * values on load, and on submit maps the values back into a payload. Selects the
 * named `colors` data provider; mirrors the product/knowledge form shape.
 *
 * Create then edit: synonyms link by `colorId`, so a color must exist first.
 * After a successful create we redirect to the edit page (`redirect: "edit"`),
 * where the dialect-terms manager is available — the same "product then images"
 * two-step used elsewhere in the admin.
 */

import { useEffect, useMemo, useState } from "react";
import { useForm } from "@refinedev/react-hook-form";
import {
  useList,
  useNavigation,
  useNotification,
  type HttpError,
} from "@refinedev/core";
import { ArrowRight } from "lucide-react";

import {
  blankColorForm,
  colorToFormValues,
  formValuesToSubmit,
  hasColorErrors,
  validateColorForm,
  type ColorFormErrors,
} from "@/lib/colors";
import type { Color, ColorFormValues } from "@/types/color";
import { FormCard } from "@/components/products/product-form-ui";
import { ColorFields } from "./color-fields";
import { ColorFormAside } from "./color-form-aside";
import { ColorSynonymsManager } from "./color-synonyms-manager";

const NO_ERRORS: ColorFormErrors = {};

export function ColorForm({ mode }: { mode: "create" | "edit" }) {
  const { list } = useNavigation();
  const { open } = useNotification();

  const form = useForm<Color, HttpError, ColorFormValues>({
    refineCoreProps: {
      resource: "colors",
      dataProviderName: "colors",
      action: mode,
      // Create → edit (to add dialect terms); edit → back to the list.
      redirect: mode === "create" ? "edit" : "list",
      successNotification: () => ({
        type: "success",
        message: mode === "create" ? "تم إنشاء اللون" : "تم حفظ التغييرات",
      }),
    },
    defaultValues: blankColorForm(),
  });

  const { watch, setValue, getValues, register, reset, refineCore } = form;
  const { onFinish, formLoading, query } = refineCore;

  const [showErrors, setShowErrors] = useState(false);

  // Load the record into the form once it arrives (edit flow).
  const record = query?.data?.data;
  useEffect(() => {
    if (mode === "edit" && record) reset(colorToFormValues(record));
  }, [mode, record, reset]);

  // The existing colors, to catch a duplicate `family` before submit (the
  // backend does not surface that conflict cleanly). Exclude the current color.
  const { result: colorsResult } = useList<Color>({
    resource: "colors",
    dataProviderName: "colors",
    pagination: { currentPage: 1, pageSize: 500 },
  });
  const existingFamilies = useMemo(() => {
    const rows = Array.isArray(colorsResult?.data) ? colorsResult.data : [];
    return new Set(
      rows.filter((c) => c.id !== record?.id).map((c) => c.family),
    );
  }, [colorsResult, record?.id]);

  const values = watch();
  const errors = showErrors
    ? validateColorForm(values, existingFamilies)
    : NO_ERRORS;

  const submit = () => {
    const v = getValues();
    const validation = validateColorForm(v, existingFamilies);
    if (hasColorErrors(validation)) {
      setShowErrors(true);
      open?.({
        type: "error",
        message: "يرجى تصحيح الحقول المطلوبة",
        key: "form-invalid",
      });
      return;
    }
    // onFinish forwards the mapped payload to the data provider; the form's
    // TVariables is the editable shape, so the payload is cast through.
    onFinish(formValuesToSubmit(v) as unknown as ColorFormValues);
  };

  if (mode === "edit" && query?.isLoading) return <FormSkeleton />;
  if (mode === "edit" && query?.isError) {
    return (
      <FormError onBack={() => list("colors")} onRetry={() => query.refetch()} />
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => list("colors")}
          className="mb-3.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#7A7F88] transition-colors hover:text-primary"
        >
          <ArrowRight className="size-4" />
          العودة إلى الألوان
        </button>
        <h1 className="m-0 text-[28px] font-semibold tracking-[-0.4px] text-[#14161B]">
          {mode === "edit" ? "تعديل لون" : "إضافة لون جديد"}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_332px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-[18px]">
          <ColorFields
            values={values}
            errors={errors}
            register={register}
            onHex={(hex) => setValue("hex", hex)}
          />
          {mode === "edit" && record?.id && (
            <ColorSynonymsManager colorId={record.id} />
          )}
        </div>

        <ColorFormAside
          values={values}
          mode={mode}
          submitting={formLoading}
          onToggleActive={(v) => setValue("isActive", v)}
          onSave={submit}
          onCancel={() => list("colors")}
        />
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div>
      <div className="mb-6">
        <div className="mb-3.5 h-4 w-40 animate-pulse rounded bg-[#EDEEF1]" />
        <div className="h-8 w-56 animate-pulse rounded bg-[#EDEEF1]" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_332px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-[18px]">
          {[260, 220].map((h, i) => (
            <FormCard key={i}>
              <div className="h-4 w-40 animate-pulse rounded bg-[#EDEEF1]" />
              <div
                className="mt-4 w-full animate-pulse rounded-[12px] bg-[#F0F1F4]"
                style={{ height: h }}
              />
            </FormCard>
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <FormCard>
            <div className="h-28 w-full animate-pulse rounded bg-[#F0F1F4]" />
          </FormCard>
          <FormCard>
            <div className="h-16 w-full animate-pulse rounded bg-[#F0F1F4]" />
          </FormCard>
        </div>
      </div>
    </div>
  );
}

function FormError({
  onBack,
  onRetry,
}: {
  onBack: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-[18px] border border-[#F2DCDC] bg-card px-[30px] py-[60px] text-center">
      <h2 className="mb-2 text-xl font-semibold text-[#14161B]">
        تعذّر تحميل اللون
      </h2>
      <p className="mx-auto mb-6 max-w-[380px] text-sm leading-[1.7] text-[#7A7F88]">
        حدث خطأ أثناء جلب بيانات اللون. حاول مرّة أخرى أو عُد إلى القائمة.
      </p>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-[12px] border border-[#DADDE2] bg-card px-5 py-[11px] text-sm font-semibold text-[#14161B] transition-colors hover:bg-[#F6F7F9]"
        >
          إعادة المحاولة
        </button>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-[11px] text-sm font-medium text-[#8A8F98] transition-colors hover:text-primary"
        >
          العودة إلى الألوان
        </button>
      </div>
    </div>
  );
}
