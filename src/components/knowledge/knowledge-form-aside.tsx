/**
 * The knowledge form's sticky aside. Mirrors the product form's aside (preview
 * card + publish card + actions) but its lead card explains *how the agent uses
 * the entry* — making the editor write `situation` and `priority` deliberately.
 * Everything is derived live from the current form values.
 */

import { ArrowUpNarrowWide, Eye, Info, ScanSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { brand } from "@/constants/theme";
import type { KnowledgeFormValues } from "@/types/knowledge";
import {
  CategoryBadge,
  GeneralBadge,
  ProductBadge,
} from "./knowledge-visuals";
import { PublishBadge } from "@/components/products/product-visuals";

type KnowledgeFormAsideProps = {
  values: KnowledgeFormValues;
  submitting?: boolean;
  onTogglePublish: (published: boolean) => void;
  onPublish: () => void;
  onSaveDraft: () => void;
  onCancel: () => void;
};

const primaryBtnClass =
  "h-auto w-full justify-center rounded-[12px] py-[11px] text-sm font-semibold shadow-[0_6px_18px_-8px_#2B50D6]";

export function KnowledgeFormAside({
  values,
  submitting,
  onTogglePublish,
  onPublish,
  onSaveDraft,
  onCancel,
}: KnowledgeFormAsideProps) {
  const published = values.published;

  return (
    <aside className="top-[30px] flex flex-col gap-4 lg:sticky">
      {/* How the agent sees it */}
      <div className="overflow-hidden rounded-[18px] border border-[#ECEDF1] bg-card shadow-[0_1px_2px_rgba(16,18,22,.04),0_12px_34px_-28px_rgba(16,18,22,.26)]">
        <div className="border-b border-[#F0F1F4] px-[18px] py-3.5 text-xs font-semibold text-[#9197A0]">
          كيف يراها المساعد الذكي
        </div>

        {/* Live preview */}
        <div className="flex flex-col gap-2.5 p-[18px]">
          <div className="text-[14.5px] font-semibold text-[#14161B]">
            {values.title || "عنوان المدخل"}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {values.category && <CategoryBadge category={values.category} />}
            <PublishBadge status={published ? "published" : "draft"} />
            {values.productId ? <ProductBadge /> : <GeneralBadge />}
          </div>
        </div>

        {/* Behaviour notes */}
        <div className="border-t border-[#F0F1F4] px-[18px] py-4">
          <Note icon={<Eye className="size-3.5" />}>
            لا يرى المساعد إلا المداخل <strong>المنشورة</strong>.
          </Note>
          <Note icon={<ScanSearch className="size-3.5" />}>
            يطابق سؤال الزبون مع <strong>العنوان والسؤال والمحتوى</strong> معاً.
          </Note>
          <Note icon={<ArrowUpNarrowWide className="size-3.5" />}>
            يعرض الأعلى <strong>أولويةً</strong> أولاً، ويقدّم معرفة المنتج على
            العامة.
          </Note>
        </div>
      </div>

      {/* Publish */}
      <div className="rounded-[18px] border border-[#ECEDF1] bg-card p-[22px] shadow-[0_1px_2px_rgba(16,18,22,.04),0_12px_34px_-28px_rgba(16,18,22,.26)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[#14161B]">حالة النشر</div>
            <div
              className="mt-[3px] text-xs font-medium"
              style={{ color: published ? brand.accentDark : "#9197A0" }}
            >
              {published ? "مرئي للمساعد" : "مخفي — مسودّة"}
            </div>
          </div>
          <Switch
            checked={published}
            onCheckedChange={onTogglePublish}
            aria-label="تبديل حالة النشر"
          />
        </div>
        <div className="mt-3.5 flex items-start gap-[9px] rounded-[11px] border border-[#EDEEF1] bg-[#F7F8FA] px-3 py-[11px]">
          <Info className="mt-px size-3.5 shrink-0 text-[#9197A0]" />
          <p className="m-0 text-xs leading-relaxed text-[#7A7F88]">
            المداخل المنشورة فقط يستخدمها المساعد الذكي في إجاباته. المسودّات تبقى
            مخفية.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-[9px]">
        <Button
          className={primaryBtnClass}
          onClick={onPublish}
          disabled={submitting}
        >
          نشر المدخل
        </Button>
        <Button
          variant="outline"
          className="h-auto w-full justify-center rounded-[12px] py-[11px] text-sm font-semibold"
          onClick={onSaveDraft}
          disabled={submitting}
        >
          حفظ كمسودّة
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-2 text-[13.5px] font-medium text-[#8A8F98] transition-colors hover:text-[#C0392B]"
        >
          إلغاء
        </button>
      </div>
    </aside>
  );
}

function Note({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 py-1.5 text-[12.5px] leading-relaxed text-[#7A7F88]">
      <span className="mt-px shrink-0 text-primary">{icon}</span>
      <p className="m-0">{children}</p>
    </div>
  );
}
