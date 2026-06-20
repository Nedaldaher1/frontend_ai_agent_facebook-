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
  // `inline-block` so width/height apply in any context (in a plain grid/table
  // cell a bare inline <span> collapses to a thin vertical line); `rounded-full`
  // makes it a circular swatch.
  const base = "inline-block shrink-0 rounded-full border";
  if (!hex) {
    return (
      <span
        aria-hidden
        title="بدون لون محدّد"
        className={cn(base, "size-[22px] border-dashed border-line-strong", className)}
        style={{
          background:
            "repeating-linear-gradient(135deg,var(--surface-1) 0 5px,var(--line) 5px 10px)",
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
        // The fill is the literal product hex (a physical color sample — never
        // themed); only the delineating ring adapts to the surface.
        background: hex,
        borderColor: isWhite ? "var(--swatch-ring-white)" : "var(--swatch-ring)",
      }}
    />
  );
}

/** Active / retired badge. Active is green; retired is neutral gray. */
export function ColorStatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span
      className={badgeClass}
      style={{
        color: "var(--ok-fg)",
        background: "var(--ok-bg)",
        borderColor: "var(--ok-line)",
      }}
    >
      <span className="size-1.5 rounded-full bg-ok-dot" aria-hidden />
      مفعّل
    </span>
  ) : (
    <span
      className={badgeClass}
      style={{
        color: "var(--neutral-fg)",
        background: "var(--neutral-bg)",
        borderColor: "var(--neutral-line)",
      }}
    >
      <span className="size-1.5 rounded-full bg-ink-faint" aria-hidden />
      معطّل
    </span>
  );
}

/** Synonym-count badge. Zero terms renders a muted dash. */
export function SynonymCountBadge({ count }: { count: number }) {
  if (count <= 0) {
    return <span className="text-[13px] text-ink-faint">—</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-accent-line bg-accent-soft px-[10px] py-1 text-[11.5px] font-semibold text-primary">
      {termsLabel(count)}
    </span>
  );
}
