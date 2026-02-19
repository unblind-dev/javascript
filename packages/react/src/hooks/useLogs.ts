import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useUnblindClientConfig } from "@/providers/UnblindProvider";
import { useTimeConfig } from "@/hooks/useTimeConfig";
import type { Log, PaginatedResponse, TimeConfig } from "../types";
import { deduceTimestamp } from "./utils";

export type UseLogsParams = {
  /**
   * Array of filters to apply to the logs query.
   */
  attributes?: Record<string, Array<string>>;
  body?: Array<string>;
  severity?: Array<string>;
  traceId?: string;
  spanId?: string;
  logId?: string;
} & TimeConfig;

export interface UseLogsReturn {
  logs: Array<Log>;
  isLoading: boolean;
  hasError: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
  refetch: () => void;
}

export type PaginatedLogsResponse = PaginatedResponse<Log>;

/**
 * Hook to fetch logs data with infinite scroll pagination.
 *
 * @param params - Configuration object with timeRange and filters.
 * @returns Object containing logs data, loading states, and pagination controls.
 */
export function useLogs(props: UseLogsParams): UseLogsReturn {
  const { apiBaseUrl, fetchImpl = fetch } = useUnblindClientConfig();
  const { timeRange, startTime, endTime } = useTimeConfig(props);
  const { attributes, body, severity, traceId, spanId, logId } = props;

  const query = useInfiniteQuery<PaginatedLogsResponse>({
    queryKey: [
      "unblind",
      "logs",
      timeRange,
      startTime,
      endTime,
      body,
      severity,
      logId,
      JSON.stringify(attributes),
    ],
    queryFn: async ({ pageParam }) => {
      const [deducedStartTime, deducedEndTime] = deduceTimestamp(
        timeRange,
        startTime,
        endTime,
      );

      const res = await fetchImpl(`${apiBaseUrl}/tenants/logs`, {
        method: "POST",
        body: JSON.stringify({
          attributes,
          body,
          severity,
          traceId,
          spanId,
          logId,
          startTime: deducedStartTime,
          endTime: deducedEndTime,
          pagination: {
            page: pageParam,
          },
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Error fetching logs");

      const { data, nextPage } = await res.json();

      if (!data) {
        throw new Error("data not found");
      }

      return { data, nextPage } as PaginatedLogsResponse;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const logs = useMemo(() => {
    if (!query.data) return [];
    return query.data.pages.flatMap((page) => page.data || []);
  }, [query.data]);

  return {
    logs,
    isLoading: query.isLoading,
    hasError: query.isError,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
  };
}
