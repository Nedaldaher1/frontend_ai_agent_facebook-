import { useEffect, useMemo, useState } from "react";
import {
  useDelete,
  useList,
  useNavigation,
  useUpdate,
  type CrudFilters,
} from "@refinedev/core";
import {
  ChevronLeft,
  ChevronRight,
  Diamond,
  Plus,
  RotateCw,
  Search,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ProductsTable,
  ProductsTableSkeleton,
} from "@/components/products/products-table";
import { COLORS, PUBLISH_STATUSES, STOCK_STATUSES } from "@/constants/enums";
import type { ColorValue, Product } from "@/types/product";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

/** Brand primary button (accent fill + soft colored shadow), shared by the
 *  header and the empty state — mirrors `ui.primaryBtn` from the prototype. */
const primaryBtnClass =
  "h-auto gap-2 rounded-[12px] px-[19px] py-[11px] text-sm font-semibold shadow-[0_6px_18px_-8px_#2B50D6]";

export const ProductList = () => {
  const { create, edit } = useNavigation();

  // Toolbar state. `searchInput` is debounced into `search` so we don't refetch
  // on every keystroke.
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [color, setColor] = useState("all");
  const [status, setStatus] = useState("all");
  const [stock, setStock] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [togglingId, setTogglingId] = useState<Product["id"] | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const hasActiveFilters =
    !!search || color !== "all" || status !== "all" || stock !== "all";

  // Only publish status is filterable server-side (the admin list accepts
  // `published` only); color/stock/search narrow the loaded page client-side.
  const filters = useMemo<CrudFilters>(
    () =>
      status !== "all"
        ? [{ field: "status", operator: "eq", value: status }]
        : [],
    [status],
  );

  const { result, query } = useList<Product>({
    resource: "products",
    pagination: { currentPage, pageSize: PAGE_SIZE },
    filters,
    sorters: [{ field: "createdAt", order: "desc" }],
  });

  // Guard against a malformed payload (e.g. an error body) so the table never
  // tries to map over a non-array.
  const products = Array.isArray(result?.data) ? result.data : [];
  const total = result?.total ?? 0;
  const { isLoading, isError, refetch } = query;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Client-side narrowing of the loaded page (no server text/color/stock filter).
  const filteredProducts = useMemo(
    () =>
      products.filter((p) => {
        if (search && !p.name.toLowerCase().includes(search.toLowerCase()))
          return false;
        if (color !== "all" && !(p.colors ?? []).includes(color as ColorValue))
          return false;
        if (stock !== "all" && p.stock !== stock) return false;
        return true;
      }),
    [products, search, color, stock],
  );

  const { mutate: updateProduct } = useUpdate();
  const { mutate: deleteProduct } = useDelete();

  // Reset to the first page whenever the result set changes shape.
  const resetPage = () => setCurrentPage(1);

  const handleToggle = (product: Product) => {
    const next = product.status === "published" ? "draft" : "published";
    setTogglingId(product.id);
    updateProduct(
      {
        resource: "products",
        id: product.id,
        values: { status: next },
        successNotification: {
          type: "success",
          message:
            next === "published" ? "تم نشر المنتج" : "أصبح المنتج مسودّة",
        },
      },
      { onSettled: () => setTogglingId(null) },
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteProduct(
      {
        resource: "products",
        id: deleteTarget.id,
        successNotification: { type: "success", message: "تم حذف المنتج" },
      },
      { onSuccess: () => setDeleteTarget(null) },
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-[26px] flex items-end justify-between gap-5">
        <div>
          <div className="mb-[7px] text-xs font-semibold text-[#9AA0A9]">
            الكتالوج
          </div>
          <div className="flex items-center gap-3">
            <h1 className="m-0 text-[30px] font-semibold tracking-[-0.4px] text-[#14161B]">
              المنتجات
            </h1>
            <span className="rounded-[20px] border border-[#E6E8EC] bg-card px-3 py-1 text-[13px] font-semibold text-[#6B7079]">
              {total} منتج
            </span>
          </div>
          <p className="mt-[9px] max-w-[480px] text-[13.5px] leading-relaxed text-[#7A7F88]">
            يقرأ المساعد الذكي هذا الكتالوج مباشرةً — تأكّد من دقّة البيانات وانشر
            المنتجات الجاهزة فقط.
          </p>
        </div>
        <Button className={primaryBtnClass} onClick={() => create("products")}>
          <Plus className="size-[18px]" />
          إضافة منتج
        </Button>
      </div>

      {/* Toolbar — hidden on the error state */}
      {!isError && (
        <div className="mb-[18px] flex flex-wrap items-center gap-[11px]">
          <div className="relative min-w-[160px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 start-[13px] size-4 -translate-y-1/2 text-[#A2A7AF]" />
            <Input
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                resetPage();
              }}
              placeholder="ابحث باسم المنتج…"
              className="h-[42px] rounded-[12px] border-[#E2E4E9] bg-card ps-10 text-sm"
            />
          </div>
          <FilterSelect
            value={color}
            onValueChange={(v) => {
              setColor(v);
              resetPage();
            }}
            allLabel="كل الألوان"
            options={COLORS.map((c) => ({ value: c.value, label: c.label }))}
          />
          <FilterSelect
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              resetPage();
            }}
            allLabel="كل الحالات"
            options={PUBLISH_STATUSES.map((s) => ({
              value: s.value,
              label: s.label,
            }))}
          />
          <FilterSelect
            value={stock}
            onValueChange={(v) => {
              setStock(v);
              resetPage();
            }}
            allLabel="كل المخزون"
            options={STOCK_STATUSES.map((s) => ({
              value: s.value,
              label: s.label,
            }))}
          />
        </div>
      )}

      {/* States */}
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <ProductsTableSkeleton rows={PAGE_SIZE > 6 ? 6 : PAGE_SIZE} />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          filtered={hasActiveFilters}
          onAdd={() => create("products")}
        />
      ) : (
        <>
          <ProductsTable
            products={filteredProducts}
            pendingId={togglingId}
            onEdit={(id) => edit("products", id)}
            onToggle={handleToggle}
            onDelete={(p) => setDeleteTarget(p)}
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

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="max-w-[380px] rounded-[20px] p-[26px]">
          <div className="mb-4 flex size-[52px] items-center justify-center rounded-[15px] border border-[#F2D6D6] bg-[#FBEDED] text-[#C0392B]">
            <Trash2 className="size-5" />
          </div>
          <AlertDialogTitle className="text-lg font-semibold text-[#14161B]">
            حذف المنتج؟
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[13.5px] leading-relaxed text-[#7A7F88]">
            سيتم حذف «
            <span className="font-semibold text-[#4A4E57]">
              {deleteTarget?.name}
            </span>
            » نهائياً ولن يظهر للمساعد الذكي. لا يمكن التراجع.
          </AlertDialogDescription>
          <AlertDialogFooter className="mt-[22px] gap-2.5 sm:justify-stretch">
            <Button
              variant="destructive"
              className="h-auto flex-1 rounded-[12px] py-[11px] font-semibold"
              onClick={handleConfirmDelete}
            >
              نعم، احذف
            </Button>
            <AlertDialogCancel className="m-0 h-auto flex-1 rounded-[12px] py-[11px] font-semibold">
              تراجع
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

type FilterOption = { value: string; label: string };

function FilterSelect({
  value,
  onValueChange,
  allLabel,
  options,
}: {
  value: string;
  onValueChange: (value: string) => void;
  allLabel: string;
  options: FilterOption[];
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-[42px] min-w-[140px] rounded-[12px] border-[#E2E4E9] bg-card text-[13.5px] font-medium text-[#3A3E47]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function EmptyState({
  filtered,
  onAdd,
}: {
  filtered: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="rounded-[18px] border border-[#ECEDF1] bg-card px-[30px] py-[74px] text-center shadow-[0_1px_2px_rgba(16,18,22,.04)]">
      <div
        className="mx-auto mb-[22px] flex size-[88px] items-center justify-center rounded-[24px] border border-[#E3E8F8] text-[34px] text-primary"
        style={{ background: "linear-gradient(155deg,#EEF1FC,#fff)" }}
      >
        <Diamond className="size-9" />
      </div>
      <h2 className="mb-2 text-[21px] font-semibold text-[#14161B]">
        {filtered ? "لا توجد نتائج مطابقة" : "أضف أوّل منتج لكتالوجك"}
      </h2>
      <p className="mx-auto mb-6 max-w-[380px] text-sm leading-[1.7] text-[#7A7F88]">
        {filtered
          ? "جرّب تعديل كلمات البحث أو إزالة بعض عوامل التصفية."
          : "ابدأ برفع صور العباية ودع الذكاء الاصطناعي يقترح الخصائص — ثم راجعها وانشرها ليراها زبائنك."}
      </p>
      {!filtered && (
        <Button className={cn(primaryBtnClass, "mx-auto")} onClick={onAdd}>
          <Plus className="size-[18px]" />
          إضافة منتج
        </Button>
      )}
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
        تعذّر تحميل المنتجات
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
    <div className="mt-4 flex items-center justify-between gap-3 text-[13px] text-[#7A7F88]">
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
};
