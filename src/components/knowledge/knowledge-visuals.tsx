/**
 * Small presentational atoms shared by the knowledge list and the form preview.
 *
 * Category colors stay within a soft palette harmonious with the brand accent
 * (`#2B50D6`) — tuned for quick visual scanning without shouting. The publish
 * badge is reused from the product visuals so publish state looks identical
 * across the whole admin.
 */

import {
  CreditCard,
  HelpCircle,
  Info,
  MessageSquareText,
  Package,
  RotateCcw,
  Ruler,
  ShieldCheck,
  Sparkles,
  Truck,
  type LucideIcon,
} from "lucide-react";

import { KNOWLEDGE_CATEGORIES, labelOf } from "@/constants/enums";
import type { KnowledgeCategory } from "@/types/knowledge";
import { cn } from "@/lib/utils";

type CategoryStyle = { icon: LucideIcon; fg: string; bg: string; border: string };

/**
 * Per-category icon + soft color, harmonious with the brand palette. Colors are
 * theme-aware CSS vars (defined in `src/App.css`): the prototype's exact soft
 * pastels in light, lightened foregrounds on low-tint dark backgrounds in dark.
 */
const CATEGORY_META: Record<KnowledgeCategory, CategoryStyle> = {
  faq: {
    icon: HelpCircle,
    fg: "var(--cat-faq-fg)",
    bg: "var(--cat-faq-bg)",
    border: "var(--cat-faq-line)",
  },
  policy: {
    icon: ShieldCheck,
    fg: "var(--cat-policy-fg)",
    bg: "var(--cat-policy-bg)",
    border: "var(--cat-policy-line)",
  },
  shipping: {
    icon: Truck,
    fg: "var(--cat-shipping-fg)",
    bg: "var(--cat-shipping-bg)",
    border: "var(--cat-shipping-line)",
  },
  returns: {
    icon: RotateCcw,
    fg: "var(--cat-returns-fg)",
    bg: "var(--cat-returns-bg)",
    border: "var(--cat-returns-line)",
  },
  sizing: {
    icon: Ruler,
    fg: "var(--cat-sizing-fg)",
    bg: "var(--cat-sizing-bg)",
    border: "var(--cat-sizing-line)",
  },
  payment: {
    icon: CreditCard,
    fg: "var(--cat-payment-fg)",
    bg: "var(--cat-payment-bg)",
    border: "var(--cat-payment-line)",
  },
  care: {
    icon: Sparkles,
    fg: "var(--cat-care-fg)",
    bg: "var(--cat-care-bg)",
    border: "var(--cat-care-line)",
  },
  canned_response: {
    icon: MessageSquareText,
    fg: "var(--cat-canned-fg)",
    bg: "var(--cat-canned-bg)",
    border: "var(--cat-canned-line)",
  },
  product_info: {
    icon: Package,
    fg: "var(--cat-product-fg)",
    bg: "var(--cat-product-bg)",
    border: "var(--cat-product-line)",
  },
  general: {
    icon: Info,
    fg: "var(--cat-general-fg)",
    bg: "var(--cat-general-bg)",
    border: "var(--cat-general-line)",
  },
};

const badgeClass =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-[10px] py-1 text-[11.5px] font-semibold";

/** Colored category pill with a small icon, for quick visual scanning. */
export function CategoryBadge({ category }: { category: KnowledgeCategory }) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.general;
  const Icon = meta.icon;
  return (
    <span
      className={badgeClass}
      style={{ color: meta.fg, background: meta.bg, borderColor: meta.border }}
    >
      <Icon className="size-3.5" aria-hidden />
      {labelOf(KNOWLEDGE_CATEGORIES, category)}
    </span>
  );
}

/** Neutral "general" badge — knowledge that applies to the whole catalog. */
export function GeneralBadge() {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-neutral-line bg-neutral-bg px-[10px] py-1 text-[11.5px] font-medium text-neutral-fg">
      عام
    </span>
  );
}

/** Product-scoped badge — shows the linked product's name when known. */
export function ProductBadge({ name }: { name?: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-neutral-line bg-card py-1 pe-2.5 ps-2 text-[11.5px] font-medium text-ink-2">
      <Package className="size-3 shrink-0 text-ink-faint" aria-hidden />
      <span className="truncate">{name || "مرتبط بمنتج"}</span>
    </span>
  );
}

/** Priority value with a subtle high-priority marker (accent dot + weight). */
export function PriorityValue({ value }: { value: number }) {
  const high = value > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[13px]",
        high ? "font-semibold text-ink" : "text-ink-faint",
      )}
      style={{ fontFeatureSettings: "'tnum'" }}
    >
      {high && <span className="size-1.5 rounded-full bg-primary" aria-hidden />}
      {value}
    </span>
  );
}
