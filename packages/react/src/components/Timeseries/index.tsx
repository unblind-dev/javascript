import { useTimeseries, UseTimeseriesReturn } from "../../hooks/useTimeseries";
import { useScope } from "@/providers/UnblindProvider";
import {
  type Appearance,
  type TimeseriesQueryConfig,
  type ChartVisualConfig,
  isLabeledMetric,
  LabeledMetric,
  LabeledMetricMetadata,
} from "../../types";
import { useEffect, useMemo } from "react";
import { Chart } from "../Chart";

export type TimeseriesProps = Exclude<
  TimeseriesQueryConfig,
  "startTime" | "endTime" | "timeRange"
> &
  ChartVisualConfig & {
    /**
     * Metric name(s) to display in the chart.
     *
     * @example  Single metric
     * ```jsx
     * <Timeseries metrics="nodejs.eventloop.p50" />
     * ```
     *
     * @example
     * Multiple metrics
     * ```jsx
     * <Timeseries metrics={["nodejs.eventloop.p50", "..."]} />
     * ```
     *
     * @example
     * Labeled metrics
     * ```jsx
     * <Timeseries metrics={{ name: "nodejs.eventloop.p50", label: "P50" ]} />
     * ```
     */
    metrics: Array<LabeledMetric> | Array<string> | string;

    /**
     * Optional className for the chart container.
     */
    className?: string;

    /**
     * Optional appearance configuration for this chart
     */
    appearance?: Appearance;

    /**
     * Hook to get request data
     */
    onResponse?: (response: UseTimeseriesReturn) => void;
  };

/**
 * Displays a time series chart.
 * Uses values from <UnblindProvider> or <Scope>
 * when they are not explicitly provided as props.
 *
 * @example
 * ```tsx
 *  <Timeseries
 *    metrics="host.cpu"
 *    attributes={{ "host.region": ["us-east-2"] }}
 *    groupBy={["host.name"]}
 *   />
 * ```
 *
 * @example Using `<Scope>`
 * ```tsx
 * <Scope timeRange="1h">
 *   <Timeseries metrics="host.cpu" />
 *   <Timeseries metrics="host.memory" />
 * </Scope>
 * ```
 */
export function Timeseries({
  metrics,
  operator: propOperator,
  attributes: propAttributes,
  groupBy: propGroupBy,
  interval: propInterval,
  type = "line",
  className,
  appearance: propAppearance,
  tooltip: propTooltip,
  onResponse,
  ...chartStyleProps
}: TimeseriesProps) {
  // Get defaults from scope
  const scope = useScope();

  // Use props if provided, otherwise fall back to scope values
  // Priority: props > scope > defaults
  const interval = propInterval ?? scope.interval;
  const attributes = propAttributes ?? scope.attributes;
  const groupBy = propGroupBy ?? scope.groupBy;
  const operator = propOperator ?? scope.operator;

  const tooltipComponent =
    propAppearance?.components?.Tooltip ?? scope.appearance.components.Tooltip;

  const tooltip = useMemo(() => {
    return {
      hide: propTooltip?.hide ?? scope.tooltip?.hide,
      visibilityLimit:
        propTooltip?.visibilityLimit ?? scope.tooltip?.visibilityLimit,
    };
  }, [
    propTooltip?.hide,
    scope.tooltip?.hide,
    propTooltip?.visibilityLimit,
    scope.tooltip?.visibilityLimit,
  ]);

  const { queries, metadataLabels } = useMemo(() => {
    const normalizedMetrics = Array.isArray(metrics) ? metrics : [metrics];
    const metadataLabels: Record<string, string> = {};

    const queries = normalizedMetrics.map((metric) => {
      const name = isLabeledMetric(metric) ? metric.name : metric;
      if (isLabeledMetric(metric)) metadataLabels[name] = metric.label;
      return { metrics: [name], operator, attributes, groupBy };
    });

    return { queries, metadataLabels };
  }, [metrics, operator, attributes, groupBy]);

  const response = useTimeseries({
    queries,
    timeRange: scope.timeRange,
    startTime: scope.startTime,
    endTime: scope.endTime,
    interval,
  });
  const { isLoading, data, hasError } = response;

  const { series, times, metadata } = data;
  const isEmpty = series.every((x) => x.isEmpty);

  const labeledMetadata = useMemo((): Record<string, LabeledMetricMetadata> => {
    if (Object.keys(metadataLabels).length === 0) return metadata;

    return Object.fromEntries(
      Object.entries(metadata).map(([metricName, meta]) => [
        metricName,
        {
          ...meta,
          label:
            metadataLabels[metricName] ?? meta.suggestedLabel ?? metricName,
        },
      ]),
    );
  }, [metadataLabels, metadata]);

  const containerClassName = `ub-chart-container${className ? ` ${className}` : ""}`;

  useEffect(() => {
    if (onResponse) {
      onResponse(response);
    }
  }, [response, onResponse]);

  if (isLoading) {
    const LoadingComponent =
      propAppearance?.components?.Loading ??
      scope.appearance.components.Loading;
    return (
      <div className={containerClassName}>
        <LoadingComponent />
      </div>
    );
  }

  if (hasError) {
    const ErrorComponent =
      propAppearance?.components?.Error ?? scope.appearance.components.Error;
    return (
      <div className={containerClassName}>
        <ErrorComponent />
      </div>
    );
  }

  if (isEmpty) {
    const EmptyComponent =
      propAppearance?.components?.Empty ?? scope.appearance.components.Empty;

    return (
      <div className={containerClassName}>
        <EmptyComponent />
      </div>
    );
  }

  return (
    <Chart
      times={times}
      series={series}
      metadata={labeledMetadata}
      type={type}
      className={className}
      tooltip={tooltip}
      tooltipComponent={tooltipComponent}
      {...chartStyleProps}
    />
  );
}
