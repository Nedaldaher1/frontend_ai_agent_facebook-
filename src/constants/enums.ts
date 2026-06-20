/**
 * Closed-enum vocabulary for the product catalog.
 *
 * This file is the single source of truth for every structured (dropdown)
 * attribute the admin exposes. These values must stay in sync with the backend
 * enums and the agent's Structured Outputs vocabulary (see CLAUDE.md §6).
 *
 * Each option carries a stable English `value` (the wire/DB key) and an Arabic
 * `label` (shown to staff). Never free-type these in the UI — always a <Select>.
 *
 * NOTE: the `value` keys below are derived from the design prototype
 * (the_goal.html) and are PLACEHOLDERS until the backend enum is confirmed.
 */

export type EnumOption<V extends string = string> = {
  value: V;
  label: string;
};

/** A color in the closed `color_family` enum, plus its swatch hex. */
export type ColorOption = EnumOption & { hex: string };

export const COLORS = [
  { value: "red", label: "أحمر", hex: "#C0392B" },
  { value: "blue", label: "أزرق", hex: "#2A52CC" },
  { value: "black", label: "أسود", hex: "#1A1C22" },
  { value: "white", label: "أبيض", hex: "#FFFFFF" },
  { value: "green", label: "أخضر", hex: "#1E7A52" },
  { value: "beige", label: "بيج", hex: "#CDBA9E" },
  { value: "gray", label: "رمادي", hex: "#9097A1" },
  { value: "pink", label: "وردي", hex: "#D98AAE" },
  { value: "purple", label: "بنفسجي", hex: "#7A4FB0" },
  { value: "brown", label: "بني", hex: "#7A5236" },
] as const satisfies readonly ColorOption[];

export const SLEEVES = [
  { value: "wide", label: "كم واسع" },
  { value: "narrow", label: "كم ضيق" },
  { value: "flared", label: "كم كلوش" },
  { value: "regular", label: "كم عادي" },
  { value: "sleeveless", label: "بدون كم" },
] as const satisfies readonly EnumOption[];

export const FABRICS = [
  { value: "crepe", label: "كريب" },
  { value: "naqda", label: "نقدة" },
  { value: "georgette", label: "جورجيت" },
  { value: "velvet", label: "مخمل" },
  { value: "cotton", label: "قطن" },
  { value: "rayon", label: "حرير صناعي" },
] as const satisfies readonly EnumOption[];

export const OCCASIONS = [
  { value: "daily", label: "يومي" },
  { value: "events", label: "مناسبات" },
  { value: "soiree", label: "سواريه" },
  { value: "prayer", label: "صلاة" },
  { value: "work", label: "عمل" },
] as const satisfies readonly EnumOption[];

export const EMBROIDERY = [
  { value: "none", label: "بدون" },
  { value: "light", label: "تطريز خفيف" },
  { value: "heavy", label: "تطريز كثيف" },
  { value: "stones", label: "حجر / سواروفسكي" },
  { value: "tassels", label: "شراشيب" },
  { value: "lace", label: "دانتيل" },
] as const satisfies readonly EnumOption[];

/** Stock availability. The admin tracks availability, not piece counts. */
export const STOCK_STATUSES = [
  { value: "in", label: "متوفر" },
  { value: "out", label: "غير متوفر" },
  { value: "soon", label: "قريباً" },
] as const satisfies readonly EnumOption[];

/** Publish state — gates whether the agent may surface the product. */
export const PUBLISH_STATUSES = [
  { value: "published", label: "منشور" },
  { value: "draft", label: "مسودّة" },
] as const satisfies readonly EnumOption[];

/**
 * Closed category vocabulary for knowledge-base entries. The English `value` is
 * the wire/DB key (must match the backend enum exactly — see the OpenAPI
 * `CreateKnowledgeEntryDto.category`); the Arabic `label` is shown to staff.
 * Always a <Select>, never free-typed (CLAUDE.md §6).
 */
export const KNOWLEDGE_CATEGORIES = [
  { value: "faq", label: "أسئلة شائعة" },
  { value: "policy", label: "سياسة عامة" },
  { value: "shipping", label: "الشحن" },
  { value: "returns", label: "الإرجاع والاستبدال" },
  { value: "sizing", label: "دليل المقاسات" },
  { value: "payment", label: "الدفع" },
  { value: "care", label: "العناية بالقماش" },
  { value: "canned_response", label: "ردّ جاهز" },
  { value: "product_info", label: "معلومات منتج" },
  { value: "general", label: "عام" },
] as const satisfies readonly EnumOption[];

/** A size bracket, defined by the customer's weight range (kg). */
export type SizeOption = {
  id: string;
  no: string;
  fromKg: number;
  toKg: number;
};

export const SIZE_CATALOG = [
  { id: "s1", no: "1", fromKg: 60, toKg: 90 },
  { id: "s2", no: "2", fromKg: 90, toKg: 120 },
  { id: "s3", no: "3", fromKg: 120, toKg: 150 },
  { id: "s4", no: "4", fromKg: 150, toKg: 180 },
] as const satisfies readonly SizeOption[];

/** Helper: resolve an enum option's Arabic label by value. */
export function labelOf(
  options: readonly EnumOption[],
  value: string | undefined | null
): string {
  return options.find((o) => o.value === value)?.label ?? "";
}

/** Helper: resolve a color's swatch hex by value (falls back to neutral gray). */
export function colorHex(value: string | undefined | null): string {
  return COLORS.find((c) => c.value === value)?.hex ?? "#9097A1";
}
