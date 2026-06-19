/**
 * The dialect-terms manager, shown inside the color editor. One color owns many
 * terms (نبيتي / عنابي / خمري → "أحمر"); they all normalize to the same `family`
 * at the agent, so the accuracy of terms here = the agent's quality in
 * understanding the customer's dialect.
 *
 * Self-contained: it loads the global color-synonyms list (via the dedicated
 * `colorSynonyms` provider), shows the ones for THIS color, and uses the full
 * set to enforce the global `term` uniqueness before calling the API — so a
 * duplicate gets a clear Arabic message instead of a generic 500. It manages its
 * own data, so editing terms never disturbs the color form's unsaved fields.
 */

import { useMemo, useState } from "react";
import { useCreate, useDelete, useList, useUpdate } from "@refinedev/core";
import { Check, Loader2, Pencil, Plus, RotateCw, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateTerm } from "@/lib/colors";
import type { ColorSynonym } from "@/types/color";
import { cn } from "@/lib/utils";
import {
  ErrorText,
  fieldClass,
  FormCard,
  Hint,
  SectionHeader,
} from "@/components/products/product-form-ui";
import { SynonymCountBadge } from "./color-visuals";

const RESOURCE = "color-synonyms";
const PROVIDER = "colorSynonyms";

export function ColorSynonymsManager({ colorId }: { colorId: string }) {
  const { result, query } = useList<ColorSynonym>({
    resource: RESOURCE,
    dataProviderName: PROVIDER,
    pagination: { currentPage: 1, pageSize: 1000 },
  });

  const all = useMemo(
    () => (Array.isArray(result?.data) ? result.data : []),
    [result],
  );
  const mine = useMemo(
    () =>
      all
        .filter((s) => s.colorId === colorId)
        .sort((a, b) => a.term.localeCompare(b.term, "ar")),
    [all, colorId],
  );

  const { mutate: createSyn } = useCreate();
  const { mutate: updateSyn } = useUpdate();
  const { mutate: deleteSyn } = useDelete();

  const [term, setTerm] = useState("");
  const [addError, setAddError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState<string>();

  const refresh = () => query.refetch();

  const handleAdd = () => {
    const value = term.trim();
    // A term is globally unique, so any existing term (this color's or another's)
    // is a conflict.
    const taken = new Set(all.map((s) => s.term));
    const error = validateTerm(value, taken);
    if (error) {
      setAddError(error);
      return;
    }
    setBusy(true);
    createSyn(
      {
        resource: RESOURCE,
        dataProviderName: PROVIDER,
        values: { term: value, colorId },
        successNotification: { type: "success", message: "تمت إضافة المصطلح" },
        errorNotification: {
          type: "error",
          message: "تعذّر إضافة المصطلح",
        },
      },
      {
        onSuccess: () => {
          setTerm("");
          setAddError(undefined);
          refresh();
        },
        onSettled: () => setBusy(false),
      },
    );
  };

  const startEdit = (synonym: ColorSynonym) => {
    setEditingId(synonym.id);
    setEditValue(synonym.term);
    setEditError(undefined);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError(undefined);
  };

  const saveEdit = (synonym: ColorSynonym) => {
    const value = editValue.trim();
    if (value === synonym.term) {
      cancelEdit();
      return;
    }
    const taken = new Set(
      all.filter((s) => s.id !== synonym.id).map((s) => s.term),
    );
    const error = validateTerm(value, taken);
    if (error) {
      setEditError(error);
      return;
    }
    setBusy(true);
    updateSyn(
      {
        resource: RESOURCE,
        dataProviderName: PROVIDER,
        id: synonym.id,
        values: { term: value },
        successNotification: { type: "success", message: "تم تحديث المصطلح" },
        errorNotification: { type: "error", message: "تعذّر تحديث المصطلح" },
      },
      {
        onSuccess: () => {
          cancelEdit();
          refresh();
        },
        onSettled: () => setBusy(false),
      },
    );
  };

  const handleDelete = (synonym: ColorSynonym) => {
    setBusy(true);
    deleteSyn(
      {
        resource: RESOURCE,
        dataProviderName: PROVIDER,
        id: synonym.id,
        successNotification: { type: "success", message: "تم حذف المصطلح" },
        errorNotification: { type: "error", message: "تعذّر حذف المصطلح" },
      },
      {
        onSuccess: () => refresh(),
        onSettled: () => setBusy(false),
      },
    );
  };

  return (
    <FormCard>
      <SectionHeader
        step="٢"
        title="مصطلحات اللهجة"
        badge={<SynonymCountBadge count={mine.length} />}
      />
      <Hint className="mb-4 mt-2">
        أضف الكلمات الدارجة التي قد يستخدمها الزبون لهذا اللون (نبيتي، عنابي،
        خمري…) ليفهمها المساعد الذكي ويوحّدها عند البحث.
      </Hint>

      {/* Add a term */}
      <div>
        <div className="flex items-stretch gap-2">
          <Input
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              if (addError) setAddError(undefined);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="أضف مصطلحاً…"
            className={cn(fieldClass, addError && "border-[#E3A6A6]")}
          />
          <Button
            type="button"
            onClick={handleAdd}
            disabled={busy || !term.trim()}
            className="h-auto shrink-0 gap-1.5 rounded-[11px] px-4 font-semibold"
          >
            <Plus className="size-4" />
            إضافة
          </Button>
        </div>
        {addError && <ErrorText>{addError}</ErrorText>}
      </div>

      {/* Existing terms */}
      <div className="mt-[18px]">
        {query.isLoading ? (
          <div className="flex items-center gap-2 py-3 text-[13px] text-[#9197A0]">
            <Loader2 className="size-4 animate-spin text-primary" />
            جارٍ تحميل المصطلحات…
          </div>
        ) : query.isError ? (
          <div className="flex items-center justify-between gap-3 rounded-[12px] border border-[#F2DCDC] bg-[#FBEDED] px-3.5 py-3 text-[13px] text-[#B23B3B]">
            تعذّر تحميل المصطلحات.
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-1.5 font-semibold text-[#C0392B] hover:underline"
            >
              <RotateCw className="size-3.5" />
              إعادة المحاولة
            </button>
          </div>
        ) : mine.length === 0 ? (
          <p className="rounded-[12px] border border-dashed border-[#E2E4E9] bg-[#FAFAFB] px-3.5 py-4 text-center text-[13px] text-[#9197A0]">
            لا توجد مصطلحات بعد — أضف أوّل مصطلح لهذا اللون.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {mine.map((synonym) =>
              editingId === synonym.id ? (
                <li
                  key={synonym.id}
                  className="rounded-[12px] border border-[#CBD6F5] bg-[#F7F9FE] p-1.5"
                >
                  <div className="flex items-stretch gap-2">
                    <Input
                      autoFocus
                      value={editValue}
                      onChange={(e) => {
                        setEditValue(e.target.value);
                        if (editError) setEditError(undefined);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveEdit(synonym);
                        } else if (e.key === "Escape") {
                          cancelEdit();
                        }
                      }}
                      className={cn(
                        fieldClass,
                        "bg-card",
                        editError && "border-[#E3A6A6]",
                      )}
                    />
                    <RowIconButton
                      label="حفظ"
                      tone="confirm"
                      disabled={busy}
                      onClick={() => saveEdit(synonym)}
                    >
                      <Check className="size-[15px]" />
                    </RowIconButton>
                    <RowIconButton label="إلغاء" onClick={cancelEdit}>
                      <X className="size-[15px]" />
                    </RowIconButton>
                  </div>
                  {editError && (
                    <div className="px-1 pt-1">
                      <ErrorText>{editError}</ErrorText>
                    </div>
                  )}
                </li>
              ) : (
                <li
                  key={synonym.id}
                  className="flex items-center justify-between gap-2 rounded-[12px] border border-[#ECEDF1] bg-card px-3.5 py-2.5"
                >
                  <span className="truncate text-sm font-medium text-[#1B1D23]">
                    {synonym.term}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <RowIconButton
                      label="تعديل"
                      disabled={busy}
                      onClick={() => startEdit(synonym)}
                    >
                      <Pencil className="size-[14px]" />
                    </RowIconButton>
                    <RowIconButton
                      label="حذف"
                      tone="danger"
                      disabled={busy}
                      onClick={() => handleDelete(synonym)}
                    >
                      <Trash2 className="size-[14px]" />
                    </RowIconButton>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
      </div>
    </FormCard>
  );
}

type RowIconButtonProps = {
  label: string;
  tone?: "default" | "danger" | "confirm";
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function RowIconButton({
  label,
  tone = "default",
  disabled,
  onClick,
  children,
}: RowIconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-[32px] shrink-0 items-center justify-center rounded-[9px] border bg-card transition-colors disabled:opacity-50",
        tone === "default" &&
          "border-[#E6E8EC] text-[#7A7F88] hover:border-[#CBD6F5] hover:bg-[#EEF1FC] hover:text-primary",
        tone === "danger" &&
          "border-[#E6E8EC] text-[#7A7F88] hover:border-[#F2D6D6] hover:bg-[#FBEDED] hover:text-[#C0392B]",
        tone === "confirm" &&
          "border-[#CDEBD9] bg-[#EAF6EF] text-[#1B7A4E] hover:bg-[#DFF1E7]",
      )}
    >
      {children}
    </button>
  );
}
