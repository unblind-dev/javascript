import { useQuery } from "@tanstack/react-query";
import { useUnblindClientConfig } from "../providers/UnblindProvider";
import type { MetricMetadataList } from "../types";

export interface UseMetricsReturn {
  metrics: MetricMetadataList | undefined;
  isLoading: boolean;
  hasError: boolean;
  refetch: () => void;
}

/**
 * Hook to fetch the list of available metrics metadata.
 *
 * @returns Object containing the metrics list, loading state, error state, and refetch function.
 */
export function useMetrics(): UseMetricsReturn {
  const { apiBaseUrl, fetchImpl = fetch } = useUnblindClientConfig();

  const query = useQuery<MetricMetadataList>({
    queryKey: ["unblind", "metrics"],
    queryFn: async () => {
      const res = await fetchImpl(`${apiBaseUrl}/metrics`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Error loading metrics metadata");
      }

      if (res.status === 200) {
        const { data: metrics } = await res.json();
        return metrics;
      } else {
        throw new Error("Unexpected status code");
      }
    },
  });

  return {
    metrics: query.data,
    isLoading: query.isLoading,
    hasError: query.isError,
    refetch: query.refetch,
  };
}
