/**
 * The add/edit product form. Self-contained: it owns the Refine `useForm`
 * instance (so create.tsx / edit.tsx stay one-liners), maps the API record into
 * editable values on load, and on submit maps the values back into a payload.
 *
 * Local React state holds the bits that aren't plain inputs — the Vision
 * suggestions under review, the tag composer — while the rest lives in
 * react-hook-form so the live preview can `watch()` everything.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "@refinedev/react-hook-form";
import {
  useList,
  useNavigation,
  useNotification,
  type HttpError,
} from "@refinedev/core";
import { ArrowRight } from "lucide-react";

import {
  blankProductForm,
  defaultAiSuggestions,
  formValuesToPayload,
  hasErrors,
  productToFormValues,
  suggestionTargetOptions,
  validateProductForm,
  valueFromLabel,
  type ProductFormErrors,
} from "@/lib/products";
import type {
  AiSuggestion,
  ColorValue,
  Product,
  ProductFormValues,
  ProductImage,
  ProductMeasurements,
  SizeId,
  StockStatus,
} from "@/types/product";
import type { Color } from "@/types/color";
import { useUnassignedUsage } from "@/hooks/use-unassigned-colors";
import { ProductDetailsFields } from "./product-details-fields";
import { ProductFormAside } from "./product-form-aside";
import { ProductImagesField } from "./product-images-field";
import { FormCard } from "./product-form-ui";

const NO_ERRORS: ProductFormErrors = { name: false, price: false, images: false };

type AttrKey = "sleeve" | "fabric" | "occasion" | "embroidery";

export function ProductForm({ mode }: { mode: "create" | "edit" }) {
  const { list } = useNavigation();
  const { open } = useNotification();
  const { refresh: refreshUnassigned } = useUnassignedUsage();

  const form = useForm<Product, HttpError, ProductFormValues>({
    refineCoreProps: {
      resource: "products",
      action: mode,
      redirect: "list",
      // Assigning a real color to an image fixes it, so drain the review queue
      // (and its nav badge) on every save.
      onMutationSuccess: () => {
        void refreshUnassigned();
      },
      successNotification: (_data, values) => ({
        type: "success",
        message:
          (values as Partial<Product>)?.status === "published"
            ? "تم نشر المنتج بنجاح"
            : "تم حفظ المسودّة",
      }),
    },
    defaultValues: blankProductForm(),
  });

  const { watch, setValue, getValues, register, reset, refineCore } = form;
  const { onFinish, formLoading, query } = refineCore;

  const [showErrors, setShowErrors] = useState(false);
  const [ai, setAi] = useState<AiSuggestion[]>(defaultAiSuggestions());
  const [aiApproved, setAiApproved] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const objectUrls = useRef<string[]>([]);

  // Load the record into the form once it arrives (edit flow).
  const record = query?.data?.data;
  useEffect(() => {
    if (mode === "edit" && record) reset(productToFormValues(record));
  }, [mode, record, reset]);

  // Revoke any object URLs we created for image previews.
  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const values = watch();
  const errors = showErrors ? validateProductForm(values) : NO_ERRORS;

  // Each image stores a color id (UUID). The product's `color_family` and the
  // live preview need the enum family + swatch, so fetch the colors once here
  // and resolve id → family — keeping the colors table out of the pure mappers
  // and the preview atoms (CLAUDE.md §6).
  const { result: colorsResult } = useList<Color>({
    resource: "colors",
    dataProviderName: "colors",
    pagination: { currentPage: 1, pageSize: 500 },
  });
  const colorFamilyById = useMemo(() => {
    const rows = Array.isArray(colorsResult?.data) ? colorsResult.data : [];
    const byId = new Map(rows.map((c) => [c.id, c.family]));
    return (colorId: string): ColorValue | "" =>
      ((colorId && byId.get(colorId)) || "") as ColorValue | "";
  }, [colorsResult]);

  // --- image handlers ---------------------------------------------------
  const addImage = (file?: File) => {
    const id = Date.now();
    let url: string | undefined;
    if (file) {
      url = URL.createObjectURL(file);
      objectUrls.current.push(url);
    }
    // Hold the File until Save; the data provider uploads it then (create has
    // no product id yet, and edit batches gallery changes on Save).
    const next: ProductImage = { id, url, file, color: "", analyzed: false };
    setValue("images", [...getValues("images"), next], { shouldDirty: true });
    // Simulate Vision finishing its analysis for this variant.
    window.setTimeout(() => {
      setValue(
        "images",
        getValues("images").map((im) =>
          im.id === id ? { ...im, analyzed: true } : im,
        ),
      );
    }, 1400);
  };

  const removeImage = (id: ProductImage["id"]) =>
    setValue(
      "images",
      getValues("images").filter((im) => im.id !== id),
      { shouldDirty: true },
    );

  const setMain = (id: ProductImage["id"]) => {
    const imgs = getValues("images");
    const target = imgs.find((im) => im.id === id);
    if (!target) return;
    setValue("images", [target, ...imgs.filter((im) => im.id !== id)], {
      shouldDirty: true,
    });
  };

  const setImageColor = (id: ProductImage["id"], color: string) =>
    setValue(
      "images",
      getValues("images").map((im) => (im.id === id ? { ...im, color } : im)),
      { shouldDirty: true },
    );

  // --- detail handlers --------------------------------------------------
  const setStock = (stock: StockStatus) => setValue("stock", stock);

  const toggleSize = (id: SizeId) => {
    const sizes = getValues("sizes");
    setValue(
      "sizes",
      sizes.includes(id) ? sizes.filter((s) => s !== id) : [...sizes, id],
    );
  };

  const setMeasurement = (key: keyof ProductMeasurements, raw: string) => {
    const clean = raw.replace(/[^\d]/g, "");
    setValue(`measurements.${key}`, clean === "" ? null : Number(clean));
  };

  const setAttr = (key: AttrKey, value: string) =>
    setValue(key, value as ProductFormValues[AttrKey]);

  const addTag = () => {
    const tag = tagInput.trim();
    const tags = getValues("tags");
    if (tag && !tags.includes(tag)) setValue("tags", [...tags, tag]);
    setTagInput("");
  };

  const removeTag = (tag: string) =>
    setValue("tags", getValues("tags").filter((t) => t !== tag));

  // --- AI suggestions ---------------------------------------------------
  const editSuggestion = (index: number, value: string) =>
    setAi((prev) => prev.map((s, i) => (i === index ? { ...s, value } : s)));

  const approveAll = () => {
    for (const s of ai) {
      const enumValue = valueFromLabel(suggestionTargetOptions[s.target], s.value);
      if (enumValue) setValue(s.target, enumValue as ProductFormValues[AttrKey]);
    }
    setAiApproved(true);
    open?.({
      type: "success",
      message: "تم اعتماد اقتراحات الذكاء الاصطناعي",
      key: "ai-approved",
    });
  };

  // --- submit -----------------------------------------------------------
  const submit = (publish: boolean) => {
    const v = getValues();
    const validation = validateProductForm(v);
    if (hasErrors(validation)) {
      setShowErrors(true);
      open?.({
        type: "error",
        message: "يرجى تعبئة الحقول المطلوبة",
        key: "form-invalid",
      });
      return;
    }
    // onFinish forwards the payload to the data provider; the form's TVariables
    // is the editable shape, so the mapped payload is cast through.
    onFinish(
      formValuesToPayload(v, publish, colorFamilyById) as unknown as ProductFormValues,
    );
  };

  // --- edit loading / error states --------------------------------------
  if (mode === "edit" && query?.isLoading) return <FormSkeleton />;
  if (mode === "edit" && query?.isError) {
    return (
      <FormError onBack={() => list("products")} onRetry={() => query.refetch()} />
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => list("products")}
          className="mb-3.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-primary"
        >
          <ArrowRight className="size-4" />
          العودة إلى المنتجات
        </button>
        <h1 className="m-0 text-[28px] font-semibold tracking-[-0.4px] text-ink">
          {mode === "edit" ? "تعديل منتج" : "إضافة منتج جديد"}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_332px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-[18px]">
          <ProductImagesField
            images={values.images}
            error={errors.images}
            onAdd={addImage}
            onRemove={removeImage}
            onSetMain={setMain}
            onSetColor={setImageColor}
          />
  
          <ProductDetailsFields
            values={values}
            errors={errors}
            register={register}
            onStock={setStock}
            onToggleSize={toggleSize}
            onMeasurement={setMeasurement}
            onAttr={setAttr}
            tagInput={tagInput}
            onTagInput={setTagInput}
            onAddTag={addTag}
            onRemoveTag={removeTag}
          />
        </div>

        <ProductFormAside
          values={values}
          colorFamilyOf={colorFamilyById}
          submitting={formLoading}
          onTogglePublish={(v) => setValue("published", v)}
          onPublish={() => submit(true)}
          onSaveDraft={() => submit(false)}
          onCancel={() => list("products")}
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
          {[230, 180, 320].map((h, i) => (
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
            <div className="h-24 w-full animate-pulse rounded bg-surface-1" />
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
        تعذّر تحميل المنتج
      </h2>
      <p className="mx-auto mb-6 max-w-[380px] text-sm leading-[1.7] text-ink-muted">
        حدث خطأ أثناء جلب بيانات المنتج. حاول مرّة أخرى أو عُد إلى القائمة.
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
          العودة إلى المنتجات
        </button>
      </div>
    </div>
  );
}
