/**
 * Pure helpers that map between the API `Product` shape, the editable
 * `ProductFormValues`, and the submit payload — plus small derivations the
 * product UI needs. Keeping this logic here (not in components) means the form,
 * the preview, and the list all agree on the same rules.
 */

import {
  EMBROIDERY,
  FABRICS,
  OCCASIONS,
  SLEEVES,
  type EnumOption,
} from "@/constants/enums";
import type {
  AiSuggestion,
  ColorValue,
  Product,
  ProductFormValues,
  ProductImage,
} from "@/types/product";

/**
 * Distinct, non-empty color families across a product's image variants, in
 * order. Each image stores a color id (UUID); `resolveFamily` maps that id to
 * its closed-enum family key — the value `color_family` and the preview swatches
 * are derived from. Ids that no longer resolve (e.g. a deleted color) are
 * skipped.
 */
export function uniqueColors(
  images: ProductImage[],
  resolveFamily: (colorId: string) => ColorValue | "",
): ColorValue[] {
  const seen = new Set<ColorValue>();
  for (const img of images) {
    const family = img.color ? resolveFamily(img.color) : "";
    if (family) seen.add(family);
  }
  return [...seen];
}

/** The closed-enum options each AI suggestion target maps onto. */
export const suggestionTargetOptions: Record<
  AiSuggestion["target"],
  readonly EnumOption[]
> = {
  sleeve: SLEEVES,
  fabric: FABRICS,
  occasion: OCCASIONS,
  embroidery: EMBROIDERY,
};

/** Resolve an enum `value` from a (possibly human-edited) Arabic label. */
export function valueFromLabel(
  options: readonly EnumOption[],
  label: string,
): string {
  return options.find((o) => o.label === label.trim())?.value ?? "";
}

/**
 * Seed Vision suggestions. `value` holds the Arabic label the reviewer sees and
 * edits; on approval it is resolved back to the closed-enum value.
 */
export function defaultAiSuggestions(): AiSuggestion[] {
  return [
    { label: "نوع الكم", value: "كم واسع", confidence: 0.9, target: "sleeve" },
    { label: "القماش", value: "كريب", confidence: 0.74, target: "fabric" },
    { label: "المناسبة", value: "مناسبات", confidence: 0.88, target: "occasion" },
    { label: "التطريز", value: "تطريز خفيف", confidence: 0.69, target: "embroidery" },
  ];
}

/** A pristine form for the "create" flow. */
export function blankProductForm(): ProductFormValues {
  return {
    name: "",
    description: "",
    price: "",
    colors: [],
    sizes: ["s1", "s2"],
    maxWeight: "",
    measurements: {},
    stock: "in",
    sleeve: "",
    fabric: "",
    occasion: "",
    embroidery: "",
    tags: [],
    images: [],
    published: false,
  };
}

/** Map a loaded API product into editable form values (for the "edit" flow). */
export function productToFormValues(product: Product): ProductFormValues {
  const images: ProductImage[] =
    product.images && product.images.length > 0
      ? product.images
      : (product.colors ?? []).map((color, i) => ({
          id: i + 1,
          color,
          analyzed: true,
        }));

  return {
    name: product.name ?? "",
    description: product.description ?? "",
    price: product.price ?? "",
    colors: product.colors ?? [],
    sizes: product.sizes ?? [],
    maxWeight: product.maxWeight ?? "",
    measurements: product.measurements ?? {},
    stock: product.stock ?? "in",
    sleeve: product.sleeve ?? "",
    fabric: product.fabric ?? "",
    occasion: product.occasion ?? "",
    embroidery: product.embroidery ?? "",
    tags: product.tags ?? [],
    images,
    published: product.status === "published",
  };
}

/**
 * Build the create/update payload, deriving colors + publish status.
 * `resolveFamily` turns each image's color id into its enum family so the
 * product's `color_family` stays the closed-enum key (not a UUID).
 */
export function formValuesToPayload(
  values: ProductFormValues,
  publish: boolean,
  resolveFamily: (colorId: string) => ColorValue | "",
): Partial<Product> {
  return {
    // Guard every `.trim()`: Refine re-populates the edit form from the raw
    // record, where optional fields (description, maxWeight) arrive `undefined`.
    name: (values.name ?? "").trim(),
    description: (values.description ?? "").trim() || undefined,
    price: (values.price ?? "").trim(),
    colors: uniqueColors(values.images, resolveFamily),
    sizes: values.sizes,
    maxWeight: (values.maxWeight ?? "").trim() || undefined,
    measurements: values.measurements,
    stock: values.stock,
    sleeve: values.sleeve || undefined,
    fabric: values.fabric || undefined,
    occasion: values.occasion || undefined,
    embroidery: values.embroidery || undefined,
    tags: values.tags,
    status: publish ? "published" : "draft",
    // Carry each variant's storage `key` (existing images to keep) and pending
    // `file` (new uploads) so the data provider can reconcile the gallery on
    // save: delete removed keys, upload new files, set the first as primary.
    images: values.images.map((img, i) => ({
      id: img.id,
      color: img.color,
      isMain: i === 0,
      analyzed: img.analyzed,
      key: img.key,
      file: img.file,
    })),
  };
}

export type ProductFormErrors = {
  name: boolean;
  price: boolean;
  images: boolean;
};

/** The backend's accepted JOD price shape (e.g. "45", "45.5", "45.990"). */
const PRICE_PATTERN = /^\d+(\.\d{1,3})?$/;

/** Required: name, a pattern-valid price, and ≥1 image. */
export function validateProductForm(
  values: ProductFormValues,
): ProductFormErrors {
  // Guard against the raw nullable record Refine resets the edit form with.
  const price = (values.price ?? "").trim();
  return {
    name: !(values.name ?? "").trim(),
    price: !PRICE_PATTERN.test(price),
    images: (values.images ?? []).length === 0,
  };
}

export function hasErrors(errors: ProductFormErrors): boolean {
  return errors.name || errors.price || errors.images;
}
