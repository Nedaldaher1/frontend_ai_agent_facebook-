/**
 * Pure helpers that map between the API `KnowledgeEntry` shape, the editable
 * `KnowledgeFormValues`, and the submit payload — mirroring `lib/products.ts`.
 * Keeping this logic here (not in components) means the form, the preview and
 * the list all agree on the same rules (CLAUDE.md §6).
 */

import type {
  KnowledgeCategory,
  KnowledgeEntry,
  KnowledgeFormValues,
  KnowledgeSubmit,
} from "@/types/knowledge";

/** A pristine form for the "create" flow (starts as an unpublished draft). */
export function blankKnowledgeForm(): KnowledgeFormValues {
  return {
    title: "",
    category: "",
    situation: "",
    content: "",
    tags: [],
    priority: 0,
    productId: null,
    published: false,
  };
}

/** Map a loaded API entry into editable form values (for the "edit" flow). */
export function knowledgeToFormValues(
  entry: KnowledgeEntry,
): KnowledgeFormValues {
  return {
    title: entry.title ?? "",
    category: entry.category ?? "",
    situation: entry.situation ?? "",
    content: entry.content ?? "",
    tags: entry.tags ?? [],
    priority: entry.priority ?? 0,
    productId: entry.productId ?? null,
    published: entry.status === "published",
  };
}

/** Build the create/update payload, resolving the publish status. */
export function formValuesToPayload(
  values: KnowledgeFormValues,
  publish: boolean,
): KnowledgeSubmit {
  return {
    // Validation guarantees a non-empty category before submit.
    category: values.category as KnowledgeCategory,
    title: values.title.trim(),
    content: values.content.trim(),
    situation: values.situation.trim(),
    tags: values.tags,
    priority: Number.isFinite(values.priority) ? values.priority : 0,
    productId: values.productId,
    status: publish ? "published" : "draft",
  };
}

export type KnowledgeFormErrors = {
  title: boolean;
  category: boolean;
  content: boolean;
};

/** Required: title, category (closed enum), content. */
export function validateKnowledgeForm(
  values: KnowledgeFormValues,
): KnowledgeFormErrors {
  return {
    title: !values.title.trim(),
    category: !values.category,
    content: !values.content.trim(),
  };
}

export function hasErrors(errors: KnowledgeFormErrors): boolean {
  return errors.title || errors.category || errors.content;
}
