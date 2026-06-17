import { createSimpleRestDataProvider } from "@refinedev/rest/simple-rest";
import type {
  BaseRecord,
  DataProvider,
  GetListParams,
  GetOneParams,
} from "@refinedev/core";
import { API_URL } from "./constants";

const base = createSimpleRestDataProvider({ apiURL: API_URL });

export const kyInstance = base.kyInstance;

/**
 * `@refinedev/rest`'s simple-rest `getList`/`getOne` don't check `response.ok` —
 * on an HTTP error (4xx/5xx) they map the error body instead of throwing, so
 * Refine's `isError` never trips and a failed request looks "empty". Wrap them
 * to surface server errors, which is what drives the list/form error states.
 * (Network failures already throw on their own.) Keeping this in the provider —
 * not in the pages — per CLAUDE.md §6.
 */
export const dataProvider: DataProvider = {
  ...base.dataProvider,
  getList: async <TData extends BaseRecord = BaseRecord>(
    params: GetListParams,
  ) => {
    const result = await base.dataProvider.getList<TData>(params);
    if (!Array.isArray(result.data)) {
      throw new Error("تعذّر تحميل البيانات من الخادم");
    }
    return result;
  },
  getOne: async <TData extends BaseRecord = BaseRecord>(
    params: GetOneParams,
  ) => {
    const result = await base.dataProvider.getOne<TData>(params);
    const data = result?.data as { id?: unknown } | undefined;
    if (!data || data.id == null) {
      throw new Error("تعذّر تحميل العنصر من الخادم");
    }
    return result;
  },
};
