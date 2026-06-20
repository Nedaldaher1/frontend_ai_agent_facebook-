/**
 * The add/edit knowledge form. Self-contained: it owns the Refine `useForm`
 * instance (so create.tsx / edit.tsx stay one-liners), maps the API record into
 * editable values on load, and on submit maps the values back into a payload.
 * Selects the named `knowledge` data provider; mirrors the product form's shape.
 */

import { useEffect, useState } from "react";
import { useForm } from "@refinedev/react-hook-form";
import { useNavigation, useNotification, type HttpError } from "@refinedev/core";
import { ArrowRight } from "lucide-react";

import {
  blankKnowledgeForm,
  formValuesToPayload,
  hasErrors,
  knowledgeToFormValues,
  validateKnowledgeForm,
  type KnowledgeFormErrors,
} from "@/lib/knowledge";
import type {
  KnowledgeCategory,
  KnowledgeEntry,
  KnowledgeFormValues,
} from "@/types/knowledge";
import { FormCard } from "@/components/products/product-form-ui";
import { KnowledgeFields } from "./knowledge-fields";
import { KnowledgeFormAside } from "./knowledge-form-aside";

const NO_ERRORS: KnowledgeFormErrors = {
  title: false,
  category: false,
  content: false,
};

export function KnowledgeForm({ mode }: { mode: "create" | "edit" }) {
  const { list } = useNavigation();
  const { open } = useNotification();

  const form = useForm<KnowledgeEntry, HttpError, KnowledgeFormValues>({
    refineCoreProps: {
      resource: "knowledge",
      dataProviderName: "knowledge",
      action: mode,
      redirect: "list",
      successNotification: (_data, values) => ({
        type: "success",
        message:
          (values as Partial<{ status: string }>)?.status === "published"
            ? "تم نشر المدخل بنجاح"
            : "تم حفظ المسودّة",
      }),
    },
    defaultValues: blankKnowledgeForm(),
  });

  const { watch, setValue, getValues, register, reset, refineCore } = form;
  const { onFinish, formLoading, query } = refineCore;

  const [showErrors, setShowErrors] = useState(false);
  const [tagInput, setTagInput] = useState("");

  // Load the record into the form once it arrives (edit flow).
  const record = query?.data?.data;
  useEffect(() => {
    if (mode === "edit" && record) reset(knowledgeToFormValues(record));
  }, [mode, record, reset]);

  const values = watch();
  const errors = showErrors ? validateKnowledgeForm(values) : NO_ERRORS;

  const setCategory = (category: KnowledgeCategory) =>
    setValue("category", category);
  const setProductId = (productId: string | null) =>
    setValue("productId", productId);

  const addTag = () => {
    const tag = tagInput.trim();
    const tags = getValues("tags");
    if (tag && !tags.includes(tag)) setValue("tags", [...tags, tag]);
    setTagInput("");
  };

  const removeTag = (tag: string) =>
    setValue(
      "tags",
      getValues("tags").filter((t) => t !== tag),
    );

  const submit = (publish: boolean) => {
    const v = getValues();
    const validation = validateKnowledgeForm(v);
    if (hasErrors(validation)) {
      setShowErrors(true);
      open?.({
        type: "error",
        message: "يرجى تعبئة الحقول المطلوبة",
        key: "form-invalid",
      });
      return;
    }
    // onFinish forwards the mapped payload to the data provider; the form's
    // TVariables is the editable shape, so the payload is cast through.
    onFinish(formValuesToPayload(v, publish) as unknown as KnowledgeFormValues);
  };

  if (mode === "edit" && query?.isLoading) return <FormSkeleton />;
  if (mode === "edit" && query?.isError) {
    return (
      <FormError
        onBack={() => list("knowledge")}
        onRetry={() => query.refetch()}
      />
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => list("knowledge")}
          className="mb-3.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-primary"
        >
          <ArrowRight className="size-4" />
          العودة إلى قاعدة المعرفة
        </button>
        <h1 className="m-0 text-[28px] font-semibold tracking-[-0.4px] text-ink">
          {mode === "edit" ? "تعديل مدخل" : "إضافة مدخل جديد"}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_332px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-[18px]">
          <KnowledgeFields
            values={values}
            errors={errors}
            register={register}
            onCategory={setCategory}
            onProductId={setProductId}
            tagInput={tagInput}
            onTagInput={setTagInput}
            onAddTag={addTag}
            onRemoveTag={removeTag}
          />
        </div>

        <KnowledgeFormAside
          values={values}
          submitting={formLoading}
          onTogglePublish={(v) => setValue("published", v)}
          onPublish={() => submit(true)}
          onSaveDraft={() => submit(false)}
          onCancel={() => list("knowledge")}
        />
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div>
      <div className="mb-6">
        <div className="mb-3.5 h-4 w-40 animate-pulse rounded bg-line" />
        <div className="h-8 w-56 animate-pulse rounded bg-line" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_332px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-[18px]">
          {[300, 230].map((h, i) => (
            <FormCard key={i}>
              <div className="h-4 w-40 animate-pulse rounded bg-line" />
              <div
                className="mt-4 w-full animate-pulse rounded-[12px] bg-surface-1"
                style={{ height: h }}
              />
            </FormCard>
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <FormCard>
            <div className="h-32 w-full animate-pulse rounded bg-surface-1" />
          </FormCard>
          <FormCard>
            <div className="h-16 w-full animate-pulse rounded bg-surface-1" />
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
    <div className="rounded-[18px] border border-danger-line bg-card px-[30px] py-[60px] text-center">
      <h2 className="mb-2 text-xl font-semibold text-ink">
        تعذّر تحميل المدخل
      </h2>
      <p className="mx-auto mb-6 max-w-[380px] text-sm leading-[1.7] text-ink-muted">
        حدث خطأ أثناء جلب بيانات المدخل. حاول مرّة أخرى أو عُد إلى القائمة.
      </p>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-[12px] border border-line-2 bg-card px-5 py-[11px] text-sm font-semibold text-ink transition-colors hover:bg-surface-1"
        >
          إعادة المحاولة
        </button>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-[11px] text-sm font-medium text-ink-muted transition-colors hover:text-primary"
        >
          العودة إلى قاعدة المعرفة
        </button>
      </div>
    </div>
  );
}
