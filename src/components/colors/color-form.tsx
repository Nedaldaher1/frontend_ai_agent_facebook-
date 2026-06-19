/**
 * The unified add/edit color page: one page does color CRUD AND its dialect-term
 * (color_synonyms) management. create.tsx / edit.tsx stay one-liners; this owns
 * the Refine `useForm` (colors provider) plus the staged synonym chips.
 *
 * Synonyms are STAGED locally (in both modes) and applied on Save:
 *  - CREATE: POST the color `{ name, family, hex? }` → then POST each staged term
 *    with the new `colorId`. A duplicate term (409) is flagged on its chip; the
 *    created color is kept (never rolled back), and the page switches to editing
 *    the new color in place so the user can fix/remove the failed chips.
 *  - EDIT: PATCH the color, then diff the chips against what was loaded —
 *    added → POST, removed → DELETE, renamed → PATCH — reporting per-item
 *    failures inline without losing the rest.
 *
 * A 409 on the color maps inline to the `family` field; a 409 on a term maps
 * inline to that chip. Neither shows a generic toast.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "@refinedev/react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCreate,
  useDataProvider,
  useInvalidate,
  useList,
  useNavigation,
  useNotification,
  useUpdate,
  type HttpError,
} from "@refinedev/core";
import { ArrowRight, TriangleAlert } from "lucide-react";

import {
  blankColorForm,
  colorSchema,
  colorToFormValues,
  formValuesToSubmit,
  type ColorFormErrors,
} from "@/lib/colors";
import type {
  Color,
  ColorFormValues,
  ColorSubmit,
  ColorSynonym,
  SynonymChip,
} from "@/types/color";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FormCard } from "@/components/products/product-form-ui";
import { ColorFields } from "./color-fields";
import { ColorFormAside } from "./color-form-aside";
import { ColorSynonymsManager } from "./color-synonyms-manager";

const SYN_RESOURCE = "color-synonyms";
const SYN_PROVIDER = "colorSynonyms";

export function ColorForm({ mode }: { mode: "create" | "edit" }) {
  const { list, edit } = useNavigation();
  const { open } = useNotification();

  const form = useForm<Color, HttpError, ColorFormValues>({
    resolver: zodResolver(colorSchema),
    defaultValues: blankColorForm(),
    refineCoreProps: {
      resource: "colors",
      dataProviderName: "colors",
      action: mode,
      // We orchestrate color + synonyms ourselves, then navigate.
      redirect: false,
    },
  });

  const {
    watch,
    setValue,
    register,
    reset,
    setError,
    handleSubmit,
    formState,
    refineCore,
  } = form;
  const { query } = refineCore;
  const record = query?.data?.data;

  // After a successful create we keep editing the new color in place (so partial
  // synonym failures aren't lost to a navigation). Once set, the page behaves as
  // edit-of-`createdId`.
  const [createdId, setCreatedId] = useState<string>();
  const isEditing = mode === "edit" || createdId !== undefined;
  const effectiveId = createdId ?? record?.id;

  // Staged dialect terms (source of truth for the synonyms manager) + persisted
  // chips the user removed, queued for DELETE on Save.
  const [chips, setChips] = useState<SynonymChip[]>([]);
  const [pendingDeletes, setPendingDeletes] = useState<
    { id: string; term: string }[]
  >([]);
  const [saving, setSaving] = useState(false);
  const chipKey = useRef(0);

  // Standard-key (family) change confirmation. `savedFamily` is the last
  // persisted family; a submit that differs is gated behind a confirm dialog.
  const [savedFamily, setSavedFamily] = useState("");
  const [familyConfirmOpen, setFamilyConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<ColorFormValues | null>(
    null,
  );

  // Seed the form + chips from the loaded record (edit flow).
  useEffect(() => {
    if (mode === "edit" && record) {
      reset(colorToFormValues(record));
      setSavedFamily(record.family);
      setChips(
        (record.synonyms ?? []).map((s) => ({
          key: s.id,
          id: s.id,
          term: s.term,
          originalTerm: s.term,
          status: "persisted" as const,
        })),
      );
      setPendingDeletes([]);
    }
  }, [mode, record, reset]);

  // Existing families (to pre-empt a duplicate `family` before the request),
  // excluding the color being edited / just created.
  const { result: colorsResult } = useList<Color>({
    resource: "colors",
    dataProviderName: "colors",
    pagination: { currentPage: 1, pageSize: 500 },
  });
  const existingFamilies = useMemo(() => {
    const rows = Array.isArray(colorsResult?.data) ? colorsResult.data : [];
    return new Set(rows.filter((c) => c.id !== effectiveId).map((c) => c.family));
  }, [colorsResult, effectiveId]);

  // All dialect terms owned by OTHER colors. `term` is globally unique, but the
  // backend does NOT map the Postgres unique violation (it surfaces as a generic
  // 500), so we reject a duplicate term client-side for a clean Arabic message;
  // the DB constraint and the 409 mapping below are just backstops.
  const { result: synonymsResult } = useList<ColorSynonym>({
    resource: SYN_RESOURCE,
    dataProviderName: SYN_PROVIDER,
    pagination: { currentPage: 1, pageSize: 1000 },
  });
  const takenTerms = useMemo(() => {
    const rows = Array.isArray(synonymsResult?.data) ? synonymsResult.data : [];
    return new Set(rows.filter((s) => s.colorId !== effectiveId).map((s) => s.term));
  }, [synonymsResult, effectiveId]);

  const getProvider = useDataProvider();
  const synonyms = getProvider(SYN_PROVIDER);
  const invalidate = useInvalidate();
  const { mutateAsync: createColor } = useCreate<Color, HttpError, ColorSubmit>();
  const { mutateAsync: updateColor } = useUpdate<Color, HttpError, ColorSubmit>();

  const values = watch();
  const fieldErrors: ColorFormErrors = {
    name: formState.errors.name?.message,
    family: formState.errors.family?.message,
    hex: formState.errors.hex?.message,
  };

  // --- chip intents (from the synonyms manager) ------------------------------
  const addChip = (term: string) =>
    setChips((prev) => [
      ...prev,
      { key: `new-${chipKey.current++}`, term, status: "new" },
    ]);

  const removeChip = (chip: SynonymChip) => {
    if (chip.id) {
      setPendingDeletes((prev) => [...prev, { id: chip.id!, term: chip.term }]);
    }
    setChips((prev) => prev.filter((c) => c.key !== chip.key));
  };

  const editChipTerm = (chip: SynonymChip, term: string) =>
    setChips((prev) =>
      prev.map((c) =>
        c.key === chip.key
          ? { ...c, term, status: c.id ? "persisted" : "new", error: undefined }
          : c,
      ),
    );

  const patchChip = (key: string, patch: Partial<SynonymChip>) =>
    setChips((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)));

  // --- synonym persistence ---------------------------------------------------
  const synonymError = (error: unknown): string => {
    if ((error as HttpError)?.statusCode === 409) return "هذا المصطلح مستخدم مسبقًا";
    return (error as HttpError)?.message ?? "تعذّر حفظ المصطلح";
  };

  /** POST every staged "new" chip; returns the count that failed. */
  const persistNewChips = async (
    snapshot: SynonymChip[],
    colorId: string,
  ): Promise<number> => {
    let failures = 0;
    for (const chip of snapshot.filter((c) => c.status === "new")) {
      patchChip(chip.key, { status: "saving", error: undefined });
      try {
        const { data } = await synonyms.create({
          resource: SYN_RESOURCE,
          variables: { term: chip.term, colorId },
        });
        patchChip(chip.key, {
          status: "persisted",
          id: String(data.id),
          originalTerm: chip.term,
          error: undefined,
        });
      } catch (error) {
        failures += 1;
        patchChip(chip.key, { status: "error", error: synonymError(error) });
      }
    }
    return failures;
  };

  /** PATCH every persisted chip whose term changed; returns failures. */
  const patchEditedChips = async (snapshot: SynonymChip[]): Promise<number> => {
    let failures = 0;
    for (const chip of snapshot.filter(
      (c) => c.id && c.status === "persisted" && c.term !== c.originalTerm,
    )) {
      patchChip(chip.key, { status: "saving", error: undefined });
      try {
        await synonyms.update({
          resource: SYN_RESOURCE,
          id: chip.id!,
          variables: { term: chip.term },
        });
        patchChip(chip.key, {
          status: "persisted",
          originalTerm: chip.term,
          error: undefined,
        });
      } catch (error) {
        failures += 1;
        patchChip(chip.key, { status: "error", error: synonymError(error) });
      }
    }
    return failures;
  };

  /** DELETE every queued removal; failures stay queued for the next Save. */
  const flushDeletes = async (): Promise<number> => {
    let failures = 0;
    const stillFailing: { id: string; term: string }[] = [];
    for (const item of pendingDeletes) {
      try {
        await synonyms.deleteOne({ resource: SYN_RESOURCE, id: item.id });
      } catch {
        failures += 1;
        stillFailing.push(item);
      }
    }
    setPendingDeletes(stillFailing);
    return failures;
  };

  const refreshLists = () => {
    invalidate({
      resource: "colors",
      dataProviderName: "colors",
      invalidates: ["list"],
    });
    invalidate({
      resource: SYN_RESOURCE,
      dataProviderName: SYN_PROVIDER,
      invalidates: ["list"],
    });
  };

  /** Map a color-save error: 409 → inline on `family` (no toast). */
  const handleColorError = (error: unknown) => {
    if ((error as HttpError)?.statusCode === 409) {
      setError("family", { message: "هذا المفتاح مستخدم مسبقًا" });
    }
  };

  const colorErrorNotification = (error: HttpError | undefined) =>
    error?.statusCode === 409
      ? false
      : { type: "error" as const, message: error?.message ?? "تعذّر حفظ اللون" };

  const partialMessage =
    "تعذّر حفظ بعض المصطلحات — صحّح المميّزة بالأحمر ثم احفظ.";

  // --- submit ----------------------------------------------------------------
  /** Submit gate. name/hex/isActive save freely; a `family` change is held back
   *  for explicit confirmation first (it affects search + linked terms). */
  const onValid = async (v: ColorFormValues) => {
    // Pre-empt a duplicate family (inline message instead of a round-trip).
    if (existingFamilies.has(v.family.trim())) {
      setError("family", { message: "هذا المفتاح مستخدم مسبقًا" });
      return;
    }
    if (isEditing && v.family.trim() !== savedFamily) {
      setPendingValues(v);
      setFamilyConfirmOpen(true);
      return;
    }
    await performSave(v, false);
  };

  /** Proceed with a confirmed family change → save with the confirm flag. */
  const confirmFamilyChange = () => {
    setFamilyConfirmOpen(false);
    const v = pendingValues;
    setPendingValues(null);
    if (v) void performSave(v, true);
  };

  const performSave = async (v: ColorFormValues, confirmFamily: boolean) => {
    setSaving(true);
    const payload = formValuesToSubmit(v);
    const snapshot = chips;

    try {
      if (!isEditing) {
        // CREATE: color first, then POST the staged terms with the new id.
        let newId: string;
        try {
          const res = await createColor({
            resource: "colors",
            dataProviderName: "colors",
            values: payload,
            successNotification: false,
            errorNotification: colorErrorNotification,
          });
          newId = String(res.data.id);
        } catch (error) {
          handleColorError(error);
          return;
        }

        setCreatedId(newId); // keep editing this color in place from here on
        setSavedFamily(payload.family);
        const failures = await persistNewChips(snapshot, newId);
        refreshLists();

        if (failures === 0) {
          open?.({ type: "success", message: "تم إنشاء اللون", key: "color-save" });
          edit("colors", newId);
        } else {
          open?.({
            type: "error",
            message: `تم إنشاء اللون، لكن ${partialMessage}`,
            key: "color-save",
          });
        }
        return;
      }

      // EDIT (or post-create in place): PATCH color, then apply the synonym diff.
      const id = effectiveId;
      if (!id) return;
      try {
        await updateColor({
          resource: "colors",
          dataProviderName: "colors",
          id,
          values: payload,
          meta: { confirmFamilyChange: confirmFamily },
          successNotification: false,
          errorNotification: false,
        });
      } catch (error) {
        const status = (error as HttpError)?.statusCode;
        // 409 without the flag = the backend wants the family change confirmed;
        // surface the same dialog and retry with the flag (fallback to the gate).
        if (status === 409 && !confirmFamily) {
          setPendingValues(v);
          setFamilyConfirmOpen(true);
          return;
        }
        if (status === 409) {
          setError("family", { message: "هذا المفتاح مستخدم مسبقًا" });
          return;
        }
        open?.({
          type: "error",
          message: (error as HttpError)?.message ?? "تعذّر حفظ اللون",
          key: "color-save",
        });
        return;
      }

      setSavedFamily(payload.family);

      let failures = 0;
      failures += await flushDeletes();
      failures += await persistNewChips(snapshot, String(id));
      failures += await patchEditedChips(snapshot);
      refreshLists();

      if (failures === 0) {
        open?.({ type: "success", message: "تم حفظ التغييرات", key: "color-save" });
        list("colors");
      } else {
        open?.({
          type: "error",
          message: `تم حفظ اللون، لكن ${partialMessage}`,
          key: "color-save",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const onInvalid = () =>
    open?.({
      type: "error",
      message: "يرجى تصحيح الحقول المطلوبة",
      key: "form-invalid",
    });

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
          {isEditing ? "تعديل لون" : "إضافة لون جديد"}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_332px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-[18px]">
          <ColorFields
            values={values}
            errors={fieldErrors}
            register={register}
            onHex={(hex) =>
              setValue("hex", hex, { shouldValidate: formState.isSubmitted })
            }
            onFamily={(family) =>
              setValue("family", family, {
                shouldValidate: formState.isSubmitted,
              })
            }
          />
          <ColorSynonymsManager
            chips={chips}
            takenTerms={takenTerms}
            busy={saving}
            onAdd={addChip}
            onRemove={removeChip}
            onEditTerm={editChipTerm}
          />
        </div>

        <ColorFormAside
          values={values}
          mode={isEditing ? "edit" : "create"}
          submitting={saving}
          onToggleActive={(active) =>
            setValue("isActive", active, { shouldDirty: true })
          }
          onSave={handleSubmit(onValid, onInvalid)}
          onCancel={() => list("colors")}
        />
      </div>

      {/* Standard-key (family) change confirmation */}
      <AlertDialog
        open={familyConfirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFamilyConfirmOpen(false);
            setPendingValues(null);
          }
        }}
      >
        <AlertDialogContent className="max-w-[420px] rounded-[20px] p-[26px]">
          <div className="mb-4 flex size-[52px] items-center justify-center rounded-[15px] border border-[#F4D9A6] bg-[#FBF1DD] text-[#9A6B12]">
            <TriangleAlert className="size-5" />
          </div>
          <AlertDialogTitle className="text-lg font-semibold text-[#14161B]">
            تغيير المفتاح القياسي؟
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[13.5px] leading-relaxed text-[#7A7F88]">
            تغيير المفتاح القياسي يؤثّر على البحث والمصطلحات المرتبطة بهذا اللون.
            هل تريد المتابعة؟
          </AlertDialogDescription>
          <AlertDialogFooter className="mt-[22px] gap-2.5 sm:justify-stretch">
            <Button
              className="h-auto flex-1 rounded-[12px] py-[11px] font-semibold"
              onClick={confirmFamilyChange}
            >
              متابعة
            </Button>
            <AlertDialogCancel className="m-0 h-auto flex-1 rounded-[12px] py-[11px] font-semibold">
              تراجع
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
