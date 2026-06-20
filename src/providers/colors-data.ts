/**
 * Custom data providers for the color system, both built on the central
 * `apiFetch` interceptor so auth + the `{ timestamp, path, error }` envelope are
 * handled in one place (CLAUDE.md §6). Registered in `src/App.tsx` as the named
 * providers `colors` and `colorSynonyms`; pages/components select them via
 * `dataProviderName`.
 *
 * Contract (verified against the backend, not the stale generated types):
 *  - colors.getList   → GET /admin/colors            (BARE array, newest first;
 *                       no total header → total = length. EXCLUDES system colors,
 *                       so the unassigned sentinel is never listed/offered. The
 *                       vocabulary is small, so one generous page is fetched and
 *                       paginated client-side.)
 *  - colors.getOne    → GET /admin/colors/:id         (color + `synonyms[]`;
 *                       returns the sentinel too, so the display path stays intact)
 *  - colors.create    → POST /admin/colors            (camelCase, strict body)
 *  - colors.update    → PATCH /admin/colors/:id       (camelCase, strict body;
 *                       a `family` change needs `?confirmFamilyChange=true`, passed
 *                       through `meta.confirmFamilyChange`)
 *  - colors.deleteOne → DELETE /admin/colors/:id      (the color is deleted and
 *                       its images retagged to the sentinel; 409 = transient
 *                       concurrent re-tag, 400 = system color). The structured
 *                       result is read via {@link deleteColorById} for the UI's
 *                       impact flow, so deleteOne just returns the id.
 *
 * Non-CRUD color endpoints live as standalone functions below (they fall outside
 * Refine's DataProvider interface): {@link fetchColorUsage},
 * {@link fetchUnassignedUsage}, {@link deleteColorById}, {@link fetchColorById}.
 *
 *  - colorSynonyms.* → /admin/color-synonyms (BARE array list). `color-synonyms`
 *    is intentionally NOT a registered resource (it would show in the sidebar);
 *    its mutations are driven through this provider by `dataProviderName` and
 *    managed inside the color editor.
 */

import type {
  BaseRecord,
  CreateParams,
  CreateResponse,
  DataProvider,
  DeleteOneParams,
  DeleteOneResponse,
  GetListResponse,
  GetManyParams,
  GetManyResponse,
  GetOneParams,
  GetOneResponse,
  UpdateParams,
  UpdateResponse,
} from "@refinedev/core";

import type {
  Color,
  ColorSubmit,
  ColorUsage,
  DeleteColorResult,
} from "@/types/color";
import { API_URL } from "./constants";
import { apiFetch } from "./http";
import {
  dtoToColor,
  dtoToColorSynonym,
  dtoToColorUsage,
  submitToColorBody,
  submitToCreateColorBody,
  type ColorDto,
  type ColorSynonymDto,
  type ColorUsageDto,
  type ColorWithSynonymsDto,
} from "./color-mapper";

/** Both lists are bare arrays with no count; fetch one generous page. */
const LIST_LIMIT = 500;

export const colorsDataProvider: DataProvider = {
  getApiUrl: () => API_URL,

  getList: async <TData extends BaseRecord = BaseRecord>(): Promise<
    GetListResponse<TData>
  > => {
    const rows = await apiFetch<ColorDto[]>(
      `admin/colors?limit=${LIST_LIMIT}&offset=0`,
    );
    return {
      data: rows.map((dto) => dtoToColor(dto)) as unknown as TData[],
      total: rows.length,
    };
  },

  getOne: async <TData extends BaseRecord = BaseRecord>({
    id,
  }: GetOneParams): Promise<GetOneResponse<TData>> => {
    const dto = await apiFetch<ColorWithSynonymsDto>(`admin/colors/${id}`);
    return { data: dtoToColor(dto) as unknown as TData };
  },

  // No batch endpoint exists; fetch each by id (includes the sentinel). Used by
  // useMany to resolve image colors that fall outside the assignable list.
  getMany: async <TData extends BaseRecord = BaseRecord>({
    ids,
  }: GetManyParams): Promise<GetManyResponse<TData>> => {
    const rows = await Promise.all(ids.map((id) => fetchColorById(String(id))));
    return { data: rows as unknown as TData[] };
  },

  create: async <TData extends BaseRecord = BaseRecord, TVariables = object>({
    variables,
  }: CreateParams<TVariables>): Promise<CreateResponse<TData>> => {
    const dto = await apiFetch<ColorDto>("admin/colors", {
      method: "POST",
      json: submitToCreateColorBody(variables as ColorSubmit),
    });
    return { data: dtoToColor(dto) as unknown as TData };
  },

  update: async <TData extends BaseRecord = BaseRecord, TVariables = object>({
    id,
    variables,
    meta,
  }: UpdateParams<TVariables>): Promise<UpdateResponse<TData>> => {
    // Changing the standard key (`family`) needs explicit confirmation; the
    // caller signals it via `meta.confirmFamilyChange`. Without the flag a
    // family change is rejected with 409 (handled by the form's fallback).
    const query = meta?.confirmFamilyChange ? "?confirmFamilyChange=true" : "";
    const dto = await apiFetch<ColorDto>(`admin/colors/${id}${query}`, {
      method: "PATCH",
      json: submitToColorBody(variables as ColorSubmit),
    });
    return { data: dtoToColor(dto) as unknown as TData };
  },

  // The DELETE response is a delete-impact summary, not a ColorDto. Refine's
  // useDelete only needs an id-bearing record back; the UI's removal flow reads
  // the real counts via deleteColorById instead.
  deleteOne: async <
    TData extends BaseRecord = BaseRecord,
    TVariables = object,
  >({
    id,
  }: DeleteOneParams<TVariables>): Promise<DeleteOneResponse<TData>> => {
    await apiFetch<DeleteColorResult>(`admin/colors/${id}`, {
      method: "DELETE",
    });
    return { data: { id } as unknown as TData };
  },
};

/** Fetch a single color by id (includes the sentinel) — used to resolve an
 *  image's current color when it is not in the assignable list. */
export async function fetchColorById(id: string): Promise<Color> {
  const dto = await apiFetch<ColorWithSynonymsDto>(`admin/colors/${id}`);
  return dtoToColor(dto);
}

/** Impact report for a color: products/images that reference it (≤50 names). */
export async function fetchColorUsage(id: string): Promise<ColorUsage> {
  const dto = await apiFetch<ColorUsageDto>(`admin/colors/${id}/usage`);
  return dtoToColorUsage(dto);
}

/** The review queue: products that currently have sentinel-tagged images. */
export async function fetchUnassignedUsage(): Promise<ColorUsage> {
  const dto = await apiFetch<ColorUsageDto>(`admin/colors/unassigned/usage`);
  return dtoToColorUsage(dto);
}

/**
 * Delete a color and retag its images to the unassigned sentinel, returning how
 * many images/products now need review. Errors propagate as {@link HttpError}:
 * 409 = transient concurrent re-tag (retry), 400 = system color (not reachable
 * from the UI, since system colors aren't listed).
 */
export async function deleteColorById(id: string): Promise<DeleteColorResult> {
  return apiFetch<DeleteColorResult>(`admin/colors/${id}`, { method: "DELETE" });
}

/** Body for color-synonym create/update — only the two strict camelCase keys. */
type SynonymVars = { term?: string; colorId?: string };

const synonymBody = (v: SynonymVars): Record<string, string> => {
  const body: Record<string, string> = {};
  if (typeof v.term === "string") body.term = v.term.trim();
  if (typeof v.colorId === "string") body.colorId = v.colorId;
  return body;
};

export const colorSynonymsDataProvider: DataProvider = {
  getApiUrl: () => API_URL,

  getList: async <TData extends BaseRecord = BaseRecord>(): Promise<
    GetListResponse<TData>
  > => {
    const rows = await apiFetch<ColorSynonymDto[]>(
      `admin/color-synonyms?limit=${LIST_LIMIT}&offset=0`,
    );
    return {
      data: rows.map((dto) => dtoToColorSynonym(dto)) as unknown as TData[],
      total: rows.length,
    };
  },

  // No single-synonym route exists; scan the list. Never used by the UI, but
  // required by the DataProvider interface.
  getOne: async <TData extends BaseRecord = BaseRecord>({
    id,
  }: GetOneParams): Promise<GetOneResponse<TData>> => {
    const rows = await apiFetch<ColorSynonymDto[]>(
      `admin/color-synonyms?limit=${LIST_LIMIT}&offset=0`,
    );
    const found = rows.find((r) => r.id === id);
    if (!found) {
      throw Object.assign(new Error("تعذّر العثور على المصطلح"), {
        statusCode: 404,
      });
    }
    return { data: dtoToColorSynonym(found) as unknown as TData };
  },

  create: async <TData extends BaseRecord = BaseRecord, TVariables = object>({
    variables,
  }: CreateParams<TVariables>): Promise<CreateResponse<TData>> => {
    const dto = await apiFetch<ColorSynonymDto>("admin/color-synonyms", {
      method: "POST",
      json: synonymBody(variables as SynonymVars),
    });
    return { data: dtoToColorSynonym(dto) as unknown as TData };
  },

  update: async <TData extends BaseRecord = BaseRecord, TVariables = object>({
    id,
    variables,
  }: UpdateParams<TVariables>): Promise<UpdateResponse<TData>> => {
    const dto = await apiFetch<ColorSynonymDto>(`admin/color-synonyms/${id}`, {
      method: "PATCH",
      json: synonymBody(variables as SynonymVars),
    });
    return { data: dtoToColorSynonym(dto) as unknown as TData };
  },

  deleteOne: async <
    TData extends BaseRecord = BaseRecord,
    TVariables = object,
  >({
    id,
  }: DeleteOneParams<TVariables>): Promise<DeleteOneResponse<TData>> => {
    const dto = await apiFetch<ColorSynonymDto>(`admin/color-synonyms/${id}`, {
      method: "DELETE",
    });
    return { data: dtoToColorSynonym(dto) as unknown as TData };
  },
};
