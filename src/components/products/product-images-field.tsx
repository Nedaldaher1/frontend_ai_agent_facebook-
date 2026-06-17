/**
 * Section 1 — "صور المنتج وألوانه". Each image is one color variant of the
 * abaya: upload an image, tag it with a color, and the card reflects Vision's
 * per-image analysis state (and the Phase 2 embedding placeholder).
 *
 * Improvement over the static prototype: the upload button accepts a real file
 * and previews it via an object URL, so the gallery isn't just colored boxes.
 * (Persisting the file to storage is a backend TODO — see ProductForm.)
 */

import { useRef } from "react";
import { Loader2, Star, Upload, X } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COLORS, colorHex } from "@/constants/enums";
import { tint } from "@/constants/theme";
import type { ColorValue, ProductImage } from "@/types/product";
import { cn } from "@/lib/utils";
import { ErrorText, FormCard, Hint, RequiredBadge, SectionHeader } from "./product-form-ui";

type ProductImagesFieldProps = {
  images: ProductImage[];
  error?: boolean;
  onAdd: (file?: File) => void;
  onRemove: (id: ProductImage["id"]) => void;
  onSetMain: (id: ProductImage["id"]) => void;
  onSetColor: (id: ProductImage["id"], color: ColorValue | "") => void;
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

  return (
    <FormCard>
      <SectionHeader step="١" title="صور المنتج وألوانه" badge={<RequiredBadge />} />
      <Hint>
        كل صورة تمثّل لوناً من ألوان العباية — ارفع صورة لكل لون وحدّد لونه من
        القائمة.
      </Hint>
      {error && <ErrorText>يجب رفع صورة واحدة على الأقل</ErrorText>}

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
  onRemove,
  onSetMain,
  onSetColor,
}: {
  image: ProductImage;
  isMain: boolean;
  onRemove: () => void;
  onSetMain: () => void;
  onSetColor: (color: ColorValue | "") => void;
}) {
  const hex = image.color ? colorHex(image.color) : "#C7CBD2";
  const isWhite = hex.toUpperCase() === "#FFFFFF";

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
            alt={image.color || "صورة المنتج"}
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
          <span
            className="inline-block size-3 rounded-full border"
            style={{
              background: hex,
              borderColor: isWhite ? "#DADDE2" : "rgba(0,0,0,.16)",
            }}
          />
          <span className="text-[10.5px] font-semibold text-[#7A7F88]">
            لون هذه الصورة
          </span>
        </div>
        <Select
          value={image.color || undefined}
          onValueChange={(v) => onSetColor(v as ColorValue)}
        >
          <SelectTrigger
            size="sm"
            className="h-auto w-full rounded-[9px] border-[#E2E4E9] bg-card px-2.5 py-[7px] text-xs font-medium text-[#3A3E47]"
          >
            <SelectValue placeholder="— اختر —" />
          </SelectTrigger>
          <SelectContent>
            {COLORS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
