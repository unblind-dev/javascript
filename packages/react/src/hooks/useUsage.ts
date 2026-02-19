import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useUnblindClientConfig } from "@/providers/UnblindProvider";
import { TimeConfig } from "@/types";
import { useTimeConfig } from "@/hooks/useTimeConfig";
import { deduceTimestamp } from "./utils";

export interface Usage {
  period: {
    startTime: number;
    endTime: number;
  };
  metrics: {
    units: number;
  };
  logs: {
    bytes: number;
    units: number;
  };
}

type UsageResponse = {
  data: Array<Usage>;
};

export type UseUsageParams = TimeConfig;

export interface UseUsageReturn {
  usage: Array<Usage>;
  isLoading: boolean;
  hasError: boolean;
  refetch: () => void;
}

/**
 * Hook to fetch usage data.
 *
 * @param params - Configuration object with optional timeRange.
 * @returns Object containing usage data, loading state, and error state.
 */
export function useUsage(params: UseUsageParams): UseUsageReturn {
  const { apiBaseUrl, fetchImpl = fetch } = useUnblindClientConfig();
  const { startTime, endTime, timeRange } = useTimeConfig(params);

  const hasValidTimeConfig =
    (typeof startTime === "number" && typeof endTime === "number") ||
    !!timeRange;

  const query = useQuery<Array<Usage>>({
    queryKey: ["unblind", "usage", timeRange, startTime, endTime],
    queryFn: async () => {
      const [calculatedStartTime, calculatedEndTime] = deduceTimestamp(
        timeRange,
        startTime,
        endTime,
      );

      const endpoint = `${apiBaseUrl}/tenants/usage`;

      const res = await fetchImpl(endpoint, {
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startTime: calculatedStartTime,
          endTime: calculatedEndTime,
        }),
      });
      if (!res.ok) throw new Error("Error fetching usage");
      const { data: usage } = (await res.json()) as UsageResponse;
      if (!usage) {
        throw new Error("usage not found");
      }

      return usage;
    },
    enabled: hasValidTimeConfig,
  });

  const usage: Array<Usage> = useMemo(() => {
    if (!query.data) return [];
    return query.data || [];
  }, [query]);

  const isLoading = query.isLoading || query.isRefetching;
  const hasError = query.isError;

  return {
    usage,
    isLoading,
    hasError,
    refetch: query.refetch,
  };
}
