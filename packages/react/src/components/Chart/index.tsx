import { useEffect, useRef } from "react";
import uPlot from "uplot";
import {
  type Serie,
  type ChartVisualConfig,
  type ChartType,
  isLineThreshold,
  isRangeThreshold,
  type LabeledMetricMetadata,
} from "../../types";
import { TooltipProps } from "../Tooltip";
import { useScope } from "@/providers/UnblindProvider";
import { stack } from "./YAxis";
import { compareAndResolveUnit, createChartOptions } from "./utils";

export interface ChartProps extends ChartVisualConfig {
  times: Array<number>;
  series: Serie[];
  metadata: Record<string, LabeledMetricMetadata>;
  type: ChartType;
  invertSort?: boolean;
  className?: string;
  timeZone?: string;
  options?: uPlot.Options;
  tooltipComponent?: React.ComponentType<TooltipProps>;
}

/**
 * Renders a chart for time series data
 */
export function Chart(props: ChartProps) {
  const {
    times,
    series,
    metadata,
    type,
    className,
    timeZone,
    options: propsOptions,
    tooltip,
    colors: propColors,
    tooltipComponent,
    unit: propsUnit,
    fill: propFill,
    thresholds,
    min: predefinedMin,
    max: predefinedMax,
    hideAxis: propHideAxis,
    hideCursor: propHideCursor,
    relativeTimeAxis: propRelativeTimeAxis,
    invertSort: propInvertSort,
    disableSuggestedLabel: propDisableSuggestedLabel,
  } = props;
  const { hide: propHideTooltip, visibilityLimit: propVisibilityLimit } =
    tooltip || {};
  const chartRef = useRef<HTMLDivElement>(null);
  const scope = useScope();
  const relativeTimeAxis =
    typeof propRelativeTimeAxis === "boolean"
      ? propRelativeTimeAxis
      : scope.relativeTimeAxis;
  const colors = propColors ?? scope.colors;
  const fill = typeof propFill === "boolean" ? propFill : scope.fill || false;
  const invertSort =
    typeof propInvertSort === "boolean" ? propInvertSort : scope.invertSort;
  const disableSuggestedLabel =
    typeof propDisableSuggestedLabel === "boolean"
      ? propDisableSuggestedLabel
      : scope.disableSuggestedLabel;
  const hideAxis =
    typeof propHideAxis === "boolean" ? propHideAxis : scope.hideAxis;
  const hideCursor =
    typeof propHideCursor === "boolean" ? propHideCursor : scope.hideCursor;
  const visibilityLimit =
    typeof propVisibilityLimit === "boolean"
      ? propVisibilityLimit
      : scope.tooltip?.visibilityLimit;
  const hideTooltip =
    typeof propHideTooltip === "boolean"
      ? propHideTooltip
      : scope.tooltip?.hide;

  useEffect(() => {
    if (!series || series.length === 0) {
      console.warn("No series provided");
      return;
    }

    // uPlot aligned data works in the following way:
    // - First array of values is for X-axis
    // - The rest arrays are values for Y-axis
    const data: uPlot.AlignedData = [times];
    let unit: string | undefined = propsUnit;
    series.forEach((serie) => {
      const metricMetadata = metadata[serie.metric];

      if (!propsUnit) {
        unit = compareAndResolveUnit(unit, metricMetadata);
      }

      data.push(serie.values);
    });

    const stacked = type === "bar" || type === "area";
    const stackedData = stack(data, !stacked);

    if (thresholds) {
      thresholds.forEach((threshold) => {
        if (isLineThreshold(threshold)) {
          stackedData.data.push(new Array(times.length).fill(threshold.value));
        } else if (isRangeThreshold(threshold)) {
          stackedData.data.push(new Array(times.length).fill(threshold.from));
          stackedData.data.push(new Array(times.length).fill(threshold.to));
        }
      });
    }

    const container = chartRef.current;
    let u: uPlot | null = null;

    if (container) {
      const opts = createChartOptions(
        container,
        metadata,
        stackedData,
        unit,
        series,
        type,
        stacked,
        colors,
        fill,
        timeZone,
        tooltipComponent,
        relativeTimeAxis,
        hideTooltip,
        thresholds,
        predefinedMin,
        predefinedMax,
        hideAxis,
        hideCursor,
        visibilityLimit,
        invertSort,
        disableSuggestedLabel,
      );

      u = new uPlot(
        { ...opts, ...propsOptions },
        stackedData.data as uPlot.AlignedData,
        container,
      );
      const resizeObserver = new ResizeObserver(() => {
        u?.setSize({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      });

      resizeObserver.observe(container);

      return () => {
        u?.destroy();
        resizeObserver.disconnect();
      };
    }
  }, [
    series,
    times,
    type,
    metadata,
    timeZone,
    tooltipComponent,
    relativeTimeAxis,
    colors,
    fill,
    propsUnit,
    hideTooltip,
    thresholds,
    predefinedMin,
    predefinedMax,
    propsOptions,
    hideAxis,
    hideCursor,
    invertSort,
    visibilityLimit,
    disableSuggestedLabel,
  ]);

  return (
    <div
      ref={chartRef}
      className={"ub-chart-container" + (className ? ` ${className}` : "")}
    />
  );
}
