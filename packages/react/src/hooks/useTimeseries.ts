import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useUnblindClientConfig } from "@/providers/UnblindProvider";
import { useTimeConfig } from "@/hooks/useTimeConfig";
import type {
  MetricMetadata,
  Serie,
  TimeseriesQuery,
  TimeseriesQueryConfig,
} from "../types";
import { deduceTimestamp } from "./utils";

/**
 * Response structure from the timeseries API.
 */
type TimeseriesResponse = {
  request: SeriesAPIRequest;
  metadata: Record<string, MetricMetadata>;
  series: Array<Serie>;
  times: Array<number>;
  isEmpty?: boolean;
};

/**
 * Internal API request structure.
 */
interface SeriesAPIRequest {
  queries: Array<TimeseriesQuery>;
  startTime: number;
  endTime: number;
  interval?: number;
}

export interface UseTimeseriesParams extends Pick<
  TimeseriesQueryConfig,
  "timeRange" | "startTime" | "endTime" | "interval"
> {
  /**
   * Array of queries to execute.
   */
  queries: Array<TimeseriesQuery>;
}

export interface UseTimeseriesData {
  series: Serie[];
  times: number[];
  metadata: Record<string, MetricMetadata>;
}

export interface UseTimeseriesReturn {
  data: UseTimeseriesData;
  isLoading: boolean;
  isFetching: boolean;
  hasError: boolean;
  refetch: () => void;
}

/**
 * Hook to fetch timeseries data for metrics.
 *
 * @param params - Configuration object with queries, and either timeRange or startTime/endTime, plus optional interval.
 * @returns Object containing timeseries data, loading states, and error state.
 */
export function useTimeseries(
  params: UseTimeseriesParams,
): UseTimeseriesReturn {
  const { apiBaseUrl, fetchImpl = fetch } = useUnblindClientConfig();
  const { startTime, endTime, timeRange } = useTimeConfig(params);
  const { queries, interval } = params;

  const metricNames = useMemo(
    () => queries.map((x) => x.metrics.join(",")).join(","),
    [queries],
  );
  const attributes = useMemo(
    () =>
      queries
        .map((x) => {
          const attrs = x.attributes;
          if (!attrs) return "";

          const attributeKeys = Object.keys(attrs);
          if (attributeKeys.length === 0) return "";
          return attributeKeys
            .map((key: string) => key + ":" + attrs[key]?.join(","))
            .join(",");
        })
        .join(","),
    [queries],
  );
  const operators = useMemo(() => queries.map((x) => x.operator), [queries]);
  const groupBy = useMemo(
    () => queries.map((x) => x.groupBy).join(", "),
    [queries],
  );

  const hasValidTimeConfig =
    (typeof startTime === "number" && typeof endTime === "number") ||
    !!timeRange;

  const query = useQuery<TimeseriesResponse>({
    queryKey: [
      "unblind",
      "timeseries",
      metricNames,
      attributes,
      startTime,
      endTime,
      timeRange,
      interval,
      operators,
      groupBy,
    ],
    queryFn: async () => {
      if (!metricNames) {
        throw new Error("Missing required parameters");
      }
      if (metricNames.length === 0) {
        throw new Error("No series provided");
      }

      const [calculatedStartTime, calculatedEndTime] = deduceTimestamp(
        timeRange,
        startTime,
        endTime,
      );

      const apiRequestBody: SeriesAPIRequest = {
        queries,
        startTime: calculatedStartTime,
        endTime: calculatedEndTime,
        interval,
      };
      const res = await fetchImpl(`${apiBaseUrl}/tenants/timeseries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiRequestBody),
      });
      if (!res.ok) throw new Error("Error fetching metric");
      const { series, times, metadata } = await res.json();
      if (!series) {
        console.error("Series not found");
        throw new Error("Series not found");
      }
      return { series, times, metadata } as TimeseriesResponse;
    },
    enabled: !!metricNames && hasValidTimeConfig,
  });

  const {
    metadata,
    series,
    times,
  }: {
    series: Array<Serie>;
    times: Array<number>;
    metadata: Record<string, MetricMetadata>;
  } = useMemo(() => {
    if (!query.data) return { series: [], times: [], metadata: {} };
    return {
      series: query.data.series,
      times: query.data.times,
      metadata: query.data.metadata,
    };
  }, [query]);

  const isLoading = query.isLoading;
  const isFetching = query.isFetching;
  const hasError = query.isError;

  return {
    data: { series, times, metadata },
    isLoading,
    isFetching,
    hasError,
    refetch: query.refetch,
  };
}
