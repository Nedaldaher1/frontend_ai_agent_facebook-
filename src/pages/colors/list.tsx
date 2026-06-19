import { useEffect, useMemo, useState } from "react";
import {
  useDelete,
  useList,
  useNavigation,
  useUpdate,
  type HttpError,
} from "@refinedev/core";
import {
  ChevronLeft,
  ChevronRight,
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
import type { Color, ColorSynonym } from "@/types/color";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

/** Brand primary button — identical to the products / knowledge lists. */
const primaryBtnClass =
  "h-auto gap-2 rounded-[12px] px-[19px] py-[11px] text-sm font-semibold shadow-[0_6px_18px_-8px_#2B50D6]";

export const ColorList = () => {
  const { create, edit } = useNavigation();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Color | null>(null);
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
  const { mutate: deleteColor } = useDelete();

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

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteColor(
      {
        resource: "colors",
        dataProviderName: "colors",
        id: deleteTarget.id,
        successNotification: { type: "success", message: "تم حذف اللون" },
        // A 409 means the color is still attached to product images
        // (ON DELETE RESTRICT) — guide the user to deactivate instead.
        errorNotification: (error) => {
          const status = (error as HttpError | undefined)?.statusCode;
          if (status === 409) {
            return {
              type: "error",
              message:
                "لا يمكن حذف لون مرتبط بصور منتجات. أزِل اللون من الصور أولاً، أو عطّله بدل حذفه.",
            };
          }
          return {
            type: "error",
            message:
              (error as HttpError | undefined)?.message ?? "تعذّر حذف اللون",
          };
        },
      },
      {
        onSuccess: () => setDeleteTarget(null),
        onError: () => setDeleteTarget(null),
      },
    );
  };

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
              الألوان
            </h1>
            <span className="rounded-[20px] border border-[#E6E8EC] bg-card px-3 py-1 text-[13px] font-semibold text-[#6B7079]">
              {colors.length} لون
            </span>
          </div>
          <p className="mt-[9px] max-w-[540px] text-[13.5px] leading-relaxed text-[#7A7F88]">
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
            <Search className="pointer-events-none absolute top-1/2 start-[13px] size-4 -translate-y-1/2 text-[#A2A7AF]" />
            <Input
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                resetPage();
              }}
              placeholder="ابحث بالاسم أو المفتاح…"
              className="h-[42px] rounded-[12px] border-[#E2E4E9] bg-card ps-10 text-sm"
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              resetPage();
            }}
          >
            <SelectTrigger className="h-[42px] min-w-[150px] rounded-[12px] border-[#E2E4E9] bg-card text-[13.5px] font-medium text-[#3A3E47]">
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
            onDelete={(c) => setDeleteTarget(c)}
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
        <AlertDialogContent className="max-w-[400px] rounded-[20px] p-[26px]">
          <div className="mb-4 flex size-[52px] items-center justify-center rounded-[15px] border border-[#F2D6D6] bg-[#FBEDED] text-[#C0392B]">
            <Trash2 className="size-5" />
          </div>
          <AlertDialogTitle className="text-lg font-semibold text-[#14161B]">
            حذف اللون؟
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[13.5px] leading-relaxed text-[#7A7F88]">
            سيتم حذف «
            <span className="font-semibold text-[#4A4E57]">
              {deleteTarget?.name}
            </span>
            » <span className="font-semibold">ومصطلحاته</span> نهائياً. لا يمكن
            التراجع. إن كان اللون مستخدماً في صور منتجات فلن يُحذف — عطّله بدلاً من
            ذلك.
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
        <Palette className="size-9" />
      </div>
      <h2 className="mb-2 text-[21px] font-semibold text-[#14161B]">
        {filtered ? "لا توجد نتائج مطابقة" : "لا توجد ألوان بعد"}
      </h2>
      <p className="mx-auto mb-6 max-w-[400px] text-sm leading-[1.7] text-[#7A7F88]">
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
    <div className="rounded-[18px] border border-[#F2DCDC] bg-card px-[30px] py-[60px] text-center shadow-[0_1px_2px_rgba(16,18,22,.04)]">
      <div className="mx-auto mb-5 flex size-[78px] items-center justify-center rounded-[22px] border border-[#F2D6D6] bg-[#FBEDED] text-[#C0392B]">
        <TriangleAlert className="size-8" />
      </div>
      <h2 className="mb-2 text-xl font-semibold text-[#14161B]">
        تعذّر تحميل الألوان
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
