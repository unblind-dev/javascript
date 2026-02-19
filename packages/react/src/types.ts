/**
 * Shared types for Unblind React library.
 */

import { StringValue } from "ms";
import { TooltipProps } from "./components/Tooltip";

export type MetricType =
  | "gauge"
  | "sum"
  | "histogram"
  | "summary"
  | "exphistogram";

/**
 * Aggregation operators available for metric queries.
 */
export type AggregationOperator =
  | "avg"
  | "sum"
  | "max"
  | "min"
  | "p90"
  | "p99"
  | "p50";

/**
 * Metric metadata returned by the API.
 */
export interface MetricMetadata {
  name: string;
  description: string;
  suggestedLabel?: string;
  unit: {
    /// The unique, case-sensitive UCUM identifier (e.g., "mL", "m/s2")
    code?: string;
  };
  type: MetricType;
}

export type LabeledMetricMetadata = MetricMetadata & { label?: string };

/**
 * List of metric metadata.
 */
export type MetricMetadataList = Array<MetricMetadata>;

/**
 * A single time series data point.
 */
export interface Serie {
  metric: string;
  attributes?: Record<string, string>;
  values: Array<number>;
  queryIndex: number;
  isEmpty?: boolean;
}

/**
 * Query definition for timeseries requests.
 */
export interface TimeseriesQuery {
  metrics: Array<string>;
  groupBy?: Array<string>;
  operator?: AggregationOperator;
  attributes?: Partial<Record<string, Array<string>>>;
}

/**
 * Chart types available
 */
export type ChartType = "bar" | "line" | "area" | "step" | "spline";

/**
 * Time Range definition:
 *
 * e.g. 5secs, 4h, 3 days, and so on.
 */
export type TimeRange = StringValue;

export interface Log {
  timestamp: number;
  traceId?: string;
  spanId?: string;
  logId?: string;
  severity: Severity;
  attributes?: Record<string, string>;
  body?: string;
  serviceName?: string;
}

/**
 * Default paginated response structure
 */
export type PaginatedResponse<T> = {
  data: Array<T>;
  nextPage?: string;
};

/**
 * Different severity values based on OTEL
 * https://opentelemetry.io/docs/specs/otel/logs/data-model/#field-severitytext
 */
export type Severity = "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

export type Colors =
  | Array<string>
  | { fill: Array<string>; border: Array<string> }
  | ((
      serie: Serie,
      index: number,
      type: ChartType,
      isFilling?: boolean,
    ) => string);

/**
 * Interval expressed in seconds.
 */
export type Interval = number;

export type TimeConfig = {
  /**
   * Optional time range. If not provided, will use timeRange from the provider.
   * Ignored if startTime and endTime are provided.
   */
  timeRange?: TimeRange;
  /**
   * Optional start time (Unix timestamp in seconds).
   * If provided along with endTime, takes priority over timeRange.
   */
  startTime?: number;
  /**
   * Optional end time (Unix timestamp in seconds).
   * If provided along with startTime, takes priority over timeRange.
   */
  endTime?: number;
};

/**
 * Base query configuration for timeseries data.
 * Used across components and providers.
 */
export type TimeseriesQueryConfig = TimeConfig & {
  /**
   * Optional interval in seconds. If not provided, will use interval from the provider.
   */
  interval?: Interval;
  /**
   * Optional attributes filter. If not provided, will use attributes from the provider.
   */
  attributes?: Record<string, Array<string>>;
  /**
   * Optional groupBy. If not provided, will use groupBy from the provider.
   */
  groupBy?: Array<string>;
  /**
   * Optional aggregation operator. If not provided, will use the operator from the provider.
   */
  operator?: AggregationOperator;
};

/**
 * Visual/presentation configuration for charts.
 */
export interface ChartVisualConfig {
  /**
   * Optional color configuration
   */
  colors?: Colors;

  /**
   * Optional to fill charts.
   *
   * Bar and area charts are filled by default.
   */
  fill?: boolean;

  /**
   * Optional tooltip configuration.
   */
  tooltip?: TooltipConfig;

  /**
   * Chart type. Defaults to "line".
   */
  type?: ChartType;

  /**
   * Optional threshold
   */
  thresholds?: Array<Threshold>;

  /**
   * Optional min value
   */
  min?: number;

  /**
   * Optional max value
   */
  max?: number;

  /**
   * Optional boolean to hide both axis
   */
  hideAxis?: boolean;

  /**
   * Optional boolean to hide cursor
   */
  hideCursor?: boolean;

  /**
   * Optional boolean to display relative time axis
   *
   * e.g. a day ago ------ a few seconds ago
   */
  relativeTimeAxis?: boolean;

  /**
   * Unit of measurement for the value.
   *
   * Supports standard unit identifiers:
   * - Data: 'bytes', 'decbytes', 'bits', 'decbits'
   * - Time: 'ms', 's', 'm', 'h', 'd'
   * - Throughput: 'Bps', 'Mbps', 'Gbps'
   * - Percentage: 'percent', 'percentunit'
   * - And many more standard units
   *
   */
  unit?: string;

  /**
   * Optional invert value order.
   * Defaults to false
   */
  invertSort?: boolean;

  /**
   * Disables suggested label
   */
  disableSuggestedLabel?: boolean;
}

export interface TooltipConfig {
  hide?: boolean;
  visibilityLimit?: number;
}

/**
 * Appearance configuration for Unblind components.
 *
 * Allows consumers to override internal UI components used for
 * loading, empty, and error states.
 *
 * Overrides can be provided globally via Scope or
 * locally per component.
 *
 * This API customizes presentation only; component state and data
 * fetching logic remain internal.
 */
export type Appearance = {
  components?: {
    Loading?: React.ComponentType;
    Error?: React.ComponentType;
    Empty?: React.ComponentType;
    Tooltip?: React.ComponentType<TooltipProps>;
  };
};

/**
 * Typeguard for LineThreshold
 */
export const isLineThreshold = (
  threshold: Threshold,
): threshold is LineThreshold => {
  return "value" in threshold;
};

/**
 * Typeguard for RangeThreshold
 */
export const isRangeThreshold = (
  threshold: Threshold,
): threshold is RangeThreshold => {
  return "from" in threshold && "to" in threshold;
};

export type ThresholdLevel = "info" | "warning" | "error" | "ok";
export type ThresholdLineType = "line" | "dashed" | "bold";
export type LineThreshold = {
  value: number;
  type?: ThresholdLineType;
  level?: ThresholdLevel;
  label?: string;
};

export type RangeThreshold = {
  from: number;
  to?: number;
  type?: ThresholdLineType;
  level?: ThresholdLevel;
  label?: string;
};
export type Threshold = LineThreshold | RangeThreshold;

export type StackedData = {
  data: Array<uPlot.AlignedData[number]>;
  bands: Array<uPlot.Band>;
};

export interface TooltipSerie {
  metric: LabeledMetricMetadata;
  serie: uPlot.Series;
  color: string;
  value?: number;
  formattedValue?: string;
  attributes?: Record<string, string>;
}

export interface LabeledMetric {
  name: string;
  label: string;
}

export function isLabeledMetric(value: unknown): value is LabeledMetric {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as LabeledMetric).name === "string" &&
    typeof (value as LabeledMetric).label === "string"
  );
}
