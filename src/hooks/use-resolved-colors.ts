/**
 * Resolve image color ids to full {@link Color} records.
 *
 * The assignable list (GET /admin/colors) EXCLUDES system colors, so an image
 * tagged with the unassigned sentinel carries an id that is absent from that
 * list. To tell that case apart (and read its `family`), any id not already known
 * is fetched by id — GET /admin/colors/:id returns the sentinel too. The result
 * merges the known list with the resolved-by-id colors.
 *
 * Keyed per-id in React Query, so resolutions are cached/shared across images.
 */

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";

import { fetchColorById } from "@/providers/colors-data";
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

  const results = useQueries({
    queries: unknownIds.map((id) => ({
      queryKey: ["colors", "one", id],
      queryFn: () => fetchColorById(id),
      staleTime: 60_000,
    })),
  });

  return useMemo(() => {
    const map = new Map(known);
    results.forEach((res, i) => {
      if (res.data) map.set(unknownIds[i], res.data);
    });
    return map;
  }, [known, results, unknownIds]);
}
