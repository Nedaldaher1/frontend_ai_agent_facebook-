import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  useInvalidate,
  useList,
  useNavigation,
  useUpdate,
  type HttpError,
} from "@refinedev/core";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Palette,
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
  ColorsTable,
  ColorsTableSkeleton,
} from "@/components/colors/colors-table";
import { deleteColorById, fetchColorUsage } from "@/providers/colors-data";
import { useUnassignedUsage } from "@/hooks/use-unassigned-colors";
import type { Color, ColorSynonym, ColorUsage } from "@/types/color";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

/** Brand primary button — identical to the products / knowledge lists. */
const primaryBtnClass =
  "h-auto gap-2 rounded-[12px] px-[19px] py-[11px] text-sm font-semibold shadow-[0_6px_18px_-8px_#2B50D6] dark:shadow-none";

export const ColorList = () => {
  const { create, edit } = useNavigation();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Color | null>(null);
  const [usage, setUsage] = useState<ColorUsage | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<Color["id"] | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // The colors vocabulary is small — one generous page, filtered client-side.
  const { result, query } = useList<Color>({
    resource: "colors",
    dataProviderName: "colors",
    pagination: { currentPage: 1, pageSize: 500 },
  });
  const colors = useMemo(
    () => (Array.isArray(result?.data) ? result.data : []),
    [result],
  );
  const { isLoading, isError, refetch } = query;

  // The global dialect-term list → a per-color count (the list endpoint does not
  // include one). Reused as the source of truth for the synonyms badge.
  const { result: synonymsResult } = useList<ColorSynonym>({
    resource: "color-synonyms",
    dataProviderName: "colorSynonyms",
    pagination: { currentPage: 1, pageSize: 1000 },
  });
  const synonymCount = useMemo(() => {
    const rows = Array.isArray(synonymsResult?.data) ? synonymsResult.data : [];
    const map = new Map<string, number>();
    for (const s of rows) map.set(s.colorId, (map.get(s.colorId) ?? 0) + 1);
    return (colorId: string) => map.get(colorId) ?? 0;
  }, [synonymsResult]);

  const hasActiveFilters = !!search || status !== "all";

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return colors.filter((c) => {
      if (status === "active" && !c.isActive) return false;
      if (status === "inactive" && c.isActive) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.family.toLowerCase().includes(q)
      );
    });
  }, [colors, search, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageColors = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  const { mutate: updateColor } = useUpdate();
  const invalidate = useInvalidate();
  const { refresh: refreshUnassigned } = useUnassignedUsage();
  const navigate = useNavigate();

  const resetPage = () => setCurrentPage(1);

  const handleToggle = (color: Color) => {
    setTogglingId(color.id);
    updateColor(
      {
        resource: "colors",
        dataProviderName: "colors",
        id: color.id,
        values: {
          name: color.name,
          family: color.family,
          hex: color.hex,
          isActive: !color.isActive,
        },
        successNotification: {
          type: "success",
          message: color.isActive ? "تم تعطيل اللون" : "تم تفعيل اللون",
        },
      },
      { onSettled: () => setTogglingId(null) },
    );
  };

  // Deleting always starts by fetching the impact report, so the dialog can warn
  // exactly how many products will be retagged to «غير معرف» (CLAUDE.md §6).
  const loadUsage = async (color: Color) => {
    setUsage(null);
    setUsageError(false);
    setUsageLoading(true);
    try {
      setUsage(await fetchColorUsage(color.id));
    } catch {
      setUsageError(true);
    } finally {
      setUsageLoading(false);
    }
  };

  const openDelete = (color: Color) => {
    setDeleteTarget(color);
    void loadUsage(color);
  };

  const closeDelete = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setUsage(null);
    setUsageError(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !usage) return;
    setDeleting(true);
    try {
      const result = await deleteColorById(deleteTarget.id);
      // Refresh the table and the review queue/badge so the queue self-drains.
      invalidate({
        resource: "colors",
        dataProviderName: "colors",
        invalidates: ["list"],
      });
      void refreshUnassigned();

      if (usage.productCount > 0) {
        toast.success(
          `تم الحذف. ${result.reassignedImages} صورة في ${result.affectedProducts} منتج تحتاج مراجعة.`,
          {
            richColors: true,
            action: {
              label: "مراجعة",
              onClick: () => navigate("/colors/review"),
            },
          },
        );
      } else {
        toast.success("تم حذف اللون", { richColors: true });
      }

      setDeleteTarget(null);
      setUsage(null);
    } catch (error) {
      const status = (error as HttpError | undefined)?.statusCode;
      const message =
        status === 409
          ? "تعذّر الحذف بسبب تعديل متزامن، حاول مجددًا."
          : ((error as HttpError | undefined)?.message ?? "تعذّر حذف اللون");
      toast.error(message, { richColors: true });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-[26px] flex items-end justify-between gap-5">
        <div>
          <div className="mb-[7px] text-xs font-semibold text-ink-faint">
            نظام الألوان
          </div>
          <div className="flex items-center gap-3">
            <h1 className="m-0 text-[30px] font-semibold tracking-[-0.4px] text-ink">
              الألوان
            </h1>
            <span className="rounded-[20px] border border-neutral-line bg-card px-3 py-1 text-[13px] font-semibold text-neutral-fg">
              {colors.length} لون
            </span>
          </div>
          <p className="mt-[9px] max-w-[540px] text-[13.5px] leading-relaxed text-ink-muted">
            الألوان القياسية ومصطلحات اللهجة التي يوحّدها المساعد الذكي عند فهم
            طلب الزبون (نبيتي → أحمر) — راجِعها بدقّة فهي تؤثّر مباشرةً في ردوده.
          </p>
        </div>
        <Button className={primaryBtnClass} onClick={() => create("colors")}>
          <Plus className="size-[18px]" />
          إضافة لون
        </Button>
      </div>

      {/* Toolbar — hidden on the error state */}
      {!isError && (
        <div className="mb-[18px] flex flex-wrap items-center gap-[11px]">
          <div className="relative min-w-[160px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 start-[13px] size-4 -translate-y-1/2 text-ink-faint" />
            <Input
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                resetPage();
              }}
              placeholder="ابحث بالاسم أو المفتاح…"
              className="h-[42px] rounded-[12px] border-line-2 bg-card ps-10 text-sm"
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              resetPage();
            }}
          >
            <SelectTrigger className="h-[42px] min-w-[150px] rounded-[12px] border-line-2 bg-card text-[13.5px] font-medium text-ink-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="active">مفعّل</SelectItem>
              <SelectItem value="inactive">معطّل</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* States */}
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <ColorsTableSkeleton rows={6} />
      ) : pageColors.length === 0 ? (
        <EmptyState filtered={hasActiveFilters} onAdd={() => create("colors")} />
      ) : (
        <>
          <ColorsTable
            colors={pageColors}
            synonymCount={synonymCount}
            pendingId={togglingId}
            onEdit={(id) => edit("colors", id)}
            onToggle={handleToggle}
            onDelete={openDelete}
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

      {/* Delete confirmation — always preceded by the impact check */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && closeDelete()}
      >
        <AlertDialogContent className="max-w-[430px] rounded-[20px] p-[26px]">
          <div className="mb-4 flex size-[52px] items-center justify-center rounded-[15px] border border-danger-line bg-danger-bg text-danger-fg">
            {usageLoading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Trash2 className="size-5" />
            )}
          </div>

          {usageLoading ? (
            <>
              <AlertDialogTitle className="text-lg font-semibold text-ink">
                جارٍ التحقق من تأثير الحذف…
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[13.5px] leading-relaxed text-ink-muted">
                نتأكد من عدد المنتجات المرتبطة بهذا اللون قبل الحذف.
              </AlertDialogDescription>
            </>
          ) : usageError ? (
            <>
              <AlertDialogTitle className="text-lg font-semibold text-ink">
                تعذّر جلب تأثير الحذف
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[13.5px] leading-relaxed text-ink-muted">
                حدث خطأ أثناء التحقق من المنتجات المرتبطة. حاول مرّة أخرى.
              </AlertDialogDescription>
              <AlertDialogFooter className="mt-[22px] gap-2.5 sm:justify-stretch">
                <Button
                  variant="outline"
                  className="h-auto flex-1 rounded-[12px] py-[11px] font-semibold"
                  onClick={() => deleteTarget && loadUsage(deleteTarget)}
                >
                  <RotateCw className="size-4" />
                  إعادة المحاولة
                </Button>
                <AlertDialogCancel className="m-0 h-auto flex-1 rounded-[12px] py-[11px] font-semibold">
                  تراجع
                </AlertDialogCancel>
              </AlertDialogFooter>
            </>
          ) : usage && usage.productCount > 0 ? (
            <>
              <AlertDialogTitle className="text-lg font-semibold text-ink">
                {usage.productCount} منتج يستخدم هذا اللون
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[13.5px] leading-relaxed text-ink-muted">
                عند الحذف ستتحوّل صور هذه المنتجات إلى «غير معرف» وستحتاج مراجعة
                يدوية لتعيين لون جديد.
              </AlertDialogDescription>
              <div className="mt-3 max-h-[168px] overflow-y-auto rounded-[12px] border border-line bg-surface-1 p-1.5">
                <ul className="flex flex-col">
                  {usage.products.map((p) => (
                    <li
                      key={p.id}
                      className="truncate rounded-[8px] px-2.5 py-[7px] text-[13px] font-medium text-ink-2"
                    >
                      {p.name}
                    </li>
                  ))}
                  {usage.hasMore &&
                    usage.productCount - usage.products.length > 0 && (
                      <li className="px-2.5 py-[7px] text-[12.5px] font-semibold text-ink-muted">
                        و+{usage.productCount - usage.products.length} غيرها
                      </li>
                    )}
                </ul>
              </div>
              <AlertDialogFooter className="mt-[22px] gap-2.5 sm:justify-stretch">
                <Button
                  variant="destructive"
                  disabled={deleting}
                  className="h-auto flex-1 rounded-[12px] py-[11px] font-semibold"
                  onClick={handleConfirmDelete}
                >
                  {deleting && <Loader2 className="size-4 animate-spin" />}
                  حذف وتحويل إلى غير معرف
                </Button>
                <AlertDialogCancel
                  disabled={deleting}
                  className="m-0 h-auto flex-1 rounded-[12px] py-[11px] font-semibold"
                >
                  تراجع
                </AlertDialogCancel>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogTitle className="text-lg font-semibold text-ink">
                حذف اللون؟
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[13.5px] leading-relaxed text-ink-muted">
                سيتم حذف «
                <span className="font-semibold text-ink-2">
                  {deleteTarget?.name}
                </span>
                » <span className="font-semibold">ومصطلحاته</span> نهائياً. لا
                يمكن التراجع.
              </AlertDialogDescription>
              <AlertDialogFooter className="mt-[22px] gap-2.5 sm:justify-stretch">
                <Button
                  variant="destructive"
                  disabled={deleting}
                  className="h-auto flex-1 rounded-[12px] py-[11px] font-semibold"
                  onClick={handleConfirmDelete}
                >
                  {deleting && <Loader2 className="size-4 animate-spin" />}
                  نعم، احذف
                </Button>
                <AlertDialogCancel
                  disabled={deleting}
                  className="m-0 h-auto flex-1 rounded-[12px] py-[11px] font-semibold"
                >
                  تراجع
                </AlertDialogCancel>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function EmptyState({
  filtered,
  onAdd,
}: {
  filtered: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="rounded-[18px] border border-line bg-card px-[30px] py-[74px] text-center shadow-[0_1px_2px_rgba(16,18,22,.04)]">
      <div
        className="mx-auto mb-[22px] flex size-[88px] items-center justify-center rounded-[24px] border border-accent-line text-primary"
        style={{ background: "linear-gradient(155deg,var(--accent-soft),var(--card))" }}
      >
        <Palette className="size-9" />
      </div>
      <h2 className="mb-2 text-[21px] font-semibold text-ink">
        {filtered ? "لا توجد نتائج مطابقة" : "لا توجد ألوان بعد"}
      </h2>
      <p className="mx-auto mb-6 max-w-[400px] text-sm leading-[1.7] text-ink-muted">
        {filtered
          ? "جرّب تعديل كلمات البحث أو إزالة عامل التصفية."
          : "أضِف الألوان القياسية (أحمر، أسود، بيج…) ثم اربط بكلٍّ منها مصطلحات اللهجة ليفهمها المساعد الذكي."}
      </p>
      {!filtered && (
        <Button className={cn(primaryBtnClass, "mx-auto")} onClick={onAdd}>
          <Plus className="size-[18px]" />
          إضافة لون
        </Button>
      )}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-[18px] border border-danger-line bg-card px-[30px] py-[60px] text-center shadow-[0_1px_2px_rgba(16,18,22,.04)]">
      <div className="mx-auto mb-5 flex size-[78px] items-center justify-center rounded-[22px] border border-danger-line bg-danger-bg text-danger-fg">
        <TriangleAlert className="size-8" />
      </div>
      <h2 className="mb-2 text-xl font-semibold text-ink">
        تعذّر تحميل الألوان
      </h2>
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
          {/* "Previous" points to the start of the line — in RTL that is the right. */}
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
