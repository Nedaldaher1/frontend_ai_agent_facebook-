/**
 * Resolve image color ids to full {@link Color} records.
 *
 * The assignable list (GET /admin/colors) EXCLUDES system colors, so an image
 * tagged with the unassigned sentinel carries an id that is absent from that
 * list. To tell that case apart (and read its `family`), any id not already known
 * is fetched by id via Refine's `useMany` (GET /admin/colors/:id returns the
 * sentinel too). The result merges the known list with the resolved-by-id colors.
 *
 * Refine's `useMany` is used (not raw react-query) so it shares Refine's own
 * QueryClient and cache.
 */

import { useMemo } from "react";
import { useMany } from "@refinedev/core";

import type { Color } from "@/types/color";

export function useResolvedColors(
  ids: (string | null | undefined)[],
  known: Map<string, Color>,
): Map<string, Color> {
  // Ids present in the list need no fetch; the rest (e.g. the sentinel) do.
  const unknownIds = useMemo(() => {
    const seen = new Set<string>();
    for (const id of ids) if (id && !known.has(id)) seen.add(id);
    return Array.from(seen);
  }, [ids, known]);

  const { result } = useMany<Color>({
    resource: "colors",
    dataProviderName: "colors",
    ids: unknownIds,
    queryOptions: { enabled: unknownIds.length > 0 },
  });

  return useMemo(() => {
    const map = new Map(known);
    for (const color of result?.data ?? []) map.set(color.id, color);
    return map;
  }, [known, result]);
}
