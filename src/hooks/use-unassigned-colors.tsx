/**
 * Shared access to the "needs review" queue — products that currently have
 * images tagged with the unassigned sentinel (GET /admin/colors/unassigned/usage).
 *
 * The sidebar count badge, the review page, and post-action drains all read the
 * SAME context state, so the queue stays in sync and self-drains: delete a used
 * color or fix a product, call `refresh()`, and every consumer updates at once.
 *
 * A plain React context (not React Query) is used deliberately: Refine owns its
 * own QueryClient and does not expose it to the standard react-query context, so
 * app-level react-query hooks have no client. This keeps the feature self-
 * contained and framework-agnostic.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { fetchUnassignedUsage } from "@/providers/colors-data";
import type { ColorUsage } from "@/types/color";

type UnassignedUsageValue = {
  usage: ColorUsage | null;
  isLoading: boolean;
  isError: boolean;
  /** Refetch the queue (after a delete or a fix) so consumers drain. */
  refresh: () => Promise<void>;
};

const UnassignedUsageContext = createContext<UnassignedUsageValue | null>(null);

/** Provides the live review-queue state to the authenticated app shell. */
export function UnassignedUsageProvider({ children }: { children: ReactNode }) {
  const [usage, setUsage] = useState<ColorUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      setUsage(await fetchUnassignedUsage());
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<UnassignedUsageValue>(
    () => ({ usage, isLoading, isError, refresh }),
    [usage, isLoading, isError, refresh],
  );

  return (
    <UnassignedUsageContext.Provider value={value}>
      {children}
    </UnassignedUsageContext.Provider>
  );
}

/** Read the shared review-queue state. Must be used within the provider. */
export function useUnassignedUsage(): UnassignedUsageValue {
  const ctx = useContext(UnassignedUsageContext);
  if (!ctx) {
    throw new Error(
      "useUnassignedUsage must be used within an UnassignedUsageProvider",
    );
  }
  return ctx;
}
