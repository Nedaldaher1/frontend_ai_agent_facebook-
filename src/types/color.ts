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
 * onto the strict camelCase create/update body (`hex` "" → `null`).
 */
export interface ColorSubmit {
  name: string;
  family: string;
  hex: string | null;
  isActive: boolean;
}
