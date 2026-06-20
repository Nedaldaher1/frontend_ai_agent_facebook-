/**
 * Custom data provider for the knowledge admin API (`/admin/knowledge`).
 * Registered alongside the products provider as the named `knowledge` provider
 * in `src/App.tsx`; knowledge pages select it via `dataProviderName: "knowledge"`.
 * Built on the same central `apiFetch` interceptor, so auth + error handling are
 * shared (CLAUDE.md §6).
 *
 *  - getList   → GET /admin/knowledge?limit&offset&category&published&product_id
 *                (wrapped `{ items, total }`; the list query keys are snake_case)
 *  - getOne    → no single-entry route exists; page the admin list and match by
 *                id (drafts included) so the edit form can load a draft
 *  - create    → POST /admin/knowledge (camelCase body) → optional publish
 *  - update    → PATCH fields (camelCase) and/or set publish (snake_case body)
 *  - deleteOne → DELETE /admin/knowledge/:id (hard delete)
 *
 * The list order (`priority DESC, createdAt DESC`) is fixed server-side and not
 * exposed, so sorters are intentionally ignored here.
 */

import type {
  BaseRecord,
  CreateParams,
  CreateResponse,
  CrudFilters,
  DataProvider,
  DeleteOneParams,
  DeleteOneResponse,
  GetListParams,
  GetListResponse,
  GetOneParams,
  GetOneResponse,
  UpdateParams,
  UpdateResponse,
} from "@refinedev/core";

import type { KnowledgeSubmit } from "@/types/knowledge";
import { API_URL } from "./constants";
import { apiFetch } from "./http";
import {
  dtoToKnowledge,
  payloadToBody,
  type KnowledgeDto,
} from "./knowledge-mapper";

type Paginated = { items: KnowledgeDto[]; total: number };

const PAGE_SCAN_LIMIT = 200;

/**
 * Translate Refine's filters into the list query's snake_case params:
 * `category` (eq), `status` eq published/draft → `published`, and `productId`
 * eq → `product_id`. Centralised here so the casing trap never leaks into pages.
 */
const applyFilters = (
  params: URLSearchParams,
  filters: CrudFilters | undefined,
): void => {
  for (const f of filters ?? []) {
    if (!("field" in f) || f.operator !== "eq") continue;
    if (f.value == null || f.value === "") continue;
    if (f.field === "category") {
      params.set("category", String(f.value));
    } else if (f.field === "status") {
      if (f.value === "published") params.set("published", "true");
      else if (f.value === "draft") params.set("published", "false");
    } else if (f.field === "productId") {
      params.set("product_id", String(f.value));
    }
  }
};

/** Page the admin list to find one entry by id (drafts included). */
const findKnowledgeById = async (id: string): Promise<KnowledgeDto | null> => {
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;
  while (offset < total) {
    const body = await apiFetch<Paginated>(
      `admin/knowledge?limit=${PAGE_SCAN_LIMIT}&offset=${offset}`,
    );
    total = body.total;
    const found = body.items.find((e) => e.id === id);
    if (found) return found;
    if (body.items.length === 0) break;
    offset += PAGE_SCAN_LIMIT;
  }
  return null;
};

/** Set publish state via the dedicated route — the only snake_case body. */
const setPublished = (id: string, isPublished: boolean): Promise<KnowledgeDto> =>
  apiFetch<KnowledgeDto>(`admin/knowledge/${id}/publish`, {
    method: "PATCH",
    json: { is_published: isPublished },
  });

/** Whether the payload carries entry fields (vs. a publish-only toggle). */
const KNOWLEDGE_FIELDS: (keyof KnowledgeSubmit)[] = [
  "category",
  "title",
  "content",
  "situation",
  "tags",
  "priority",
  "productId",
];
const hasKnowledgeFields = (p: Partial<KnowledgeSubmit>): boolean =>
  KNOWLEDGE_FIELDS.some((k) => k in p);

const notFound = () =>
  Object.assign(new Error("تعذّر العثور على المدخل"), { statusCode: 404 });

export const knowledgeDataProvider: DataProvider = {
  getApiUrl: () => API_URL,

  getList: async <TData extends BaseRecord = BaseRecord>({
    pagination,
    filters,
  }: GetListParams): Promise<GetListResponse<TData>> => {
    const pageSize = pagination?.pageSize ?? 50;
    const current = pagination?.currentPage ?? 1;
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String((current - 1) * pageSize),
    });
    applyFilters(params, filters);

    const body = await apiFetch<Paginated>(`admin/knowledge?${params}`);
    return {
      data: body.items.map((dto) => dtoToKnowledge(dto)) as unknown as TData[],
      total: body.total,
    };
  },

  getOne: async <TData extends BaseRecord = BaseRecord>({
    id,
  }: GetOneParams): Promise<GetOneResponse<TData>> => {
    const dto = await findKnowledgeById(String(id));
    if (!dto) throw notFound();
    return { data: dtoToKnowledge(dto) as unknown as TData };
  },

  create: async <TData extends BaseRecord = BaseRecord, TVariables = object>({
    variables,
  }: CreateParams<TVariables>): Promise<CreateResponse<TData>> => {
    const p = variables as Partial<KnowledgeSubmit>;
    let dto = await apiFetch<KnowledgeDto>("admin/knowledge", {
      method: "POST",
      json: payloadToBody(p),
    });
    if (p.status === "published") dto = await setPublished(dto.id, true);
    return { data: dtoToKnowledge(dto) as unknown as TData };
  },

  update: async <TData extends BaseRecord = BaseRecord, TVariables = object>({
    id,
    variables,
  }: UpdateParams<TVariables>): Promise<UpdateResponse<TData>> => {
    const p = variables as Partial<KnowledgeSubmit>;
    const eid = String(id);
    let dto: KnowledgeDto | undefined;

    if (hasKnowledgeFields(p)) {
      dto = await apiFetch<KnowledgeDto>(`admin/knowledge/${eid}`, {
        method: "PATCH",
        json: payloadToBody(p),
      });
    }
    if (typeof p.status === "string") {
      dto = await setPublished(eid, p.status === "published");
    }
    if (!dto) {
      const found = await findKnowledgeById(eid);
      if (!found) throw notFound();
      dto = found;
    }
    return { data: dtoToKnowledge(dto) as unknown as TData };
  },

  deleteOne: async <
    TData extends BaseRecord = BaseRecord,
    TVariables = object,
  >({
    id,
  }: DeleteOneParams<TVariables>): Promise<DeleteOneResponse<TData>> => {
    const dto = await apiFetch<KnowledgeDto>(`admin/knowledge/${id}`, {
      method: "DELETE",
    });
    return { data: dtoToKnowledge(dto) as unknown as TData };
  },
};
