/**
 * Small presentational atoms shared by the colors list, the form preview and the
 * synonyms manager. Mirrors the soft-palette badge style of the product/knowledge
 * visuals so the colors page sits in the admin with zero design drift.
 */

import { termsLabel } from "@/lib/colors";
import { cn } from "@/lib/utils";

const badgeClass =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-[10px] py-1 text-[11.5px] font-semibold";

/**
 * A color swatch driven by the stored `hex`. White-aware border so a white
 * swatch stays visible on white cards; an empty `hex` renders a neutral
 * placeholder (the color has no chosen swatch yet).
 */
export function Swatch({
  hex,
  className,
}: {
  hex: string | null;
  className?: string;
}) {
  const base = "shrink-0 rounded-[7px] border";
  if (!hex) {
    return (
      <span
        aria-hidden
        title="بدون لون محدّد"
        className={cn(base, "size-[22px] border-dashed border-[#CFD3DA]", className)}
        style={{
          background:
            "repeating-linear-gradient(135deg,#F3F4F6 0 5px,#E9EBEF 5px 10px)",
        }}
      />
    );
  }
  const isWhite = hex.toUpperCase() === "#FFFFFF";
  return (
    <span
      aria-hidden
      title={hex}
      className={cn(base, "size-[22px]", className)}
      style={{
        background: hex,
        borderColor: isWhite ? "#DADDE2" : "rgba(0,0,0,.14)",
      }}
    />
  );
}

/** Active / retired badge. Active is green; retired is neutral gray. */
export function ColorStatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span
      className={badgeClass}
      style={{ color: "#1B7A4E", background: "#EAF6EF", borderColor: "#CDEBD9" }}
    >
      <span className="size-1.5 rounded-full bg-[#1FA463]" aria-hidden />
      مفعّل
    </span>
  ) : (
    <span
      className={badgeClass}
      style={{ color: "#6B7079", background: "#F1F2F5", borderColor: "#E6E8EC" }}
    >
      <span className="size-1.5 rounded-full bg-[#B6BAC2]" aria-hidden />
      معطّل
    </span>
  );
}

/** Synonym-count badge. Zero terms renders a muted dash. */
export function SynonymCountBadge({ count }: { count: number }) {
  if (count <= 0) {
    return <span className="text-[13px] text-[#B7BBC3]">—</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[#D6DEF8] bg-[#EEF1FC] px-[10px] py-1 text-[11.5px] font-semibold text-primary">
      {termsLabel(count)}
    </span>
  );
}
