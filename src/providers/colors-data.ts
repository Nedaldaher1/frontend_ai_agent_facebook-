/**
 * Custom data providers for the color system, both built on the central
 * `apiFetch` interceptor so auth + the `{ timestamp, path, error }` envelope are
 * handled in one place (CLAUDE.md §6). Registered in `src/App.tsx` as the named
 * providers `colors` and `colorSynonyms`; pages/components select them via
 * `dataProviderName`.
 *
 * Contract (verified against the backend, not the stale generated types):
 *  - colors.getList   → GET /admin/colors            (BARE array, newest first;
 *                       no total header → total = length. The vocabulary is
 *                       small, so one generous page is fetched and paginated
 *                       client-side.)
 *  - colors.getOne    → GET /admin/colors/:id         (color + `synonyms[]`)
 *  - colors.create    → POST /admin/colors            (camelCase, strict body)
 *  - colors.update    → PATCH /admin/colors/:id       (camelCase, strict body)
 *  - colors.deleteOne → DELETE /admin/colors/:id      (409 when attached to an
 *                       image — passed through for the UI to message in Arabic)
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
  GetOneParams,
  GetOneResponse,
  UpdateParams,
  UpdateResponse,
} from "@refinedev/core";

import type { ColorSubmit } from "@/types/color";
import { API_URL } from "./constants";
import { apiFetch } from "./http";
import {
  dtoToColor,
  dtoToColorSynonym,
  submitToColorBody,
  type ColorDto,
  type ColorSynonymDto,
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

  create: async <TData extends BaseRecord = BaseRecord, TVariables = object>({
    variables,
  }: CreateParams<TVariables>): Promise<CreateResponse<TData>> => {
    const dto = await apiFetch<ColorDto>("admin/colors", {
      method: "POST",
      json: submitToColorBody(variables as ColorSubmit),
    });
    return { data: dtoToColor(dto) as unknown as TData };
  },

  update: async <TData extends BaseRecord = BaseRecord, TVariables = object>({
    id,
    variables,
  }: UpdateParams<TVariables>): Promise<UpdateResponse<TData>> => {
    const dto = await apiFetch<ColorDto>(`admin/colors/${id}`, {
      method: "PATCH",
      json: submitToColorBody(variables as ColorSubmit),
    });
    return { data: dtoToColor(dto) as unknown as TData };
  },

  deleteOne: async <
    TData extends BaseRecord = BaseRecord,
    TVariables = object,
  >({
    id,
  }: DeleteOneParams<TVariables>): Promise<DeleteOneResponse<TData>> => {
    // A 409 here means the color is still attached to a product image; the
    // HttpError propagates so the list page can show the Arabic guidance.
    const dto = await apiFetch<ColorDto>(`admin/colors/${id}`, {
      method: "DELETE",
    });
    return { data: dtoToColor(dto) as unknown as TData };
  },
};

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
