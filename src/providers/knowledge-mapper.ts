/**
 * Pure translation between the backend `KnowledgeEntryDto` and the UI
 * `KnowledgeEntry` / submit-payload shapes. Kept beside the data provider (its
 * only consumer) so no component ever sees the wire shape (CLAUDE.md §6).
 *
 * Casing note: the create/update body is camelCase (the backend schema is
 * `.strict()` — an unknown or misspelled key is rejected with 400). The publish
 * route and the list query use snake_case instead; those live in
 * `knowledge-data.ts`. We never send `createdBy` (server-owned) or `isPublished`
 * (publish has its own dedicated route).
 */

import type { components } from "@/types/api";
import type {
  KnowledgeCategory,
  KnowledgeEntry,
  KnowledgeSubmit,
} from "@/types/knowledge";

export type KnowledgeDto = components["schemas"]["KnowledgeEntryDto"];
/** Body for POST/PATCH — the strict camelCase create/update shape. */
export type KnowledgeBody = components["schemas"]["CreateKnowledgeEntryDto"];

/** Map a backend `KnowledgeEntryDto` into the UI `KnowledgeEntry`. */
export const dtoToKnowledge = (dto: KnowledgeDto): KnowledgeEntry => ({
  id: dto.id,
  category: dto.category,
  title: dto.title,
  content: dto.content,
  situation: dto.situation ?? "",
  tags: dto.tags ?? [],
  priority: dto.priority,
  status: dto.isPublished ? "published" : "draft",
  productId: dto.productId,
  createdAt: dto.createdAt,
  updatedAt: dto.updatedAt,
});

/**
 * Map a submit payload into the strict camelCase create/update body. A blank
 * `situation` becomes `null`; `productId` null = general knowledge. Never
 * includes `isPublished` or `createdBy`.
 */
export const payloadToBody = (p: Partial<KnowledgeSubmit>): KnowledgeBody => ({
  category: (p.category ?? "general") as KnowledgeCategory,
  title: (p.title ?? "").trim(),
  content: (p.content ?? "").trim(),
  situation: p.situation?.trim() ? p.situation.trim() : null,
  tags: p.tags ?? [],
  priority: Number.isFinite(p.priority) ? Number(p.priority) : 0,
  productId: p.productId ?? null,
});
