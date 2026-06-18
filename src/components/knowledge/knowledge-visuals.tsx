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

/** Per-category icon + soft color, harmonious with the brand palette. */
const CATEGORY_META: Record<KnowledgeCategory, CategoryStyle> = {
  faq: { icon: HelpCircle, fg: "#3B4CC0", bg: "#EEF1FC", border: "#D6DEF8" },
  policy: { icon: ShieldCheck, fg: "#5A6172", bg: "#F1F3F7", border: "#E1E5ED" },
  shipping: { icon: Truck, fg: "#0E7C86", bg: "#E6F6F7", border: "#C7EAEC" },
  returns: { icon: RotateCcw, fg: "#9A6B12", bg: "#FBF4E6", border: "#F0E2C2" },
  sizing: { icon: Ruler, fg: "#7A4FB0", bg: "#F3EEFA", border: "#E4D7F4" },
  payment: { icon: CreditCard, fg: "#1B7A4E", bg: "#EAF6EF", border: "#CDEBD9" },
  care: { icon: Sparkles, fg: "#B0467E", bg: "#FBECF3", border: "#F2D3E3" },
  canned_response: {
    icon: MessageSquareText,
    fg: "#2266B3",
    bg: "#E9F1FB",
    border: "#CCE0F5",
  },
  product_info: { icon: Package, fg: "#9A5B2C", bg: "#FBF0E6", border: "#F0DCC4" },
  general: { icon: Info, fg: "#6B7079", bg: "#F1F2F5", border: "#E6E8EC" },
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
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[#E6E8EC] bg-[#F4F5F7] px-[10px] py-1 text-[11.5px] font-medium text-[#6B7079]">
      عام
    </span>
  );
}

/** Product-scoped badge — shows the linked product's name when known. */
export function ProductBadge({ name }: { name?: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#E6E8EC] bg-card py-1 pe-2.5 ps-2 text-[11.5px] font-medium text-[#4A4E57]">
      <Package className="size-3 shrink-0 text-[#9197A0]" aria-hidden />
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
        high ? "font-semibold text-[#14161B]" : "text-[#9197A0]",
      )}
      style={{ fontFeatureSettings: "'tnum'" }}
    >
      {high && <span className="size-1.5 rounded-full bg-primary" aria-hidden />}
      {value}
    </span>
  );
}
