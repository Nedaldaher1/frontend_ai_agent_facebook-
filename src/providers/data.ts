/**
 * Custom data provider for the admin API. `@refinedev/simple-rest` can't model
 * this backend (it assumes `_start/_end` + `x-total-count`), so we map Refine's
 * interface onto the real contract here and keep every data-shape concern out of
 * the pages (CLAUDE.md §6):
 *
 *  - `getList`   → GET /admin/products?limit&offset&published  (wrapped result)
 *  - `getOne`    → no such route exists; page the admin list and match by id,
 *                  then load images so the edit form gets storage keys
 *  - `create`    → POST product → upload held files → optional publish
 *  - `update`    → reconcile images (delete/upload/primary) → PATCH fields →
 *                  set publish state (publish body is snake_case)
 *  - `deleteOne` → DELETE /admin/products/:id
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
  HttpError,
  UpdateParams,
  UpdateResponse,
} from "@refinedev/core";

import type { Product, ProductImage } from "@/types/product";
import { API_URL } from "./constants";
import { apiFetch } from "./http";
import {
  dtoToProduct,
  payloadToBody,
  type ProductDto,
  type ProductImageItem,
} from "./product-mapper";

type Paginated = { items: ProductDto[]; total: number };

const PAGE_SCAN_LIMIT = 200;

/** Read the publish filter (the only server-side one) from Refine's filters. */
const publishedFromFilters = (
  filters: CrudFilters | undefined,
): boolean | undefined => {
  for (const f of filters ?? []) {
    if ("field" in f && f.field === "status" && f.operator === "eq") {
      if (f.value === "published") return true;
      if (f.value === "draft") return false;
    }
  }
  return undefined;
};

/** Whether the payload carries real product fields (vs. a publish-only toggle). */
const PRODUCT_FIELDS: (keyof Product)[] = [
  "name",
  "description",
  "price",
  "colors",
  "sizes",
  "maxWeight",
  "measurements",
  "stock",
  "sleeve",
  "fabric",
  "occasion",
  "embroidery",
  "tags",
];
const hasProductFields = (p: Partial<Product>): boolean =>
  PRODUCT_FIELDS.some((k) => k in p);

/** Page the admin list to find one product by id (drafts included). */
const findProductById = async (id: string): Promise<ProductDto | null> => {
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;
  while (offset < total) {
    const body = await apiFetch<Paginated>(
      `admin/products?limit=${PAGE_SCAN_LIMIT}&offset=${offset}`,
    );
    total = body.total;
    const found = body.items.find((p) => p.id === id);
    if (found) return found;
    if (body.items.length === 0) break;
    offset += PAGE_SCAN_LIMIT;
  }
  return null;
};

const uploadImages = async (
  id: string,
  files: File[],
): Promise<ProductDto> => {
  const fd = new FormData();
  for (const file of files) fd.append("files", file);
  try {
    // No Content-Type header — the browser sets the multipart boundary.
    return await apiFetch<ProductDto>(`products/${id}/images`, {
      method: "POST",
      body: fd,
    });
  } catch (error) {
    // Turn the upload-specific HTTP statuses into clear Arabic messages.
    const status = (error as HttpError)?.statusCode;
    const message =
      status === 415
        ? "صيغة صورة غير مدعومة — استخدم JPG أو PNG أو WebP"
        : status === 413
          ? "حجم الصورة يتجاوز الحد المسموح (5 ميغابايت)"
          : status === 400
            ? "لم يتم اختيار صورة صالحة"
            : ((error as HttpError)?.message ?? "تعذّر رفع الصور");
    throw Object.assign(new Error(message), { statusCode: status ?? 0 });
  }
};

const setPublished = (id: string, isPublished: boolean): Promise<ProductDto> =>
  // ⚠️ The only snake_case body in the API.
  apiFetch<ProductDto>(`admin/products/${id}/publish`, {
    method: "PATCH",
    json: { is_published: isPublished },
  });

/**
 * Bring the backend's images in line with the form's gallery: delete images the
 * user removed (by storage `key`), upload newly-added files, and make the first
 * gallery image primary when it is an existing image. Returns the latest DTO any
 * of these calls produced, if any.
 */
const reconcileImages = async (
  id: string,
  images: ProductImage[],
): Promise<ProductDto | undefined> => {
  const current = await apiFetch<ProductImageItem[]>(
    `admin/products/${id}/images`,
  ).catch(() => [] as ProductImageItem[]);

  const keptKeys = new Set(
    images.map((im) => im.key).filter((k): k is string => !!k),
  );
  let dto: ProductDto | undefined;

  for (const item of current) {
    if (!keptKeys.has(item.key)) {
      dto = await apiFetch<ProductDto>(
        `admin/products/${id}/images/${encodeURIComponent(item.key)}`,
        { method: "DELETE" },
      );
    }
  }

  const files = images.map((im) => im.file).filter((f): f is File => !!f);
  if (files.length) dto = await uploadImages(id, files);

  const primary = images[0];
  if (primary?.key) {
    dto = await apiFetch<ProductDto>(
      `admin/products/${id}/images/${encodeURIComponent(primary.key)}/primary`,
      { method: "PATCH" },
    );
  }

  return dto;
};

export const dataProvider: DataProvider = {
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
    const published = publishedFromFilters(filters);
    if (published !== undefined) params.set("published", String(published));

    const body = await apiFetch<Paginated>(`admin/products?${params}`);
    return {
      data: body.items.map((dto) => dtoToProduct(dto)) as unknown as TData[],
      total: body.total,
    };
  },

  getOne: async <TData extends BaseRecord = BaseRecord>({
    id,
  }: GetOneParams): Promise<GetOneResponse<TData>> => {
    const pid = String(id);
    const dto = await findProductById(pid);
    if (!dto) {
      throw Object.assign(new Error("تعذّر العثور على المنتج"), {
        statusCode: 404,
      });
    }
    const images = await apiFetch<ProductImageItem[]>(
      `admin/products/${pid}/images`,
    ).catch(() => [] as ProductImageItem[]);
    return { data: dtoToProduct(dto, images) as unknown as TData };
  },

  create: async <TData extends BaseRecord = BaseRecord, TVariables = object>({
    variables,
  }: CreateParams<TVariables>): Promise<CreateResponse<TData>> => {
    const p = variables as Partial<Product>;
    let dto = await apiFetch<ProductDto>("admin/products", {
      method: "POST",
      json: payloadToBody(p),
    });

    const files = (p.images ?? [])
      .map((im) => im.file)
      .filter((f): f is File => !!f);
    if (files.length) dto = await uploadImages(dto.id, files);

    if (p.status === "published") dto = await setPublished(dto.id, true);

    return { data: dtoToProduct(dto) as unknown as TData };
  },

  update: async <TData extends BaseRecord = BaseRecord, TVariables = object>({
    id,
    variables,
  }: UpdateParams<TVariables>): Promise<UpdateResponse<TData>> => {
    const p = variables as Partial<Product>;
    const pid = String(id);
    let dto: ProductDto | undefined;

    if ("images" in p) {
      dto = (await reconcileImages(pid, p.images ?? [])) ?? dto;
    }
    if (hasProductFields(p)) {
      dto = await apiFetch<ProductDto>(`admin/products/${pid}`, {
        method: "PATCH",
        json: payloadToBody(p),
      });
    }
    if (typeof p.status === "string") {
      dto = await setPublished(pid, p.status === "published");
    }
    if (!dto) {
      const found = await findProductById(pid);
      if (!found) {
        throw Object.assign(new Error("تعذّر العثور على المنتج"), {
          statusCode: 404,
        });
      }
      dto = found;
    }
    return { data: dtoToProduct(dto) as unknown as TData };
  },

  deleteOne: async <
    TData extends BaseRecord = BaseRecord,
    TVariables = object,
  >({
    id,
  }: DeleteOneParams<TVariables>): Promise<DeleteOneResponse<TData>> => {
    const dto = await apiFetch<ProductDto>(`admin/products/${id}`, {
      method: "DELETE",
    });
    return { data: dtoToProduct(dto) as unknown as TData };
  },
};
