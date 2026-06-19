/**
 * "تحتاج مراجعة" — the review queue for products whose images were retagged to the
 * unassigned sentinel (after a color was deleted). Data comes from
 * GET /admin/colors/unassigned/usage via the shared {@link useUnassignedUsage}
 * query, so this page and the sidebar badge stay in sync.
 *
 * The queue is self-draining: fixing a product (assigning a real color on its
 * image editor) drops it out on the next fetch. When the report is capped
 * (`hasMore`), we show a note rather than building manual pagination — the rest
 * surfaces as items ahead of it are processed.
 */

import { useEffect } from "react";
import { Link } from "react-router";
import {
  ChevronLeft,
  CircleCheck,
  PackageSearch,
  RotateCw,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUnassignedUsage } from "@/hooks/use-unassigned-colors";
import { cn } from "@/lib/utils";

const cardClass =
  "overflow-hidden rounded-[18px] border border-[#ECEDF1] bg-card shadow-[0_1px_2px_rgba(16,18,22,.04),0_14px_38px_-28px_rgba(16,18,22,.28)]";

export const ColorReview = () => {
  const { data: usage, isLoading, isError, refetch, isFetching } =
    useUnassignedUsage();

  // Returning to the queue should reflect any fixes made elsewhere.
  useEffect(() => {
    void refetch();
  }, [refetch]);

  const count = usage?.productCount ?? 0;
  const products = usage?.products ?? [];
  const extra = usage ? usage.productCount - usage.products.length : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-[26px] flex items-end justify-between gap-5">
        <div>
          <div className="mb-[7px] text-xs font-semibold text-[#9AA0A9]">
            نظام الألوان
          </div>
          <div className="flex items-center gap-3">
            <h1 className="m-0 text-[30px] font-semibold tracking-[-0.4px] text-[#14161B]">
              تحتاج مراجعة
            </h1>
            {count > 0 && (
              <span className="rounded-[20px] border border-[#F4D9A6] bg-[#FBF1DD] px-3 py-1 text-[13px] font-semibold text-[#9A6B12]">
                {count} منتج
              </span>
            )}
          </div>
          <p className="mt-[9px] max-w-[560px] text-[13.5px] leading-relaxed text-[#7A7F88]">
            منتجات تحتوي صورها على لون «غير معرف» بعد حذف لون قياسي — افتح كلّ منتج
            وعيّن لوناً صحيحاً لصوره. تختفي المنتجات من هنا تلقائياً بعد تصحيحها.
          </p>
        </div>
        <Button
          variant="outline"
          className="h-auto gap-2 rounded-[12px] px-4 py-[11px] font-semibold"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RotateCw className={cn("size-4", isFetching && "animate-spin")} />
          تحديث
        </Button>
      </div>

      {/* States */}
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <ListSkeleton rows={5} />
      ) : count === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className={cardClass}>
            <ul role="list">
              {products.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 border-b border-[#F1F2F4] px-[22px] py-3.5 last:border-b-0 transition-colors hover:bg-[#FBFBFC]"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="size-2 shrink-0 rounded-full bg-[#E2A33A]"
                      aria-hidden
                    />
                    <span className="truncate text-sm font-semibold text-[#1B1D23]">
                      {p.name}
                    </span>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    className="h-auto shrink-0 gap-1.5 rounded-[10px] px-3 py-[7px] text-xs font-semibold"
                  >
                    <Link to={`/products/edit/${p.id}`}>
                      تعيين لون
                      {/* "Go to" points to the end of the line; flip for RTL. */}
                      <ChevronLeft className="size-4 rtl:-scale-x-100" />
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
          {usage?.hasMore && extra > 0 && (
            <p className="mt-3 text-center text-[12.5px] text-[#7A7F88]">
              وعدد آخر سيظهر بعد المعالجة
            </p>
          )}
        </>
      )}
    </div>
  );
};

function EmptyState() {
  return (
    <div className="rounded-[18px] border border-[#ECEDF1] bg-card px-[30px] py-[74px] text-center shadow-[0_1px_2px_rgba(16,18,22,.04)]">
      <div
        className="mx-auto mb-[22px] flex size-[88px] items-center justify-center rounded-[24px] border border-[#CDEBD9] text-[#1B7A4E]"
        style={{ background: "linear-gradient(155deg,#EAF6EF,#fff)" }}
      >
        <CircleCheck className="size-9" />
      </div>
      <h2 className="mb-2 text-[21px] font-semibold text-[#14161B]">
        لا توجد صور تحتاج مراجعة
      </h2>
      <p className="mx-auto max-w-[400px] text-sm leading-[1.7] text-[#7A7F88]">
        كل صور المنتجات معيّنة بألوان صحيحة. ستظهر هنا أي صور تتحوّل إلى «غير
        معرف» بعد حذف لون قياسي.
      </p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-[18px] border border-[#F2DCDC] bg-card px-[30px] py-[60px] text-center shadow-[0_1px_2px_rgba(16,18,22,.04)]">
      <div className="mx-auto mb-5 flex size-[78px] items-center justify-center rounded-[22px] border border-[#F2D6D6] bg-[#FBEDED] text-[#C0392B]">
        <TriangleAlert className="size-8" />
      </div>
      <h2 className="mb-2 text-xl font-semibold text-[#14161B]">
        تعذّر تحميل قائمة المراجعة
      </h2>
      <p className="mx-auto mb-6 max-w-[380px] text-sm leading-[1.7] text-[#7A7F88]">
        حدث خطأ أثناء الاتصال بالخادم. تحقّق من الاتصال وحاول مرّة أخرى.
      </p>
      <Button
        variant="outline"
        className="mx-auto h-auto gap-2 rounded-[12px] px-5 py-[11px] font-semibold"
        onClick={onRetry}
      >
        <RotateCw className="size-4" />
        إعادة المحاولة
      </Button>
    </div>
  );
}

function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className={cardClass}>
      <div className="flex items-center gap-[9px] border-b border-[#EEEFF2] bg-[#FAFAFB] px-[22px] py-[13px] text-xs text-[#9197A0]">
        <PackageSearch className="size-[14px] text-[#E2A33A]" />
        جارٍ تحميل قائمة المراجعة…
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 border-b border-[#F1F2F4] px-[22px] py-4 last:border-b-0"
        >
          <div className="h-[11px] w-[45%] animate-pulse rounded bg-[#EDEEF1]" />
          <div className="h-7 w-[88px] animate-pulse rounded-[10px] bg-[#EDEEF1]" />
        </div>
      ))}
    </div>
  );
}
