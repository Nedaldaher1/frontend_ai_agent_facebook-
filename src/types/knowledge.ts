/**
 * Domain model for the knowledge base — the FAQ / policy / care entries the AI
 * sales agent draws on when answering customers on Messenger.
 *
 * Mirrors the product domain model: enum-backed fields reference the closed
 * vocabulary in `src/constants/enums.ts`, and the UI shape is kept separate from
 * the wire shape (`KnowledgeEntryDto`) so no component ever sees the backend
 * casing (CLAUDE.md §6).
 */

import type { KNOWLEDGE_CATEGORIES } from "@/constants/enums";
import type { PublishStatus } from "./product";

/** Stable English `value` keys, narrowed straight from the enum constant. */
export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number]["value"];

/** A knowledge entry as surfaced in the admin UI (mapped from the API DTO). */
export interface KnowledgeEntry {
  /** Backend entry id (UUID). */
  id: string;
  category: KnowledgeCategory;
  /** Short title. */
  title: string;
  /** The "answer" — the content the agent reads back to the customer. */
  content: string;
  /** The "question" / situation this entry answers ("" when unset). */
  situation: string;
  tags: string[];
  /** Higher surfaces first to the agent when priorities tie. */
  priority: number;
  status: PublishStatus;
  /** `null` = general knowledge; a value = scoped to that product. */
  productId: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** The editable shape behind the add/edit form (publish kept as a boolean). */
export interface KnowledgeFormValues {
  title: string;
  category: KnowledgeCategory | "";
  situation: string;
  content: string;
  tags: string[];
  priority: number;
  productId: string | null;
  published: boolean;
}

/**
 * The submit payload the form hands to the data provider: the editable fields
 * plus a resolved publish `status`. The provider maps this onto the strict
 * camelCase create/update body and the dedicated (snake_case) publish route.
 */
export interface KnowledgeSubmit {
  category: KnowledgeCategory;
  title: string;
  content: string;
  situation: string;
  tags: string[];
  priority: number;
  productId: string | null;
  status: PublishStatus;
}
