/**
 * Domain model for the color system — the canonical `colors` entity (written by
 * this admin, read by the agent to normalize customer dialect → a color family)
 * plus its child dialect terms (`color_synonyms`).
 *
 * Mirrors the rest of the admin: the UI shape is kept separate from the backend
 * wire shape (`ColorDto`, in `src/providers/color-mapper.ts`) so no component
 * ever sees the API casing (CLAUDE.md §6). `family` is a stable English search
 * key; `name` is the Arabic display label — never conflate them.
 */

/** A dialect term that resolves to a color (e.g. "نبيتي" → the "red" color). */
export interface ColorSynonym {
  /** Backend synonym id (UUID). */
  id: string;
  /** The dialect word, globally unique across all colors. */
  term: string;
  /** FK to the owning color. */
  colorId: string;
  createdAt?: string;
}

/** A canonical color as surfaced in the admin UI (mapped from the API DTO). */
export interface Color {
  /** Backend color id (UUID). */
  id: string;
  /** Arabic display label (e.g. "أحمر"). */
  name: string;
  /** Stable English search key, unique (e.g. "red"). */
  family: string;
  /** Optional UI swatch (`#RRGGBB`); `null` when unset. */
  hex: string | null;
  /** Retired colors stay stored but are not used for matching. */
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  /** Present only from `getOne` — the dialect terms that resolve to this color. */
  synonyms?: ColorSynonym[];
}

/** The editable shape behind the add/edit form (`hex` kept as a string). */
export interface ColorFormValues {
  name: string;
  family: string;
  /** `#RRGGBB` or "" when no swatch is chosen. */
  hex: string;
  isActive: boolean;
}

/**
 * The submit payload the form hands to the data provider. The provider maps it
 * onto the strict camelCase create/update body (create drops `isActive` and an
 * empty `hex`; update keeps both, `hex` "" → `null`).
 */
export interface ColorSubmit {
  name: string;
  family: string;
  hex: string | null;
  isActive: boolean;
}

/**
 * A dialect term as it lives in the editor before/while it is persisted. Both
 * the create and edit flows stage terms locally as chips and apply them on Save
 * (POST/PATCH/DELETE), so each chip carries its own lifecycle + inline error.
 *
 *  - `new`       — staged, not yet on the server (no `id`).
 *  - `persisted` — exists on the server (`id` set); `originalTerm` detects renames.
 *  - `saving`    — a write is in flight for this chip.
 *  - `error`     — the last write failed (e.g. 409 duplicate); `error` is shown inline.
 */
export type SynonymChipStatus = "new" | "persisted" | "saving" | "error";

export interface SynonymChip {
  /** Stable local key (survives reorder/persist; not the backend id). */
  key: string;
  /** Backend synonym id once persisted. */
  id?: string;
  /** The current term text. */
  term: string;
  /** The persisted term, to detect an inline rename (persisted chips only). */
  originalTerm?: string;
  status: SynonymChipStatus;
  /** Inline message for a failed write (e.g. duplicate term). */
  error?: string;
}

/** A product referenced by a color-usage report (distinct list, capped at 50). */
export interface ColorUsageProduct {
  id: string;
  name: string;
}

/**
 * Impact report for a color (GET /admin/colors/:id/usage) or for the whole
 * unassigned queue (GET /admin/colors/unassigned/usage): how many products and
 * images reference it, plus a capped, distinct sample of product names.
 */
export interface ColorUsage {
  /** Total distinct products that use the color. */
  productCount: number;
  /** Total images tagged with the color. */
  imageCount: number;
  /** Distinct product sample (≤50). `hasMore` is true when more exist. */
  products: ColorUsageProduct[];
  hasMore: boolean;
}

/**
 * Result of DELETE /admin/colors/:id under the removal workflow: the color is
 * deleted and its images are retagged to the unassigned sentinel for review.
 */
export interface DeleteColorResult {
  deleted: boolean;
  /** Images retagged to the sentinel. */
  reassignedImages: number;
  /** Distinct products those images belong to (now needing review). */
  affectedProducts: number;
}
