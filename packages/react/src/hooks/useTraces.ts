import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useUnblindClientConfig } from "@/providers/UnblindProvider";
import { useTimeConfig } from "@/hooks/useTimeConfig";
import type {
  Span,
  PaginatedResponse,
  TimeConfig,
  StatusCode,
  SpanKind,
} from "../types";
import { deduceTimestamp } from "./utils";

export type UseTracesParams = {
  /**
   * Filter by one or many trace IDs.
   */
  traceId?: string | Array<string>;
  /**
   * Filter by one or many span IDs.
   */
  spanId?: string | Array<string>;
  /**
   * Filter by direct parent span ID.
   */
  parentSpanId?: string | Array<string>;
  /**
   * Filter by span name. Supports wildcard patterns like `%checkout%`.
   */
  spanName?: string | Array<string>;
  /**
   * Span kind filter.
   */
  spanKind?: SpanKind | Array<SpanKind>;
  /**
   * Status code filter.
   */
  statusCode?: StatusCode | Array<StatusCode>;
  /**
   * Minimum span duration in nanoseconds (inclusive).
   */
  durationMin?: number;
  /**
   * Maximum span duration in nanoseconds (inclusive).
   */
  durationMax?: number;
  /**
   * Attributes object (resource/span attributes),
   * e.g. `{ "service.name": "checkout-service" }`.
   */
  attributes?: Record<string, Array<string>>;
  /**
   * Include attributes in each returned span.
   */
  includeAttributes?: boolean;
} & TimeConfig;

export interface UseTracesReturn {
  spans: Array<Span>;
  isLoading: boolean;
  hasError: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
  refetch: () => void;
}

export type PaginatedSpansResponse = PaginatedResponse<Span>;

/**
 * Hook to fetch traces/spans data with infinite scroll pagination.
 *
 * @param params - Configuration object with timeRange and span filters.
 * @returns Object containing spans data, loading states, and pagination controls.
 */
export function useTraces(props: UseTracesParams): UseTracesReturn {
  const { apiBaseUrl, fetchImpl = fetch } = useUnblindClientConfig();
  const { timeRange, startTime, endTime } = useTimeConfig(props);

  const {
    traceId,
    spanId,
    parentSpanId,
    spanName,
    spanKind,
    statusCode,
    durationMin,
    durationMax,
    attributes,
    includeAttributes,
  } = props;

  const query = useInfiniteQuery<PaginatedSpansResponse>({
    queryKey: [
      "unblind",
      "traces",
      timeRange,
      startTime,
      endTime,
      traceId,
      spanId,
      parentSpanId,
      spanName,
      spanKind,
      statusCode,
      durationMin,
      durationMax,
      includeAttributes,
      JSON.stringify(attributes),
    ],
    queryFn: async ({ pageParam }) => {
      const [deducedStartTime, deducedEndTime] = deduceTimestamp(
        timeRange,
        startTime,
        endTime,
      );

      const res = await fetchImpl(`${apiBaseUrl}/tenants/traces`, {
        method: "POST",
        body: JSON.stringify({
          traceId,
          spanId,
          parentSpanId,
          spanName,
          spanKind,
          statusCode,
          durationMin,
          durationMax,
          attributes,
          includeAttributes,
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

      if (!res.ok) throw new Error("Error fetching traces");

      const { data, nextPage } = await res.json();
      if (!data) {
        throw new Error("data not found");
      }

      return { data, nextPage } as PaginatedSpansResponse;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const spans = useMemo(() => {
    if (!query.data) return [];
    return query.data.pages.flatMap((page) => page.data || []);
  }, [query.data]);

  return {
    spans,
    isLoading: query.isLoading,
    hasError: query.isError,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
  };
}
