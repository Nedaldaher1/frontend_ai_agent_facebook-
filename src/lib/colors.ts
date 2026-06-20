/**
 * Pure helpers mapping between the API `Color` shape, the editable
 * `ColorFormValues`, and the submit payload — plus the client-side validation.
 * Keeping the rules here (not in components) means the form and the list agree
 * (CLAUDE.md §6).
 *
 * Why client-side uniqueness checks: the backend does not catch the Postgres
 * unique violation on `family`/`term` (it surfaces as a generic 500), so we
 * pre-check against the loaded vocabulary to give a clear Arabic field error
 * instead. The DB constraint remains the ultimate backstop.
 */

import { z } from "zod";

import type { Color, ColorFormValues, ColorSubmit } from "@/types/color";

/** A stable English slug: lowercase letters, digits, `-` and `_`. */
export const FAMILY_PATTERN = /^[a-z0-9_-]+$/;
/** A six-digit hex color, e.g. `#B0212F`. */
export const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

/**
 * The system "unassigned" sentinel color. When a color is deleted, the backend
 * retags that color's images to this sentinel; those images then need manual
 * review (a human re-selects a real color).
 *
 * Identity is its stable `family` key — NEVER its stored `name` (the name must
 * not be trusted for display). The sentinel is excluded from GET /admin/colors,
 * so it is never offered as a NEW selection; it only ever surfaces as the current
 * value of an already-tagged image.
 */
export const UNASSIGNED_COLOR_FAMILY = "__unassigned__";

/** Hardcoded Arabic label for the sentinel — always used instead of the stored name. */
export const UNASSIGNED_COLOR_NAME = "غير معرف";

/** True when a color is the unassigned sentinel (keyed off `family`, not `name`). */
export const isUnassignedColor = (
  color: { family?: string | null } | null | undefined,
): boolean => color?.family === UNASSIGNED_COLOR_FAMILY;

/**
 * The display label for a color. Forces the hardcoded {@link UNASSIGNED_COLOR_NAME}
 * for the sentinel so a placeholder/tampered stored `name` can never leak to the
 * UI — apply this anywhere the sentinel color could surface.
 */
export const colorDisplayName = (
  color: { family: string; name: string } | null | undefined,
): string =>
  !color
    ? ""
    : color.family === UNASSIGNED_COLOR_FAMILY
      ? UNASSIGNED_COLOR_NAME
      : color.name;

/**
 * Client schema mirroring the backend `createColorSchema` so the form rejects
 * the same shapes the API would (name required, `family` a lowercase slug, `hex`
 * either empty or `#RRGGBB`). Wired into the form via `zodResolver`. The empty
 * `hex` is allowed here and stripped to `undefined`/`null` at submit time by the
 * data provider — keeping the wire-shape concern out of the schema.
 */
export const colorSchema = z.object({
  name: z.string().trim().min(1, "اسم اللون مطلوب"),
  family: z
    .string()
    .trim()
    .min(1, "المفتاح مطلوب")
    .regex(FAMILY_PATTERN, "أحرف إنجليزية صغيرة وأرقام و«-» و«_» فقط"),
  hex: z
    .string()
    .refine(
      (v) => v === "" || HEX_PATTERN.test(v),
      "صيغة غير صحيحة — استخدم ‎#RRGGBB",
    ),
  isActive: z.boolean(),
});

/** Coerce raw `family` keystrokes to the allowed alphabet (lowercase slug). */
export const sanitizeFamily = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9_-]/g, "");

/** A pristine form for the "create" flow (active by default). */
export function blankColorForm(): ColorFormValues {
  return { name: "", family: "", hex: "", isActive: true };
}

/** Map a loaded API color into editable form values (for the "edit" flow). */
export function colorToFormValues(color: Color): ColorFormValues {
  return {
    name: color.name ?? "",
    family: color.family ?? "",
    hex: color.hex ?? "",
    isActive: color.isActive ?? true,
  };
}

/** Build the create/update payload (`hex` "" → `null`). Values are guarded
 *  because Refine populates the edit form from the raw record (nullable `hex`). */
export function formValuesToSubmit(values: ColorFormValues): ColorSubmit {
  const hex = (values.hex ?? "").trim();
  return {
    name: (values.name ?? "").trim(),
    family: (values.family ?? "").trim(),
    hex: hex ? hex : null,
    isActive: values.isActive,
  };
}

/** Inline field errors surfaced under the color form's inputs. */
export type ColorFormErrors = {
  name?: string;
  family?: string;
  hex?: string;
};

/**
 * Validate a dialect term before adding/renaming it. `takenTerms` is the set of
 * terms already used across ALL colors (the term is globally unique).
 */
export function validateTerm(
  term: string,
  takenTerms: Set<string>,
): string | undefined {
  const value = term.trim();
  if (!value) return "المصطلح مطلوب";
  if (takenTerms.has(value)) return "هذا المصطلح مستخدم مسبقاً";
  return undefined;
}

/** Arabic count label for the synonym badge (proper duals/plurals). */
export function termsLabel(count: number): string {
  if (count === 1) return "مصطلح واحد";
  if (count === 2) return "مصطلحان";
  if (count >= 3 && count <= 10) return `${count} مصطلحات`;
  return `${count} مصطلحاً`;
}
