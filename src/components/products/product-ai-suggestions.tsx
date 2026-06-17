/**
 * Section 2 — "اقتراحات الذكاء الاصطناعي". Shows the attributes Claude Vision
 * extracted from the images with a confidence score, lets a human correct each
 * one, and gates them behind an explicit "اعتمد الكل" (approve) action before
 * they fill the closed-enum selects in section 4 (CLAUDE.md §6).
 */

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { brand, tint } from "@/constants/theme";
import type { AiSuggestion } from "@/types/product";
import { Hint, SectionHeader } from "./product-form-ui";

type ProductAiSuggestionsProps = {
  suggestions: AiSuggestion[];
  approved: boolean;
  showConfidence?: boolean;
  onEdit: (index: number, value: string) => void;
  onApproveAll: () => void;
};

function confidenceColors(confidence: number) {
  if (confidence >= 0.85) return { fg: "#1B7A4E", bg: "#EAF6EF" };
  if (confidence >= 0.7) return { fg: "#9A6B12", bg: "#FBF4E6" };
  return { fg: "#B23B3B", bg: "#FBEDED" };
}

export function ProductAiSuggestions({
  suggestions,
  approved,
  showConfidence = true,
  onEdit,
  onApproveAll,
}: ProductAiSuggestionsProps) {
  return (
    <section
      className="rounded-[18px] p-[22px] shadow-[0_1px_2px_rgba(16,18,22,.04)]"
      style={{
        background: tint(brand.accent, 5),
        border: `1px solid ${tint(brand.accent, 26)}`,
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHeader
          step="٢"
          title="اقتراحات الذكاء الاصطناعي"
          badge={
            <span
              className="rounded-md px-2 py-0.5 text-[10.5px] font-semibold"
              style={{
                color: brand.accentDark,
                background: tint(brand.accent, 16),
                border: `1px solid ${tint(brand.accent, 34)}`,
              }}
            >
              مراجعة بشرية
            </span>
          }
        />
        <Button
          onClick={onApproveAll}
          className="h-auto gap-1.5 rounded-[10px] px-[15px] py-[9px] text-[13px] font-semibold"
        >
          <Check className="size-3.5" />
          اعتمد الكل
        </Button>
      </div>
      <Hint className="ms-[34px]">
        استخرجها Vision من الصور — راجعها وعدّلها قبل الاعتماد.
      </Hint>

      {approved && (
        <div className="mt-[13px] inline-flex items-center gap-1.5 rounded-[9px] border border-[#CDEBD9] bg-[#EAF6EF] px-3 py-[7px] text-[12.5px] font-semibold text-[#1B7A4E]">
          <Check className="size-3.5" />
          تم اعتماد كل الاقتراحات وتعبئتها في الحقول
        </div>
      )}

      <div className="mt-[15px] grid grid-cols-1 gap-[11px] sm:grid-cols-2">
        {suggestions.map((s, i) => {
          const pct = Math.round(s.confidence * 100);
          const c = confidenceColors(s.confidence);
          return (
            <div
              key={s.target}
              className="rounded-[12px] border border-[#E4E9F7] bg-card p-[11px_13px]"
            >
              <div className="mb-[7px] flex items-center justify-between">
                <span className="text-[11.5px] font-semibold text-[#7A7F88]">
                  {s.label}
                </span>
                {showConfidence && (
                  <span
                    className="rounded-md px-[7px] py-px text-[10.5px] font-semibold"
                    style={{ color: c.fg, background: c.bg }}
                  >
                    {pct}٪
                  </span>
                )}
              </div>
              <input
                value={s.value}
                onChange={(e) => onEdit(i, e.target.value)}
                aria-label={s.label}
                className="w-full rounded-lg border border-[#E2E4E9] bg-[#F8F9FB] px-2.5 py-2 text-[13.5px] font-semibold text-[#14161B] outline-none focus:border-primary focus:bg-card"
              />
              {showConfidence && (
                <div className="mt-[9px] h-[3px] overflow-hidden rounded-[3px] bg-[#EDEFF4]">
                  <div
                    className="h-full rounded-[3px]"
                    style={{ width: `${pct}%`, background: c.fg }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
