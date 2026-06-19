/**
 * Orders list — a status-filterable, paginated table of orders.
 *
 * Only `status` is filterable server-side (the admin list accepts `?status=`),
 * surfaced here as filter chips. Draft orders need staff action, so their count is
 * fetched separately (a tiny `status=draft` query) and surfaced both as a chip
 * badge and a banner that jumps straight to the draft view.
 */

import { useMemo, useState } from "react";
import { useList, useNavigation, type CrudFilters } from "@refinedev/core";
import {
  ChevronLeft,
  ChevronRight,
  Inbox,
  RotateCw,
  ShoppingBag,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  OrdersTable,
  OrdersTableSkeleton,
} from "@/components/orders/orders-table";
import type { OrderDto, OrderStatus } from "@/types/order";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

type StatusTab = { value: OrderStatus | "all"; label: string };

const STATUS_TABS: StatusTab[] = [
  { value: "all", label: "الكل" },
  { value: "draft", label: "مسودّة" },
  { value: "confirmed", label: "مؤكّد" },
  { value: "fulfilled", label: "مكتمل" },
  { value: "canceled", label: "ملغى" },
];

export const OrderList = () => {
  const { show } = useNavigation();
  const [status, setStatus] = useState<StatusTab["value"]>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filters = useMemo<CrudFilters>(
    () =>
      status !== "all"
        ? [{ field: "status", operator: "eq", value: status }]
        : [],
    [status],
  );

  const { result, query } = useList<OrderDto>({
    resource: "orders",
    dataProviderName: "orders",
    pagination: { currentPage, pageSize: PAGE_SIZE },
    filters,
  });

  // Draft count for the "needs action" badge + banner (cheap, cached by Refine).
  const { result: draftResult } = useList<OrderDto>({
    resource: "orders",
    dataProviderName: "orders",
    pagination: { currentPage: 1, pageSize: 1 },
    filters: [{ field: "status", operator: "eq", value: "draft" }],
  });
  const draftCount = draftResult?.total ?? 0;

  const orders = Array.isArray(result?.data) ? result.data : [];
  const total = result?.total ?? 0;
  const { isLoading, isError, refetch } = query;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const selectStatus = (value: StatusTab["value"]) => {
    setStatus(value);
    setCurrentPage(1);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-[26px] flex items-end justify-between gap-5">
        <div>
          <div className="mb-[7px] text-xs font-semibold text-ink-faint">
            المبيعات
          </div>
          <div className="flex items-center gap-3">
            <h1 className="m-0 text-[30px] font-semibold tracking-[-0.4px] text-ink">
              الطلبات
            </h1>
            <span className="rounded-[20px] border border-neutral-line bg-card px-3 py-1 text-[13px] font-semibold text-neutral-fg">
              {total} طلب
            </span>
          </div>
          <p className="mt-[9px] max-w-[520px] text-[13.5px] leading-relaxed text-ink-muted">
            طلبات الزبائن الواردة من المحادثات — راجع المسودّات وأكّدها، وتابع
            حالتها حتى الاكتمال.
          </p>
        </div>
        <Button
          variant="outline"
          className="h-auto gap-2 rounded-[12px] px-4 py-[11px] font-semibold"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RotateCw className={cn("size-4", isLoading && "animate-spin")} />
          تحديث
        </Button>
      </div>

      {/* Draft surfacing banner */}
      {draftCount > 0 && status !== "draft" && (
        <button
          type="button"
          onClick={() => selectStatus("draft")}
          className="mb-[18px] flex w-full items-center gap-3 rounded-[14px] border border-warn-line bg-warn-bg px-4 py-3 text-start transition-colors hover:brightness-[0.99]"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-card text-warn-fg">
            <ShoppingBag className="size-[18px]" />
          </span>
          <span className="text-[13.5px] font-medium text-warn-fg">
            لديك {draftCount} طلب بحالة «مسودّة» بحاجة إلى مراجعة — اضغط للعرض.
          </span>
          <ChevronLeft className="ms-auto size-4 text-warn-fg" />
        </button>
      )}

      {/* Status filter chips */}
      {!isError && (
        <div className="mb-[18px] flex flex-wrap items-center gap-2">
          {STATUS_TABS.map((tab) => {
            const active = status === tab.value;
            const showBadge = tab.value === "draft" && draftCount > 0;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => selectStatus(tab.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[12px] border px-[14px] py-[8px] text-[13px] font-semibold transition-colors",
                  active
                    ? "border-accent-line bg-accent-soft text-primary"
                    : "border-line-2 bg-card text-ink-2 hover:bg-surface-hover",
                )}
              >
                {tab.label}
                {showBadge && (
                  <span
                    className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-warn-bg px-1.5 text-[11px] font-bold text-warn-fg"
                    style={{ fontFeatureSettings: "'tnum'" }}
                  >
                    {draftCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* States */}
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <OrdersTableSkeleton rows={6} />
      ) : orders.length === 0 ? (
        <EmptyState filtered={status !== "all"} />
      ) : (
        <>
          <OrdersTable
            orders={orders}
            onView={(id) => show("orders", id)}
          />
          {pageCount > 1 && (
            <Pagination
              currentPage={currentPage}
              pageCount={pageCount}
              onChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  );
};

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="rounded-[18px] border border-line bg-card px-[30px] py-[74px] text-center shadow-[0_1px_2px_rgba(16,18,22,.04)]">
      <div
        className="mx-auto mb-[22px] flex size-[88px] items-center justify-center rounded-[24px] border border-accent-line text-primary"
        style={{
          background:
            "linear-gradient(155deg,var(--accent-soft),var(--card))",
        }}
      >
        <Inbox className="size-9" />
      </div>
      <h2 className="mb-2 text-[21px] font-semibold text-ink">
        {filtered ? "لا توجد طلبات بهذه الحالة" : "لا توجد طلبات بعد"}
      </h2>
      <p className="mx-auto max-w-[380px] text-sm leading-[1.7] text-ink-muted">
        {filtered
          ? "جرّب اختيار حالة أخرى من عوامل التصفية بالأعلى."
          : "ستظهر هنا طلبات الزبائن الواردة من المحادثات فور إنشائها."}
      </p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-[18px] border border-danger-line bg-card px-[30px] py-[60px] text-center shadow-[0_1px_2px_rgba(16,18,22,.04)]">
      <div className="mx-auto mb-5 flex size-[78px] items-center justify-center rounded-[22px] border border-danger-line bg-danger-bg text-danger-fg">
        <TriangleAlert className="size-8" />
      </div>
      <h2 className="mb-2 text-xl font-semibold text-ink">تعذّر تحميل الطلبات</h2>
      <p className="mx-auto mb-6 max-w-[380px] text-sm leading-[1.7] text-ink-muted">
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

function Pagination({
  currentPage,
  pageCount,
  onChange,
}: {
  currentPage: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-[13px] text-ink-muted">
      <span>
        صفحة {currentPage} من {pageCount}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1 rounded-[10px]"
          disabled={currentPage <= 1}
          onClick={() => onChange(currentPage - 1)}
        >
          <ChevronRight className="size-4" />
          السابق
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 rounded-[10px]"
          disabled={currentPage >= pageCount}
          onClick={() => onChange(currentPage + 1)}
        >
          التالي
          <ChevronLeft className="size-4" />
        </Button>
      </div>
    </div>
  );
}
