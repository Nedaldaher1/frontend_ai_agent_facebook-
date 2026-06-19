/**
 * Pure translation between the backend `ProductDto` and the UI `Product` /
 * submit-payload shapes. Kept beside the data provider (its only consumer) so
 * no component ever sees the wire shape (CLAUDE.md §6).
 *
 * Key impedance mismatches handled here:
 *  - `stockStatus`: UI `in|out|soon` ⟷ API `in_stock|out|low`.
 *  - colour: UI tracks a color id (UUID) per image variant. Those per-image tags
 *    live in the `product_image_colors` join table — read here from
 *    GET /admin/products/:id/images (`colors[]`) and written by the data provider
 *    via PUT .../images/:key/colors. The API also stores a single `colorFamily`
 *    on the product, which the form derives from the first variant's family.
 *  - sizes / weights / measurements: the API `sizes` is a bare `string[]`, so
 *    the bracket selection + weight ranges + body measurements live in the free
 *    `attributes` jsonb (spec §5.4).
 */

import { SIZE_CATALOG } from "@/constants/enums";
import type { components } from "@/types/api";
import type {
  EmbroideryValue,
  FabricValue,
  OccasionValue,
  Product,
  ProductImage,
  ProductMeasurements,
  SizeId,
  SleeveValue,
  StockStatus,
} from "@/types/product";

export type ProductDto = components["schemas"]["ProductDto"];
/** Body for POST/PATCH — `camelCase`, the strict create/update shape. */
export type ProductBody = components["schemas"]["CreateProductDto"];
/** A canonical color as attached to an image (the join-table tag). */
export type ImageColorBrief = {
  id: string;
  name: string;
  family: string;
  hex: string | null;
};
/** One image as returned by `GET /admin/products/:id/images`. */
export type ProductImageItem = {
  key: string;
  url: string;
  isPrimary: boolean;
  colors: ImageColorBrief[];
};

const STOCK_UI_TO_API: Record<StockStatus, ProductDto["stockStatus"]> = {
  in: "in_stock",
  out: "out",
  soon: "low",
};
const STOCK_API_TO_UI: Record<ProductDto["stockStatus"], StockStatus> = {
  in_stock: "in",
  out: "out",
  low: "soon",
};

const sizeIdToCode = (id: SizeId): string =>
  SIZE_CATALOG.find((s) => s.id === id)?.no ?? id;
const codeToSizeId = (code: string): SizeId | null =>
  SIZE_CATALOG.find((s) => s.no === code)?.id ?? null;

/** Our fixed layout inside the free `attributes` jsonb. */
type StoredAttributes = {
  sizing?: {
    selected?: SizeId[];
    weightRanges?: Record<string, [number, number]>;
    maxWeight?: number | null;
  };
  measurements?: ProductMeasurements;
};

const readAttributes = (dto: ProductDto): StoredAttributes => {
  const a = dto.attributes;
  if (a && typeof a === "object" && !Array.isArray(a)) {
    return a as StoredAttributes;
  }
  return {};
};

const buildAttributes = (p: Partial<Product>): StoredAttributes => {
  const sizes = p.sizes ?? [];
  const weightRanges: Record<string, [number, number]> = {};
  for (const id of sizes) {
    const s = SIZE_CATALOG.find((x) => x.id === id);
    if (s) weightRanges[s.no] = [s.fromKg, s.toKg];
  }
  const maxWeight = p.maxWeight?.trim();
  return {
    sizing: {
      selected: sizes,
      weightRanges,
      maxWeight: maxWeight ? Number(maxWeight) : null,
    },
    measurements: {
      shoulderCm: p.measurements?.shoulderCm ?? null,
      armpitCm: p.measurements?.armpitCm ?? null,
      lengthCm: p.measurements?.lengthCm ?? null,
    },
  };
};

/**
 * Map a submit payload (a {@link Product} subset produced by the form) into the
 * strict `camelCase` create/update body. Never includes `imageUrls`
 * (images use the upload route) or `isPublished` (publish has its own route).
 */
export const payloadToBody = (p: Partial<Product>): ProductBody => ({
  name: p.name ?? "",
  priceJod: (p.price ?? "").trim(),
  description: p.description?.trim() || null,
  colorFamily: p.colors?.[0] ?? null,
  sleeveType: p.sleeve || null,
  fabric: p.fabric || null,
  occasion: p.occasion || null,
  embellishment: p.embroidery || null,
  sizes: (p.sizes ?? []).map(sizeIdToCode),
  stockStatus: STOCK_UI_TO_API[p.stock ?? "in"],
  tags: p.tags ?? [],
  attributes: buildAttributes(p),
});

const buildImages = (
  dto: ProductDto,
  items?: ProductImageItem[],
): ProductImage[] => {
  if (items) {
    return items.map((it) => ({
      id: it.key,
      key: it.key,
      url: it.url,
      // Per-image color is the join-table tag (first color). For a product that
      // landed in the review queue this is the unassigned sentinel id, which the
      // gallery resolves to «غير معرف» so the editor can re-assign a real color.
      color: it.colors[0]?.id ?? "",
      isMain: it.isPrimary,
      analyzed: true,
    }));
  }
  // List view (no images call): thumbnails only — per-image color isn't needed.
  return (dto.imageUrls ?? []).map((url, i) => ({
    id: i + 1,
    url,
    color: "",
    isMain: i === 0,
    analyzed: true,
  }));
};

/**
 * Map a backend `ProductDto` into the UI `Product`. Pass `imageItems` (from the
 * images endpoint) when editing so images carry their storage `key`; the list
 * skips that call and derives thumbnails from `imageUrls`.
 */
export const dtoToProduct = (
  dto: ProductDto,
  imageItems?: ProductImageItem[],
): Product => {
  const attrs = readAttributes(dto);
  const selected = attrs.sizing?.selected;
  const sizes: SizeId[] = Array.isArray(selected)
    ? selected.filter((id): id is SizeId => SIZE_CATALOG.some((s) => s.id === id))
    : (dto.sizes ?? [])
        .map(codeToSizeId)
        .filter((id): id is SizeId => id !== null);
  const maxWeight = attrs.sizing?.maxWeight;

  return {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? undefined,
    price: dto.priceJod,
    colors: dto.colorFamily ? [dto.colorFamily as Product["colors"][number]] : [],
    sizes,
    maxWeight: maxWeight != null ? String(maxWeight) : undefined,
    measurements: attrs.measurements ?? {},
    stock: STOCK_API_TO_UI[dto.stockStatus],
    status: dto.isPublished ? "published" : "draft",
    sleeve: (dto.sleeveType ?? "") as SleeveValue | "",
    fabric: (dto.fabric ?? "") as FabricValue | "",
    occasion: (dto.occasion ?? "") as OccasionValue | "",
    embroidery: (dto.embellishment ?? "") as EmbroideryValue | "",
    tags: dto.tags ?? [],
    images: buildImages(dto, imageItems),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
};
