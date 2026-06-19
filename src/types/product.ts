/**
 * Domain model for the product catalog.
 *
 * These types are derived from the design prototype (the_goal.html) and the
 * data contract in CLAUDE.md §6. Enum-backed fields reference the closed
 * vocabulary in `src/constants/enums.ts` so the UI can never drift from it.
 */

import type {
  COLORS,
  EMBROIDERY,
  FABRICS,
  OCCASIONS,
  PUBLISH_STATUSES,
  SIZE_CATALOG,
  SLEEVES,
  STOCK_STATUSES,
} from "@/constants/enums";

/** Stable `value` keys, narrowed straight from the enum constants. */
export type ColorValue = (typeof COLORS)[number]["value"];
export type SleeveValue = (typeof SLEEVES)[number]["value"];
export type FabricValue = (typeof FABRICS)[number]["value"];
export type OccasionValue = (typeof OCCASIONS)[number]["value"];
export type EmbroideryValue = (typeof EMBROIDERY)[number]["value"];
export type StockStatus = (typeof STOCK_STATUSES)[number]["value"];
export type PublishStatus = (typeof PUBLISH_STATUSES)[number]["value"];
export type SizeId = (typeof SIZE_CATALOG)[number]["id"];

/**
 * One product image. Each image represents a single color variant of the abaya.
 * `analyzed` reflects whether Claude Vision has finished extracting attributes.
 * `hasEmbedding` is display-only (CLIP / pgvector — Phase 2).
 */
export interface ProductImage {
  id: number | string;
  url?: string;
  /**
   * The selected color's backend id (UUID), or "" when untagged. Resolved to a
   * `color_family` / swatch via the `colors` resource — never an enum key.
   */
  color: string;
  isMain?: boolean;
  analyzed: boolean;
  hasEmbedding?: boolean;
  /** Storage key of an image already on the backend (e.g. "abc123.jpg"). */
  key?: string;
  /** Binary held locally until Save uploads it (create + newly-added images). */
  file?: File;
}

/** Optional physical measurements (cm). All optional. */
export interface ProductMeasurements {
  shoulderCm?: number | null;
  armpitCm?: number | null;
  lengthCm?: number | null;
}

/**
 * A structured attribute Claude Vision extracted from the product images.
 * Surfaced for human review/approval before it fills the form (CLAUDE.md §6).
 */
export interface AiSuggestion {
  /** Arabic label shown to the reviewer. */
  label: string;
  /** Proposed value (free text or an enum label, depending on `target`). */
  value: string;
  /** Model confidence in [0, 1]. */
  confidence: number;
  /** Which form field this suggestion fills when approved. */
  target: "sleeve" | "fabric" | "occasion" | "embroidery";
}

/** A product as stored in the catalog / returned by the admin API. */
export interface Product {
  /** Backend product id (UUID). */
  id: string;
  name: string;
  description?: string;
  /** Decimal string in JOD, e.g. "38.500". */
  price: string;
  colors: ColorValue[];
  sizes: SizeId[];
  /** Max customer weight the abaya fits (kg). */
  maxWeight?: string;
  measurements?: ProductMeasurements;
  stock: StockStatus;
  status: PublishStatus;
  sleeve?: SleeveValue | "";
  fabric?: FabricValue | "";
  occasion?: OccasionValue | "";
  embroidery?: EmbroideryValue | "";
  tags: string[];
  images?: ProductImage[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * The editable shape behind the add/edit form. Mirrors `Product` but keeps
 * publish state as a boolean and always carries the working image gallery.
 */
export interface ProductFormValues {
  name: string;
  description: string;
  price: string;
  colors: ColorValue[];
  sizes: SizeId[];
  maxWeight: string;
  measurements: ProductMeasurements;
  stock: StockStatus;
  sleeve: SleeveValue | "";
  fabric: FabricValue | "";
  occasion: OccasionValue | "";
  embroidery: EmbroideryValue | "";
  tags: string[];
  images: ProductImage[];
  published: boolean;
}
