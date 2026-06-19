/**
 * Shared access to the "needs review" queue — products that currently have
 * images tagged with the unassigned sentinel (GET /admin/colors/unassigned/usage).
 *
 * The sidebar count badge, the review page, and post-action invalidations all key
 * off the SAME React Query key so the queue stays in sync and self-drains: delete
 * a used color or fix an image, invalidate, and every consumer updates at once.
 *
 * Uses Refine's underlying React Query client (Refine renders the
 * QueryClientProvider), so these queries share its cache.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchUnassignedUsage } from "@/providers/colors-data";
import type { ColorUsage } from "@/types/color";

/** Stable query key for the unassigned (needs-review) usage report. */
export const UNASSIGNED_USAGE_KEY = ["colors", "unassigned-usage"] as const;

/** Live "needs review" report (products with sentinel-tagged images). */
export function useUnassignedUsage() {
  return useQuery<ColorUsage>({
    queryKey: UNASSIGNED_USAGE_KEY,
    queryFn: fetchUnassignedUsage,
    staleTime: 30_000,
  });
}

/**
 * Returns a callback that refetches the unassigned queue everywhere (the nav
 * badge and the review page). Call it after a delete or a fix so the queue
 * self-drains without manual pagination.
 */
export function useInvalidateUnassignedUsage() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: UNASSIGNED_USAGE_KEY });
}
