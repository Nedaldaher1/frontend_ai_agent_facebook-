import { useEffect, useMemo, useState } from "react";
import {
  useDelete,
  useList,
  useNavigation,
  useUpdate,
  type CrudFilters,
} from "@refinedev/core";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
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
  KnowledgeTable,
  KnowledgeTableSkeleton,
} from "@/components/knowledge/knowledge-table";
import { KNOWLEDGE_CATEGORIES, PUBLISH_STATUSES } from "@/constants/enums";
import type { KnowledgeEntry } from "@/types/knowledge";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

/** Brand primary button — identical to the products list (shared design). */
const primaryBtnClass =
  "h-auto gap-2 rounded-[12px] px-[19px] py-[11px] text-sm font-semibold shadow-[0_6px_18px_-8px_#2B50D6]";

export const KnowledgeList = () => {
  const { create, edit } = useNavigation();

  // Toolbar state. `searchInput` is debounced into `search`.
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [productId, setProductId] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeEntry | null>(null);
  const [togglingId, setTogglingId] = useState<KnowledgeEntry["id"] | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // The catalog, used to resolve linked-product names and to populate the
  // product filter. Small catalog → one generous page is plenty.
  const { result: productsResult } = useList<Product>({
    resource: "products",
    dataProviderName: "default",
    pagination: { currentPage: 1, pageSize: 200 },
  });
  const products = Array.isArray(productsResult?.data) ? productsResult.data : [];
  const productNameById = useMemo(() => {
    const map = new Map(products.map((p) => [p.id, p.name]));
    return (id: string) => map.get(id);
  }, [products]);

  const hasActiveFilters =
    !!search ||
    category !== "all" ||
    status !== "all" ||
    productId !== "all";

  // Category, publish status and product filter server-side (the list query
  // exposes them); free-text search narrows the loaded page client-side, since
  // the controller does not expose search yet.
  const filters = useMemo<CrudFilters>(() => {
    const f: CrudFilters = [];
    if (category !== "all")
      f.push({ field: "category", operator: "eq", value: category });
    if (status !== "all")
      f.push({ field: "status", operator: "eq", value: status });
    if (productId !== "all")
      f.push({ field: "productId", operator: "eq", value: productId });
    return f;
  }, [category, status, productId]);

  const { result, query } = useList<KnowledgeEntry>({
    resource: "knowledge",
    dataProviderName: "knowledge",
    pagination: { currentPage, pageSize: PAGE_SIZE },
    filters,
  });

  const entries = Array.isArray(result?.data) ? result.data : [];
  const total = result?.total ?? 0;
  const { isLoading, isError, refetch } = query;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filteredEntries = useMemo(() => {
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.situation.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q),
    );
  }, [entries, search]);

  const { mutate: updateEntry } = useUpdate();
  const { mutate: deleteEntry } = useDelete();

  const resetPage = () => setCurrentPage(1);

  const handleToggle = (entry: KnowledgeEntry) => {
    const next = entry.status === "published" ? "draft" : "published";
    setTogglingId(entry.id);
    updateEntry(
      {
        resource: "knowledge",
        dataProviderName: "knowledge",
        id: entry.id,
        values: { status: next },
        successNotification: {
          type: "success",
          message:
            next === "published" ? "تم نشر المدخل" : "أصبح المدخل مسودّة",
        },
      },
      { onSettled: () => setTogglingId(null) },
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteEntry(
      {
        resource: "knowledge",
        dataProviderName: "knowledge",
        id: deleteTarget.id,
        successNotification: { type: "success", message: "تم حذف المدخل" },
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
            المساعد الذكي
          </div>
          <div className="flex items-center gap-3">
            <h1 className="m-0 text-[30px] font-semibold tracking-[-0.4px] text-[#14161B]">
              قاعدة المعرفة
            </h1>
            <span className="rounded-[20px] border border-[#E6E8EC] bg-card px-3 py-1 text-[13px] font-semibold text-[#6B7079]">
              {total} مدخل
            </span>
          </div>
          <p className="mt-[9px] max-w-[520px] text-[13.5px] leading-relaxed text-[#7A7F88]">
            يستند المساعد الذكي إلى هذه المداخل للإجابة عن أسئلة الزبائن — راجع
            المحتوى وانشر الجاهز فقط.
          </p>
        </div>
        <Button className={primaryBtnClass} onClick={() => create("knowledge")}>
          <Plus className="size-[18px]" />
          إضافة مدخل
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
              placeholder="ابحث في العناوين والأسئلة…"
              className="h-[42px] rounded-[12px] border-[#E2E4E9] bg-card ps-10 text-sm"
            />
          </div>
          <FilterSelect
            value={category}
            onValueChange={(v) => {
              setCategory(v);
              resetPage();
            }}
            allLabel="كل الفئات"
            options={KNOWLEDGE_CATEGORIES.map((c) => ({
              value: c.value,
              label: c.label,
            }))}
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
          {products.length > 0 && (
            <FilterSelect
              value={productId}
              onValueChange={(v) => {
                setProductId(v);
                resetPage();
              }}
              allLabel="كل المنتجات"
              options={products.map((p) => ({ value: p.id, label: p.name }))}
            />
          )}
        </div>
      )}

      {/* States */}
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <KnowledgeTableSkeleton rows={6} />
      ) : filteredEntries.length === 0 ? (
        <EmptyState
          filtered={hasActiveFilters}
          onAdd={() => create("knowledge")}
        />
      ) : (
        <>
          <KnowledgeTable
            entries={filteredEntries}
            productNameById={productNameById}
            pendingId={togglingId}
            onEdit={(id) => edit("knowledge", id)}
            onToggle={handleToggle}
            onDelete={(e) => setDeleteTarget(e)}
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
            حذف المدخل؟
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[13.5px] leading-relaxed text-[#7A7F88]">
            سيتم حذف «
            <span className="font-semibold text-[#4A4E57]">
              {deleteTarget?.title}
            </span>
            » نهائياً ولن يستخدمه المساعد الذكي. لا يمكن التراجع.
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
      <SelectTrigger className="h-[42px] min-w-[150px] rounded-[12px] border-[#E2E4E9] bg-card text-[13.5px] font-medium text-[#3A3E47]">
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
        className="mx-auto mb-[22px] flex size-[88px] items-center justify-center rounded-[24px] border border-[#E3E8F8] text-primary"
        style={{ background: "linear-gradient(155deg,#EEF1FC,#fff)" }}
      >
        <BookOpen className="size-9" />
      </div>
      <h2 className="mb-2 text-[21px] font-semibold text-[#14161B]">
        {filtered ? "لا توجد نتائج مطابقة" : "أضف أوّل مدخل إلى قاعدة المعرفة"}
      </h2>
      <p className="mx-auto mb-6 max-w-[400px] text-sm leading-[1.7] text-[#7A7F88]">
        {filtered
          ? "جرّب تعديل كلمات البحث أو إزالة بعض عوامل التصفية."
          : "ابدأ بإضافة الأسئلة الشائعة والسياسات وتفاصيل الشحن والإرجاع لتغذية المساعد الذكي بإجابات دقيقة وموحّدة."}
      </p>
      {!filtered && (
        <Button className={cn(primaryBtnClass, "mx-auto")} onClick={onAdd}>
          <Plus className="size-[18px]" />
          إضافة مدخل
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
        تعذّر تحميل قاعدة المعرفة
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
}
