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

import type { Color, ColorFormValues, ColorSubmit } from "@/types/color";

/** A stable English slug: starts with a letter, then letters/digits/-/_. */
export const FAMILY_PATTERN = /^[a-z][a-z0-9_-]*$/;
/** A six-digit hex color, e.g. `#B0212F`. */
export const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

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

/** Build the create/update payload (`hex` "" → `null`). */
export function formValuesToSubmit(values: ColorFormValues): ColorSubmit {
  const hex = values.hex.trim();
  return {
    name: values.name.trim(),
    family: values.family.trim(),
    hex: hex ? hex : null,
    isActive: values.isActive,
  };
}

export type ColorFormErrors = {
  name?: string;
  family?: string;
  hex?: string;
};

/**
 * Validate the color form. `existingFamilies` is the set of `family` keys
 * already taken (excluding the color being edited) so a duplicate is caught
 * before the request.
 */
export function validateColorForm(
  values: ColorFormValues,
  existingFamilies: Set<string>,
): ColorFormErrors {
  const errors: ColorFormErrors = {};

  if (!values.name.trim()) {
    errors.name = "اسم اللون مطلوب";
  }

  const family = values.family.trim();
  if (!family) {
    errors.family = "المفتاح مطلوب";
  } else if (!FAMILY_PATTERN.test(family)) {
    errors.family = "أحرف إنجليزية صغيرة وأرقام و«-» و«_» فقط، تبدأ بحرف";
  } else if (existingFamilies.has(family)) {
    errors.family = "هذا المفتاح مستخدم مسبقاً";
  }

  const hex = values.hex.trim();
  if (hex && !HEX_PATTERN.test(hex)) {
    errors.hex = "صيغة غير صحيحة — استخدم ‎#RRGGBB";
  }

  return errors;
}

export function hasColorErrors(errors: ColorFormErrors): boolean {
  return Boolean(errors.name || errors.family || errors.hex);
}

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
