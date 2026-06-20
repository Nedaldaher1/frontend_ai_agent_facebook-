/**
 * Shared building blocks for the product form, mirroring the prototype's
 * `ui.card` / `ui.stepNo` / `ui.h3` / `ui.label` / `ui.hint` style objects so
 * the five form sections stay visually consistent without repeating classes.
 */

import { brand } from "@/constants/theme";
import { cn } from "@/lib/utils";

/** Input/textarea base styling matching the prototype's `ui.input`. */
export const fieldClass =
  "h-auto w-full rounded-[11px] border-line-2 bg-card px-[13px] py-[11px] text-sm text-ink";

/** Select trigger styling tuned to match the text fields. */
export const selectTriggerClass =
  "h-auto w-full rounded-[11px] border-line-2 bg-card px-[13px] py-[11px] text-sm font-medium text-ink-2 data-[size=default]:h-auto";

/** White section card. */
export function FormCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[18px] border border-line bg-card p-[22px] shadow-[0_1px_2px_rgba(16,18,22,.04),0_12px_34px_-28px_rgba(16,18,22,.26)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

/** A numbered section header: accent step badge + title + optional tag. */
export function SectionHeader({
  step,
  title,
  badge,
  className,
}: {
  step: string;
  title: string;
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-2.5", className)}>
      <span
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-semibold"
        style={{
          background: "var(--accent-soft)",
          color: brand.accentDark,
        }}
      >
        {step}
      </span>
      <h3 className="m-0 text-base font-semibold text-ink">{title}</h3>
      {badge}
    </div>
  );
}

/** Amber "required" pill. */
export function RequiredBadge() {
  return (
    <span className="rounded-md border border-warn-line bg-warn-bg px-[7px] py-0.5 text-[10.5px] font-semibold text-warn-fg">
      مطلوبة
    </span>
  );
}

/** Neutral "optional" pill. */
export function OptionalBadge() {
  return (
    <span className="rounded-[5px] bg-neutral-bg px-[7px] py-0.5 text-[10px] font-semibold text-ink-faint">
      اختياري
    </span>
  );
}

export function FieldLabel({
  children,
  required,
  className,
}: {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "mb-2 block text-[13px] font-semibold text-ink-2",
        className,
      )}
    >
      {children}
      {required && <span className="text-danger-fg"> *</span>}
    </label>
  );
}

export function Hint({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("mt-2 text-[12.5px] leading-relaxed text-ink-muted", className)}>
      {children}
    </p>
  );
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-[7px] flex items-center gap-1 text-xs font-medium text-danger-fg">
      {children}
    </div>
  );
}
