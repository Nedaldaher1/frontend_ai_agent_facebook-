/**
 * Section 1 — "صور المنتج وألوانه". Each image is one color variant of the
 * abaya: upload an image, tag it with a color, and the card reflects Vision's
 * per-image analysis state (and the Phase 2 embedding placeholder).
 *
 * The color dropdown is sourced live from the `colors` resource (the same
 * vocabulary managed on the Colors page) via `useSelect`, so a color added there
 * appears here with no code change. The selected value is the color id (UUID),
 * never the Arabic name — it round-trips through the image's `color` and feeds
 * the per-image color tagging on save (CLAUDE.md §6).
 */

import { useMemo, useRef } from "react";
import { Link } from "react-router";
import { useSelect } from "@refinedev/core";
import { Loader2, RotateCw, Star, TriangleAlert, Upload, X } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tint } from "@/constants/theme";
import type { Color } from "@/types/color";
import type { ProductImage } from "@/types/product";
import { colorDisplayName, isUnassignedColor } from "@/lib/colors";
import { useResolvedColors } from "@/hooks/use-resolved-colors";
import { cn } from "@/lib/utils";
import { ErrorText, FormCard, Hint, RequiredBadge, SectionHeader } from "./product-form-ui";

/** Neutral swatch when a color has no hex, or no color is selected yet. */
const NEUTRAL_HEX = "#C7CBD2";

/** Shared state of the live colors fetch, surfaced on every image's dropdown. */
type ColorsStatus = "loading" | "error" | "empty" | "ready";

type ProductImagesFieldProps = {
  images: ProductImage[];
  error?: boolean;
  onAdd: (file?: File) => void;
  onRemove: (id: ProductImage["id"]) => void;
  onSetMain: (id: ProductImage["id"]) => void;
  onSetColor: (id: ProductImage["id"], colorId: string) => void;
};

export function ProductImagesField({
  images,
  error,
  onAdd,
  onRemove,
  onSetMain,
  onSetColor,
}: ProductImagesFieldProps) {
  const fileInput = useRef<HTMLInputElement>(null);

  // Live color vocabulary from GET /admin/colors (the `colors` named provider).
  const { query } = useSelect<Color>({
    resource: "colors",
    dataProviderName: "colors",
    optionLabel: "name",
    optionValue: "id",
    sorters: [{ field: "name", order: "asc" }],
    pagination: { mode: "off" },
  });

  // The colors provider sorts client-side, so order the records here.
  const colors = useMemo<Color[]>(() => {
    const rows = query.data?.data ?? [];
    return [...rows].sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }, [query.data]);
  const colorsById = useMemo(
    () => new Map(colors.map((c) => [c.id, c] as const)),
    [colors],
  );

  // An image retagged to the deleted-color sentinel carries an id absent from
  // the assignable list (the list excludes system colors). Resolve those ids by
  // id so the dropdown can flag «غير معرف» on the affected image.
  const imageColorIds = useMemo(() => images.map((im) => im.color), [images]);
  const resolvedColors = useResolvedColors(imageColorIds, colorsById);

  const { isLoading, isError, refetch } = query;
  const status: ColorsStatus = isLoading
    ? "loading"
    : isError
      ? "error"
      : colors.length === 0
        ? "empty"
        : "ready";

  return (
    <FormCard>
      <SectionHeader step="١" title="صور المنتج وألوانه" badge={<RequiredBadge />} />
      <Hint>
        كل صورة تمثّل لوناً من ألوان العباية — ارفع صورة لكل لون وحدّد لونه من
        القائمة.
      </Hint>
      {error && <ErrorText>يجب رفع صورة واحدة على الأقل</ErrorText>}

      {status === "error" && (
        <div
          dir="rtl"
          className="mt-2 flex items-center justify-between gap-3 rounded-[11px] border border-[#F2DCDC] bg-[#FBEDED] px-3 py-2.5 text-xs font-medium text-[#C0392B]"
        >
          <span className="inline-flex items-center gap-1.5">
            <TriangleAlert className="size-3.5" />
            تعذّر تحميل الألوان
          </span>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1 rounded-[8px] border border-[#E7C3C3] bg-card px-2.5 py-1 font-semibold text-[#C0392B] transition-colors hover:bg-[#FBEDED]"
          >
            <RotateCw className="size-3" />
            إعادة المحاولة
          </button>
        </div>
      )}
      {status === "empty" && (
        <div
          dir="rtl"
          className="mt-2 rounded-[11px] border border-[#EDEEF1] bg-[#F7F8FA] px-3 py-2.5 text-xs leading-relaxed text-[#7A7F88]"
        >
          لا توجد ألوان بعد — أضِفها من{" "}
          <Link
            to="/colors"
            className="font-semibold text-primary underline-offset-2 hover:underline"
          >
            صفحة الألوان
          </Link>{" "}
          أولًا.
        </div>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={(e) => {
          onAdd(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <div className="mt-3.5 flex flex-wrap gap-[13px]">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="flex h-[230px] w-[120px] flex-col items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-dashed border-[#C6CCD6] bg-[#FAFBFC] text-[#7A7F88] transition-colors hover:border-primary hover:bg-[#EEF1FC] hover:text-primary"
        >
          <Upload className="size-6" />
          <span className="text-xs font-semibold">أضف لون / صورة</span>
          <span className="text-[10.5px] text-[#A2A7AF]">PNG · JPG</span>
        </button>

        {images.map((img, i) => (
          <GalleryItem
            key={img.id}
            image={img}
            isMain={i === 0}
            colors={colors}
            resolved={resolvedColors}
            status={status}
            onRemove={() => onRemove(img.id)}
            onSetMain={() => onSetMain(img.id)}
            onSetColor={(c) => onSetColor(img.id, c)}
          />
        ))}
      </div>
    </FormCard>
  );
}

function GalleryItem({
  image,
  isMain,
  colors,
  resolved,
  status,
  onRemove,
  onSetMain,
  onSetColor,
}: {
  image: ProductImage;
  isMain: boolean;
  colors: Color[];
  resolved: Map<string, Color>;
  status: ColorsStatus;
  onRemove: () => void;
  onSetMain: () => void;
  onSetColor: (colorId: string) => void;
}) {
  const selected = image.color ? resolved.get(image.color) : undefined;
  // Keyed off `family` (never the stored name): this image needs a real color.
  const isUnassigned = isUnassignedColor(selected);
  const hex = selected?.hex ?? NEUTRAL_HEX;

  const placeholder =
    status === "loading"
      ? "جاري تحميل الألوان…"
      : status === "error"
        ? "تعذّر تحميل الألوان"
        : status === "empty"
          ? "لا توجد ألوان"
          : "— اختر —";

  return (
    <div className="w-[120px]">
      <div
        className="relative h-[142px] w-[120px] overflow-hidden rounded-[14px] border border-[#E6E8EC]"
        style={
          image.url
            ? undefined
            : { background: `linear-gradient(160deg, ${tint(hex, 62)}, ${tint(hex, 22)})` }
        }
      >
        {image.url && (
          <img
            src={image.url}
            alt={colorDisplayName(selected) || "صورة المنتج"}
            className="size-full object-cover"
          />
        )}
        {isMain && (
          <span className="absolute end-[7px] top-[7px] rounded-[7px] bg-primary/90 px-2 py-[3px] text-[10px] font-semibold text-white">
            ★ رئيسية
          </span>
        )}
        <div className="absolute inset-x-[7px] bottom-[7px] flex gap-[5px]">
          {!isMain && (
            <ImageOverlayButton label="تعيين رئيسية" onClick={onSetMain} hoverClass="hover:bg-card hover:text-primary">
              <Star className="size-3.5" />
            </ImageOverlayButton>
          )}
          <ImageOverlayButton label="حذف" onClick={onRemove} hoverClass="hover:bg-card hover:text-[#C0392B]">
            <X className="size-3.5" />
          </ImageOverlayButton>
        </div>
      </div>

      <div className="mt-2">
        <div className="mb-[5px] flex items-center gap-1.5">
          <Swatch hex={hex} />
          <span className="text-[10.5px] font-semibold text-[#7A7F88]">
            لون هذه الصورة
          </span>
        </div>
        <Select
          dir="rtl"
          value={image.color || undefined}
          onValueChange={onSetColor}
          disabled={status !== "ready"}
        >
          <SelectTrigger
            dir="rtl"
            size="sm"
            className={cn(
              "h-auto w-full rounded-[9px] border-[#E2E4E9] bg-card px-2.5 py-[7px] text-xs font-medium text-[#3A3E47]",
              isUnassigned && "border-[#E2A33A] bg-[#FBF7EE]",
            )}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent dir="rtl">
            {/* The sentinel is never offered as a NEW choice (it's excluded from
                the options); it renders only as a disabled item so the current
                value shows. Label is hardcoded off family — never the stored name. */}
            {isUnassigned && image.color && (
              <SelectItem value={image.color} disabled className="text-xs">
                <span className="flex items-center gap-2">
                  <Swatch hex={NEUTRAL_HEX} />
                  غير معرف (يحتاج تعيين)
                </span>
              </SelectItem>
            )}
            {colors.map((c) => (
              <SelectItem
                key={c.id}
                value={c.id}
                disabled={!c.isActive}
                className="text-xs"
              >
                <span className="flex items-center gap-2">
                  <Swatch hex={c.hex ?? NEUTRAL_HEX} />
                  {c.isActive ? c.name : `${c.name} (معطّل)`}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isUnassigned && (
          <p className="mt-1 flex items-center gap-1 text-[10.5px] font-medium text-[#9A6B12]">
            <TriangleAlert className="size-3" />
            اختر لونًا صحيحًا لهذه الصورة
          </p>
        )}
      </div>

      <div className="mt-[7px] flex flex-col gap-1">
        {image.analyzed ? (
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-[#1B7A4E]">
            <span className="size-[5px] rounded-full bg-[#1FA463]" />
            تم التحليل
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-[#9A6B12]">
            <Loader2 className="size-2.5 animate-spin" />
            جارٍ التحليل…
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 text-[10.5px] text-[#9197A0]">
          <span className="size-[5px] rounded-full bg-[#C7CBD2]" />
          embedding · قيد الإعداد
        </span>
      </div>
    </div>
  );
}

/** A round color swatch, white-aware so it stays visible on white surfaces. */
function Swatch({ hex }: { hex: string }) {
  const isWhite = hex.toUpperCase() === "#FFFFFF";
  return (
    <span
      className="inline-block size-3 shrink-0 rounded-full border"
      style={{
        background: hex,
        borderColor: isWhite ? "#DADDE2" : "rgba(0,0,0,.16)",
      }}
    />
  );
}

function ImageOverlayButton({
  label,
  onClick,
  hoverClass,
  children,
}: {
  label: string;
  onClick: () => void;
  hoverClass: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex size-[26px] items-center justify-center rounded-[7px] bg-[#14161B]/60 text-white backdrop-blur-sm transition-colors",
        hoverClass,
      )}
    >
      {children}
    </button>
  );
}
