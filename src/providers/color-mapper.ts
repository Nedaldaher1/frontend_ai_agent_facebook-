/**
 * Pure translation between the backend color DTOs and the UI `Color` /
 * `ColorSynonym` / submit shapes. Kept beside the data provider (its only
 * consumer) so no component ever sees the wire shape (CLAUDE.md §6).
 *
 * Types are declared locally rather than pulled from `@/types/api`: the
 * generated OpenAPI types predate the `colors` entity (they still carry the old
 * `color_synonyms { canonicalFamily }` shape), so they are not a reliable source
 * here. Regenerate `src/types/api.d.ts` (`gen:types`) once the backend is up to
 * switch these onto `components["schemas"]["ColorDto"]`.
 *
 * Casing note: the create/update body is camelCase and the backend schema is
 * `.strict()` — an unknown or misspelled key is rejected with 400. We never send
 * `id`/`createdAt`/`updatedAt` (server-owned).
 */

import type { Color, ColorSubmit, ColorSynonym } from "@/types/color";

/** A canonical color row as returned by the admin API. */
export type ColorDto = {
  id: string;
  name: string;
  family: string;
  hex: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/** A dialect-term row as returned by the admin API. */
export type ColorSynonymDto = {
  id: string;
  term: string;
  colorId: string;
  createdAt: string;
};

/** `GET /admin/colors/:id` returns the color with its dialect terms attached. */
export type ColorWithSynonymsDto = ColorDto & { synonyms: ColorSynonymDto[] };

/** The strict camelCase body for POST/PATCH `/admin/colors`. */
export type ColorBody = {
  name: string;
  family: string;
  hex: string | null;
  isActive: boolean;
};

export const dtoToColorSynonym = (dto: ColorSynonymDto): ColorSynonym => ({
  id: dto.id,
  term: dto.term,
  colorId: dto.colorId,
  createdAt: dto.createdAt,
});

/** Map a backend color DTO (optionally with synonyms) into the UI `Color`. */
export const dtoToColor = (
  dto: ColorDto | ColorWithSynonymsDto,
): Color => ({
  id: dto.id,
  name: dto.name,
  family: dto.family,
  hex: dto.hex ?? null,
  isActive: dto.isActive,
  createdAt: dto.createdAt,
  updatedAt: dto.updatedAt,
  synonyms:
    "synonyms" in dto && Array.isArray(dto.synonyms)
      ? dto.synonyms.map(dtoToColorSynonym)
      : undefined,
});

/** Map a submit payload into the strict camelCase create/update body. */
export const submitToColorBody = (s: ColorSubmit): ColorBody => ({
  name: s.name.trim(),
  family: s.family.trim(),
  hex: s.hex && s.hex.trim() ? s.hex.trim() : null,
  isActive: s.isActive,
});
