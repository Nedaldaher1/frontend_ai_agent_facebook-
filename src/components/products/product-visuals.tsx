/**
 * Small presentational atoms shared by the product list and the form preview.
 *
 * Colors that encode meaning (stock/publish) or that derive from a product's
 * color value come from `@/constants/enums` + `@/constants/theme`, so the exact
 * palette from the design prototype lives in one place and never drifts.
 */

import {
  COLORS,
  PUBLISH_STATUSES,
  STOCK_STATUSES,
  colorHex,
  labelOf,
} from "@/constants/enums";
import {
  brand,
  publishColors,
  statusColors,
  tint,
} from "@/constants/theme";
import type { PublishStatus, StockStatus } from "@/types/product";
import { cn } from "@/lib/utils";

/** Shared pill geometry for the stock / publish badges. */
const badgeClass =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-[11px] py-1 text-[11.5px] font-semibold";

/**
 * A product thumbnail. Shows the real primary image when a `url` is given
 * (`imageUrls[0]`), otherwise falls back to a soft color-tinted gradient
 * placeholder. Size is passed via `className`.
 */
export function ProductThumb({
  color,
  url,
  className,
  showLabel = false,
}: {
  color?: string | null;
  url?: string | null;
  className?: string;
  showLabel?: boolean;
}) {
  if (url) {
    return (
      <div
        className={cn(
          "shrink-0 overflow-hidden rounded-[9px] border border-[#ECEDF1]",
          className,
        )}
      >
        <img src={url} alt="" className="size-full object-cover" />
      </div>
    );
  }
  const hex = colorHex(color);
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[9px] border border-[#ECEDF1]",
        className,
      )}
      style={{
        background: `linear-gradient(155deg, ${tint(hex, 30)}, #fff 80%)`,
      }}
    >
      {showLabel && (
        <span className="text-[9px] font-semibold text-[#14161B]/35">صورة</span>
      )}
    </div>
  );
}

/** A single color swatch dot, white-aware so it stays visible on white cards. */
function ColorDot({ color }: { color: string }) {
  const hex = colorHex(color);
  const isWhite = hex.toUpperCase() === "#FFFFFF";
  return (
    <span
      className="inline-block size-[13px] rounded-full border"
      title={labelOf(COLORS, color)}
      style={{
        background: hex,
        borderColor: isWhite ? "#DADDE2" : "rgba(0,0,0,.14)",
      }}
    />
  );
}

/** A row of color dots with a "+N" overflow indicator. */
export function ColorDots({
  colors,
  max = 5,
}: {
  colors: string[];
  max?: number;
}) {
  const shown = colors.slice(0, max);
  const more = colors.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-[5px]">
      {shown.map((c, i) => (
        <ColorDot key={`${c}-${i}`} color={c} />
      ))}
      {more > 0 && (
        <span className="text-[11px] font-semibold text-[#9197A0]">
          +{more}
        </span>
      )}
    </div>
  );
}

/** Stock availability badge (متوفر / غير متوفر / قريباً) with a status dot. */
export function StockBadge({ stock }: { stock: StockStatus }) {
  const c = statusColors[stock];
  return (
    <span
      className={badgeClass}
      style={{ color: c.fg, background: c.bg, borderColor: c.border }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ background: c.dot }}
        aria-hidden
      />
      {labelOf(STOCK_STATUSES, stock)}
    </span>
  );
}

/** Publish-state badge (منشور / مسودّة). `published` is accent-tinted. */
export function PublishBadge({ status }: { status: PublishStatus }) {
  const c = publishColors[status];
  return (
    <span
      className={badgeClass}
      style={{ color: c.fg, background: c.bg, borderColor: c.border }}
    >
      {labelOf(PUBLISH_STATUSES, status)}
    </span>
  );
}

/** A price with the JOD unit, using tabular figures so columns line up. */
export function Price({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return (
    <span
      className={cn(className)}
      style={{ fontFeatureSettings: "'tnum'" }}
    >
      {value || "0.000"}{" "}
      <span className="text-[11px] font-medium text-[#9197A0]">
        {brand.currency}
      </span>
    </span>
  );
}
