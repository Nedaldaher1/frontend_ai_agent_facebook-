/**
 * The dialect-terms manager, shown inside the color editor in BOTH create and
 * edit modes. One color owns many terms (نبيتي / عنابي / خمري → "أحمر"); they all
 * normalize to the same `family` at the agent, so the accuracy of terms here =
 * the agent's quality in understanding the customer's dialect.
 *
 * Controlled & staged: this component renders the parent's chip list and reports
 * intents (add / rename / remove) back up — it performs NO API calls itself. The
 * parent (`ColorForm`) stages the chips locally and applies them on Save (POST /
 * PATCH / DELETE), surfacing per-chip failures via each chip's `status`/`error`.
 * Client-side it rejects empties and any term already present — in this color's
 * list (`chips`) or owned by another color (`takenTerms`) — so a globally
 * duplicate term gets a clean Arabic message instead of the backend's generic
 * 500 on the unique-constraint violation.
 */

import { useState } from "react";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateTerm } from "@/lib/colors";
import type { SynonymChip } from "@/types/color";
import { cn } from "@/lib/utils";
import {
  ErrorText,
  fieldClass,
  FormCard,
  Hint,
  SectionHeader,
} from "@/components/products/product-form-ui";
import { SynonymCountBadge } from "./color-visuals";

type ColorSynonymsManagerProps = {
  /** The staged chips owned by the parent form (source of truth). */
  chips: SynonymChip[];
  /** Terms owned by OTHER colors — for the global-uniqueness pre-check. */
  takenTerms: Set<string>;
  /** A save is in flight — disable mutating actions. */
  busy: boolean;
  /** Stage a new term (already trimmed & locally validated). */
  onAdd: (term: string) => void;
  /** Drop a chip (a "new" one vanishes; a persisted one is queued for delete). */
  onRemove: (chip: SynonymChip) => void;
  /** Rename a chip's term (already trimmed & locally validated). */
  onEditTerm: (chip: SynonymChip, term: string) => void;
};

export function ColorSynonymsManager({
  chips,
  takenTerms,
  busy,
  onAdd,
  onRemove,
  onEditTerm,
}: ColorSynonymsManagerProps) {
  const [term, setTerm] = useState("");
  const [addError, setAddError] = useState<string>();

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState<string>();

  const handleAdd = () => {
    const value = term.trim();
    const taken = new Set(takenTerms);
    chips.forEach((c) => taken.add(c.term));
    const error = validateTerm(value, taken);
    if (error) {
      setAddError(error);
      return;
    }
    onAdd(value);
    setTerm("");
    setAddError(undefined);
  };

  const startEdit = (chip: SynonymChip) => {
    setEditingKey(chip.key);
    setEditValue(chip.term);
    setEditError(undefined);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditError(undefined);
  };

  const saveEdit = (chip: SynonymChip) => {
    const value = editValue.trim();
    if (value === chip.term) {
      cancelEdit();
      return;
    }
    // A term is globally unique, so any other chip's term — or a term owned by
    // another color — is a conflict.
    const taken = new Set(takenTerms);
    chips.forEach((c) => {
      if (c.key !== chip.key) taken.add(c.term);
    });
    const error = validateTerm(value, taken);
    if (error) {
      setEditError(error);
      return;
    }
    onEditTerm(chip, value);
    cancelEdit();
  };

  return (
    <FormCard>
      <SectionHeader
        step="٢"
        title="مصطلحات اللهجة"
        badge={<SynonymCountBadge count={chips.length} />}
      />
      <Hint className="mb-4 mt-2">
        أضف الكلمات الدارجة التي قد يستخدمها الزبون لهذا اللون (نبيتي، عنابي،
        خمري…) ليفهمها المساعد الذكي ويوحّدها عند البحث. تُحفظ المصطلحات عند حفظ
        اللون.
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
            placeholder="أضف مصطلحًا… مثال: نبيتي"
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

      {/* Staged terms */}
      <div className="mt-[18px]">
        {chips.length === 0 ? (
          <p className="rounded-[12px] border border-dashed border-[#E2E4E9] bg-[#FAFAFB] px-3.5 py-4 text-center text-[13px] text-[#9197A0]">
            لا توجد مصطلحات بعد — أضف أوّل مصطلح لهذا اللون.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {chips.map((chip) =>
              editingKey === chip.key ? (
                <li
                  key={chip.key}
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
                          saveEdit(chip);
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
                      onClick={() => saveEdit(chip)}
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
                <ChipRow
                  key={chip.key}
                  chip={chip}
                  busy={busy}
                  onEdit={() => startEdit(chip)}
                  onRemove={() => onRemove(chip)}
                />
              ),
            )}
          </ul>
        )}
      </div>
    </FormCard>
  );
}

/** A single staged term, styled by its lifecycle: new (accent), persisted
 *  (neutral), saving (spinner), error (red + inline message). */
function ChipRow({
  chip,
  busy,
  onEdit,
  onRemove,
}: {
  chip: SynonymChip;
  busy: boolean;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const saving = chip.status === "saving";
  const failed = chip.status === "error";
  const isNew = chip.status === "new";

  return (
    <li>
      <div
        className={cn(
          "flex items-center justify-between gap-2 rounded-[12px] border px-3.5 py-2.5",
          failed
            ? "border-[#E3A6A6] bg-[#FBEDED]"
            : isNew
              ? "border-[#CBD6F5] bg-[#F7F9FE]"
              : "border-[#ECEDF1] bg-card",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium text-[#1B1D23]">
            {chip.term}
          </span>
          {isNew && (
            <span className="shrink-0 rounded-[5px] bg-[#EAF0FF] px-[6px] py-0.5 text-[10px] font-semibold text-primary">
              غير محفوظ
            </span>
          )}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {saving ? (
            <Loader2 className="size-4 animate-spin text-primary" />
          ) : (
            <>
              <RowIconButton label="تعديل" disabled={busy} onClick={onEdit}>
                <Pencil className="size-[14px]" />
              </RowIconButton>
              <RowIconButton
                label="حذف"
                tone="danger"
                disabled={busy}
                onClick={onRemove}
              >
                <Trash2 className="size-[14px]" />
              </RowIconButton>
            </>
          )}
        </div>
      </div>
      {failed && chip.error && (
        <div className="px-1 pt-1">
          <ErrorText>{chip.error}</ErrorText>
        </div>
      )}
    </li>
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
